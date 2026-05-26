import { HTMLAttributes } from 'react';
import { motion } from 'motion/react';
import { cn } from '../ui/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  delay?: number;
}

export function Card({ className, hover, delay = 0, ...props }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay, ease: [0.22, 0.68, 0, 1] }}
      className={cn(
        'rounded-lg border border-border bg-card shadow-xs',
        hover && 'cursor-pointer transition hover:border-primary/30 hover:shadow-sm',
        className
      )}
      {...props}
    />
  );
}

export default Card;
