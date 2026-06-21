// Enrichissement via l'agent n8n (OpenRouter + Perplexity), DB-aware.
// - Cache GLOBAL (enrichment_cache) partagé entre users/orgs : même entité = réutilisation, pas de re-recherche.
// - Transmet à l'agent ce qui est DÉJÀ connu (cache + signaux existants) pour ne pas répéter et chercher le NOUVEAU.
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
const FRESH_MS = 14 * 24 * 60 * 60 * 1000; // 14 jours

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
  const { contactId, companyId, organizationId, forceRefresh = false } = body;
  if (!organizationId || (!contactId && !companyId)) {
    return jsonResponse({ error: 'organizationId and (contactId or companyId) required' }, 400);
  }

  // ── Charge l'entité + construit la clé de cache + le payload ──
  let entityType: 'person' | 'company';
  let entityKey: string;
  let payload: Record<string, unknown>;
  let knownSignals: string[] = [];

  if (contactId) {
    entityType = 'person';
    const { data: c, error } = await supabase
      .from('contacts')
      .select('id, full_name, email, role_title, enrichment_data, companies(name, domain)')
      .eq('id', contactId).eq('organization_id', organizationId).maybeSingle();
    if (error || !c) return jsonResponse({ error: 'Contact not found' }, 404);
    const email = (c.email ?? '').toLowerCase().trim();
    const domain = (c.companies as any)?.domain ?? (email ? email.split('@')[1] : '');
    entityKey = email ? `person:${email}` : `person:${(c.full_name ?? '').toLowerCase().trim()}@${domain}`;
    payload = {
      entityType, entityId: contactId, organizationId,
      fullName: c.full_name ?? '', email, domain, company: (c.companies as any)?.name ?? '', linkedinUrl: '',
    };
    const { data: sigs } = await supabase.from('behavioral_signals').select('title').eq('contact_id', contactId).limit(25);
    knownSignals = (sigs ?? []).map((s: any) => s.title).filter(Boolean);
  } else {
    entityType = 'company';
    const { data: co, error } = await supabase
      .from('companies').select('id, name, domain, enrichment_data')
      .eq('id', companyId).eq('organization_id', organizationId).maybeSingle();
    if (error || !co) return jsonResponse({ error: 'Company not found' }, 404);
    const domain = (co.domain ?? '').toLowerCase().trim();
    entityKey = domain ? `company:${domain}` : `company:${(co.name ?? '').toLowerCase().trim()}`;
    payload = { entityType, entityId: companyId, organizationId, fullName: '', email: '', domain, company: co.name ?? '', linkedinUrl: '' };
    const { data: sigs } = await supabase.from('company_signals').select('title').eq('company_id', companyId).limit(25);
    knownSignals = (sigs ?? []).map((s: any) => s.title).filter(Boolean);
  }

  // ── Cache global : réutilisation cross-user si frais ──
  const { data: cached } = await supabase
    .from('enrichment_cache').select('data, refreshed_at').eq('entity_key', entityKey).maybeSingle();

  const persist = async (enr: any) => {
    const now = new Date().toISOString();
    if (contactId) {
      await supabase.from('contacts').update({
        web_bio: enr.summary ?? null, enrichment_data: enr,
        enrichment_status: 'done', last_enriched_at: now, enrichment_error: null,
      }).eq('id', contactId).eq('organization_id', organizationId);
    } else {
      await supabase.from('companies').update({ enrichment_data: enr, enriched_at: now }).eq('id', companyId).eq('organization_id', organizationId);
    }
  };

  if (!forceRefresh && cached?.data && cached.refreshed_at &&
      (Date.now() - new Date(cached.refreshed_at).getTime()) < FRESH_MS) {
    await persist(cached.data);
    return jsonResponse({ status: 'done', source: 'cache', enrichment: cached.data });
  }

  // ── Recherche via l'agent n8n, en lui transmettant le DÉJÀ CONNU (anti-répétition) ──
  payload.alreadyKnown = {
    previousEnrichment: cached?.data ?? (contactId ? null : null),
    knownSignals,
    note: 'Ne répète pas ces éléments déjà connus. Concentre-toi sur les informations NOUVELLES, récentes ou manquantes.',
  };

  let enr: any = null;
  try {
    const r = await fetch(N8N_ENRICH_URL, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload), signal: AbortSignal.timeout(150000),
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

  // Persiste sur l'entité + met à jour le cache global (mutualisé)
  await persist(enr);
  await supabase.from('enrichment_cache').upsert({
    entity_key: entityKey, entity_type: entityType, data: enr, sources: enr.sources ?? null, refreshed_at: new Date().toISOString(),
  }, { onConflict: 'entity_key' });

  return jsonResponse({ status: 'done', source: 'agent', enrichment: enr });
});
