import { ReactNode } from 'react';
import { motion } from 'motion/react';

interface KnowrCardProps {
  children: ReactNode;
  hover?: boolean;
  className?: string;
  onClick?: () => void;
  delay?: number;
}

export default function KnowrCard({
  children,
  hover = false,
  className = '',
  onClick,
  delay = 0
}: KnowrCardProps) {
  const baseStyles = 'bg-card border border-border transition-all duration-200';
  const hoverStyles = hover ? 'hover:border-primary/30 hover:shadow-sm hover:-translate-y-0.5 cursor-pointer' : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 0.68, 0, 1] }}
      whileHover={hover ? { y: -2 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      className={`${baseStyles} ${hoverStyles} ${className}`}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}
