import { ButtonHTMLAttributes, ReactNode } from 'react';
import { motion } from 'motion/react';

interface KnowyButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  icon?: ReactNode;
  loading?: boolean;
}

export default function KnowyButton({
  variant = 'primary',
  size = 'md',
  children,
  icon,
  loading,
  className = '',
  disabled,
  ...props
}: KnowyButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150 ease-out disabled:opacity-50 disabled:cursor-not-allowed';

  const variantStyles = {
    primary: 'bg-primary hover:bg-primary-hover text-white shadow-button hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.96]',
    secondary: 'bg-white border-[1.5px] border-[rgba(110,80,200,0.18)] text-primary hover:bg-lavender-50 active:scale-[0.96]',
    ghost: 'bg-transparent text-text-secondary hover:text-foreground hover:bg-muted active:scale-[0.96]'
  };

  const sizeStyles = {
    sm: 'px-3 py-2 text-sm rounded-lg',
    md: 'px-6 py-3 text-base rounded-[14px]',
    lg: 'px-8 py-4 text-lg rounded-xl'
  };

  return (
    <motion.button
      whileHover={{ y: variant === 'primary' ? -1 : 0 }}
      whileTap={{ scale: 0.96 }}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {icon && !loading && icon}
      {children}
    </motion.button>
  );
}
