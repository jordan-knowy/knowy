import { cn } from '../ui/utils';
import ProgressBar from './ProgressBar';

interface ScoreDisplayProps {
  value: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  tone?: 'primary' | 'confidence';
  showBar?: boolean;
}

export function ScoreDisplay({ value, label, size = 'md', tone = 'primary', showBar }: ScoreDisplayProps) {
  const color = tone === 'confidence' && value < 50 ? 'text-amber' : tone === 'confidence' ? 'text-sage' : 'text-primary';

  return (
    <div className="space-y-2">
      <div className="flex items-baseline gap-1">
        <span className={cn('font-mono font-black', color, size === 'sm' && 'text-xl', size === 'md' && 'text-3xl', size === 'lg' && 'text-5xl')}>
          {value}
        </span>
        <span className="font-mono text-sm text-muted-foreground">/100</span>
      </div>
      {label && <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p>}
      {showBar && (
        <ProgressBar
          value={value}
          label={label || 'Score'}
          tone={color === 'text-amber' ? 'amber' : color === 'text-sage' ? 'sage' : 'primary'}
        />
      )}
    </div>
  );
}

export default ScoreDisplay;
