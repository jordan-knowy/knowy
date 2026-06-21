// Veille PAR PERSONNE (phase 2). Cron : détecte changement de poste + activité récente
// via l'agent n8n (réutilise cache + déjà-connu) → behavioral_signals + notifications.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

const N8N_ENRICH_URL = 'https://alyah-knowledge.app.n8n.cloud/webhook/knowr-enrich';
const STALE_MS = 12 * 60 * 60 * 1000;
const MAX_PER_RUN = 6;

type Contact = { id: string; full_name: string | null; email: string | null; organization_id: string; enrichment_data: any; companies: any };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

  const body = await req.json().catch(() => ({}));
  const cronHeader = req.headers.get('x-cron-secret');
  let isCron = false;
  if (cronHeader) {
    const { data: sec } = await supabase.from('app_secrets').select('value').eq('name', 'monitor_cron').maybeSingle();
    if (sec?.value && sec.value === cronHeader) isCron = true;
  }

  let q = supabase.from('contacts')
    .select('id, full_name, email, organization_id, enrichment_data, companies(name, domain)')
    .not('email', 'is', null).is('merged_into_contact_id', null);

  if (!isCron) {
    const auth = req.headers.get('Authorization');
    if (!auth) return jsonResponse({ error: 'Missing authorization' }, 401);
    const { data: { user }, error: userErr } = await supabase.auth.getUser(auth.replace('Bearer ', ''));
    if (userErr || !user) return jsonResponse({ error: 'Unauthorized' }, 401);
    if (!body.organizationId) return jsonResponse({ error: 'organizationId required' }, 400);
    q = q.eq('organization_id', body.organizationId);
  } else {
    const cutoff = new Date(Date.now() - STALE_MS).toISOString();
    q = q.or(`last_monitored_at.is.null,last_monitored_at.lt.${cutoff}`);
  }

  const { data: contacts } = await q.order('last_monitored_at', { ascending: true, nullsFirst: true }).limit(MAX_PER_RUN);
  if (!contacts?.length) return jsonResponse({ success: true, scanned: 0, signals: 0, notified: 0 });

  const orgMembers = new Map<string, string[]>();
  const membersOf = async (orgId: string): Promise<string[]> => {
    if (orgMembers.has(orgId)) return orgMembers.get(orgId)!;
    const { data } = await supabase.from('memberships').select('user_id').eq('organization_id', orgId);
    const ids = (data ?? []).map((m: any) => m.user_id);
    orgMembers.set(orgId, ids);
    return ids;
  };

  let totalSignals = 0;
  let totalNotified = 0;

  const processContact = async (c: Contact) => {
    const email = (c.email ?? '').toLowerCase().trim();
    const entityKey = email ? `person:${email}` : `person:${(c.full_name ?? '').toLowerCase().trim()}`;
    const { data: cacheRow } = await supabase.from('enrichment_cache').select('data').eq('entity_key', entityKey).maybeSingle();
    const previous = cacheRow?.data ?? c.enrichment_data ?? null;

    let enr: any = null;
    try {
      const r = await fetch(N8N_ENRICH_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType: 'person', entityId: c.id, organizationId: c.organization_id,
          fullName: c.full_name ?? '', email, domain: (c.companies as any)?.domain ?? (email ? email.split('@')[1] : ''),
          company: (c.companies as any)?.name ?? '', linkedinUrl: '',
          alreadyKnown: { previousEnrichment: previous, note: 'Détecte surtout les CHANGEMENTS récents (poste, activité) vs le déjà-connu.' },
        }),
        signal: AbortSignal.timeout(120000),
      });
      if (r.ok) { const d = await r.json().catch(() => null); enr = d && (d.output ?? d); }
    } catch { /* ignore */ }

    // Marque comme surveillé quoi qu'il arrive (throttle)
    await supabase.from('contacts').update({ last_monitored_at: new Date().toISOString() }).eq('id', c.id);
    if (!enr) return;

    // Détecte les nouveautés
    const candidates: Array<{ signal_type: string; text: string; important: boolean; url?: string | null; date?: string | null }> = [];
    const prevRole = previous?.currentRole, prevCo = previous?.currentCompany;
    if (enr.currentRole && enr.roleConfidence === 'confirmed' && prevRole &&
        (enr.currentRole !== prevRole || (enr.currentCompany && enr.currentCompany !== prevCo))) {
      candidates.push({
        signal_type: 'mobility', important: true,
        text: `Changement de poste : ${prevRole}${prevCo ? ' @ ' + prevCo : ''} → ${enr.currentRole}${enr.currentCompany ? ' @ ' + enr.currentCompany : ''}`,
      });
    }
    const prevTitles = new Set((previous?.recentActivity ?? []).map((a: any) => (a.title || '').toLowerCase()));
    for (const a of (enr.recentActivity ?? []).slice(0, 5)) {
      if (a?.title && !prevTitles.has(String(a.title).toLowerCase())) {
        candidates.push({ signal_type: 'recent_activity', important: false, text: a.date ? `${a.title} (${a.date})` : a.title, url: a.url ?? null, date: a.date ?? null });
      }
    }

    // Persiste le nouvel enrichissement + cache (mutualisé)
    await supabase.from('contacts').update({ enrichment_data: enr, web_bio: enr.summary ?? null }).eq('id', c.id);
    await supabase.from('enrichment_cache').upsert({
      entity_key: entityKey, entity_type: 'person', data: enr, sources: enr.sources ?? null, refreshed_at: new Date().toISOString(),
    }, { onConflict: 'entity_key' });

    if (!candidates.length) return;

    // Anti-doublon vs signaux de veille déjà créés
    const { data: existing } = await supabase.from('behavioral_signals')
      .select('text').eq('contact_id', c.id).eq('source_type', 'ai_monitoring');
    const seen = new Set((existing ?? []).map((s: any) => (s.text || '').toLowerCase()));
    const fresh = candidates.filter(s => !seen.has(s.text.toLowerCase()));
    if (!fresh.length) return;

    await supabase.from('behavioral_signals').insert(fresh.map(s => ({
      organization_id: c.organization_id, contact_id: c.id,
      signal_type: s.signal_type, text: s.text, inference_level: 'observable',
      confidence: s.important ? 80 : 65, source_type: 'ai_monitoring', source_ref: s.url ?? null,
      observed_at: new Date().toISOString(),
    })));
    totalSignals += fresh.length;

    // Notifications pour les changements importants (mobilité)
    const important = fresh.filter(s => s.important);
    if (important.length) {
      const members = await membersOf(c.organization_id);
      const notifs = members.flatMap(uid => important.map(s => ({
        organization_id: c.organization_id, user_id: uid, type: 'contact_signal', priority: 'high',
        title: `${c.full_name ?? 'Contact'} — ${s.text}`.slice(0, 200), body: null,
        entity_type: 'contact', entity_id: c.id, link: `/contacts/${c.id}`,
      })));
      if (notifs.length) { await supabase.from('notifications').insert(notifs); totalNotified += notifs.length; }
    }
  };

  await Promise.allSettled((contacts as Contact[]).map(processContact));

  return jsonResponse({ success: true, scanned: contacts.length, signals: totalSignals, notified: totalNotified, mode: isCron ? 'cron' : 'user' });
});
