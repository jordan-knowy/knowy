import { ReactNode } from 'react';
import Button from './Button';

export function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-violet-night/40 p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="knowy-modal-title" className="w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="knowy-modal-title" className="text-xl font-bold">{title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>Fermer</Button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default Modal;
