import { ReactNode } from 'react';

interface KnowyBadgeProps {
  children: ReactNode;
  variant?: 'violet' | 'sage' | 'amber' | 'coral' | 'blue' | 'muted';
  size?: 'sm' | 'md';
  className?: string;
}

export default function KnowyBadge({
  children,
  variant = 'violet',
  size = 'md',
  className = ''
}: KnowyBadgeProps) {
  const variantStyles = {
    violet: 'bg-lavender-100 text-primary border-[rgba(110,80,200,0.18)]',
    sage: 'bg-[#E4F5ED] text-sage border-sage/20',
    amber: 'bg-[#FBF0E2] text-amber border-amber/20',
    coral: 'bg-[#FDEAED] text-coral border-coral/20',
    blue: 'bg-[#E5EDFF] text-[#3D6FCC] border-[#3D6FCC]/20',
    muted: 'bg-muted text-muted-foreground border-border'
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-[11px]'
  };

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full border font-bold uppercase tracking-wide ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
}
