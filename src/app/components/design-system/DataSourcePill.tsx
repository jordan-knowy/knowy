import { CheckCircle2, CircleDashed } from 'lucide-react';
import Badge from './Badge';

interface DataSourcePillProps {
  source: string;
  status?: 'connected' | 'missing' | 'partial';
  level?: 'observable' | 'inferred' | 'hypothetical' | 'unavailable';
}

const levelLabel = {
  observable: 'Observable',
  inferred: 'Inféré',
  hypothetical: 'Hypothétique',
  unavailable: 'Non disponible'
};

export function DataSourcePill({ source, status = 'connected', level }: DataSourcePillProps) {
  const variant = status === 'connected' ? 'sage' : status === 'partial' ? 'amber' : 'muted';

  return (
    <Badge variant={variant} size="sm" className="normal-case tracking-normal">
      {status === 'connected' ? <CheckCircle2 className="size-3" /> : <CircleDashed className="size-3" />}
      {source}
      {level ? ` · ${levelLabel[level]}` : ''}
    </Badge>
  );
}

export default DataSourcePill;
