import { cn } from '../ui/utils';

interface ProgressBarProps {
  value: number;
  tone?: 'primary' | 'sage' | 'amber' | 'blue';
  label: string;
}

export function ProgressBar({ value, tone = 'primary', label }: ProgressBarProps) {
  return (
    <progress
      aria-label={label}
      className={cn(
        'knowy-progress h-2 w-full overflow-hidden rounded-full bg-muted',
        tone === 'primary' && 'knowy-progress-primary',
        tone === 'sage' && 'knowy-progress-sage',
        tone === 'amber' && 'knowy-progress-amber',
        tone === 'blue' && 'knowy-progress-blue'
      )}
      max={100}
      value={value}
    />
  );
}

export default ProgressBar;
