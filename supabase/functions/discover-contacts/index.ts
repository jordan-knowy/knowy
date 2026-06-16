/**
 * discover-contacts v3
 * Scanne les emails Gmail OU Outlook selon le provider connecté.
 * Retourne les interlocuteurs fréquents pas encore dans la base.
 * Le corps est lu en mémoire pour snippet — jamais stocké en base (RGPD).
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

// ── Domaines personnels à ignorer ─────────────────────────────────────────────
const PERSONAL_DOMAINS = new Set([
  'gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'yahoo.fr',
  'free.fr', 'orange.fr', 'wanadoo.fr', 'icloud.com', 'me.com',
  'live.com', 'protonmail.com', 'laposte.net', 'sfr.fr', 'gmx.com',
  'aol.com', 'msn.com', 'bbox.fr',
]);

function isSpam(email: string): boolean {
  if (/noreply|no-reply|donotreply|bounce|mailer-daemon/i.test(email)) return true;
  const local = email.split('@')[0];
  if (/noreply|no-reply|notifications?|alerts?|support|info|contact|newsletter/i.test(local)) return true;
  return false;
}

// ── Helpers Gmail ─────────────────────────────────────────────────────────────
const GMAIL = 'https://gmail.googleapis.com/gmail/v1';

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

function b64decode(s: string): string {
  try { return atob(s.replace(/-/g, '+').replace(/_/g, '/')); } catch { return ''; }
}

function extractBodyText(payload: any, depth = 0): string {
  if (!payload || depth > 4) return '';
  if (payload.mimeType === 'text/plain' && payload.body?.data) return b64decode(payload.body.data);
  if (payload.mimeType === 'text/html' && payload.body?.data) {
    return b64decode(payload.body.data).replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s{2,}/g, ' ').trim();
  }
  if (payload.parts?.length) {
    const plain = payload.parts.find((p: any) => p.mimeType === 'text/plain');
    if (plain) return extractBodyText(plain, depth + 1);
    const html = payload.parts.find((p: any) => p.mimeType === 'text/html');
    if (html) return extractBodyText(html, depth + 1);
    for (const part of payload.parts) { const t = extractBodyText(part, depth + 1); if (t) return t; }
  }
  return '';
}

function cleanSnippet(raw: string): string {
  return raw.split('\n').filter(l => !l.trim().startsWith('>')).join(' ')
    .replace(/\s{2,}/g, ' ').trim().slice(0, 250);
}

async function gmailGet(path: string, token: string) {
  const r = await fetch(`${GMAIL}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw Object.assign(new Error(`Gmail ${r.status}`), { code: r.status });
  return r.json();
}

// ── Helpers Outlook (Microsoft Graph) ────────────────────────────────────────
const GRAPH = 'https://graph.microsoft.com/v1.0';

async function graphGet(path: string, token: string) {
  const r = await fetch(`${GRAPH}${path}`, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } });
  if (r.status === 401) throw Object.assign(new Error('TOKEN_EXPIRED'), { code: 401 });
  if (!r.ok) throw new Error(`Graph ${r.status}: ${await r.text()}`);
  return r.json();
}

// ── Type fréquence contact ────────────────────────────────────────────────────
interface ContactFreq {
  name: string;
  count: number;
  lastSeen: string;
  lastSubject: string;
  lastSnippet: string;
}

// ── Scan Gmail ────────────────────────────────────────────────────────────────
async function scanGmail(token: string, userEmail: string, afterEpoch: number): Promise<Map<string, ContactFreq>> {
  const freq = new Map<string, ContactFreq>();
  const allIds: string[] = [];
  let pageToken: string | undefined;
  do {
    const params = new URLSearchParams({ maxResults: '500', q: `after:${afterEpoch}`, ...(pageToken ? { pageToken } : {}) });
    const page: any = await gmailGet(`/users/me/messages?${params}`, token);
    for (const m of page.messages ?? []) allIds.push(m.id);
    pageToken = page.nextPageToken;
  } while (pageToken && allIds.length < 1000);

  const chunkSize = 5;
  for (let i = 0; i < allIds.length; i += chunkSize) {
    const chunk = allIds.slice(i, i + chunkSize);
    await Promise.all(chunk.map(async (id) => {
      try {
        const msg: any = await gmailGet(`/users/me/messages/${id}?format=full`, token);
        const headers: Array<{ name: string; value: string }> = msg.payload?.headers ?? [];
        const sentAt = msg.internalDate ? new Date(parseInt(msg.internalDate)).toISOString() : new Date().toISOString();
        const subject = headerVal(headers, 'Subject') || '';
        const snippet = cleanSnippet(extractBodyText(msg.payload) || msg.snippet || '');
        const candidates = [
          ...parseAddresses(headerVal(headers, 'From')),
          ...parseAddresses(headerVal(headers, 'To')),
          ...parseAddresses(headerVal(headers, 'Cc')),
        ];
        for (const { email, name } of candidates) {
          if (email === userEmail) continue;
          const domain = email.split('@')[1] ?? '';
          if (PERSONAL_DOMAINS.has(domain) || isSpam(email)) continue;
          const cur = freq.get(email);
          if (!cur) { freq.set(email, { name, count: 1, lastSeen: sentAt, lastSubject: subject, lastSnippet: snippet }); }
          else {
            cur.count++;
            if (sentAt > cur.lastSeen) { cur.lastSeen = sentAt; if (name) cur.name = name; cur.lastSubject = subject; cur.lastSnippet = snippet; }
          }
        }
      } catch { /* skip */ }
    }));
  }
  return freq;
}

