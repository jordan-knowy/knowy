/**
 * analyze-email-exchanges v1
 * Lit les corps des derniers emails d'un contact via Gmail API,
 * envoie le contexte conversationnel à Gemini 2.5 Flash (OpenRouter),
 * stocke UNIQUEMENT le résumé cognitif/relationnel — jamais le texte brut.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1';

// ── Résolution du token Google ─────────────────────────────────────────────
async function resolveGoogleToken(
  supabase: any,
  organizationId: string,
  userId: string,
  bodyToken: string | null,
): Promise<string | null> {
  if (bodyToken) return bodyToken;

  const { data: connector } = await supabase.from('connectors')
    .select('metadata, status')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .eq('provider', 'google')
    .maybeSingle();

  if (!connector || connector.status === 'not_connected') return null;

  let token = (connector.metadata as any)?.access_token ?? null;

  if (!token && (connector.metadata as any)?.refresh_token) {
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
    if (clientId && clientSecret) {
      try {
        const res = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: (connector.metadata as any).refresh_token,
            grant_type: 'refresh_token',
          }),
        });
        if (res.ok) {
          const data = await res.json();
          token = data.access_token ?? null;
          if (token) {
            await supabase.from('connectors').update({
              metadata: { ...(connector.metadata ?? {}), access_token: token, stored_at: new Date().toISOString() },
              status: 'connected',
              updated_at: new Date().toISOString(),
            }).eq('organization_id', organizationId).eq('user_id', userId).eq('provider', 'google');
          }
        }
      } catch { /* ignore */ }
    }
  }

  return token;
}

// ── Détection newsletters / emails automatiques ───────────────────────────
function isNewsletter(headers: Array<{ name: string; value: string }>): boolean {
  const h = (name: string) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value ?? '';
  // Emails automatiques / newsletters — jamais pertinents relationnellement
  if (h('List-Unsubscribe')) return true;
  if (h('List-Id')) return true;
  const precedence = h('Precedence').toLowerCase();
  if (precedence === 'bulk' || precedence === 'list' || precedence === 'junk') return true;
  if (h('Auto-Submitted') && h('Auto-Submitted').toLowerCase() !== 'no') return true;
  const xMailer = h('X-Mailer').toLowerCase();
  if (xMailer.includes('mailchimp') || xMailer.includes('sendgrid') || xMailer.includes('mailgun')) return true;
  return false;
  // Les emails de groupe (plusieurs destinataires) sont CONSERVÉS — pertinents relationnellement
}

// ── Extraction récursive du text/plain dans le MIME tree ──────────────────
function extractTextPlain(part: any): string {
  if (!part) return '';
  if (part.mimeType === 'text/plain' && part.body?.data) {
    try {
      // Gmail encode en base64url
      const b64 = (part.body.data as string).replace(/-/g, '+').replace(/_/g, '/');
      return atob(b64);
    } catch { return ''; }
  }
  if (part.parts && Array.isArray(part.parts)) {
    for (const sub of part.parts) {
      const t = extractTextPlain(sub);
      if (t) return t;
    }
  }
  return '';
}

// ── Nettoyage du corps (supprime signatures, citations, lignes vides) ──────
function cleanBody(raw: string, maxChars = 800): string {
  return raw
    .split('\n')
    .filter(line => {
      const t = line.trim();
      // Supprime lignes de citation, de signature, vides
      if (t.startsWith('>')) return false;
      if (/^[-_]{3,}$/.test(t)) return false;
      if (/^(De|From|À|To|Envoyé|Sent|Date|Objet|Subject)\s*:/i.test(t)) return false;
      return true;
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, maxChars);
}

// ── Appel OpenRouter Gemini 2.5 Flash ─────────────────────────────────────
async function callGemini(prompt: string): Promise<any> {
  const apiKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!apiKey) throw new Error('OPENROUTER_API_KEY non configuré');

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://knowy.ai',
      'X-Title': 'Knowy Email Analysis',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash-lite',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 600,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${err}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? '';
  try {
    return JSON.parse(text);
  } catch {
    // Tentative d'extraction du JSON si enrobé de texte
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('Réponse Gemini non parsable');
  }
}

