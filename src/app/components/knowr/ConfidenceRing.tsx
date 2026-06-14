import { motion } from 'motion/react';

interface ConfidenceRingProps {
  /** Confidence value 0–100 */
  value: number;
  /** Diameter in px (default 52) */
  size?: number;
  /** Render for dark hero (default true) or light surface */
  dark?: boolean;
  label?: string;
}

/**
 * Anneau de confiance — bloc canonique #2 du hero (doctrine #4 / spec-16 §3).
 * conic-gradient violet, valeur en % au centre. Couleur sémantique du %
 * (coral < 40, amber < 60, sage ≥ 75).
 */
export default function ConfidenceRing({
  value,
  size = 52,
  dark = true,
  label = 'Confiance',
}: ConfidenceRingProps) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));

  const ringColor =
    pct < 40 ? '#D94F63'      // coral
    : pct < 60 ? '#C97A20'    // amber
    : pct < 75 ? '#6E50C8'    // violet
    : '#2EA86A';              // sage

  const track = dark ? 'rgba(255,255,255,0.10)' : 'rgba(110,80,200,0.12)';
  const labelColor = dark ? 'rgba(255,255,255,0.3)' : 'var(--t3)';
  const valueColor = dark ? '#fff' : 'var(--t1)';
  const thickness = Math.round(size * 0.12);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <p
        className="text-[9px] font-bold uppercase tracking-widest"
        style={{ color: labelColor, fontFamily: 'var(--mono)' }}
      >
        {label}
      </p>
      <motion.div
        initial={{ rotate: -90, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 0.68, 0, 1.2] }}
        className="relative flex items-center justify-center"
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: `conic-gradient(${ringColor} ${pct * 3.6}deg, ${track} 0deg)`,
        }}
      >
        <div
          className="flex items-center justify-center rounded-full"
          style={{
            width: size - thickness * 2,
            height: size - thickness * 2,
            background: dark ? '#13111E' : '#fff',
          }}
        >
          <span
            className="font-black leading-none"
            style={{
              fontSize: size * 0.28,
              color: valueColor,
              fontFamily: 'var(--mono)',
            }}
          >
            {pct}
            <span style={{ fontSize: size * 0.16, opacity: 0.5 }}>%</span>
          </span>
        </div>
      </motion.div>
    </div>
  );
}
