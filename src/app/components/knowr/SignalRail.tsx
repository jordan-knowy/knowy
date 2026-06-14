import { AlertTriangle, TrendingDown, TrendingUp, Users, Globe, Zap } from 'lucide-react';

export type SignalTag =
  | 'Churn'
  | 'Risque'
  | 'Levier'
  | 'Mobilité'
  | 'Réseau'
  | 'Présence'
  | 'Marché'
  | 'Croissance';

export interface Signal {
  tag: SignalTag;
  text: string;
  source?: string;
  date?: string;
  provenance?: 'observable' | 'inferred' | 'public';
}

interface SignalRailProps {
  signals: Signal[];
  title?: string;
}

const TAG_CONFIG: Record<SignalTag, { icon: React.ElementType; color: string; bg: string }> = {
  Churn:      { icon: TrendingDown, color: '#D94F63', bg: 'rgba(217,79,99,0.1)' },
  Risque:     { icon: AlertTriangle, color: '#C97A20', bg: 'rgba(201,122,32,0.1)' },
  Levier:     { icon: Zap,           color: '#6E50C8', bg: 'rgba(110,80,200,0.1)' },
  Mobilité:   { icon: TrendingUp,    color: '#2EA86A', bg: 'rgba(46,168,106,0.1)' },
  Réseau:     { icon: Users,         color: '#3D6FCC', bg: 'rgba(61,111,204,0.1)' },
  Présence:   { icon: Globe,         color: '#3D6FCC', bg: 'rgba(61,111,204,0.1)' },
  Marché:     { icon: TrendingUp,    color: '#2EA86A', bg: 'rgba(46,168,106,0.1)' },
  Croissance: { icon: TrendingUp,    color: '#2EA86A', bg: 'rgba(46,168,106,0.1)' },
};

const TAG_ORDER: SignalTag[] = ['Churn', 'Risque', 'Levier', 'Mobilité', 'Réseau', 'Présence', 'Marché', 'Croissance'];

function sortSignals(signals: Signal[]): Signal[] {
  return [...signals].sort(
    (a, b) => TAG_ORDER.indexOf(a.tag) - TAG_ORDER.indexOf(b.tag)
  );
}

export default function SignalRail({ signals, title = 'Signaux' }: SignalRailProps) {
  const sorted = sortSignals(signals);

  return (
    <aside className="w-full space-y-3">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
        {title}
      </p>

      {sorted.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-4 py-6 text-center">
          <p className="text-xs text-muted-foreground">
            Aucun signal disponible.
            <br />
            Connectez vos sources pour activer les alertes.
          </p>
        </div>
      ) : (
        sorted.map((sig, i) => {
          const cfg = TAG_CONFIG[sig.tag];
          const Icon = cfg.icon;
          return (
            <div
              key={i}
              className="rounded-2xl border border-border bg-card px-4 py-3 space-y-2"
            >
              <div className="flex items-center gap-2">
                <span
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ background: cfg.bg, color: cfg.color }}
                >
                  <Icon className="size-3" />
                  {sig.tag}
                </span>
                {sig.date && (
                  <span className="text-[10px] text-muted-foreground ml-auto font-mono">
                    {sig.date}
                  </span>
                )}
              </div>
              <p className="text-xs text-foreground leading-relaxed">{sig.text}</p>
              {sig.source && (
                <p className="text-[10px] text-muted-foreground">
                  {sig.provenance === 'observable' && (
                    <span className="text-[#2EA86A] font-bold mr-1">●</span>
                  )}
                  {sig.provenance === 'inferred' && (
                    <span className="text-primary font-bold mr-1">●</span>
                  )}
                  {sig.provenance === 'public' && (
                    <span className="text-[#3D6FCC] font-bold mr-1">●</span>
                  )}
                  {sig.source}
                </p>
              )}
            </div>
          );
        })
      )}
    </aside>
  );
}
