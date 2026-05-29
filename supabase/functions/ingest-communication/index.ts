/**
 * ingest-communication
 * Pipeline d'ingestion Gmail (métadonnées uniquement — doc 09 v1.0)
 *
 * RGPD-safe : on ne lit JAMAIS le body des emails, uniquement les headers.
 * Scope Gmail requis : gmail.metadata (readonly)
 *
 * Ce que ce pipeline extrait :
 *   - Threads (sujet, participants, dates)
 *   - Messages (direction, thread_id, date, temps de réponse estimé)
 *   - Mise à jour du connector last_synced_at
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';

const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1';

// ── Gmail API helpers ────────────────────────────────────────────────────────

async function gmailFetch(path: string, token: string) {
  const res = await fetch(`${GMAIL_API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gmail API ${res.status}: ${err}`);
  }
  return res.json();
}

interface GmailThread { id: string; historyId: string; }
interface GmailMessage {
  id: string;
  threadId: string;
  internalDate: string;
  payload?: { headers?: Array<{ name: string; value: string }> };
  labelIds?: string[];
}

function headerVal(msg: GmailMessage, name: string): string {
  return msg.payload?.headers?.find(h => h.name.toLowerCase() === name.toLowerCase())?.value ?? '';
}

function extractEmail(raw: string): string {
  const match = raw.match(/<([^>]+)>/) || raw.match(/([^\s,]+@[^\s,]+)/);
  return match ? match[1].trim().toLowerCase() : raw.trim().toLowerCase();
}

function isOutbound(msg: GmailMessage, userEmail: string): boolean {
  return (msg.labelIds?.includes('SENT') ?? false)
    || extractEmail(headerVal(msg, 'from')) === userEmail.toLowerCase();
}

// ── Main edge function ───────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return jsonResponse({ error: 'Missing authorization header' }, 401);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  const jwt = authHeader.replace('Bearer ', '');
  const { data: { user }, error: userErr } = await supabase.auth.getUser(jwt);
  if (userErr || !user) return jsonResponse({ error: 'Unauthorized' }, 401);

  const body = await req.json().catch(() => ({}));
  const { organizationId, providerToken, contactEmails, lookbackDays = 90 } = body;

  if (!organizationId) return jsonResponse({ error: 'organizationId is required' }, 400);
  if (!providerToken) return jsonResponse({ error: 'providerToken is required — reconnect Google' }, 400);

  const userEmail = user.email ?? '';

  // Resolve which contacts to ingest
  let targetEmails: string[] = [];
  if (contactEmails && Array.isArray(contactEmails) && contactEmails.length > 0) {
    targetEmails = contactEmails;
  } else {
    // Fetch all contacts in the org
    const { data: contacts } = await supabase
      .from('contacts')
      .select('email')
      .eq('organization_id', organizationId)
      .not('email', 'is', null);
    targetEmails = (contacts || []).map((c: any) => c.email).filter(Boolean);
  }

  if (targetEmails.length === 0) {
    return jsonResponse({ success: true, message: 'No contacts to ingest', messagesStored: 0 });
  }

  const afterDate = new Date(Date.now() - lookbackDays * 86400000);
  const afterEpoch = Math.floor(afterDate.getTime() / 1000);

  let totalMessagesStored = 0;
  let totalThreadsStored = 0;
  const errors: string[] = [];

  for (const contactEmail of targetEmails.slice(0, 20)) {  // cap at 20 contacts per call
    try {
      // Find contact_id
      const { data: contactRow } = await supabase
        .from('contacts')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('email', contactEmail)
        .maybeSingle();

      if (!contactRow) continue;
      const contactId = contactRow.id;

      // ── Search Gmail threads with this contact ──────────────────────
      const query = encodeURIComponent(
        `(from:${contactEmail} OR to:${contactEmail}) after:${afterEpoch}`
      );
      const threadsData = await gmailFetch(
        `/users/me/threads?q=${query}&maxResults=50`,
        providerToken,
      );

      const threads: GmailThread[] = threadsData.threads || [];
      if (threads.length === 0) continue;

      for (const thread of threads) {
        // ── Fetch thread details (headers only) ─────────────────────
        let threadDetail: any;
        try {
          threadDetail = await gmailFetch(
            `/users/me/threads/${thread.id}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Cc&metadataHeaders=Date&metadataHeaders=Subject`,
            providerToken,
          );
        } catch {
          continue;
        }

        const msgs: GmailMessage[] = threadDetail.messages || [];
        if (msgs.length === 0) continue;

        // Extract subject from first message
        const subject = headerVal(msgs[0], 'Subject') || '(Sans objet)';
        const participants = new Set<string>();
        for (const m of msgs) {
          const from = extractEmail(headerVal(m, 'From'));
          const to = headerVal(m, 'To').split(',').map(extractEmail);
          const cc = headerVal(m, 'Cc').split(',').map(extractEmail).filter(Boolean);
          if (from) participants.add(from);
          to.forEach(e => { if (e) participants.add(e); });
          cc.forEach(e => { if (e) participants.add(e); });
        }

        // Upsert communication_thread
        const { data: threadRow } = await supabase
          .from('communication_threads')
          .upsert({
            organization_id: organizationId,
            provider: 'google',
            external_thread_id: thread.id,
            subject,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'organization_id,provider,external_thread_id' })
          .select('id')
          .single();

        if (!threadRow) continue;
        totalThreadsStored++;

        // ── Upsert each message ──────────────────────────────────────
        const msgPayloads = [];
        let lastOutboundTime: number | null = null;
        let lastInboundTime: number | null = null;

        for (const msg of msgs) {
          const sentAt = msg.internalDate
            ? new Date(parseInt(msg.internalDate)).toISOString()
            : null;
          if (!sentAt) continue;

          const msgTime = new Date(sentAt).getTime();
          const outbound = isOutbound(msg, userEmail);
          const direction = outbound ? 'outbound' : 'inbound';

          // Estimate response time
          let responseTimeHours: number | null = null;
          if (outbound && lastInboundTime != null) {
            responseTimeHours = (msgTime - lastInboundTime) / 3600000;
            if (responseTimeHours < 0 || responseTimeHours > 168) responseTimeHours = null;
          } else if (!outbound && lastOutboundTime != null) {
            responseTimeHours = (msgTime - lastOutboundTime) / 3600000;
            if (responseTimeHours < 0 || responseTimeHours > 168) responseTimeHours = null;
          }

          if (outbound) lastOutboundTime = msgTime;
          else lastInboundTime = msgTime;

          msgPayloads.push({
            organization_id: organizationId,
            thread_id: threadRow.id,
            contact_id: contactId,
            provider: 'google',
            external_message_id: msg.id,
            direction,
            sent_at: sentAt,
            body_text: null,  // NEVER store body — RGPD
            metadata: {
              response_time_hours: responseTimeHours,
              participant_count: participants.size,
              has_external: participants.size > 2,
            },
          });
        }

        if (msgPayloads.length > 0) {
          const { data: inserted } = await supabase
            .from('communication_messages')
            .upsert(msgPayloads, { onConflict: 'organization_id,provider,external_message_id' })
            .select('id');
          totalMessagesStored += (inserted || []).length;
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('401')) {
        // Token expired — update connector status
        await supabase.from('connectors')
          .update({ status: 'expired', updated_at: new Date().toISOString() })
          .eq('organization_id', organizationId)
          .eq('user_id', user.id)
          .eq('provider', 'google');
        return jsonResponse({ error: 'Google token expired. Please reconnect.', code: 'TOKEN_EXPIRED' }, 401);
      }
      errors.push(`${contactEmail}: ${msg}`);
    }
  }

  // Update connector last_synced_at
  await supabase.from('connectors')
    .update({ status: 'connected', last_synced_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .eq('provider', 'google');

  return jsonResponse({
    success: true,
    stats: {
      contactsProcessed: Math.min(targetEmails.length, 20),
      threadsStored: totalThreadsStored,
      messagesStored: totalMessagesStored,
      errors: errors.length,
    },
    errors: errors.slice(0, 5),
  });
});