// ── Scan Outlook ──────────────────────────────────────────────────────────────
async function scanOutlook(token: string, userEmail: string, afterDate: string): Promise<Map<string, ContactFreq>> {
  const freq = new Map<string, ContactFreq>();
  const select = 'from,toRecipients,ccRecipients,subject,bodyPreview,receivedDateTime';
  const filter = `receivedDateTime ge ${afterDate}`;
  let nextLink: string | undefined;
  let scanned = 0;

  // First page
  const firstParams = new URLSearchParams({ $top: '100', $select: select, $filter: filter, $orderby: 'receivedDateTime desc' });
  let page: any = await graphGet(`/me/messages?${firstParams}`, token);

  do {
    for (const msg of page.value ?? []) {
      const receivedAt: string = msg.receivedDateTime ?? new Date().toISOString();
      const subject: string = msg.subject ?? '';
      const snippet: string = cleanSnippet(
        (msg.bodyPreview ?? '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ')
      );

      const candidates: Array<{ email: string; name: string }> = [];
      if (msg.from?.emailAddress) candidates.push({ email: msg.from.emailAddress.address?.toLowerCase() ?? '', name: msg.from.emailAddress.name ?? '' });
      for (const r of msg.toRecipients ?? []) { if (r.emailAddress) candidates.push({ email: r.emailAddress.address?.toLowerCase() ?? '', name: r.emailAddress.name ?? '' }); }
      for (const r of msg.ccRecipients ?? []) { if (r.emailAddress) candidates.push({ email: r.emailAddress.address?.toLowerCase() ?? '', name: r.emailAddress.name ?? '' }); }

      for (const { email, name } of candidates) {
        if (!email.includes('@') || email === userEmail) continue;
        const domain = email.split('@')[1] ?? '';
        if (PERSONAL_DOMAINS.has(domain) || isSpam(email)) continue;
        const cur = freq.get(email);
        if (!cur) { freq.set(email, { name, count: 1, lastSeen: receivedAt, lastSubject: subject, lastSnippet: snippet }); }
        else {
          cur.count++;
          if (receivedAt > cur.lastSeen) { cur.lastSeen = receivedAt; if (name) cur.name = name; cur.lastSubject = subject; cur.lastSnippet = snippet; }
        }
      }
      scanned++;
    }
    nextLink = page['@odata.nextLink'];
    if (nextLink && scanned < 1000) {
      const r = await fetch(nextLink, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } });
      if (!r.ok) break;
      page = await r.json();
    } else { break; }
  } while (scanned < 1000);

  return freq;
}

// ── Merge deux maps de fréquence ──────────────────────────────────────────────
function mergeFreqs(a: Map<string, ContactFreq>, b: Map<string, ContactFreq>): Map<string, ContactFreq> {
  const result = new Map(a);
  for (const [email, v] of b) {
    const existing = result.get(email);
    if (!existing) { result.set(email, v); }
    else {
      existing.count += v.count;
      if (v.lastSeen > existing.lastSeen) { existing.lastSeen = v.lastSeen; existing.lastSubject = v.lastSubject; existing.lastSnippet = v.lastSnippet; if (v.name) existing.name = v.name; }
    }
  }
  return result;
}

// ── Handler principal ─────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const auth = req.headers.get('Authorization');
    if (!auth) return json({ error: 'Missing Authorization' }, 401);

    const { data: { user }, error: authErr } = await supabaseClient.auth.getUser(auth.replace('Bearer ', ''));
    if (authErr || !user) return json({ error: 'Unauthorized' }, 401);

    const body = await req.json().catch(() => ({}));
    const {
      organizationId,
      googleToken,
      microsoftToken,
      lookbackDays = 90,
      minExchanges = 2,
    } = body;

    if (!organizationId) return json({ error: 'organizationId required' }, 400);

    const userEmail = user.email?.toLowerCase() ?? '';
    const afterEpoch = Math.floor((Date.now() - lookbackDays * 86400000) / 1000);
    const afterDate = new Date(Date.now() - lookbackDays * 86400000).toISOString();

    let combinedFreq = new Map<string, ContactFreq>();
    let totalScanned = 0;

    // ── Gmail ─────────────────────────────────────────────────────────────────
    if (googleToken) {
      try {
        const gmailFreq = await scanGmail(googleToken, userEmail, afterEpoch);
        combinedFreq = mergeFreqs(combinedFreq, gmailFreq);
        totalScanned += gmailFreq.size > 0 ? 1000 : 0; // approximation
      } catch (e: any) {
        console.error('Gmail scan error:', e.message);
      }
    }

    // ── Outlook ───────────────────────────────────────────────────────────────
    if (microsoftToken) {
      try {
        const outlookFreq = await scanOutlook(microsoftToken, userEmail, afterDate);
        combinedFreq = mergeFreqs(combinedFreq, outlookFreq);
      } catch (e: any) {
        console.error('Outlook scan error:', e.message);
      }
    }

    if (!googleToken && !microsoftToken) {
      return json({ error: 'Aucun compte mail connecté. Connectez Google ou Microsoft dans Paramètres.' }, 400);
    }

    // ── Seuil minimum d'échanges ──────────────────────────────────────────────
    const candidates = Array.from(combinedFreq.entries())
      .filter(([, v]) => v.count >= minExchanges)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 100);

    if (candidates.length === 0) return json({ suggestions: [], scanned: totalScanned });

    // ── Filtrer les contacts déjà connus ──────────────────────────────────────
    const emails = candidates.map(([email]) => email);
    const { data: existing } = await supabaseClient
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

    return json({ suggestions, scanned: totalScanned });

  } catch (err: any) {
    console.error('discover-contacts error:', err.message);
    return json({ error: err.message ?? 'Internal error' }, 500);
  }
});
