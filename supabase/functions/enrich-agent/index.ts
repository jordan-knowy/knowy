// Enrichissement via l'agent n8n (OpenRouter + Perplexity).
// Appelé sur Actualiser / Enrichir / Ré-enrichir. Persiste le résultat structuré.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

const N8N_ENRICH_URL = 'https://alyah-knowledge.app.n8n.cloud/webhook/knowr-enrich';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const auth = req.headers.get('Authorization');
  if (!auth) return jsonResponse({ error: 'Missing authorization' }, 401);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );
  const { data: { user }, error: userErr } = await supabase.auth.getUser(auth.replace('Bearer ', ''));
  if (userErr || !user) return jsonResponse({ error: 'Unauthorized' }, 401);

  const body = await req.json().catch(() => ({}));
  const { contactId, companyId, organizationId } = body;
  if (!organizationId || (!contactId && !companyId)) {
    return jsonResponse({ error: 'organizationId and (contactId or companyId) required' }, 400);
  }

  // ── Construit le payload selon le type d'entité ──
  let payload: Record<string, unknown>;
  if (contactId) {
    const { data: c, error } = await supabase
      .from('contacts')
      .select('id, full_name, email, role_title, companies(name, domain)')
      .eq('id', contactId).eq('organization_id', organizationId).maybeSingle();
    if (error || !c) return jsonResponse({ error: 'Contact not found' }, 404);
    payload = {
      entityType: 'person',
      entityId: contactId,
      organizationId,
      fullName: c.full_name ?? '',
      email: c.email ?? '',
      domain: (c.companies as any)?.domain ?? (c.email ? String(c.email).split('@')[1] : ''),
      company: (c.companies as any)?.name ?? '',
      linkedinUrl: '',
    };
  } else {
    const { data: co, error } = await supabase
      .from('companies')
      .select('id, name, domain')
      .eq('id', companyId).eq('organization_id', organizationId).maybeSingle();
    if (error || !co) return jsonResponse({ error: 'Company not found' }, 404);
    payload = {
      entityType: 'company',
      entityId: companyId,
      organizationId,
      fullName: '',
      email: '',
      domain: co.domain ?? '',
      company: co.name ?? '',
      linkedinUrl: '',
    };
  }

  // ── Appel de l'agent n8n ──
  let enr: any = null;
  try {
    const r = await fetch(N8N_ENRICH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(150000),
    });
    if (!r.ok) {
      const txt = await r.text().catch(() => '');
      return jsonResponse({ error: `Agent n8n: HTTP ${r.status}`, detail: txt.slice(0, 300), code: 'AGENT_ERROR' }, 502);
    }
    const data = await r.json().catch(() => null);
    enr = data && (data.output ?? data);
  } catch (e) {
    return jsonResponse({ error: 'Agent n8n injoignable (workflow actif ?)', detail: String(e), code: 'AGENT_UNREACHABLE' }, 502);
  }

  if (!enr || (typeof enr === 'object' && !enr.summary && !enr.fullName && !enr.company && !enr.currentRole)) {
    return jsonResponse({ error: 'Agent: réponse vide', code: 'EMPTY' }, 502);
  }

  // ── Persistance ──
  const now = new Date().toISOString();
  if (contactId) {
    await supabase.from('contacts').update({
      web_bio: enr.summary ?? null,
      enrichment_data: enr,
      enrichment_status: 'done',
      last_enriched_at: now,
      enrichment_error: null,
    }).eq('id', contactId).eq('organization_id', organizationId);
  } else {
    await supabase.from('companies').update({
      enrichment_data: enr,
      enriched_at: now,
    }).eq('id', companyId).eq('organization_id', organizationId);
  }

  return jsonResponse({ status: 'done', source: 'n8n-agent', enrichment: enr });
});
