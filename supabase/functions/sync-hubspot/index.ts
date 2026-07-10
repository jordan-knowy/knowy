// Synchronise les contacts + companies HubSpot vers Tohu (contacts/companies).
// Rafraîchit le token si besoin (refresh_token). Upsert par email pour les contacts,
// par domaine pour les companies — jamais d'écrasement des données déjà enrichies par Tohu.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

const HUBSPOT_TOKEN_URL = 'https://api.hubapi.com/oauth/v1/token';

async function refreshHubspotToken(refreshToken: string, clientId: string, clientSecret: string) {
  const res = await fetch(HUBSPOT_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'refresh_token', client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken }),
  });
  if (!res.ok) throw new Error('Échec du rafraîchissement du token HubSpot');
  return res.json();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const auth = req.headers.get('Authorization');
  if (!auth) return jsonResponse({ error: 'Missing authorization' }, 401);

  const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
  const { data: { user }, error: userErr } = await supabase.auth.getUser(auth.replace('Bearer ', ''));
  if (userErr || !user) return jsonResponse({ error: 'Unauthorized' }, 401);

  const { organizationId } = await req.json().catch(() => ({}));
  if (!organizationId) return jsonResponse({ error: 'organizationId requis' }, 400);

  try {
    const { data: connector } = await supabase
      .from('connectors')
      .select('id, metadata')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .eq('provider', 'hubspot')
      .maybeSingle();

    if (!connector) return jsonResponse({ error: 'HubSpot non connecté' }, 400);
    let { access_token, refresh_token } = (connector as any).metadata ?? {};
    if (!access_token) return jsonResponse({ error: 'Token HubSpot manquant — reconnecte HubSpot' }, 400);

    const clientId = Deno.env.get('HUBSPOT_CLIENT_ID');
    const clientSecret = Deno.env.get('HUBSPOT_CLIENT_SECRET');

    async function hubspotFetch(path: string) {
      let res = await fetch(`https://api.hubapi.com${path}`, { headers: { Authorization: `Bearer ${access_token}` } });
      if (res.status === 401 && refresh_token && clientId && clientSecret) {
        const refreshed = await refreshHubspotToken(refresh_token, clientId, clientSecret);
        access_token = refreshed.access_token;
        refresh_token = refreshed.refresh_token ?? refresh_token;
        await (supabase.from('connectors') as any).update({
          metadata: { ...(connector as any).metadata, access_token, refresh_token, token_stored_at: new Date().toISOString() },
        }).eq('id', (connector as any).id);
        res = await fetch(`https://api.hubapi.com${path}`, { headers: { Authorization: `Bearer ${access_token}` } });
      }
      return res;
    }

    // ── Companies ──────────────────────────────────────────────────────────
    const companiesRes = await hubspotFetch('/crm/v3/objects/companies?limit=100&properties=name,domain,industry');
    const companiesData = companiesRes.ok ? await companiesRes.json() : { results: [] };
    let companiesCreated = 0;
    const domainToCompanyId: Record<string, string> = {};

    for (const c of companiesData.results ?? []) {
      const name = c.properties?.name;
      const domain = c.properties?.domain || null;
      if (!name) continue;
      const { data: existing } = await supabase.from('companies').select('id')
        .eq('organization_id', organizationId)
        .eq(domain ? 'domain' : 'name', domain || name)
        .maybeSingle();
      if (existing) { domainToCompanyId[c.id] = (existing as any).id; continue; }
      const { data: created } = await supabase.from('companies').insert({
        organization_id: organizationId, name, domain, industry: c.properties?.industry || null,
      }).select('id').single();
      if (created) { domainToCompanyId[c.id] = (created as any).id; companiesCreated++; }
    }

    // ── Contacts ───────────────────────────────────────────────────────────
    const contactsRes = await hubspotFetch('/crm/v3/objects/contacts?limit=100&properties=firstname,lastname,email,jobtitle,associatedcompanyid');
    const contactsData = contactsRes.ok ? await contactsRes.json() : { results: [] };
    let contactsCreated = 0;

    for (const p of contactsData.results ?? []) {
      const email = p.properties?.email;
      const fullName = [p.properties?.firstname, p.properties?.lastname].filter(Boolean).join(' ') || email;
      if (!fullName) continue;
      const { data: existing } = await supabase.from('contacts').select('id')
        .eq('organization_id', organizationId)
        .eq('email', email || '__no_email__')
        .maybeSingle();
      if (existing) continue;
      await supabase.from('contacts').insert({
        organization_id: organizationId,
        full_name: fullName,
        email: email || null,
        role_title: p.properties?.jobtitle || null,
        company_id: domainToCompanyId[p.properties?.associatedcompanyid] ?? null,
        crm_synced: true,
        source_summary: { source: 'hubspot_sync' },
      });
      contactsCreated++;
    }

    await (supabase.from('connectors') as any).update({ last_synced_at: new Date().toISOString() }).eq('id', (connector as any).id);

    return jsonResponse({ success: true, companiesCreated, contactsCreated });
  } catch (e: any) {
    console.error('sync-hubspot error:', e?.message);
    return jsonResponse({ error: e?.message ?? 'Erreur interne' }, 500);
  }
});
