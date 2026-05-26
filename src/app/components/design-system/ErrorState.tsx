import { AlertTriangle } from 'lucide-react';
import Card from './Card';

export function ErrorState({ title = 'Erreur', description }: { title?: string; description: string }) {
  return (
    <Card className="border-coral/20 bg-coral-bg p-5">
      <div className="flex gap-3">
        <AlertTriangle className="size-5 text-coral" aria-hidden="true" />
        <div>
          <h3 className="font-bold text-coral">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </Card>
  );
}

export default ErrorState;
