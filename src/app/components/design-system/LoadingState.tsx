import { Loader2 } from 'lucide-react';

export function LoadingState({ label = 'Chargement' }: { label?: string }) {
  return (
    <div className="flex min-h-40 items-center justify-center gap-3 text-muted-foreground">
      <Loader2 className="size-5 animate-spin" aria-hidden="true" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

export default LoadingState;