// ── Main handler ──────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const auth = req.headers.get('Authorization');
  if (!auth) return jsonResponse({ error: 'Missing authorization header' }, 401);

  // Filet de sécurité global — capture toute exception non gérée
  try {

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  const jwt = auth.replace('Bearer ', '');
  const { data: { user }, error: userErr } = await supabase.auth.getUser(jwt);
  if (userErr || !user) return jsonResponse({ error: 'Unauthorized' }, 401);

  const body = await req.json().catch(() => ({}));
  const { contactId, organizationId, providerToken: bodyToken } = body;
  if (!contactId || !organizationId) {
    return jsonResponse({ error: 'contactId et organizationId requis' }, 400);
  }

  // 1. Résoudre le token Google
  const gmailToken = await resolveGoogleToken(supabase, organizationId, user.id, bodyToken ?? null);
  if (!gmailToken) {
    return jsonResponse({
      error: 'Token Google introuvable. Reconnectez votre compte Google dans Paramètres → Connexions.',
      code: 'TOKEN_MISSING',
    }, 401);
  }

  // 2. Récupérer les external_message_id stockés pour ce contact (20 plus récents)
  const { data: storedMsgs, error: msgsErr } = await supabase
    .from('communication_messages')
    .select('external_message_id, direction, sent_at, subject')
    .eq('contact_id', contactId)
    .eq('organization_id', organizationId)
    .order('sent_at', { ascending: false })
    .limit(20);

  if (msgsErr || !storedMsgs?.length) {
    return jsonResponse({
      error: 'Aucun email synchronisé pour ce contact. Lancez d\'abord une synchronisation Gmail.',
      code: 'NO_MESSAGES',
    }, 400);
  }

  // 3. Charger le nom du contact
  const { data: contactRow } = await supabase.from('contacts')
    .select('full_name, email, role_title, company_name')
    .eq('id', contactId).maybeSingle();

  const contactName = contactRow?.full_name ?? 'Contact';
  const userEmail = user.email ?? '';

  // 4. Récupérer les corps d'emails depuis Gmail (les 10 plus récents)
  const msgsToFetch = storedMsgs.slice(0, 10);
  const emailBodies: Array<{ direction: string; subject: string; body: string; date: string }> = [];

  await Promise.all(msgsToFetch.map(async (msg: any) => {
    try {
      const res = await fetch(
        `${GMAIL_API}/users/me/messages/${msg.external_message_id}?format=full`,
        { headers: { Authorization: `Bearer ${gmailToken}` } },
      );
      if (!res.ok) return;
      const gmailMsg = await res.json();
      const headers: Array<{ name: string; value: string }> = gmailMsg.payload?.headers ?? [];

      // Compter les destinataires directs (To) pour détecter emails de masse
      // Ignorer newsletters, bulk, automatiques
      if (isNewsletter(headers)) return;

      const rawBody = extractTextPlain(gmailMsg.payload);
      const cleanedBody = cleanBody(rawBody, 800);
      if (cleanedBody.length > 20) {
        emailBodies.push({
          direction: msg.direction,
          subject: msg.subject ?? '(Sans objet)',
          body: cleanedBody,
          date: msg.sent_at,
        });
      }
    } catch { /* ignore les erreurs individuelles */ }
  }));

  if (emailBodies.length === 0) {
    return jsonResponse({
      error: 'Impossible de lire les corps des emails. Vérifiez les permissions Gmail.',
      code: 'BODY_READ_FAILED',
    }, 400);
  }

  // 5. Construire le contexte conversationnel (limité à ~6000 chars total)
  emailBodies.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let conversationContext = '';
  for (const e of emailBodies) {
    const label = e.direction === 'outbound' ? `[Moi → ${contactName}]` : `[${contactName} → Moi]`;
    const entry = `${label} Objet: ${e.subject}\n${e.body}\n\n`;
    if ((conversationContext + entry).length > 6000) break;
    conversationContext += entry;
  }

  // 6. Prompt cognitif / relationnel — Gemini 2.5 Flash
  const prompt = `Tu es un expert en intelligence relationnelle et en psychologie cognitive.

Analyse la relation professionnelle entre moi (${userEmail}) et ${contactName}${contactRow?.role_title ? ` (${contactRow.role_title}${contactRow.company_name ? ` chez ${contactRow.company_name}` : ''})` : ''} à travers ces échanges emails.

RÈGLES ABSOLUES :
- Ne reproduis JAMAIS le contenu brut des emails
- Ne stocke aucune information personnelle ou confidentielle
- Analyse uniquement le style, le ton et la dynamique relationnelle

ÉCHANGES À ANALYSER :
${conversationContext}

Réponds UNIQUEMENT en JSON valide avec cette structure exacte :
{
  "relationship_tone": "chaud|neutre|froid",
  "formality": "très formel|formel|semi-formel|informel",
  "engagement_level": "très élevé|élevé|modéré|faible",
  "communication_style": "analytique|assertif|empathique|directif|collaboratif",
  "key_topics": ["max 5 thèmes identifiés"],
  "behavioral_signals": ["max 5 signaux comportementaux observables"],
  "relationship_summary": "2-3 phrases de synthèse relationnelle en français, focus sur la dynamique de la relation",
  "contact_engagement": "description courte du niveau d'engagement du contact",
  "my_posture": "description courte de ma posture dans ces échanges",
  "red_flags": ["signaux d'alerte éventuels, tableau vide si aucun"],
  "opportunities": ["opportunités relationnelles identifiées"],
  "emails_analyzed": ${emailBodies.length}
}`;

  let analysis: any;
  try {
    analysis = await callGemini(prompt);
  } catch (e: any) {
    return jsonResponse({ error: `Analyse IA échouée : ${e.message}`, code: 'AI_FAILED' }, 500);
  }

  // 7. Enrichir le résultat avec des métadonnées
  const result = {
    ...analysis,
    analyzed_at: new Date().toISOString(),
    emails_analyzed: emailBodies.length,
    model: 'gemini-2.5-flash',
  };

  // 8. Stocker dans contacts.email_analysis — jamais le texte brut
  const { error: saveErr } = await supabase.from('contacts')
    .update({ email_analysis: result, updated_at: new Date().toISOString() })
    .eq('id', contactId)
    .eq('organization_id', organizationId);

  if (saveErr) {
    console.error('Save error:', saveErr.message);
  }

  return jsonResponse({ success: true, analysis: result });

  } catch (e: any) {
    console.error('Uncaught error:', e?.message ?? String(e), e?.stack ?? '');
    return jsonResponse({ error: `Erreur interne : ${e?.message ?? String(e)}`, code: 'INTERNAL_ERROR' }, 500);
  }
});
