/**
 * discover-contacts v2
 * Scanne les 1000 derniers emails Gmail, lit les headers + corps du message,
 * retourne les interlocuteurs fréquents non encore présents dans la base.
 *
 * Le corps est lu en mémoire pour extraction de snippet — jamais stocké en base.
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

const PERSONAL_DOMAINS = new Set([
  'gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'yahoo.fr',
  'free.fr', 'orange.fr', 'wanadoo.fr', 'icloud.com', 'me.com',
  'live.com', 'protonmail.com', 'laposte.net', 'sfr.fr', 'gmx.com',
  'aol.com', 'msn.com', 'bbox.fr',
]);

function extractEmail(raw: string): string {
  const m = raw.match(/<([^>]+)>/);
  return (m ? m[1] : raw).trim().toLowerCase();
}

function extractName(raw: string): string {
  const m = raw.match(/^([^<]+)<[^>]+>/);
  if (m) return m[1].trim().replace(/^["']|["']$/g, '');
  return extractEmail(raw).split('@')[0].replace(/[._-]/g, ' ');
}

function headerVal(headers: Array<{ name: string; value: string }>, name: string): string {
  return headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value ?? '';
}

function parseAddresses(raw: string): Array<{ email: string; name: string }> {
  if (!raw) return [];
  return raw.split(/,(?![^<]*>)/)
    .map(p => ({ email: extractEmail(p.trim()), name: extractName(p.trim()) }))
    .filter(a => a.email.includes('@'));
}

// Décode base64url → texte UTF-8
function b64decode(s: string): string {
  try {
    return atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  } catch {
    return '';
  }
}

// Extrait le texte brut depuis payload Gmail (full format)
function extractBodyText(payload: any, depth = 0): string {
  if (!payload || depth > 4) return '';

  // Corps direct text/plain
  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    return b64decode(payload.body.data);
  }

  // Corps direct text/html — strip les balises
  if (payload.mimeType === 'text/html' && payload.body?.data) {
    return b64decode(payload.body.data).replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s{2,}/g, ' ').trim();
  }

  // Multipart : cherche text/plain en priorité, sinon text/html
  if (payload.parts?.length) {
    const plain = payload.parts.find((p: any) => p.mimeType === 'text/plain');
    if (plain) return extractBodyText(plain, depth + 1);
    const html = payload.parts.find((p: any) => p.mimeType === 'text/html');
    if (html) return extractBodyText(html, depth + 1);
    // Multipart imbriqué
    for (const part of payload.parts) {
      const t = extractBodyText(part, depth + 1);
      if (t) return t;
    }
  }

  return '';
}

// Extrait un snippet propre (250 chars max, sans les lignes de citation >)
function cleanSnippet(raw: string): string {
  return raw
    .split('\n')
    .filter(l => !l.trim().startsWith('>'))   // retire les citations
    .join(' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, 250);
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

    // ── 1. Lister les IDs — jusqu'à 1000 messages (2 pages × 500) ────────────
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
    } while (pageToken && allIds.length < 1000);

    // ── 2. Fetch complet (headers + body) en chunks de 5 en parallèle ────────
    interface ContactFreq {
      name: string;
      count: number;
      lastSeen: string;
      lastSubject: string;
      lastSnippet: string;
    }
    const freq = new Map<string, ContactFreq>();

    const chunkSize = 5; // réduit vs metadata-only car payloads plus lourds
    for (let i = 0; i < allIds.length; i += chunkSize) {
      const chunk = allIds.slice(i, i + chunkSize);
      await Promise.all(chunk.map(async (id) => {
        try {
          const msg: any = await gmailGet(`/users/me/messages/${id}?format=full`, gmailToken!);
          const headers: Array<{ name: string; value: string }> = msg.payload?.headers ?? [];
          const sentAt = msg.internalDate
            ? new Date(parseInt(msg.internalDate)).toISOString()
            : new Date().toISOString();

          const subject = headerVal(headers, 'Subject') || '';
          const bodyRaw = extractBodyText(msg.payload);
          const snippet = cleanSnippet(bodyRaw || msg.snippet || '');

          const candidates = [
            ...parseAddresses(headerVal(headers, 'From')),
            ...parseAddresses(headerVal(headers, 'To')),
            ...parseAddresses(headerVal(headers, 'Cc')),
          ];

          for (const { email, name } of candidates) {
            if (email === userEmail) continue;
            const domain = email.split('@')[1] ?? '';
            if (PERSONAL_DOMAINS.has(domain)) continue;
            if (/noreply|no-reply|donotreply|bounce|mailer-daemon/i.test(email)) continue;
            if (/noreply|no-reply|notifications?|alerts?|support|info|contact|newsletter/i.test(email.split('@')[0])) continue;

            const cur = freq.get(email);
            if (!cur) {
              freq.set(email, { name, count: 1, lastSeen: sentAt, lastSubject: subject, lastSnippet: snippet });
            } else {
              cur.count++;
              if (sentAt > cur.lastSeen) {
                cur.lastSeen = sentAt;
                if (name) cur.name = name;
                cur.lastSubject = subject;
                cur.lastSnippet = snippet;
              }
            }
          }
        } catch { /* skip message errors */ }
      }));
    }

    // ── 3. Seuil minimum d'échanges ──────────────────────────────────────────
    const candidates = Array.from(freq.entries())
      .filter(([, v]) => v.count >= minExchanges)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 100);

    if (candidates.length === 0) return json({ suggestions: [], scanned: allIds.length });

    // ── 4. Filtrer les contacts déjà connus ───────────────────────────────────
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
        name: v.name || email.split('@')[0].replace(/[._-]/g, ' '),
        domain: email.split('@')[1] ?? '',
        count: v.count,
        lastSeen: v.lastSeen,
        lastSubject: v.lastSubject,
        lastSnippet: v.lastSnippet,
      }))
      .slice(0, 50);

    return json({ suggestions, scanned: allIds.length });

  } catch (err: any) {
    console.error('discover-contacts error:', err.message);
    return json({ error: err.message ?? 'Internal error' }, 500);
  }
});
