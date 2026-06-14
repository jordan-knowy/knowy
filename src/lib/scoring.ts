import type { VerdictPosture } from '../app/components/knowr/VerdictCard';
import { TYPE_GATING, TYPE_SEVERITY_CAP, type AccountType } from './accountType';

export interface VerdictData {
  posture: VerdictPosture;
  pilote: string;
  score: number;
  severite: number;
  urgence: number;
  reason: string;
}

interface ScoringSignal {
  signal_type?: string;
  tag?: string;
  inference_level?: string;
  text?: string;
  observed_at?: string | null;
}

// Spec-30 §3 — urgence par paliers (v1)
export function urgenceFromDays(days: number | null): number {
  if (days === null) return 35;
  if (days <= 2)  return 95;
  if (days <= 5)  return 75;
  if (days <= 14) return 55;
  return 35;
}

// Spec-30 §3 — formule gelée
export function priorityFromSevUrg(sev: number, urg: number): number {
  return Math.round(sev * (0.55 + 0.45 * urg / 100));
}

// Map signal tags/types → family
function signalFamily(s: ScoringSignal): 'churn' | 'risk' | 'lever' | 'mobility' | 'market' | 'growth' | null {
  const raw = (s.signal_type ?? s.tag ?? '').toLowerCase();
  if (/churn|resign|cancel|annul/.test(raw))       return 'churn';
  if (/risk|risque|objection|payment|paiement/.test(raw)) return 'risk';
  if (/levier|lever|opportunit|recovery|reengage/.test(raw)) return 'lever';
  if (/mobil|job.change|new.decision|arrivant/.test(raw))   return 'mobility';
  if (/march|market|m&a|rachat|control/.test(raw)) return 'market';
  if (/growth|croissance|fund|lever.fonds/.test(raw)) return 'growth';
  return null;
}

/**
 * Compute a VerdictData for a contact or company.
 * Returns null when the situation is healthy and no verdict is warranted.
 *
 * @param engagementScore  Latest engagement score (0–100) or null
 * @param lastContactDays  Days since last any contact (mail/meeting) or null
 * @param signals          Behavioral signals (behavioral_analysis_data or behavioral_signals rows)
 * @param scoreDelta       Score change vs 30d ago (negative = declining)
 * @param accountType      Type de compte (spec-32) — module le gating de signaux + plafond de sévérité
 */
export function computeVerdict(
  engagementScore: number | null,
  lastContactDays: number | null,
  signals: ScoringSignal[],
  scoreDelta?: number | null,
  accountType?: AccountType | null,
): VerdictData | null {

  // Spec-32 §4.1 — gating de signaux : seules les familles autorisées par le type sont actives.
  const gate = accountType ? TYPE_GATING[accountType] : null;
  const families = (signals.map(signalFamily).filter(Boolean) as string[])
    .filter(f => !gate || gate.has(f));
  const hasChurn    = families.includes('churn');
  const hasRisk     = families.includes('risk');
  const hasLever    = families.includes('lever');
  const hasMobility = families.includes('mobility');
  const hasMarket   = families.includes('market');
  const hasGrowth   = families.includes('growth');

  const score       = engagementScore ?? null;
  const declining   = (scoreDelta ?? 0) < -5;
  const silence     = (lastContactDays ?? 0) > 30;
  const atRisk      = score !== null && score < 40;

  // ── Posture decision tree (spec-30 §2) ─────────────────────────────
  let posture:   VerdictPosture;
  let pilote:    string;
  let baseSev:   number;
  let reason:    string;

  if (hasChurn) {
    posture  = 'defend';
    pilote   = 'Active Churn / Save-the-Deal';
    baseSev  = 82;
    reason   = 'Des signaux de désengagement actifs ont été détectés. Une action rapide est nécessaire pour sauvegarder cette relation.';
  } else if (silence && atRisk) {
    posture  = 'defend';
    pilote   = 'Cooling Active Relationship';
    baseSev  = 68;
    reason   = 'Le silence prolongé (>30j) combiné à un score faible indique une relation en refroidissement. Planifier un contact de reprise.';
  } else if (hasRisk) {
    posture  = 'defend';
    pilote   = 'Open Objection';
    baseSev  = 63;
    reason   = 'Une objection ou tension non soldée a été détectée. Préparer une réponse argumentée avant le prochain échange.';
  } else if (declining && !hasLever) {
    posture  = 'defend';
    pilote   = 'Slipping Opportunity';
    baseSev  = 58;
    reason   = 'Le score d\'engagement est en déclin. Agir avant que le momentum ne soit perdu.';
  } else if (hasLever || hasGrowth) {
    posture  = 'capitaliser';
    pilote   = hasGrowth ? 'Founder Buying Window' : 'Recovery Momentum';
    baseSev  = 55;
    reason   = hasGrowth
      ? 'Un signal de croissance (levée, expansion) ouvre une fenêtre d\'équipement. Capitaliser rapidement.'
      : 'Un signal d\'appui récent ouvre une fenêtre d\'opportunité. Capitaliser avant que le momentum ne retombe.';
  } else if (hasMobility || hasMarket) {
    posture  = 'derisquer';
    pilote   = hasMarket ? 'Account Control Change' : 'New Decision-Maker Grace';
    baseSev  = 60;
    reason   = hasMarket
      ? 'Un changement structurel (M&A, rachat) a été détecté. Sécuriser la continuité de la relation sous 90 jours.'
      : 'Un nouveau décideur est arrivé. La fenêtre de grâce (90j) nécessite un repositionnement proactif.';
  } else if (silence) {
    posture  = 'defend';
    pilote   = 'Cooling Active Relationship';
    baseSev  = 48;
    reason   = `Aucun contact depuis plus de ${lastContactDays}j. Prévoir un point de contact pour maintenir la chaleur de la relation.`;
  } else if (atRisk) {
    posture  = 'defend';
    pilote   = 'Cooling Active Relationship';
    baseSev  = 42;
    reason   = 'Le score d\'engagement est sous le seuil de vigilance. Renforcer la fréquence des interactions.';
  } else {
    // Situation saine — pas de verdict
    return null;
  }

  // Adjust severity by current engagement score
  if (score !== null) {
    const penalty = Math.max(0, (50 - score) / 50) * 18;
    baseSev = Math.min(100, Math.round(baseSev + penalty));
  }

  // Spec-32 §4.3 — plafond de sévérité par type (un partenaire ne peut pas être « critique churn »).
  if (accountType) {
    baseSev = Math.min(baseSev, TYPE_SEVERITY_CAP[accountType]);
  }

  const urgence  = urgenceFromDays(lastContactDays);
  const priority = Math.min(100, priorityFromSevUrg(baseSev, urgence));

  return { posture, pilote, score: priority, severite: baseSev, urgence, reason };
}
