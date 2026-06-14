import { useState } from 'react';
import { Zap, Info, ArrowRight } from 'lucide-react';

export type VerdictPosture = 'defend' | 'capitaliser' | 'derisquer';

export interface VerdictCardProps {
  posture: VerdictPosture;
  pilote: string;
  score: number;
  severite: number;
  urgence: number;
  reason: string;
  onAction?: () => void;
}

const POSTURE_CONFIG: Record<VerdictPosture, { label: string; color: string; border: string; bg: string; badgeBg: string; badgeText: string }> = {
  defend: {
    label: 'Défendre',
    color:     '#D94F63',
    border:    'rgba(217,79,99,0.35)',
    bg:        'rgba(217,79,99,0.05)',
    badgeBg:   'rgba(217,79,99,0.12)',
    badgeText: '#D94F63',
  },
  capitaliser: {
    label: 'Capitaliser',
    color:     '#6E50C8',
    border:    'rgba(110,80,200,0.35)',
    bg:        'rgba(110,80,200,0.05)',
    badgeBg:   'rgba(110,80,200,0.12)',
    badgeText: '#6E50C8',
  },
  derisquer: {
    label: 'Dé-risquer',
    color:     '#C97A20',
    border:    'rgba(201,122,32,0.35)',
    bg:        'rgba(201,122,32,0.05)',
    badgeBg:   'rgba(201,122,32,0.12)',
    badgeText: '#C97A20',
  },
};

function ScoreBar({ value, colors }: { value: number; colors: string }) {
  return (
    <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.08)' }}>
      <div
        className="absolute inset-y-0 left-0 rounded-full transition-all"
        style={{ width: `${value}%`, background: colors }}
      />
    </div>
  );
}

export default function VerdictCard({ posture, pilote, score, severite, urgence, reason, onAction }: VerdictCardProps) {
  const [showPopover, setShowPopover] = useState(false);
  const cfg = POSTURE_CONFIG[posture];

  return (
    <div
      className="relative rounded-2xl border overflow-hidden mb-3"
      style={{
        borderColor: cfg.border,
        background: cfg.bg,
        borderTopWidth: '3px',
        borderTopColor: cfg.color,
      }}
    >
      {/* Head */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <div className="flex items-center gap-1.5">
          <Zap className="size-3.5" style={{ color: cfg.color }} />
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: cfg.color }}>
            Priorité du compte
          </span>
        </div>
        <button
          onClick={() => setShowPopover(v => !v)}
          className="size-5 flex items-center justify-center rounded-full transition-colors hover:bg-black/5"
          title="Détail du calcul"
        >
          <Info className="size-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* Popover détail calcul */}
      {showPopover && (
        <div className="mx-4 mb-2 p-3 rounded-xl border" style={{ background: 'rgba(255,255,255,0.8)', borderColor: cfg.border }}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Détail du calcul</p>
          {/* Sévérité */}
          <div className="mb-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Sévérité</span>
              <span className="text-xs font-mono font-bold">{severite}/100</span>
            </div>
            <ScoreBar value={severite} colors="linear-gradient(90deg,#F59E0B,#D94F63)" />
            <p className="text-[10px] text-muted-foreground mt-1">{pilote}</p>
          </div>
          {/* Urgence */}
          <div className="mb-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Urgence</span>
              <span className="text-xs font-mono font-bold">{urgence}/100</span>
            </div>
            <ScoreBar value={urgence} colors="linear-gradient(90deg,#3D6FCC,#6E50C8)" />
          </div>
          {/* Formule */}
          <p className="text-[10px] font-mono text-muted-foreground mt-2 px-2 py-1 rounded bg-black/5">
            priorité = sév × (0,55 + 0,45 × urg/100)
          </p>
        </div>
      )}

      {/* Body */}
      <div className="flex items-center gap-3 px-4 py-2">
        {/* Score */}
        <div className="flex-shrink-0 text-center">
          <span className="text-3xl font-black leading-none" style={{ color: cfg.color }}>{score}</span>
          <p className="text-[9px] font-mono text-muted-foreground">/100</p>
        </div>

        {/* Pilote + posture */}
        <div className="flex flex-col gap-1 min-w-0">
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold self-start"
            style={{ background: cfg.badgeBg, color: cfg.badgeText }}
          >
            {pilote}
          </span>
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold self-start border"
            style={{ borderColor: cfg.border, color: cfg.color, background: 'transparent' }}
          >
            ● {cfg.label}
          </span>
        </div>
      </div>

      {/* Reason */}
      <p className="px-4 pb-3 text-xs text-muted-foreground leading-relaxed">{reason}</p>

      {/* Footer CTA */}
      <div className="border-t px-4 py-2.5" style={{ borderColor: cfg.border }}>
        <button
          onClick={onAction}
          className="flex items-center gap-1.5 text-xs font-semibold transition-colors hover:opacity-80"
          style={{ color: cfg.color }}
        >
          Préparer une action
          <ArrowRight className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
