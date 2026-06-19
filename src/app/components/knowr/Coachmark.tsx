import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';

/**
 * Coachmark — bulle d'aide affichée UNIQUEMENT au premier passage sur une surface.
 * Apparition liée à l'onboarding (cf. doctrine maquette : les guides de première
 * visite se déclenchent une fois puis se désactivent, état persisté en localStorage).
 *
 * Usage :
 *   <Coachmark id="personne-sync" title="Synchronisez vos emails"
 *     text="Cliquez ici pour rapatrier vos échanges Gmail / Outlook avec ce contact." />
 * À placer dans un parent `position: relative` proche de la cible.
 */
const LS_PREFIX = 'knowr.coachmark.';

export function dismissCoachmark(id: string) {
  try { localStorage.setItem(LS_PREFIX + id, '1'); } catch { /* ignore */ }
}

export function wasCoachmarkSeen(id: string): boolean {
  try { return localStorage.getItem(LS_PREFIX + id) === '1'; } catch { return false; }
}

interface CoachmarkProps {
  id: string;
  title: string;
  text: string;
  /** Positionnement de la bulle par rapport au parent relatif. */
  className?: string;
  /** Délai avant apparition (ms) — laisse la page s'animer d'abord. */
  delay?: number;
}

export default function Coachmark({ id, title, text, className = '', delay = 600 }: CoachmarkProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (wasCoachmarkSeen(id)) return;
    const t = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(t);
  }, [id, delay]);

  const close = () => {
    setShow(false);
    dismissCoachmark(id);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.98 }}
          transition={{ duration: 0.32, ease: [0.22, 0.68, 0, 1.2] }}
          className={`absolute z-50 w-64 rounded-xl p-3.5 shadow-lg ${className}`}
          style={{ background: 'var(--night, #1A1040)', color: '#fff' }}
          role="dialog"
        >
          <button
            onClick={close}
            aria-label="Fermer"
            className="absolute top-2.5 right-2.5 opacity-60 hover:opacity-100 transition-opacity"
          >
            <X className="size-3.5" />
          </button>
          <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '8.5px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--violet-l, #D4C5F5)' }}>
            Première fois
          </p>
          <p className="mt-1 font-bold" style={{ fontSize: '13px' }}>{title}</p>
          <p className="mt-1 leading-snug" style={{ fontSize: '11.5px', color: 'rgba(255,255,255,.78)' }}>{text}</p>
          <button
            onClick={close}
            className="mt-2.5 text-[11px] font-bold rounded-lg px-2.5 py-1.5"
            style={{ background: 'var(--violet, #6E50C8)', color: '#fff' }}
          >
            Compris
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
