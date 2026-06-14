import { motion } from 'motion/react';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

/**
 * En-tête de page canonique — typo unique pour toutes les pages liste
 * (Home, Réunions, Comptes, Personnes, Paramètres). Spec-16 : titre Epilogue 900.
 * Garantit la cohérence : même taille, même graisse, même emplacement partout.
 */
export default function PageHeader({ title, subtitle, actions, className = '' }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`flex flex-col gap-4 mb-7 sm:flex-row sm:items-start sm:justify-between ${className}`}
    >
      <div className="min-w-0">
        <h1 className="text-3xl font-black tracking-tight leading-tight text-foreground">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1" style={{ fontFamily: 'var(--mono)' }}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
          {actions}
        </div>
      )}
    </motion.div>
  );
}
