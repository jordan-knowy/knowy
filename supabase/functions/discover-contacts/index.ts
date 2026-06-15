/**
 * discover-contacts
 * Scanne Gmail (90 derniers jours) et retourne les interlocuteurs fréquents
 * qui ne sont pas encore dans la base contacts — pour la page "Suggestions".
 *
 * Ne crée aucun contact : lecture seule, l'import est déclenché par l'UI.
 * RGPD-safe : seuls From/To/Cc headers sont lus, jamais le corps des mails.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

const GMAIL = 'https://gmail.googleapis.com/gmail/v1';

// Domaines personnels — exclus des suggestions (jamais un compte pro)
const PERSONAL_DOMAINS = new Set([
  'gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'yahoo.fr',
  'free.fr', 'orange.fr', 'wanadoo.fr', 'icloud.com', 'me.com',
  'live.com', 'protonmail.com', 'laposte.net', 'sfr.fr', 'gmx.com',
  'aol.com', 'msn.com', 'bbox.fr', 'noreply', 'no-reply',
]);

function extractEmail(raw: string): string {
  const m = raw.match(/<([^>]+)>/);
  return (m ? m[1] : raw).trim().toLowerCase();
}

function extractName(raw: string): string {
  const m = raw.match(/^([^<]+)<[^>]+>/);
  if (m) return m[1].trim().replace(/^["']|["']$/g, '');
  const email = extractEmail(raw);
  return email.split('@')[0].replace(/[._]/g, ' ');
}

function headerVal(headers: Array<{ name: string; value: string }>, name: string): string {
  return headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value ?? '';
}

function parseAddresses(raw: string): Array<{ email: string; name: string }> {
  if (!raw) return [];
  // Split on comma not inside angle brackets
  const parts = raw.split(/,(?![^<]*>)/);
  return parts.map(p => ({ email: extractEmail(p.trim()), name: extractName(p.trim()) })).filter(a => a.email.includes('@'));
}

async function gmailGet(path: string, token: string) {
  const r = await fetch(`${GMAIL}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw Object.assign(new Error(`Gmail ${r.status}`), { code: r.status });
  return r.json();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const auth = req.headers.get('Authorization');
    if (!auth) return json({ error: 'Missing Authorization' }, 401);

    const { data: { user }, error: authErr } = await supabase.auth.getUser(auth.replace('Bearer ', ''));
    if (authErr || !user) return json({ error: 'Unauthorized' }, 401);

    const body = await req.json().catch(() => ({}));
    const { organizationId, providerToken, lookbackDays = 90, minExchanges = 2 } = body;

    if (!organizationId) return json({ error: 'organizationId required' }, 400);

    // Resolve Gmail token
    let gmailToken: string | null = providerToken ?? null;
    if (!gmailToken) {
      const { data: connector } = await supabase
        .from('connectors')
        .select('metadata')
        .eq('organization_id', organizationId)
        .eq('provider', 'google')
        .eq('status', 'connected')
        .maybeSingle();
      gmailToken = (connector?.metadata as any)?.access_token ?? null;
    }
    if (!gmailToken) return json({ error: 'No Gmail token — connect Google first' }, 400);

    const userEmail = user.email?.toLowerCase() ?? '';
    const afterEpoch = Math.floor((Date.now() - lookbackDays * 86400000) / 1000);

    // ── 1. List message IDs (max 500 for performance) ────────────────────────
    const allIds: string[] = [];
    let pageToken: string | undefined;
    do {
      const params = new URLSearchParams({
        maxResults: '500',
        q: `after:${afterEpoch}`,
        ...(pageToken ? { pageToken } : {}),
      });
      const page: any = await gmailGet(`/users/me/messages?${params}`, gmailToken);
      for (const m of page.messages ?? []) allIds.push(m.id);
      pageToken = page.nextPageToken;
    } while (pageToken && allIds.length < 500);

    // ── 2. Batch-fetch headers (From / To / Cc) in chunks of 10 ─────────────
    const freq = new Map<string, { name: string; count: number; lastSeen: string }>();

    const chunkSize = 10;
    for (let i = 0; i < allIds.length; i += chunkSize) {
      const chunk = allIds.slice(i, i + chunkSize);
      await Promise.all(chunk.map(async (id) => {
        try {
          const msg: any = await gmailGet(
            `/users/me/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Cc`,
            gmailToken!,
          );
          const headers: Array<{ name: string; value: string }> = msg.payload?.headers ?? [];
          const sentAt = msg.internalDate
            ? new Date(parseInt(msg.internalDate)).toISOString()
            : new Date().toISOString();

          const candidates = [
            ...parseAddresses(headerVal(headers, 'From')),
            ...parseAddresses(headerVal(headers, 'To')),
            ...parseAddresses(headerVal(headers, 'Cc')),
          ];

          for (const { email, name } of candidates) {
            if (email === userEmail) continue;
            const domain = email.split('@')[1] ?? '';
            if (PERSONAL_DOMAINS.has(domain) || domain.includes('noreply') || domain.includes('no-reply')) continue;
            if (email.startsWith('noreply') || email.startsWith('no-reply') || email.startsWith('donotreply')) continue;

            const cur = freq.get(email);
            if (!cur) {
              freq.set(email, { name, count: 1, lastSeen: sentAt });
            } else {
              cur.count++;
              if (sentAt > cur.lastSeen) { cur.lastSeen = sentAt; cur.name = name || cur.name; }
            }
          }
        } catch { /* skip individual message errors */ }
      }));
    }

    // ── 3. Filter to minExchanges threshold ──────────────────────────────────
    const candidates = Array.from(freq.entries())
      .filter(([, v]) => v.count >= minExchanges)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 100);

    if (candidates.length === 0) return json({ suggestions: [] });

    // ── 4. Cross-check existing contacts ────────────────────────────────────
    const emails = candidates.map(([email]) => email);
    const { data: existing } = await supabase
      .from('contacts')
      .select('email')
      .eq('organization_id', organizationId)
      .is('merged_into_contact_id', null)
      .in('email', emails);

    const knownEmails = new Set((existing ?? []).map((c: any) => c.email?.toLowerCase()));

    const suggestions = candidates
      .filter(([email]) => !knownEmails.has(email))
      .map(([email, v]) => ({
        email,
        name: v.name || email.split('@')[0].replace(/[._]/g, ' '),
        domain: email.split('@')[1] ?? '',
        count: v.count,
        lastSeen: v.lastSeen,
      }))
      .slice(0, 50);

    return json({ suggestions, scanned: allIds.length });

  } catch (err: any) {
    console.error('discover-contacts error:', err.message);
    return json({ error: err.message ?? 'Internal error' }, 500);
  }
});
