/**
 * Registre des features Knowr — source de vérité CÔTÉ CODE de ce qui est réellement
 * livré (built) vs annoncé mais pas encore disponible (coming_soon).
 *
 * Séparation volontaire :
 *  - `subscription_plans.entitlements` (DB) = ce que CHAQUE PLAN inclut (selon la tarification).
 *  - Ce registre = ce qui est RÉELLEMENT CODÉ.
 *
 * Accès effectif d'une feature = plan l'inclut  ET  feature `built`  ET  quota OK.
 * Si le plan l'inclut mais qu'elle est `coming_soon` → affichage « Bientôt » (verrouillé pour tous).
 */

export type FeatureKey =
  | 'calendar_sync'
  | 'email_sync'
  | 'brief_generation'
  | 'human_intelligence'
  | 'company_signals'
  | 'behavioral_signals'
  | 'account_verdict'
  | 'prioritized_portfolio'
  | 'relational_memory'
  | 'linkedin_source'
  | 'crm_sync'
  | 'team_memory'
  | 'analytics'
  | 'f11_mobility'
  | 'account_handoff'
  | 'sso';

export type FeatureStatus = 'built' | 'coming_soon';

export interface FeatureMeta {
  key: FeatureKey;
  label: string;
  /** Statut réel d'implémentation. `coming_soon` ⇒ verrouillé partout + badge « Bientôt ». */
  status: FeatureStatus;
  /** Plan minimal qui inclut la feature (pour les messages d'upsell). */
  minPlanLabel: string;
}

export const FEATURES: Record<FeatureKey, FeatureMeta> = {
  calendar_sync:        { key: 'calendar_sync',        label: 'Synchronisation calendrier',       status: 'built',       minPlanLabel: 'Free' },
  email_sync:           { key: 'email_sync',           label: 'Synchronisation emails',            status: 'built',       minPlanLabel: 'Free' },
  brief_generation:     { key: 'brief_generation',     label: 'Génération de briefs',              status: 'built',       minPlanLabel: 'Free' },
  human_intelligence:   { key: 'human_intelligence',   label: 'Intelligence humaine',              status: 'built',       minPlanLabel: 'Free' },
  company_signals:      { key: 'company_signals',      label: 'Veille & signaux entreprise',       status: 'built',       minPlanLabel: 'Pro' },
  behavioral_signals:   { key: 'behavioral_signals',   label: 'Signaux relationnels illimités',    status: 'built',       minPlanLabel: 'Pro' },
  account_verdict:      { key: 'account_verdict',      label: 'Verdict de compte',                 status: 'built',       minPlanLabel: 'Pro' },
  prioritized_portfolio:{ key: 'prioritized_portfolio',label: 'Portefeuille priorisé',             status: 'built',       minPlanLabel: 'Pro' },
  relational_memory:    { key: 'relational_memory',    label: 'Mémoire relationnelle',             status: 'built',       minPlanLabel: 'Pro' },
  // Annoncées dans la tarification mais pas encore livrées → « Bientôt »
  linkedin_source:      { key: 'linkedin_source',      label: 'Source LinkedIn',                   status: 'coming_soon', minPlanLabel: 'Pro' },
  crm_sync:             { key: 'crm_sync',             label: 'Sync CRM (HubSpot · Salesforce)',   status: 'coming_soon', minPlanLabel: 'Pro' },
  team_memory:          { key: 'team_memory',          label: 'Mémoire relationnelle d’équipe',    status: 'coming_soon', minPlanLabel: 'Business' },
  analytics:            { key: 'analytics',            label: 'Dashboard manager & analytics',     status: 'coming_soon', minPlanLabel: 'Business' },
  f11_mobility:         { key: 'f11_mobility',         label: 'Détection mobilité contacts (F11)', status: 'coming_soon', minPlanLabel: 'Business' },
  account_handoff:      { key: 'account_handoff',      label: 'Passation de compte zéro perte',    status: 'coming_soon', minPlanLabel: 'Business' },
  sso:                  { key: 'sso',                  label: 'SSO & gestion des accès',           status: 'coming_soon', minPlanLabel: 'Business' },
};

export function isComingSoon(key: FeatureKey): boolean {
  return FEATURES[key]?.status === 'coming_soon';
}

/** Ligne de la vue `subscription_usage` (jointure plan + usage live). */
export interface PlanUsage {
  organization_id: string;
  plan_id: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  max_licenses: number;
  max_briefs_per_month: number;
  max_ai_calls_per_month: number;
  max_storage_gb: number;
  max_profiles_per_month: number;
  price_monthly: number;
  entitlements: Partial<Record<FeatureKey, boolean>>;
  licenses_used: number;
  briefs_used: number;
  ai_calls_used: number;
  profiles_used: number;
}

export type QuotaMetric = 'profiles' | 'briefs' | 'licenses' | 'ai_calls';

const QUOTA_FIELDS: Record<QuotaMetric, { max: keyof PlanUsage; used: keyof PlanUsage }> = {
  profiles: { max: 'max_profiles_per_month', used: 'profiles_used' },
  briefs:   { max: 'max_briefs_per_month',   used: 'briefs_used' },
  licenses: { max: 'max_licenses',           used: 'licenses_used' },
  ai_calls: { max: 'max_ai_calls_per_month', used: 'ai_calls_used' },
};

/** -1 = illimité. Renvoie le nombre restant (Infinity si illimité). */
export function quotaLeft(usage: PlanUsage | null, metric: QuotaMetric): number {
  if (!usage) return 0;
  const { max, used } = QUOTA_FIELDS[metric];
  const maxVal = Number(usage[max] ?? 0);
  if (maxVal < 0) return Infinity;
  return Math.max(0, maxVal - Number(usage[used] ?? 0));
}

export function quotaMax(usage: PlanUsage | null, metric: QuotaMetric): number {
  if (!usage) return 0;
  return Number(usage[QUOTA_FIELDS[metric].max] ?? 0);
}

export function quotaUsed(usage: PlanUsage | null, metric: QuotaMetric): number {
  if (!usage) return 0;
  return Number(usage[QUOTA_FIELDS[metric].used] ?? 0);
}

/**
 * La feature est-elle réellement utilisable ?
 * = le plan l'inclut ET elle est livrée (built).
 */
export function hasFeature(usage: PlanUsage | null, key: FeatureKey): boolean {
  if (isComingSoon(key)) return false;
  // super_admin / enterprise : tout activé via entitlements
  return Boolean(usage?.entitlements?.[key]);
}

/** Le plan inclut la feature (selon la tarification), indépendamment du fait qu'elle soit livrée. */
export function planIncludes(usage: PlanUsage | null, key: FeatureKey): boolean {
  return Boolean(usage?.entitlements?.[key]);
}
