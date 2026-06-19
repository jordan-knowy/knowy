import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Check, Sparkles, ArrowRight } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { usePlan } from '../../../hooks/usePlan';

interface PlanRow {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  max_profiles_per_month: number;
  features: string[];
  sort_order: number;
}

const PUBLIC_PLANS = ['free', 'pro', 'business'];

/**
 * PlanSummary — carte « Mon abonnement » pour la page Paramètres.
 * Affiche le plan actuel + les autres offres (différences) + CTA upgrade.
 * Charte Knowr (tokens violet, mono pour les labels).
 */
export default function PlanSummary() {
  const navigate = useNavigate();
  const { usage, quotaUsed, quotaMax } = usePlan();
  const [plans, setPlans] = useState<PlanRow[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!supabase) return;
      const { data } = await supabase
        .from('subscription_plans')
        .select('id, name, description, price_monthly, max_profiles_per_month, features, sort_order')
        .in('id', PUBLIC_PLANS)
        .order('sort_order', { ascending: true });
      if (mounted && data) setPlans(data as any);
    })();
    return () => { mounted = false; };
  }, []);

  const currentId = usage?.plan_id ?? 'free';
  const profilesUsed = quotaUsed('profiles');
  const profilesMax = quotaMax('profiles');
  const fmtPrice = (cents: number) => (cents === 0 ? 'Gratuit' : `${Math.round(cents / 100)}€`);

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden" style={{ boxShadow: 'var(--sh-sm)' }}>
      <div className="px-6 pt-5 pb-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <p style={{ fontFamily: 'var(--mono, monospace)', fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--t3, #9082B8)' }}>
          Abonnement
        </p>
        <div className="flex items-center gap-2.5 mt-1 mb-4">
          <Sparkles style={{ width: 15, height: 15, color: 'var(--violet, #6E50C8)' }} />
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--t1, #1A1040)', letterSpacing: '-0.02em', margin: 0 }}>
            Mon abonnement
          </h3>
        </div>
      </div>

      <div className="p-6">
        {/* Quota profils du plan courant */}
        {profilesMax > 0 && (
          <div className="mb-5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold" style={{ color: 'var(--t2, #5A4880)' }}>Profils intégrés ce mois</span>
              <span className="text-xs font-mono" style={{ color: 'var(--t3, #9082B8)' }}>{profilesUsed} / {profilesMax}</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg3, #E8E4F4)' }}>
              <div className="h-full rounded-full" style={{ width: `${Math.min(100, profilesMax ? (profilesUsed / profilesMax) * 100 : 0)}%`, background: 'var(--violet, #6E50C8)' }} />
            </div>
          </div>
        )}

        {/* Grille des offres */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {plans.map((plan) => {
            const isCurrent = plan.id === currentId;
            return (
              <div
                key={plan.id}
                className="rounded-xl border p-4 flex flex-col"
                style={{
                  borderColor: isCurrent ? 'var(--violet, #6E50C8)' : 'var(--border-m, rgba(110,80,200,.18))',
                  background: isCurrent ? 'var(--violet-s, rgba(110,80,200,.08))' : 'var(--white, #fff)',
                  boxShadow: isCurrent ? 'var(--sh-sm)' : 'none',
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--t1, #1A1040)' }}>{plan.name}</span>
                  {isCurrent && (
                    <span style={{ fontSize: 9, fontWeight: 700, fontFamily: 'var(--mono, monospace)', textTransform: 'uppercase', letterSpacing: '.06em',
                      padding: '2px 8px', borderRadius: 999, background: 'var(--violet, #6E50C8)', color: '#fff' }}>
                      Actuel
                    </span>
                  )}
                </div>
                <div className="mb-2">
                  <span style={{ fontSize: 22, fontWeight: 900, color: 'var(--t1, #1A1040)' }}>{fmtPrice(plan.price_monthly)}</span>
                  {plan.price_monthly > 0 && <span style={{ fontSize: 11, color: 'var(--t3, #9082B8)' }}>{plan.id === 'business' ? '/siège/mois' : '/mois'}</span>}
                </div>
                <ul className="flex flex-col gap-1.5 mb-3 flex-1">
                  <li className="flex items-start gap-1.5" style={{ fontSize: 11, color: 'var(--t2, #5A4880)' }}>
                    <Check style={{ width: 12, height: 12, color: 'var(--sage, #2EA86A)', marginTop: 2, flexShrink: 0 }} />
                    {plan.max_profiles_per_month < 0 ? 'Profils illimités' : `${plan.max_profiles_per_month} profils / mois`}
                  </li>
                  {(plan.features ?? []).slice(0, 4).map((f, i) => (
                    <li key={i} className="flex items-start gap-1.5" style={{ fontSize: 11, color: 'var(--t2, #5A4880)' }}>
                      <Check style={{ width: 12, height: 12, color: 'var(--sage, #2EA86A)', marginTop: 2, flexShrink: 0 }} />
                      {f}
                    </li>
                  ))}
                </ul>
                {!isCurrent && (
                  <button
                    onClick={() => navigate('/subscription')}
                    className="w-full rounded-lg px-3 py-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    style={{ background: 'var(--violet, #6E50C8)', color: '#fff' }}
                  >
                    Choisir {plan.name} <ArrowRight style={{ width: 13, height: 13 }} />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={() => navigate('/subscription')}
          className="mt-4 text-xs font-semibold flex items-center gap-1.5"
          style={{ color: 'var(--violet, #6E50C8)' }}
        >
          Voir le détail & gérer l'abonnement <ArrowRight style={{ width: 13, height: 13 }} />
        </button>
      </div>
    </div>
  );
}
