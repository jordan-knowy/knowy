/**
 * ingest-communication v2
 * Gmail ingestion pipeline — métadonnées uniquement (RGPD-safe)
 *
 * Architecture v2 :
 *   - messages.list API (plus efficace que threads.list)
 *   - Pagination complète avec nextPageToken → jusqu'à 1000+ emails
 *   - Fetch metadata en parallèle (batches de 10)
 *   - Lookback par défaut : 365 jours
 *   - Support multi-contacts (cap 50 contacts / appel)
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';

const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1';

// ── Google token refresh ───────────────────────────────────────────────────
async function refreshGoogleToken(
  refreshToken: string,
  supabase: any,
  organizationId: string,
  userId: string,
): Promise<string | null> {
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
  if (!clientId || !clientSecret) return null;

  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const newToken: string = data.access_token;
    if (!newToken) return null;

    // Persist the refreshed token back to connectors.metadata
    const { data: conn } = await supabase
      .from('connectors')
      .select('metadata')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .eq('provider', 'google')
      .maybeSingle();

    await supabase.from('connectors').update({
      metadata: { ...(conn?.metadata ?? {}), access_token: newToken, stored_at: new Date().toISOString() },
      status: 'connected',
      updated_at: new Date().toISOString(),
    }).eq('organization_id', organizationId).eq('user_id', userId).eq('provider', 'google');

    return newToken;
  } catch {
    return null;
  }
}

// ── Gmail helpers ──────────────────────────────────────────────────────────
async function gmail<T = any>(path: string, token: string): Promise<T> {
  const res = await fetch(`${GMAIL_API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) throw Object.assign(new Error('TOKEN_EXPIRED'), { code: 401 });
  if (!res.ok) throw new Error(`Gmail ${res.status}: ${await res.text()}`);
  return res.json() as T;
}

function headerVal(headers: Array<{ name: string; value: string }>, name: string): string {
  return headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value ?? '';
}

function extractEmail(raw: string): string {
  const m = raw.match(/<([^>]+)>/) ?? raw.match(/([^\s,]+@[^\s,]+)/);
  return m ? m[1].trim().toLowerCase() : raw.trim().toLowerCase();
}

function isOutbound(headers: Array<{ name: string; value: string }>, labelIds: string[], userEmail: string): boolean {
  if (labelIds.includes('SENT')) return true;
  const from = extractEmail(headerVal(headers, 'From'));
  return from === userEmail.toLowerCase();
}

// ── Fetch all message IDs for a contact (paginated) ────────────────────────
async function listMessageIds(
  contactEmails: string | string[],
  token: string,
  afterEpoch: number,
  maxMessages: number,
): Promise<Array<{ id: string; threadId: string }>> {
  const results: Array<{ id: string; threadId: string }> = [];
  let pageToken: string | undefined;

  // Supporte plusieurs emails (email principal + alias secondaires d'un contact fusionné)
  const emails = Array.isArray(contactEmails) ? contactEmails : [contactEmails];
  const clause = emails.map(e => `from:${e} OR to:${e}`).join(' OR ');
  const q = encodeURIComponent(`(${clause}) after:${afterEpoch}`);

  do {
    const url = `/users/me/messages?q=${q}&maxResults=100${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`;
    const data = await gmail<{ messages?: Array<{ id: string; threadId: string }>; nextPageToken?: string }>(url, token);
    results.push(...(data.messages ?? []));
    pageToken = data.nextPageToken;
  } while (pageToken && results.length < maxMessages);

  return results.slice(0, maxMessages);
}

// ── Fetch message metadata in parallel batches ─────────────────────────────
async function batchFetchMetadata(
  ids: string[],
  token: string,
  batchSize = 10,
): Promise<any[]> {
  const results: any[] = [];
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    const fetched = await Promise.all(
      batch.map(id =>
        gmail(
          `/users/me/messages/${id}?format=metadata` +
          `&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Cc` +
          `&metadataHeaders=Subject&metadataHeaders=Date`,
          token,
        ).catch(() => null),
      ),
    );
    results.push(...fetched.filter(Boolean));
  }
  return results;
}

// ── Process one contact ────────────────────────────────────────────────────
async function processContact(
  contactId: string,
  contactEmail: string,
  organizationId: string,
  userEmail: string,
  token: string,
  supabase: any,
  afterEpoch: number,
  maxMessages: number,
  secondaryEmails: string[] = [],
): Promise<{ messages: number; threads: number }> {

  // 1. Get all message IDs (paginated) — inclut l'email principal + les alias
  const allEmails = [contactEmail, ...secondaryEmails.filter(Boolean)];
  const msgList = await listMessageIds(allEmails, token, afterEpoch, maxMessages);
  if (msgList.length === 0) return { messages: 0, threads: 0 };

  // 2. Fetch metadata in parallel batches of 10
  const msgDetails = await batchFetchMetadata(msgList.map(m => m.id), token, 10);
  if (msgDetails.length === 0) return { messages: 0, threads: 0 };

  // 3. Group by threadId to upsert threads
  const threadMap = new Map<string, { subject: string; firstDate: string }>();
  for (const msg of msgDetails) {
    const tid = msg.threadId as string;
    if (!threadMap.has(tid)) {
      const headers: Array<{ name: string; value: string }> = msg.payload?.headers ?? [];
      const subject = headerVal(headers, 'Subject') || '(Sans objet)';
      const date = msg.internalDate
        ? new Date(parseInt(msg.internalDate)).toISOString()
        : new Date().toISOString();
      threadMap.set(tid, { subject, firstDate: date });
    }
  }

  // 4. Upsert all threads → get UUID map
  const threadExternalIds = Array.from(threadMap.keys());
  const threadRows = threadExternalIds.map(extId => ({
    organization_id: organizationId,
    provider: 'google',
    external_thread_id: extId,
    subject: threadMap.get(extId)!.subject,
    updated_at: new Date().toISOString(),
  }));

  const { data: upsertedThreads } = await supabase
    .from('communication_threads')
    .upsert(threadRows, { onConflict: 'organization_id,provider,external_thread_id' })
    .select('id, external_thread_id');

  const threadUUIDMap = new Map<string, string>();
  for (const t of (upsertedThreads ?? [])) {
    threadUUIDMap.set(t.external_thread_id, t.id);
  }

  // 5. Build message payloads
  // Track last timestamps per thread for response time estimation
  const threadLastOut = new Map<string, number>();
  const threadLastIn = new Map<string, number>();

  // Sort messages by date ascending for response time calculation
  msgDetails.sort((a, b) => parseInt(a.internalDate ?? '0') - parseInt(b.internalDate ?? '0'));

  const msgPayloads: any[] = [];
  for (const msg of msgDetails) {
    const headers: Array<{ name: string; value: string }> = msg.payload?.headers ?? [];
    const labelIds: string[] = msg.labelIds ?? [];
    const tid = msg.threadId as string;
    const threadUUID = threadUUIDMap.get(tid);
    if (!threadUUID) continue;

    const sentAt = msg.internalDate
      ? new Date(parseInt(msg.internalDate)).toISOString()
      : null;
    if (!sentAt) continue;

    const msgTime = parseInt(msg.internalDate ?? '0');
    const outbound = isOutbound(headers, labelIds, userEmail);
    const direction = outbound ? 'outbound' : 'inbound';
    const subject = headerVal(headers, 'Subject') || null;

    // Response time estimation
    let responseTimeHours: number | null = null;
    if (outbound && threadLastIn.has(tid)) {
      const diff = (msgTime - threadLastIn.get(tid)!) / 3600000;
      if (diff >= 0 && diff <= 168) responseTimeHours = Math.round(diff * 10) / 10;
    } else if (!outbound && threadLastOut.has(tid)) {
      const diff = (msgTime - threadLastOut.get(tid)!) / 3600000;
      if (diff >= 0 && diff <= 168) responseTimeHours = Math.round(diff * 10) / 10;
    }
    if (outbound) threadLastOut.set(tid, msgTime);
    else threadLastIn.set(tid, msgTime);

    msgPayloads.push({
      organization_id: organizationId,
      thread_id: threadUUID,
      contact_id: contactId,
      provider: 'google',
      external_message_id: msg.id,
      direction,
      sent_at: sentAt,
      subject,
      body_text: null, // NEVER store body — RGPD
      metadata: {
        response_time_hours: responseTimeHours,
        gmail_labels: labelIds.filter(l => !['INBOX', 'UNREAD', 'IMPORTANT', 'CATEGORY_PERSONAL', 'CATEGORY_PROMOTIONS', 'CATEGORY_UPDATES', 'CATEGORY_SOCIAL', 'CATEGORY_FORUMS'].includes(l)),
      },
    });
  }

  // 6. Upsert messages in chunks to avoid payload limits
  let inserted = 0;
  const chunkSize = 100;
  for (let i = 0; i < msgPayloads.length; i += chunkSize) {
    const chunk = msgPayloads.slice(i, i + chunkSize);
    const { data: rows } = await supabase
      .from('communication_messages')
      .upsert(chunk, { onConflict: 'organization_id,provider,external_message_id' })
      .select('id');
    inserted += (rows ?? []).length;
  }

  // 7. Mark contact for re-enrichment if new messages arrived
  if (inserted > 0) {
    await supabase.from('contacts')
      .update({ enrichment_status: 'pending', updated_at: new Date().toISOString() })
      .eq('id', contactId)
      .eq('enrichment_status', 'done'); // only reset if previously done
  }

  return { messages: inserted, threads: threadMap.size };
}

// ── Main handler ───────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const auth = req.headers.get('Authorization');
  if (!auth) return jsonResponse({ error: 'Missing authorization header' }, 401);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  const jwt = auth.replace('Bearer ', '');
  const { data: { user }, error: userErr } = await supabase.auth.getUser(jwt);
  if (userErr || !user) return jsonResponse({ error: 'Unauthorized' }, 401);

  const body = await req.json().catch(() => ({}));
  const {
    organizationId,
    providerToken: bodyToken,
    contactEmails,
    lookbackDays = 365,
    maxMessagesPerContact = 1000,
  } = body;

  if (!organizationId) return jsonResponse({ error: 'organizationId is required' }, 400);

  // ── Resolve Google token — priorité : body token → token stocké en BDD ──
  // Fonctionne quel que soit le mode de connexion Supabase (email / LinkedIn / Google)
  let providerToken: string | null = bodyToken ?? null;

  if (!providerToken) {
    const { data: connector } = await supabase
      .from('connectors')
      .select('metadata, status')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .eq('provider', 'google')
      .maybeSingle();

    if (!connector || connector.status === 'not_connected') {
      return jsonResponse({
        error: 'Google non connecté. Allez dans Paramètres → Connexions et connectez votre compte Google.',
        code: 'NOT_CONNECTED',
      }, 400);
    }

    providerToken = (connector.metadata as any)?.access_token ?? null;

    // Si access_token absent mais refresh_token présent → tenter un refresh
    if (!providerToken && (connector.metadata as any)?.refresh_token) {
      const refreshed = await refreshGoogleToken((connector.metadata as any).refresh_token, supabase, organizationId, user.id);
      if (refreshed) providerToken = refreshed;
    }

    if (!providerToken) {
      return jsonResponse({
        error: 'Token Google introuvable ou expiré. Reconnectez votre compte Google dans Paramètres → Connexions.',
        code: 'TOKEN_MISSING',
      }, 401);
    }
  }

  const userEmail = user.email ?? '';
  const afterEpoch = Math.floor((Date.now() - lookbackDays * 86400000) / 1000);

  // Resolve which contacts to ingest
  let targetContacts: Array<{ id: string; email: string; secondary_emails: string[] }> = [];

  if (contactEmails?.length > 0) {
    const { data } = await supabase
      .from('contacts')
      .select('id, email, secondary_emails')
      .eq('organization_id', organizationId)
      .is('merged_into_contact_id', null)
      .in('email', contactEmails);
    targetContacts = (data ?? []).filter((c: any) => c.email);
  } else {
    const { data } = await supabase
      .from('contacts')
      .select('id, email, secondary_emails')
      .eq('organization_id', organizationId)
      .is('merged_into_contact_id', null)
      .not('email', 'is', null)
      .limit(50); // cap per call
    targetContacts = (data ?? []).filter((c: any) => c.email);
  }

  if (targetContacts.length === 0) {
    return jsonResponse({ success: true, message: 'No contacts with emails found', stats: { contacts: 0, messages: 0, threads: 0 } });
  }

  let totalMessages = 0;
  let totalThreads = 0;
  const errors: string[] = [];
  const contactStats: Array<{ email: string; messages: number; threads: number }> = [];

  for (const contact of targetContacts) {
    try {
      const result = await processContact(
        contact.id,
        contact.email,
        organizationId,
        userEmail,
        providerToken,
        supabase,
        afterEpoch,
        maxMessagesPerContact,
        contact.secondary_emails ?? [],
      );
      totalMessages += result.messages;
      totalThreads += result.threads;
      if (result.messages > 0) {
        contactStats.push({ email: contact.email, messages: result.messages, threads: result.threads });
      }
    } catch (err: any) {
      if (err?.code === 401 || err?.message === 'TOKEN_EXPIRED') {
        await supabase.from('connectors')
          .update({ status: 'expired', updated_at: new Date().toISOString() })
          .eq('organization_id', organizationId)
          .eq('user_id', user.id)
          .eq('provider', 'google');
        return jsonResponse({ error: 'Google token expired. Please reconnect.', code: 'TOKEN_EXPIRED' }, 401);
      }
      errors.push(`${contact.email}: ${err?.message ?? String(err)}`);
    }
  }

  // Update connector sync timestamp
  await supabase.from('connectors')
    .update({ status: 'connected', last_synced_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .eq('provider', 'google');

  return jsonResponse({
    success: true,
    stats: {
      contacts: targetContacts.length,
      messages: totalMessages,
      threads: totalThreads,
      errors: errors.length,
    },
    contactStats,
    errors: errors.slice(0, 5),
  });
});
