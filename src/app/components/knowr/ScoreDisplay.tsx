import { motion } from 'motion/react';

interface ScoreDisplayProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  showBar?: boolean;
  label?: string;
  variant?: 'default' | 'confidence';
}

export default function ScoreDisplay({
  value,
  max = 100,
  size = 'md',
  showBar = false,
  label,
  variant = 'default'
}: ScoreDisplayProps) {
  const percentage = (value / max) * 100;

  // Color based on confidence level
  const getColor = () => {
    if (variant === 'confidence') {
      if (percentage < 25) return 'text-coral';
      if (percentage < 40) return 'text-amber';
      if (percentage < 60) return 'text-amber';
      if (percentage < 75) return 'text-sage';
      return 'text-sage';
    }
    return 'text-primary';
  };

  const getBarColor = () => {
    if (variant === 'confidence') {
      if (percentage < 25) return 'bg-coral';
      if (percentage < 40) return 'bg-amber';
      if (percentage < 60) return 'bg-amber';
      if (percentage < 75) return 'bg-sage';
      return 'bg-sage';
    }
    return 'bg-primary';
  };

  const sizeStyles = {
    sm: 'text-xl',
    md: 'text-3xl',
    lg: 'text-5xl'
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline gap-2">
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 0.68, 0, 1.2] }}
          className={`font-mono font-black ${sizeStyles[size]} ${getColor()}`}
        >
          {Math.round(value)}
        </motion.span>
        <span className="text-sm text-muted-foreground font-mono">/{max}</span>
      </div>

      {label && (
        <span className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
          {label}
        </span>
      )}

      {showBar && (
        <div className="w-full h-1.5 bg-lavender-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 0.68, 0, 1.2] }}
            className={`h-full ${getBarColor()} rounded-full`}
          />
        </div>
      )}
    </div>
  );
}
