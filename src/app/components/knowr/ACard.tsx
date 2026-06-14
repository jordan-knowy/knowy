import { ArrowRight } from 'lucide-react';

interface ACardProps {
  avatar?: string;
  initials?: string;
  eyebrow: string;
  name: string;
  subtitle?: string;
  score?: number | null;
  onClick: () => void;
  className?: string;
}

function scoreColor(s: number) {
  return s >= 70 ? '#2EA86A' : s >= 40 ? '#6E50C8' : '#D94F63';
}

export default function ACard({
  avatar,
  initials,
  eyebrow,
  name,
  subtitle,
  score,
  onClick,
  className = '',
}: ACardProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all text-left w-full ${className}`}
    >
      {avatar ? (
        <img
          src={avatar}
          alt={name}
          className="size-10 rounded-xl object-cover flex-shrink-0"
        />
      ) : (
        <div
          className="size-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #6E50C8, #9747FF)' }}
        >
          {initials ?? name.slice(0, 2).toUpperCase()}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">
          {eyebrow}
        </p>
        <p className="text-sm font-semibold text-foreground truncate">{name}</p>
        {subtitle && (
          <p className="text-[11px] text-muted-foreground truncate">{subtitle}</p>
        )}
      </div>

      {score != null && (
        <span
          className="text-lg font-black flex-shrink-0"
          style={{ color: scoreColor(score) }}
        >
          {score}
        </span>
      )}

      <ArrowRight className="size-4 text-muted-foreground flex-shrink-0" />
    </button>
  );
}
