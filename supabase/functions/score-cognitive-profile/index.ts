/**
 * score-cognitive-profile
 * Moteur de scoring relationnel (doc 08 — Tohu Scoring Relationnel v1.0)
 *
 * 3 dimensions : Intensité (40%) · Réciprocité (35%) · Longévité (25%)
 * Outputs : engagement_score (0-100), phase, reciprocity_pct, contact_alerts
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';

// ── Constants (doc 08) ───────────────────────────────────────────────────────
const DIMENSION_WEIGHTS = { intensite: 0.40, reciprocite: 0.35, longevite: 0.25 };
const PHASE_DELTA_THRESHOLD = 8.0;
const PHASE_DECLINE_MAX_SCORE = 70;
const HONEYMOON_WINDOW_DAYS = 45;
const HALF_LIFE_MIN_DAYS = 30;
const HALF_LIFE_MAX_DAYS = 180;

// ── Helpers ──────────────────────────────────────────────────────────────────
function clamp(v: number, min = 0, max = 1) { return Math.max(min, Math.min(max, v)); }

function temporalDecay(daysSinceLast: number, depth: number): number {
  const halfLife = HALF_LIFE_MIN_DAYS + depth * (HALF_LIFE_MAX_DAYS - HALF_LIFE_MIN_DAYS);
  const lambda = Math.LN2 / halfLife;
  return Math.exp(-lambda * daysSinceLast);
}

function honeymoonSmoothing(raw: number, ageInDays: number): number {
  if (ageInDays >= HONEYMOON_WINDOW_DAYS) return raw;
  const maxScore = 0.45 + (ageInDays / HONEYMOON_WINDOW_DAYS) * 0.20;
  return Math.min(raw, maxScore);
}

// ── Scoring dimensions ───────────────────────────────────────────────────────

function scoreIntensite(stats: ContactStats): number {
  const { emailsLast30, meetingsLast90, avgThreadDepth, channelCount } = stats;

  // Email frequency vs baseline (simplified: normalize by expected 2/month per contact)
  const emailFreqNorm = clamp(emailsLast30 / 4);   // 4 emails/30j = score 1.0
  const emailFreqCapped = stats.initiationRatio > 0.85 || stats.initiationRatio < 0.15
    ? Math.min(emailFreqNorm, 0.50) : emailFreqNorm;

  // Meeting frequency (1 meeting/3 months = score 0.5)
  const meetingFreqNorm = clamp((meetingsLast90 / 90) / (1 / 30));  // 1/month = 1.0

  // Channel richness
  const richness = channelCount >= 3 ? 1.0 : channelCount === 2 ? 0.65 : 0.25;

  // Thread depth (5 messages avg = score 1.0)
  const depthNorm = clamp(avgThreadDepth / 5);

  return emailFreqCapped * 0.40 + meetingFreqNorm * 0.35 + richness * 0.15 + depthNorm * 0.10;
}

function scoreReciprocite(stats: ContactStats): number {
  const { initiationRatio, responseRate, responseTimeRatio } = stats;

  // Initiation balance (floor at 0.40 for asymmetric but valid relationships)
  const asymmetry = Math.abs(initiationRatio - 0.5) * 2;
  const initiationScore = Math.max(0.40, 1.0 - asymmetry * 0.60);

  // Response rate (0-1)
  const responseRateScore = clamp(responseRate);

  // Response time ratio (> 1 means faster than usual = positive)
  const rtScore = clamp(responseTimeRatio / 2);

  return initiationScore * 0.50 + responseRateScore * 0.30 + rtScore * 0.20;
}

function scoreLongevite(stats: ContactStats): { score: number; factor: number } {
  const { ageInDays, monthlyExchangeCounts, quartersWithMeetings } = stats;

  if (ageInDays < 30) return { score: 0, factor: 0 };

  const factor = ageInDays < 90 ? (ageInDays - 30) / 60 : 1.0;

  // Age score (24 months = 1.0)
  const ageScore = clamp(ageInDays / (24 * 30));

  // Consistency (coefficient of variation — lower = more consistent)
  let consistencyScore = 0.5;
  if (monthlyExchangeCounts.length >= 3) {
    const mean = monthlyExchangeCounts.reduce((a, b) => a + b, 0) / monthlyExchangeCounts.length;
    if (mean > 0) {
      const variance = monthlyExchangeCounts.reduce((a, b) => a + (b - mean) ** 2, 0) / monthlyExchangeCounts.length;
      const cv = Math.sqrt(variance) / mean;
      consistencyScore = Math.max(0, 1.0 - cv / 2.0);
    }
  }

  // Meeting continuity (4 quarters = 1.0)
  const meetingContinuity = quartersWithMeetings / 4;

  const raw = ageScore * 0.45 + consistencyScore * 0.35 + meetingContinuity * 0.20;
  return { score: raw * factor, factor };
}

interface ContactStats {
  emailsLast30: number;
  meetingsLast90: number;
  avgThreadDepth: number;
  channelCount: number;
  initiationRatio: number;  // 0 = contact initiates all, 1 = user initiates all
  responseRate: number;     // 0-1
  responseTimeRatio: number; // > 1 = faster than usual
  ageInDays: number;
  daysSinceLastContact: number;
  monthlyExchangeCounts: number[];
  quartersWithMeetings: number;
  totalInteractions: number;
}

// ── Compute stats from DB data ───────────────────────────────────────────────
function buildStats(
  messages: any[],
  meetings: any[],
  firstSeen: string | null,
): ContactStats {
  const now = Date.now();
  const cutoff30 = now - 30 * 86400000;
  const cutoff90 = now - 90 * 86400000;

  const msgs30 = messages.filter(m => m.sent_at && new Date(m.sent_at).getTime() > cutoff30);
  const meets90 = meetings.filter(m => m.starts_at && new Date(m.starts_at).getTime() > cutoff90);

  // Initiation ratio (outbound = user initiated)
  const outbound = messages.filter(m => m.direction === 'outbound').length;
  const total = messages.length || 1;
  const initiationRatio = outbound / total;

  // Response rate (simplified: if both sides have messages, rate ≥ 0.5)
  const inbound = messages.filter(m => m.direction === 'inbound').length;
  const responseRate = total > 1 ? clamp((Math.min(inbound, outbound) * 2) / total) : 0.3;

  // Response time ratio (use metadata if available)
  const responseTimes = messages
    .filter(m => (m.metadata as any)?.response_time_hours != null)
    .map(m => (m.metadata as any).response_time_hours as number);
  const avgResponseTime = responseTimes.length
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
    : 24;
  const responseTimeRatio = clamp(24 / Math.max(avgResponseTime, 1), 0, 4) / 4;

  // Thread depth
  const threadGroups = new Map<string, number>();
  for (const m of messages) {
    if (m.thread_id) threadGroups.set(m.thread_id, (threadGroups.get(m.thread_id) || 0) + 1);
  }
  const avgThreadDepth = threadGroups.size
    ? Array.from(threadGroups.values()).reduce((a, b) => a + b, 0) / threadGroups.size
    : 1;

  // Channel count
  const hasEmail = messages.length > 0;
  const hasMeeting = meetings.length > 0;
  const channelCount = (hasEmail ? 1 : 0) + (hasMeeting ? 1 : 0);

  // Age
  const ageInDays = firstSeen
    ? Math.round((now - new Date(firstSeen).getTime()) / 86400000)
    : messages.length > 0
    ? Math.round((now - new Date(messages[messages.length - 1].sent_at).getTime()) / 86400000)
    : 0;

  // Last contact
  const allDates = [
    ...messages.map(m => m.sent_at ? new Date(m.sent_at).getTime() : 0),
    ...meetings.map(m => m.starts_at ? new Date(m.starts_at).getTime() : 0),
  ].filter(d => d > 0);
  const lastContact = allDates.length ? Math.max(...allDates) : 0;
  const daysSinceLastContact = lastContact ? Math.round((now - lastContact) / 86400000) : 999;

  // Monthly exchange counts (last 6 months)
  const monthlyExchangeCounts: number[] = [];
  for (let i = 0; i < 6; i++) {
    const start = now - (i + 1) * 30 * 86400000;
    const end = now - i * 30 * 86400000;
    const count = messages.filter(m => {
      const t = m.sent_at ? new Date(m.sent_at).getTime() : 0;
      return t > start && t <= end;
    }).length;
    monthlyExchangeCounts.push(count);
  }

  // Quarters with meetings
  const quartersWithMeetings = [0, 1, 2, 3].filter(q => {
    const start = now - (q + 1) * 90 * 86400000;
    const end = now - q * 90 * 86400000;
    return meetings.some(m => {
      const t = m.starts_at ? new Date(m.starts_at).getTime() : 0;
      return t > start && t <= end;
    });
  }).length;

  const totalInteractions = messages.length + meetings.length * 4;

  return {
    emailsLast30: msgs30.length,
    meetingsLast90: meets90.length,
    avgThreadDepth,
    channelCount,
    initiationRatio,
    responseRate,
    responseTimeRatio,
    ageInDays,
    daysSinceLastContact,
    monthlyExchangeCounts,
    quartersWithMeetings,
    totalInteractions,
  };
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
  const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
  if (userError || !user) return jsonResponse({ error: 'Unauthorized' }, 401);

  const body = await req.json().catch(() => ({}));
  const { organizationId, contactId } = body;
  if (!organizationId || !contactId) return jsonResponse({ error: 'organizationId and contactId are required' }, 400);

  // ── 1. Fetch contact + messages + meetings ──────────────────────────────
  const [{ data: contact }, { data: messages }, { data: meetings }] = await Promise.all([
    supabase.from('contacts').select('full_name, email, created_at').eq('id', contactId).single(),
    supabase.from('communication_messages')
      .select('direction, sent_at, thread_id, metadata')
      .eq('organization_id', organizationId)
      .eq('contact_id', contactId)
      .order('sent_at', { ascending: false })
      .limit(200),
    supabase.from('meeting_participants')
      .select('meetings(starts_at)')
      .eq('organization_id', organizationId)
      .eq('contact_id', contactId),
  ]);

  if (!contact) return jsonResponse({ error: 'Contact not found' }, 404);

  const meetingRows = (meetings || [])
    .map((p: any) => p.meetings)
    .filter(Boolean)
    .flat();

  const stats = buildStats(messages || [], meetingRows, contact.created_at);

  // Insufficient data guard
  if (stats.totalInteractions === 0 && stats.ageInDays < 30) {
    return jsonResponse({
      contactId,
      engagementScore: null,
      phase: 'stagnant',
      message: 'Données insuffisantes — minimum 30 jours requis',
    });
  }

  // ── 2. Compute dimensions ──────────────────────────────────────────────
  const si = scoreIntensite(stats);
  const sr = scoreReciprocite(stats);
  const { score: sl, factor: lFactor } = scoreLongevite(stats);

  // Redistribute longévité weight if insufficient data
  const effectiveWeights = lFactor < 1
    ? {
        intensite: DIMENSION_WEIGHTS.intensite + DIMENSION_WEIGHTS.longevite * (1 - lFactor) * 0.54,
        reciprocite: DIMENSION_WEIGHTS.reciprocite + DIMENSION_WEIGHTS.longevite * (1 - lFactor) * 0.46,
        longevite: DIMENSION_WEIGHTS.longevite * lFactor,
      }
    : DIMENSION_WEIGHTS;

  const rawScore = si * effectiveWeights.intensite + sr * effectiveWeights.reciprocite + sl * effectiveWeights.longevite;

  // ── 3. Apply corrections ──────────────────────────────────────────────
  const smoothed = honeymoonSmoothing(rawScore, stats.ageInDays);
  const depth = clamp(stats.totalInteractions / 500);
  const decay = temporalDecay(stats.daysSinceLastContact, depth);
  const finalScore = Math.round(clamp(smoothed * decay) * 100);

  // ── 4. Fetch previous snapshot for phase calculation ──────────────────
  const { data: prevSnapshot } = await supabase
    .from('relationship_snapshots')
    .select('engagement_score, snapshot_date')
    .eq('organization_id', organizationId)
    .eq('contact_id', contactId)
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  const prevScore = prevSnapshot?.engagement_score ?? finalScore;
  const delta = finalScore - prevScore;

  let phase: 'growth' | 'stagnant' | 'decline' = 'stagnant';
  if (delta >= PHASE_DELTA_THRESHOLD) {
    phase = 'growth';
  } else if (delta <= -PHASE_DELTA_THRESHOLD && finalScore <= PHASE_DECLINE_MAX_SCORE) {
    phase = 'decline';
  }

  const lastContactType = meetingRows.length > 0 && (messages || []).length === 0
    ? 'meeting'
    : 'email';

  const lastContactAt = stats.daysSinceLastContact < 999
    ? new Date(Date.now() - stats.daysSinceLastContact * 86400000).toISOString()
    : null;

  // ── 5. Upsert relationship_snapshot ──────────────────────────────────
  const today = new Date().toISOString().split('T')[0];
  await supabase.from('relationship_snapshots').upsert({
    organization_id: organizationId,
    user_id: user.id,
    contact_id: contactId,
    engagement_score: finalScore,
    score_evolution: delta,
    phase,
    last_contact_at: lastContactAt,
    last_contact_type: lastContactType,
    reciprocity_pct: Math.round(sr * 100),
    avg_frequency_days: stats.monthlyExchangeCounts.reduce((a, b) => a + b, 0) > 0
      ? Math.round(30 / Math.max(1, stats.emailsLast30))
      : null,
    snapshot_date: today,
  }, { onConflict: 'organization_id,user_id,contact_id,snapshot_date' });

  // ── 6. Generate contact_alerts ────────────────────────────────────────
  const alerts: Array<{ alert_type: string; message: string }> = [];

  // Cooling alert (doc 08 — relationship_cooling)
  if (stats.daysSinceLastContact > 30 && prevScore > 40) {
    const usualFreqDays = stats.monthlyExchangeCounts.reduce((a, b) => a + b, 0) > 0
      ? Math.round(30 / Math.max(1, stats.emailsLast30))
      : 14;
    if (stats.daysSinceLastContact > usualFreqDays * 1.5) {
      alerts.push({
        alert_type: 'cooling',
        message: `Silence de ${stats.daysSinceLastContact} jours — cycle habituel ${usualFreqDays}j`,
      });
    }
  }

  // Score drop alert
  if (delta <= -15 && finalScore < 60) {
    alerts.push({
      alert_type: 'cooling',
      message: `Score en baisse de ${Math.abs(delta)} pts sur 30j`,
    });
  }

  if (alerts.length > 0) {
    // Insert only new alerts (avoid duplicates within 7 days)
    const { data: existingAlerts } = await supabase
      .from('contact_alerts')
      .select('alert_type')
      .eq('organization_id', organizationId)
      .eq('contact_id', contactId)
      .eq('is_read', false)
      .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString());

    const existingTypes = new Set((existingAlerts || []).map((a: any) => a.alert_type));
    const newAlerts = alerts.filter(a => !existingTypes.has(a.alert_type));

    if (newAlerts.length > 0) {
      await supabase.from('contact_alerts').insert(
        newAlerts.map(a => ({
          organization_id: organizationId,
          contact_id: contactId,
          ...a,
        }))
      );
    }
  }

  return jsonResponse({
    contactId,
    engagementScore: finalScore,
    phase,
    delta,
    reciprocityPct: Math.round(sr * 100),
    dimensions: {
      intensite: Math.round(si * 100),
      reciprocite: Math.round(sr * 100),
      longevite: Math.round(sl * 100),
    },
    daysSinceLastContact: stats.daysSinceLastContact,
    alertsCreated: alerts.length,
  });
});
