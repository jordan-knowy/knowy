import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getActiveOrganizationId } from '../lib/api/org';
import {
  type FeatureKey, type PlanUsage, type QuotaMetric,
  hasFeature, planIncludes, isComingSoon, quotaLeft, quotaMax, quotaUsed,
} from '../lib/entitlements';

/**
 * usePlan — droits & quotas de l'org active.
 * Source : vue `subscription_usage` (plan + entitlements + usage live).
 * Défaut défensif : si aucune ligne (pas d'abonnement) → null ⇒ tout verrouillé sauf base.
 */
export function usePlan(orgIdOverride?: string | null) {
  const [usage, setUsage] = useState<PlanUsage | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!supabase) { setLoading(false); return; }
    setLoading(true);
    try {
      const oid = orgIdOverride ?? await getActiveOrganizationId();
      if (!oid) { setUsage(null); setLoading(false); return; }
      const { data } = await supabase
        .from('subscription_usage')
        .select('*')
        .eq('organization_id', oid)
        .maybeSingle();
      setUsage((data as PlanUsage | null) ?? null);
    } catch {
      setUsage(null);
    } finally {
      setLoading(false);
    }
  }, [orgIdOverride]);

  useEffect(() => { load(); }, [load]);

  return {
    usage,
    loading,
    planId: usage?.plan_id ?? 'free',
    /** Feature réellement utilisable (plan l'inclut ET livrée). */
    can: (key: FeatureKey) => hasFeature(usage, key),
    /** Le plan l'inclut (selon la tarif), même si pas encore livrée. */
    planIncludes: (key: FeatureKey) => planIncludes(usage, key),
    /** Annoncée mais pas encore disponible → « Bientôt ». */
    isComingSoon: (key: FeatureKey) => isComingSoon(key),
    quotaLeft: (m: QuotaMetric) => quotaLeft(usage, m),
    quotaMax: (m: QuotaMetric) => quotaMax(usage, m),
    quotaUsed: (m: QuotaMetric) => quotaUsed(usage, m),
    reload: load,
  };
}
