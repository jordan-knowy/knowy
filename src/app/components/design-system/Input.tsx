import { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '../ui/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: ReactNode;
}

export function Input({ label, icon, id, className, ...props }: InputProps) {
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="block text-sm font-semibold text-foreground">
        {label}
      </label>
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</div>}
        <input
          id={inputId}
          className={cn(
            'min-h-11 w-full rounded-lg border border-border bg-input-background px-4 py-2 text-sm transition',
            'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
            icon && 'pl-10',
            className
          )}
          {...props}
        />
      </div>
    </div>
  );
}

export default Input;
