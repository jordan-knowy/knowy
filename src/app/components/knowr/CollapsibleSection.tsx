import { useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';

interface CollapsibleSectionProps {
  title: string;
  icon?: ReactNode;
  badge?: string;
  defaultOpen?: boolean;
  action?: boolean;
  children: ReactNode;
  className?: string;
}

export default function CollapsibleSection({
  title,
  icon,
  badge,
  defaultOpen = true,
  action = false,
  children,
  className = '',
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className={`rounded-2xl overflow-hidden ${
        action
          ? 'border border-primary/20 bg-card'
          : 'border border-border bg-card'
      } ${className}`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-muted/20 transition-colors text-left"
      >
        {icon && (
          <span className={`flex-shrink-0 ${action ? 'text-primary' : 'text-muted-foreground'}`}>
            {icon}
          </span>
        )}
        <span className="flex-1 text-sm font-bold text-foreground uppercase tracking-wide">
          {title}
        </span>
        {badge && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
            {badge}
          </span>
        )}
        <ChevronDown
          className={`size-4 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 border-t border-border pt-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
