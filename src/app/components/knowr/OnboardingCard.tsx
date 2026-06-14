import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X, ChevronDown } from 'lucide-react';

interface OnboardingCardProps {
  /** Navigation handler (réutilise le go() de la Sidebar) */
  onGo: (path: string) => void;
  /** Au moins une source publique connectée → étape « Activer la veille » auto-validée */
  sourcesConnected: boolean;
}

interface Step {
  n: number;
  label: string;
  path: string;
  /** clé d'auto-détection (sinon validée au clic) */
  auto?: 'sources';
}

const STEPS: Step[] = [
  { n: 1, label: 'Analyser un compte',     path: '/companies' },
  { n: 2, label: 'Analyser une personne',  path: '/contacts'  },
  { n: 3, label: 'Générer un brief Knowr', path: '/meetings'  },
  { n: 4, label: 'Activer la veille',      path: '/account', auto: 'sources' },
  { n: 5, label: "Inviter ton équipe",     path: '/account'   },
];

const LS_DONE = 'knowr_onboarding_steps';
const LS_DISMISSED = 'knowr_onboarding_dismissed';

function readDone(): number[] {
  try { return JSON.parse(localStorage.getItem(LS_DONE) ?? '[]'); } catch { return []; }
}

/**
 * Carte « Prise en main · 5 gestes clés » de la sidebar (réf. maquette knowr-app.html `.onb`).
 * Anneau de progression conique + 5 étapes cliquables. S'efface quand tout est fait ou rejeté.
 */
export default function OnboardingCard({ onGo, sourcesConnected }: OnboardingCardProps) {
  const [done, setDone] = useState<number[]>(readDone);
  const [dismissed, setDismissed] = useState<boolean>(() => localStorage.getItem(LS_DISMISSED) === '1');
  const [collapsed, setCollapsed] = useState(false);

  // Auto-validation de l'étape « Activer la veille » dès qu'une source est connectée
  useEffect(() => {
    if (sourcesConnected && !done.includes(4)) {
      setDone(prev => {
        const next = [...new Set([...prev, 4])];
        localStorage.setItem(LS_DONE, JSON.stringify(next));
        return next;
      });
    }
  }, [sourcesConnected, done]);

  const markDone = useCallback((n: number) => {
    setDone(prev => {
      if (prev.includes(n)) return prev;
      const next = [...prev, n];
      localStorage.setItem(LS_DONE, JSON.stringify(next));
      return next;
    });
  }, []);

  const handleStep = (s: Step) => {
    markDone(s.n);
    onGo(s.path);
  };

  const dismiss = () => {
    localStorage.setItem(LS_DISMISSED, '1');
    setDismissed(true);
  };

  const doneCount = done.length;
  const pct = Math.round((doneCount / STEPS.length) * 100);

  // Masquée si rejetée ou 100% complétée
  if (dismissed || doneCount >= STEPS.length) return null;

  return (
    <div
      className="mx-1 mb-2 mt-2 rounded-xl p-3"
      style={{ background: 'var(--violet-s)', border: '1px solid var(--violet-x)' }}
    >
      {/* Header : anneau + titre + collapse + close */}
      <div className="flex items-center gap-2.5">
        <div
          className="size-9 rounded-full flex-shrink-0 flex items-center justify-center"
          style={{ background: `conic-gradient(var(--violet) ${pct * 3.6}deg, var(--violet-x) 0deg)` }}
        >
          <div className="size-7 rounded-full bg-card flex items-center justify-center">
            <span className="text-[9px] font-black" style={{ color: 'var(--violet)', fontFamily: 'var(--mono)' }}>
              {doneCount}/5
            </span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11.5px] font-extrabold leading-tight" style={{ color: 'var(--violet-d)' }}>
            Prise en main
          </p>
          <p className="text-[8px] font-semibold uppercase tracking-wide" style={{ color: 'var(--violet)', fontFamily: 'var(--mono)' }}>
            5 gestes clés
          </p>
        </div>
        <button onClick={() => setCollapsed(c => !c)} className="p-1 rounded hover:bg-white/40 transition-colors">
          <ChevronDown className={`size-3.5 transition-transform ${collapsed ? '' : 'rotate-180'}`} style={{ color: 'var(--violet)' }} />
        </button>
        <button onClick={dismiss} className="p-1 rounded hover:bg-white/40 transition-colors" title="Masquer">
          <X className="size-3.5" style={{ color: 'var(--violet)' }} />
        </button>
      </div>

      {/* Steps */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-2.5 flex flex-col gap-1">
              {STEPS.map(s => {
                const isDone = done.includes(s.n);
                return (
                  <button
                    key={s.n}
                    onClick={() => handleStep(s)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg bg-card border transition-colors text-left hover:border-[var(--violet)]"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <span
                      className="size-4 rounded-full flex items-center justify-center flex-shrink-0 text-[8px] font-black"
                      style={isDone
                        ? { background: 'var(--violet)', color: '#fff' }
                        : { background: 'var(--violet-x)', color: 'var(--violet)', fontFamily: 'var(--mono)' }}
                    >
                      {isDone ? <Check className="size-2.5" /> : s.n}
                    </span>
                    <span className={`text-[11px] font-semibold ${isDone ? 'line-through opacity-50' : ''}`}
                      style={{ color: 'var(--t1)' }}>
                      {s.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
