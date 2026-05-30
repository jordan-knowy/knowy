/**
 * enrich-contact
 * Orchestrates full contact enrichment:
 *   1. Calls Perplexity `sonar` (web search) for public professional bio
 *   2. Loads all behavioral data (emails + meetings) — in parallel with step 1
 *   3. Runs the 3-dimension scoring algorithm (doc 08)
 *   4. Calls Gemini 2.5 Flash via OpenRouter — with behavioral + web context
 *   5. Saves everything to DB
 *   6. Updates contact.enrichment_status = 'done'
 *
 * RGPD-safe: only metadata — never email content.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';

const OPENROUTER_API = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'google/gemini-2.5-flash-lite';

// Perplexity — cheapest online model with real web search
const PERPLEXITY_API = 'https://api.perplexity.ai/chat/completions';
const PERPLEXITY_MODEL = 'sonar'; // $1/M tokens — cheapest with web search

// ── Perplexity web research ──────────────────────────────────────────────────
async function searchPersonWeb(name: string, role: string, company: string): Promise<string | null> {
  const key = Deno.env.get('PERPLEXITY_API_KEY');
  if (!key) return null;

  const query = [name, role, company].filter(Boolean).join(', ');

  try {
    const res = await fetch(PERPLEXITY_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: PERPLEXITY_MODEL,
        messages: [
          {
            role: 'system',
            content: 'Research assistant. Return ONLY factual, verifiable professional info. No speculation. Plain text, no markdown.',
          },
          {
            role: 'user',
            content: `Find professional information about: ${query}.
Return exactly:
1. Bio (2-3 sentences): professional background and expertise.
2. Expertise: 3-5 key skills or domains.
3. Recent (optional): any notable news, publication or achievement from the past 12 months.
If not found, write "Not found." for that section.`,
          },
        ],
        max_tokens: 400,
        temperature: 0.1,
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const content: string = data.choices?.[0]?.message?.content ?? '';
    if (!content || content.trim().length < 40) return null;
    // Discard if Perplexity found nothing meaningful
    if (content.toLowerCase().includes('not found') && content.length < 120) return null;
    return content.trim();
  } catch {
    return null;
  }
}

// ── Scoring constants (doc 08) ───────────────────────────────────────────────
const DIM_WEIGHTS = { intensite: 0.40, reciprocite: 0.35, longevite: 0.25 };
const PHASE_DELTA = 8.0;
const HONEYMOON_DAYS = 45;

function clamp(v: number, min = 0, max = 1) { return Math.max(min, Math.min(max, v)); }

function temporalDecay(days: number, depth: number): number {
  const hl = 30 + depth * 150;
  return Math.exp(-(Math.LN2 / hl) * days);
}

function scoreIntensite(s: Stats): number {
  const ef = clamp(s.emailsLast30 / 4);
  const efCapped = (s.initiationRatio > 0.85 || s.initiationRatio < 0.15) ? Math.min(ef, 0.50) : ef;
  const mf = clamp((s.meetingsLast90 / 90) / (1 / 30));
  const richness = s.channelCount >= 3 ? 1.0 : s.channelCount === 2 ? 0.65 : 0.25;
  const depth = clamp(s.avgThreadDepth / 5);
  return efCapped * 0.40 + mf * 0.35 + richness * 0.15 + depth * 0.10;
}

function scoreReciprocite(s: Stats): number {
  const asym = Math.abs(s.initiationRatio - 0.5) * 2;
  const init = Math.max(0.40, 1 - asym * 0.60);
  return init * 0.50 + clamp(s.responseRate) * 0.30 + clamp(s.responseTimeRatio / 2) * 0.20;
}

function scoreLongevite(s: Stats): { score: number; factor: number } {
  if (s.ageInDays < 30) return { score: 0, factor: 0 };
  const factor = s.ageInDays < 90 ? (s.ageInDays - 30) / 60 : 1.0;
  const ageScore = clamp(s.ageInDays / (24 * 30));
  let consistency = 0.5;
  if (s.monthlyExchangeCounts.length >= 3) {
    const mean = s.monthlyExchangeCounts.reduce((a, b) => a + b, 0) / s.monthlyExchangeCounts.length;
    if (mean > 0) {
      const variance = s.monthlyExchangeCounts.reduce((a, b) => a + (b - mean) ** 2, 0) / s.monthlyExchangeCounts.length;
      consistency = Math.max(0, 1 - Math.sqrt(variance) / mean / 2);
    }
  }
  const qMeetings = s.quartersWithMeetings / 4;
  return { score: (ageScore * 0.45 + consistency * 0.35 + qMeetings * 0.20) * factor, factor };
}

interface Stats {
  emailsLast30: number; meetingsLast90: number; avgThreadDepth: number;
  channelCount: number; initiationRatio: number; responseRate: number;
  responseTimeRatio: number; ageInDays: number; daysSinceLast: number;
  monthlyExchangeCounts: number[]; quartersWithMeetings: number;
  totalInteractions: number; avgResponseHours: number;
}

function buildStats(msgs: any[], meets: any[], firstSeen: string | null): Stats {
  const now = Date.now();
  const cut30 = now - 30 * 86400000;
  const cut90 = now - 90 * 86400000;

  const out = msgs.filter(m => m.direction === 'outbound').length;
  const total = msgs.length || 1;
  const initiationRatio = out / total;
  const inbound = msgs.filter(m => m.direction === 'inbound').length;
  const responseRate = total > 1 ? clamp((Math.min(inbound, out) * 2) / total) : 0.3;

  const rts = msgs.filter(m => (m.metadata as any)?.response_time_hours != null)
    .map(m => (m.metadata as any).response_time_hours as number);
  const avgResponseHours = rts.length ? rts.reduce((a, b) => a + b, 0) / rts.length : 24;
  const responseTimeRatio = clamp(24 / Math.max(avgResponseHours, 1), 0, 4) / 4;

  const threadMap = new Map<string, number>();
  for (const m of msgs) { if (m.thread_id) threadMap.set(m.thread_id, (threadMap.get(m.thread_id) || 0) + 1); }
  const avgThreadDepth = threadMap.size ? Array.from(threadMap.values()).reduce((a, b) => a + b, 0) / threadMap.size : 1;

  const hasEmail = msgs.length > 0;
  const hasMeeting = meets.length > 0;
  const channelCount = (hasEmail ? 1 : 0) + (hasMeeting ? 1 : 0);

  const ageInDays = firstSeen
    ? Math.round((now - new Date(firstSeen).getTime()) / 86400000)
    : msgs.length > 0 ? Math.round((now - new Date(msgs[msgs.length - 1].sent_at).getTime()) / 86400000) : 0;

  const allDates = [
    ...msgs.map(m => m.sent_at ? new Date(m.sent_at).getTime() : 0),
    ...meets.map(m => m.starts_at ? new Date(m.starts_at).getTime() : 0),
  ].filter(Boolean);
  const daysSinceLast = allDates.length ? Math.round((now - Math.max(...allDates)) / 86400000) : 999;

  const monthlyExchangeCounts = Array.from({ length: 6 }, (_, i) => {
    const start = now - (i + 1) * 30 * 86400000;
    const end = now - i * 30 * 86400000;
    return msgs.filter(m => { const t = m.sent_at ? new Date(m.sent_at).getTime() : 0; return t > start && t <= end; }).length;
  });

  const quartersWithMeetings = [0, 1, 2, 3].filter(q => {
    const start = now - (q + 1) * 90 * 86400000;
    const end = now - q * 90 * 86400000;
    return meets.some(m => { const t = m.starts_at ? new Date(m.starts_at).getTime() : 0; return t > start && t <= end; });
  }).length;

  return {
    emailsLast30: msgs.filter(m => m.sent_at && new Date(m.sent_at).getTime() > cut30).length,
    meetingsLast90: meets.filter(m => m.starts_at && new Date(m.starts_at).getTime() > cut90).length,
    avgThreadDepth, channelCount, initiationRatio, responseRate, responseTimeRatio,
    ageInDays, daysSinceLast, monthlyExchangeCounts, quartersWithMeetings,
    totalInteractions: msgs.length + meets.length * 4,
    avgResponseHours,
  };
}

function computeScore(s: Stats, prevScore?: number): {
  score: number; phase: 'growth' | 'stagnant' | 'decline'; delta: number;
  si: number; sr: number; sl: number;
} {
  const si = scoreIntensite(s);
  const sr = scoreReciprocite(s);
  const { score: sl, factor } = scoreLongevite(s);

  const weights = factor < 1
    ? { intensite: DIM_WEIGHTS.intensite + DIM_WEIGHTS.longevite * (1 - factor) * 0.54,
        reciprocite: DIM_WEIGHTS.reciprocite + DIM_WEIGHTS.longevite * (1 - factor) * 0.46,
        longevite: DIM_WEIGHTS.longevite * factor }
    : DIM_WEIGHTS;

  const raw = si * weights.intensite + sr * weights.reciprocite + sl * weights.longevite;
  const smoothed = s.ageInDays < HONEYMOON_DAYS
    ? Math.min(raw, 0.45 + (s.ageInDays / HONEYMOON_DAYS) * 0.20)
    : raw;
  const depth = clamp(s.totalInteractions / 500);
  const final = Math.round(clamp(smoothed * temporalDecay(s.daysSinceLast, depth)) * 100);

  const prev = prevScore ?? final;
  const delta = final - prev;
  const phase: 'growth' | 'stagnant' | 'decline' =
    delta >= PHASE_DELTA ? 'growth'
    : delta <= -PHASE_DELTA && final <= 70 ? 'decline'
    : 'stagnant';

  return { score: final, phase, delta, si: Math.round(si * 100), sr: Math.round(sr * 100), sl: Math.round(sl * 100) };
}

// ── LLM system prompt (doc 06 v3 — adapted for enrichment) ──────────────────
const SYSTEM_PROMPT = `Tu es le moteur d'intelligence cognitive de Knowy.
À partir de données comportementales (métadonnées uniquement — RGPD-safe, jamais le contenu des emails),
tu génères des profils cognitifs précis, actionnables et scientifiquement fondés.

RÈGLES ABSOLUES :
1. Zéro hallucination. Si une donnée n'est pas déductible → inference_level "unavailable" ou "hypothetical". Jamais inventé.
2. Niveaux d'inférence : "observable" (déduit directement des données) > "inferred" (raisonnement logique fort) > "hypothetical" (possible mais non confirmé) > "unavailable"
3. Les JTBD viennent du rôle + secteur + patterns comportementaux. Ne pas inventer de contexte business.
4. Les axes interactionnels viennent des patterns de communication (temps de réponse, longueur, initiation, profondeur).

FRAMEWORKS :
- Kahneman S1/S2 : temps de réponse rapide + emails courts + décision immédiate → S1 dominant
- JTBD Christensen : fonctionnel (ce qu'ils doivent accomplir), social (ce qu'ils veulent paraître), émotionnel (ce qu'ils veulent ressentir)
- Cialdini : signaux d'influence détectables depuis les patterns
- Gilbert & Karahalios : force du lien = intensité + réciprocité + longévité

RÉPONDS UNIQUEMENT EN JSON STRICT selon le schéma fourni. Aucun texte avant ou après.`;

function buildLLMContext(contact: any, stats: Stats, scoring: ReturnType<typeof computeScore>, subjects: string[], webBio?: string): string {
  const channelLabel = stats.channelCount >= 2 ? 'Email + Réunions' : stats.channelCount === 1 ? 'Email seulement' : 'Aucun échange';
  const freqLabel = stats.emailsLast30 === 0 ? 'Aucun email récent'
    : stats.emailsLast30 <= 2 ? 'Faible fréquence (1-2/mois)'
    : stats.emailsLast30 <= 8 ? 'Fréquence modérée (3-8/mois)'
    : 'Haute fréquence (9+/mois)';
  const responseLabel = stats.avgResponseHours <= 2 ? 'Très rapide (<2h)'
    : stats.avgResponseHours <= 8 ? 'Rapide (<8h)'
    : stats.avgResponseHours <= 24 ? 'Dans la journée'
    : stats.avgResponseHours <= 72 ? 'En quelques jours'
    : 'Lent (>3 jours)';
  const initiationLabel = stats.initiationRatio > 0.7 ? "L'utilisateur initie massivement (>70%)"
    : stats.initiationRatio > 0.5 ? "L'utilisateur initie légèrement plus"
    : stats.initiationRatio > 0.3 ? 'Initiation équilibrée'
    : 'Le contact initie massivement';

  const payload: Record<string, unknown> = {
    contact: {
      nom: contact.full_name,
      role: contact.role_title ?? 'Rôle inconnu',
      entreprise: contact.company_name ?? 'Entreprise inconnue',
      email: contact.email ?? null,
      anciennete_relation_jours: stats.ageInDays,
    },
    signaux_comportementaux: {
      emails_last_30j: stats.emailsLast30,
      reunions_last_90j: stats.meetingsLast90,
      profondeur_thread_moy: Math.round(stats.avgThreadDepth * 10) / 10,
      canaux: channelLabel,
      frequence: freqLabel,
      temps_reponse_moy: responseLabel,
      initiation: initiationLabel,
      taux_reponse_pct: Math.round(stats.responseRate * 100),
      jours_sans_contact: stats.daysSinceLast,
    },
    scoring_relationnel: {
      score_engagement: scoring.score,
      phase: scoring.phase === 'growth' ? 'Développement' : scoring.phase === 'decline' ? 'Déclin' : 'Stable',
      delta_30j: scoring.delta,
      dimension_intensite: scoring.si,
      dimension_reciprocite: scoring.sr,
      dimension_longevite: scoring.sl,
    },
    sujets_emails_observes: subjects.slice(0, 10),
  };

  // Inject web research if available — enriches JTBD and cognitive inference
  if (webBio) payload.recherche_web = webBio;

  return JSON.stringify(payload, null, 0);
}

const LLM_SCHEMA = `{
  "executive_summary": "<2-3 phrases résumant la relation et le profil. Concret, actionnable.>",
  "cognitive_mode": "s1_dominant|s2_dominant|contextual|unavailable",
  "cognitive_mode_confidence": 0.0,
  "cognitive_mode_signals": ["<signal observable>"],
  "interaction_modes_primary": ["Operator|Validator|Strategist|Challenger|Consensus Builder|Explorer"],
  "interaction_axes": {
    "relation_result": { "value": 0, "inference_level": "observable|inferred|hypothetical|unavailable", "confidence": 0, "signal": "<signal>" },
    "intuition_structure": { "value": 0, "inference_level": "...", "confidence": 0, "signal": "<signal>" },
    "caution_speed": { "value": 0, "inference_level": "...", "confidence": 0, "signal": "<signal>" },
    "consensus_control": { "value": 0, "inference_level": "...", "confidence": 0, "signal": "<signal>" }
  },
  "behavioral_signals": [
    { "signal_type": "communication_style|decision_speed|initiation_pattern|channel_preference|response_pattern",
      "text": "<signal observable précis>", "inference": "<ce que ça signifie>",
      "inference_level": "observable|inferred|hypothetical", "confidence": 0 }
  ],
  "jtbd_data": {
    "functional_job": { "text": "<job fonctionnel>", "confidence": 0.0, "pitch_angle": "<angle d'approche>" },
    "social_job":     { "text": "<job social>",     "confidence": 0.0, "pitch_angle": "<angle d'approche>" },
    "emotional_job":  { "text": "<job émotionnel>", "confidence": 0.0, "pitch_angle": "<angle d'approche>" },
    "qualify_question": "<question de qualification JTBD>"
  },
  "theory_of_mind": {
    "perceived_positioning": "<comment ce contact nous perçoit probablement>",
    "likely_skepticism": "<zone de scepticisme probable>",
    "credibility_gaps": "<lacunes de crédibilité à combler>",
    "confidence": 0.0
  }
}`;

// ── Main handler ─────────────────────────────────────────────────────────────
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
  const { contactId, organizationId, forceRefresh = false } = body;
  if (!contactId || !organizationId) return jsonResponse({ error: 'contactId and organizationId required' }, 400);

  // ── 1. Load contact ────────────────────────────────────────────────────────
  const { data: contact, error: contactErr } = await supabase
    .from('contacts')
    .select('id, full_name, email, role_title, created_at, enrichment_status, last_enriched_at, companies(name, domain)')
    .eq('id', contactId)
    .eq('organization_id', organizationId)
    .maybeSingle();

  if (contactErr || !contact) return jsonResponse({ error: 'Contact not found', detail: contactErr?.message }, 404);

  const companyName = (contact.companies as any)?.name ?? null;
  const contactWithCompany = { ...contact, company_name: companyName };

  // Skip if recently enriched (< 7 days) and not forced
  if (!forceRefresh && contact.enrichment_status === 'done' && contact.last_enriched_at) {
    const age = Date.now() - new Date(contact.last_enriched_at).getTime();
    if (age < 7 * 86400000) return jsonResponse({ status: 'cached', contactId });
  }

  // ── 2. Mark as running ─────────────────────────────────────────────────────
  await supabase.from('contacts')
    .update({ enrichment_status: 'running', enrichment_error: null })
    .eq('id', contactId);

  try {
    // ── 3. Load behavioral data + Perplexity web search IN PARALLEL ──────────
    const [
      { data: messages },
      { data: meetingParts },
      webBio,
    ] = await Promise.all([
      supabase.from('communication_messages')
        .select('direction, sent_at, thread_id, metadata, subject')
        .eq('organization_id', organizationId)
        .eq('contact_id', contactId)
        .order('sent_at', { ascending: false })
        .limit(300),
      supabase.from('meeting_participants')
        .select('meetings(id, starts_at, title, actual_duration_minutes)')
        .eq('organization_id', organizationId)
        .eq('contact_id', contactId),
      // Perplexity search — runs while DB queries are in flight
      searchPersonWeb(
        contact.full_name,
        contact.role_title ?? '',
        companyName ?? '',
      ),
    ]);

    const msgs = messages ?? [];
    const meets = (meetingParts ?? []).map((p: any) => p.meetings).filter(Boolean).flat();

    // Persist web bio immediately — it's useful even if LLM step fails
    if (webBio) {
      await supabase.from('contacts')
        .update({ web_bio: webBio })
        .eq('id', contactId);
    }

    // ── 4. Compute behavioral stats + scoring ────────────────────────────────
    const stats = buildStats(msgs, meets, contact.created_at);

    const { data: prevSnap } = await supabase
      .from('contact_score_history')
      .select('score')
      .eq('contact_id', contactId)
      .order('snapshot_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    const scoring = computeScore(stats, prevSnap?.score);

    // Subject lines for LLM context (deduplicated, cleaned)
    const subjects = [...new Set(
      msgs.map(m => m.subject).filter(s => s && s.length > 3 && !s.startsWith('Re:') && !s.startsWith('Fwd:'))
    )].slice(0, 15) as string[];

    // ── 5. Call Gemini — with behavioral data + Perplexity web research ──────
    const webSection = webBio
      ? `\n\nRecherche web Perplexity (données publiques) :\n${webBio}`
      : '';

    const userMessage = `Voici les données comportementales du contact à analyser :

${buildLLMContext(contactWithCompany, stats, scoring, subjects, webBio ?? undefined)}${webSection}

Génère le profil cognitif complet selon ce schéma JSON exact (réponds UNIQUEMENT en JSON, aucun texte autour) :

${LLM_SCHEMA}

Instructions spécifiques :
- behavioral_signals : 3 à 5 signaux, uniquement ce qui est déductible des données fournies
- interaction_axes : valeurs entre 0 (pôle gauche) et 100 (pôle droit). relation_result: 0=Relation/100=Résultat. intuition_structure: 0=Intuition/100=Structure. caution_speed: 0=Prudence/100=Rapidité. consensus_control: 0=Consensus/100=Contrôle
- jtbd : basé sur le rôle "${contactWithCompany.role_title}" dans l'entreprise "${companyName}"${webBio ? ' ET les données de recherche web ci-dessus' : ''}
- si les données sont insuffisantes (peu d'échanges) → utilise "hypothetical" et confidence faible
- executive_summary : intègre les infos web si disponibles pour enrichir le résumé`;

    const llmRes = await fetch(OPENROUTER_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENROUTER_API_KEY')}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://knowy.ai',
        'X-Title': 'Knowy Contact Enrichment',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      }),
    });

    if (!llmRes.ok) throw new Error(`LLM error ${llmRes.status}: ${await llmRes.text()}`);

    const llmData = await llmRes.json();
    const rawContent = llmData.choices?.[0]?.message?.content ?? '{}';
    let profile: any = {};
    try {
      profile = JSON.parse(rawContent);
    } catch {
      const match = rawContent.match(/\{[\s\S]*\}/);
      if (match) profile = JSON.parse(match[0]);
    }

    // ── 6. Upsert cognitive_profile ──────────────────────────────────────────
    const globalConfidence = stats.totalInteractions > 50 ? 80
      : stats.totalInteractions > 20 ? 65
      : stats.totalInteractions > 5 ? 45
      : 25;

    const { data: savedProfile } = await supabase
      .from('cognitive_profiles')
      .upsert({
        organization_id: organizationId,
        contact_id: contactId,
        profile_version: 1,
        global_confidence: globalConfidence,
        summary: profile.executive_summary ?? null,
        executive_summary: profile.executive_summary ?? null,
        cognitive_mode: profile.cognitive_mode ?? 'unavailable',
        cognitive_mode_confidence: profile.cognitive_mode_confidence ?? 0,
        interaction_modes_data: profile.interaction_modes_primary ?? [],
        jtbd_data: profile.jtbd_data ?? {},
        theory_of_mind_data: profile.theory_of_mind ?? {},
        behavioral_analysis_data: profile.behavioral_signals ?? [],
        engagement_score: scoring.score,
        score_phase: scoring.phase,
        score_intensite: scoring.si,
        score_reciprocite: scoring.sr,
        score_longevite: scoring.sl,
        score_delta: scoring.delta,
        updated_from: ['gmail', 'calendar'].filter(s =>
          s === 'gmail' ? msgs.length > 0 : meets.length > 0
        ),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'organization_id,contact_id,profile_version' })
      .select('id')
      .maybeSingle();

    const profileId = savedProfile?.id;
    const signals: any[] = profile.behavioral_signals ?? [];

    if (profileId) {
      // ── 7. Save interaction axes ─────────────────────────────────────────
      const axes = profile.interaction_axes ?? {};
      const axisRows = Object.entries(axes).map(([axis, data]: [string, any]) => ({
        organization_id: organizationId,
        profile_id: profileId,
        axis: axis as any,
        value: Math.round(clamp(data.value ?? 50, 0, 100)),
        confidence: Math.round(clamp(data.confidence ?? 50, 0, 100)),
        inference_level: data.inference_level ?? 'unavailable',
        evidence_count: msgs.length + meets.length,
      }));

      if (axisRows.length > 0) {
        await supabase.from('interaction_axis_scores').delete().eq('profile_id', profileId);
        await supabase.from('interaction_axis_scores').insert(axisRows);
      }

      // ── 8. Save interaction modes ────────────────────────────────────────
      const modes: string[] = profile.interaction_modes_primary ?? [];
      if (modes.length > 0) {
        await supabase.from('interaction_mode_scores').delete().eq('profile_id', profileId);
        await supabase.from('interaction_mode_scores').insert(
          modes.map((mode, i) => ({
            organization_id: organizationId,
            profile_id: profileId,
            mode: mode as any,
            score: Math.max(50, 90 - i * 15),
            confidence: Math.round(profile.cognitive_mode_confidence * 100) || 60,
            evidence_count: msgs.length + meets.length,
          }))
        );
      }

      // ── 9. Save behavioral signals ───────────────────────────────────────
      if (signals.length > 0) {
        // Remove old AI-generated signals for this contact
        await supabase.from('behavioral_signals')
          .delete()
          .eq('contact_id', contactId)
          .eq('source_type', 'ai_enrichment');

        await supabase.from('behavioral_signals').insert(
          signals.map(s => ({
            organization_id: organizationId,
            contact_id: contactId,
            profile_id: profileId,
            signal_type: s.signal_type ?? 'communication_style',
            text: s.text ?? '',
            inference: s.inference ?? null,
            inference_level: s.inference_level ?? 'hypothetical',
            confidence: Math.round(clamp(s.confidence / 100) * 100),
            source_type: 'ai_enrichment',
            observed_at: new Date().toISOString(),
          }))
        );
      }
    }

    // ── 10. Save score history ───────────────────────────────────────────────
    const today = new Date().toISOString().split('T')[0];
    await supabase.from('contact_score_history').upsert({
      organization_id: organizationId,
      contact_id: contactId,
      user_id: user.id,
      score: scoring.score,
      phase: scoring.phase,
      score_intensite: scoring.si,
      score_reciprocite: scoring.sr,
      score_longevite: scoring.sl,
      snapshot_date: today,
    }, { onConflict: 'organization_id,contact_id,user_id,snapshot_date' });

    // ── 11. Update contact ───────────────────────────────────────────────────
    await supabase.from('contacts').update({
      enrichment_status: 'done',
      last_enriched_at: new Date().toISOString(),
      enrichment_error: null,
    }).eq('id', contactId);

    // ── 12. Activity event ───────────────────────────────────────────────────
    const webLabel = webBio ? ' · Perplexity ✓' : '';
    await supabase.from('knowy_activity_events').insert({
      organization_id: organizationId,
      user_id: user.id,
      event_type: 'profile_enriched',
      title: `Profil enrichi — ${contact.full_name}`,
      description: `Score ${scoring.score}/100 · ${scoring.phase === 'growth' ? '+' : ''}${scoring.delta} pts · ${signals.length} signaux cognitifs${webLabel}`,
      entity_link: `/contacts/${contactId}`,
    }).select().maybeSingle();

    return jsonResponse({
      status: 'done',
      contactId,
      engagementScore: scoring.score,
      phase: scoring.phase,
      dimensions: { intensite: scoring.si, reciprocite: scoring.sr, longevite: scoring.sl },
      cognitiveMode: profile.cognitive_mode,
      interactionModes: profile.interaction_modes_primary,
      globalConfidence,
      webEnriched: !!webBio,
    });

  } catch (err: any) {
    // Mark as failed
    await supabase.from('contacts').update({
      enrichment_status: 'failed',
      enrichment_error: err?.message ?? 'Unknown error',
    }).eq('id', contactId);

    console.error('[enrich-contact] error:', err);
    return jsonResponse({ error: err?.message ?? 'Enrichment failed' }, 500);
  }
});
