import { ReactNode } from 'react';
import Card from './Card';

export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description: string; action?: ReactNode }) {
  return (
    <Card className="px-6 py-12 text-center">
      {icon && <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-lg bg-muted text-muted-foreground">{icon}</div>}
      <h3 className="mb-2 text-lg font-bold">{title}</h3>
      <p className="mx-auto mb-6 max-w-md text-sm text-muted-foreground">{description}</p>
      {action}
    </Card>
  );
}

export default EmptyState;
