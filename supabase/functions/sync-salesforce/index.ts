// Synchronise les contacts + accounts Salesforce vers Tohu (contacts/companies).
// Utilise l'instance_url renvoyée à la connexion (spécifique à chaque org Salesforce).
// Rafraîchit le token si besoin. Upsert par email pour les contacts, par nom pour les accounts.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

const LOGIN_URL = Deno.env.get('SALESFORCE_LOGIN_URL') || 'https://login.salesforce.com';
const API_VERSION = 'v59.0';

async function refreshSalesforceToken(refreshToken: string, clientId: string, clientSecret: string) {
  const res = await fetch(`${LOGIN_URL}/services/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'refresh_token', client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken }),
  });
  if (!res.ok) throw new Error('Échec du rafraîchissement du token Salesforce');
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
      .eq('provider', 'salesforce')
      .maybeSingle();

    if (!connector) return jsonResponse({ error: 'Salesforce non connecté' }, 400);
    let { access_token, refresh_token, instance_url } = (connector as any).metadata ?? {};
    if (!access_token || !instance_url) return jsonResponse({ error: 'Token Salesforce manquant — reconnecte Salesforce' }, 400);

    const clientId = Deno.env.get('SALESFORCE_CLIENT_ID');
    const clientSecret = Deno.env.get('SALESFORCE_CLIENT_SECRET');

    async function sfFetch(path: string) {
      let res = await fetch(`${instance_url}${path}`, { headers: { Authorization: `Bearer ${access_token}` } });
      if (res.status === 401 && refresh_token && clientId && clientSecret) {
        const refreshed = await refreshSalesforceToken(refresh_token, clientId, clientSecret);
        access_token = refreshed.access_token;
        instance_url = refreshed.instance_url ?? instance_url;
        await (supabase.from('connectors') as any).update({
          metadata: { ...(connector as any).metadata, access_token, instance_url, token_stored_at: new Date().toISOString() },
        }).eq('id', (connector as any).id);
        res = await fetch(`${instance_url}${path}`, { headers: { Authorization: `Bearer ${access_token}` } });
      }
      return res;
    }

    // ── Accounts (= companies) ───────────────────────────────────────────
    const accQuery = encodeURIComponent('SELECT Id, Name, Website, Industry FROM Account LIMIT 200');
    const accRes = await sfFetch(`/services/data/${API_VERSION}/query?q=${accQuery}`);
    const accData = accRes.ok ? await accRes.json() : { records: [] };
    let companiesCreated = 0;
    const sfIdToCompanyId: Record<string, string> = {};

    for (const a of accData.records ?? []) {
      if (!a.Name) continue;
      const domain = a.Website ? a.Website.replace(/^https?:\/\//, '').replace(/\/$/, '') : null;
      const { data: existing } = await supabase.from('companies').select('id')
        .eq('organization_id', organizationId)
        .eq(domain ? 'domain' : 'name', domain || a.Name)
        .maybeSingle();
      if (existing) { sfIdToCompanyId[a.Id] = (existing as any).id; continue; }
      const { data: created } = await supabase.from('companies').insert({
        organization_id: organizationId, name: a.Name, domain, industry: a.Industry || null,
      }).select('id').single();
      if (created) { sfIdToCompanyId[a.Id] = (created as any).id; companiesCreated++; }
    }

    // ── Contacts ───────────────────────────────────────────────────────────
    const conQuery = encodeURIComponent('SELECT Id, Name, Email, Title, AccountId FROM Contact LIMIT 200');
    const conRes = await sfFetch(`/services/data/${API_VERSION}/query?q=${conQuery}`);
    const conData = conRes.ok ? await conRes.json() : { records: [] };
    let contactsCreated = 0;

    for (const c of conData.records ?? []) {
      if (!c.Name) continue;
      const { data: existing } = await supabase.from('contacts').select('id')
        .eq('organization_id', organizationId)
        .eq('email', c.Email || '__no_email__')
        .maybeSingle();
      if (existing) continue;
      await supabase.from('contacts').insert({
        organization_id: organizationId,
        full_name: c.Name,
        email: c.Email || null,
        role_title: c.Title || null,
        company_id: sfIdToCompanyId[c.AccountId] ?? null,
        crm_synced: true,
        source_summary: { source: 'salesforce_sync' },
      });
      contactsCreated++;
    }

    await (supabase.from('connectors') as any).update({ last_synced_at: new Date().toISOString() }).eq('id', (connector as any).id);

    return jsonResponse({ success: true, companiesCreated, contactsCreated });
  } catch (e: any) {
    console.error('sync-salesforce error:', e?.message);
    return jsonResponse({ error: e?.message ?? 'Erreur interne' }, 500);
  }
});
