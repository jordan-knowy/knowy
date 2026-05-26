import { HTMLAttributes } from 'react';
import { cn } from '../ui/utils';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'violet' | 'sage' | 'amber' | 'coral' | 'blue' | 'muted' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export function Badge({ variant = 'violet', size = 'md', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center gap-1 rounded-full border font-bold uppercase tracking-wide',
        (variant === 'primary' || variant === 'violet') && 'border-primary/15 bg-lavender-100 text-primary',
        variant === 'sage' && 'border-sage/20 bg-sage-bg text-sage',
        variant === 'amber' && 'border-amber/20 bg-amber-bg text-amber',
        variant === 'coral' && 'border-coral/20 bg-coral-bg text-coral',
        variant === 'blue' && 'border-blue-info/20 bg-blue-info-bg text-blue-info',
        variant === 'muted' && 'border-border bg-muted text-muted-foreground',
        variant === 'outline' && 'border-primary/30 bg-card text-primary',
        size === 'sm' && 'px-2 py-0.5 text-[10px]',
        size === 'md' && 'px-2.5 py-1 text-[11px]',
        size === 'lg' && 'px-3 py-1.5 text-xs',
        className
      )}
      {...props}
    />
  );
}

export default Badge;
