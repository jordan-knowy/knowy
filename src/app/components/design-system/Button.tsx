import { ButtonHTMLAttributes, ReactNode } from 'react';
import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { cn } from '../ui/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  icon?: ReactNode;
  loading?: boolean;
  children?: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  loading,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      className={cn(
        'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg font-semibold transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:pointer-events-none disabled:opacity-50',
        variant === 'primary' && 'bg-primary text-primary-foreground shadow-button hover:bg-primary-hover',
        variant === 'secondary' && 'border border-border bg-card text-primary hover:bg-lavender-50',
        variant === 'ghost' && 'bg-transparent text-text-secondary hover:bg-muted hover:text-foreground',
        variant === 'danger' && 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        size === 'sm' && 'min-h-9 px-3 py-2 text-sm',
        size === 'md' && 'px-5 py-2.5 text-sm',
        size === 'lg' && 'min-h-12 px-6 py-3 text-base',
        size === 'icon' && 'size-10 p-0',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : icon}
      {children}
    </motion.button>
  );
}

export default Button;
