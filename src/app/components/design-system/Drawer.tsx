import { ReactNode } from 'react';

export function Drawer({ title, children }: { title: string; children: ReactNode }) {
  return (
    <aside className="h-full w-full max-w-md border-l border-border bg-card p-6 shadow-lg" aria-label={title}>
      <h2 className="mb-4 text-xl font-bold">{title}</h2>
      {children}
    </aside>
  );
}

export default Drawer;
