import { type ReactNode } from 'react';
import { Lock, Clock } from 'lucide-react';
import { useNavigate } from 'react-router';
import { usePlan } from '../../../hooks/usePlan';
import { FEATURES, type FeatureKey } from '../../../lib/entitlements';

interface GateProps {
  feature: FeatureKey;
  children: ReactNode;
  /** `overlay` (défaut) : floute le contenu + cadenas. `replace` : remplace par une carte. */
  variant?: 'overlay' | 'replace';
  /** Hauteur mini de la carte `replace`. */
  className?: string;
}

/**
 * Gate — verrouille une zone selon le plan / la disponibilité.
 *  - feature utilisable (plan l'inclut + livrée) → rend les enfants.
 *  - feature `coming_soon` → badge « Bientôt » (verrouillé pour tous).
 *  - plan insuffisant → cadenas + upsell « Passer à {plan} ».
 */
export default function Gate({ feature, children, variant = 'overlay', className = '' }: GateProps) {
  const { can, isComingSoon, planIncludes, loading } = usePlan();
  const navigate = useNavigate();
  const meta = FEATURES[feature];

  if (loading || can(feature)) return <>{children}</>;

  const coming = isComingSoon(feature);
  const lacksPlan = !planIncludes(feature);

  const Pill = (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold"
      style={
        coming
          ? { background: 'var(--amber-s, #FBF0E2)', color: 'var(--amber, #C97A20)' }
          : { background: 'var(--violet-s, rgba(110,80,200,.08))', color: 'var(--violet, #6E50C8)' }
      }
    >
      {coming ? <Clock className="size-3" /> : <Lock className="size-3" />}
      {coming ? 'Bientôt' : `Plan ${meta.minPlanLabel}`}
    </span>
  );

  const Cta = !coming && lacksPlan && (
    <button
      onClick={() => navigate('/subscription')}
      className="mt-3 rounded-xl px-4 py-2 text-xs font-bold text-white"
      style={{ background: 'var(--violet, #6E50C8)' }}
    >
      Passer à {meta.minPlanLabel} →
    </button>
  );

  if (variant === 'replace') {
    return (
      <div
        className={`flex flex-col items-center justify-center text-center rounded-2xl border border-dashed p-6 ${className}`}
        style={{ borderColor: 'var(--border-m, rgba(110,80,200,.18))', background: 'var(--bg2, #F0EEF8)' }}
      >
        {Pill}
        <p className="mt-3 text-sm font-bold" style={{ color: 'var(--t1, #1A1040)' }}>{meta.label}</p>
        <p className="mt-1 text-xs" style={{ color: 'var(--t3, #9082B8)' }}>
          {coming ? 'Cette fonctionnalité arrive bientôt.' : `Disponible à partir du plan ${meta.minPlanLabel}.`}
        </p>
        {Cta}
      </div>
    );
  }

  // overlay
  return (
    <div className="relative">
      <div className="pointer-events-none select-none opacity-40 blur-[2px]">{children}</div>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
        {Pill}
        <p className="mt-2 text-xs font-semibold" style={{ color: 'var(--t2, #5A4880)' }}>
          {coming ? `${meta.label} — bientôt disponible` : `${meta.label} — plan ${meta.minPlanLabel}`}
        </p>
        {Cta}
      </div>
    </div>
  );
}
