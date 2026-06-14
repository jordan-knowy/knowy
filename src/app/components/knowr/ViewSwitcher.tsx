import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Calendar, User, Building2, ChevronDown } from 'lucide-react';

type View = 'reunion' | 'personne' | 'compte';

interface ContactRef { id: string; name: string; role?: string | null }

interface ViewSwitcherProps {
  active: View;
  meetingId?: string | null;
  /** Cible(s) « Personne ». Si plusieurs → popover de sélection. */
  contacts?: ContactRef[];
  /** Raccourci pour une seule personne (rétro-compat) */
  contactId?: string | null;
  companyId?: string | null;
  dark?: boolean;
}

function initials(name: string) {
  return name.split(/[\s\-]+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

/**
 * Commutateur de vue « Réunion · Personne · Compte » (spec-25 §B).
 * Navigation constante entre les 3 surfaces. Si plusieurs personnes sont liées,
 * le bouton « Personne » ouvre une liste de sélection avant d'ouvrir la fiche.
 */
export default function ViewSwitcher({ active, meetingId, contacts, contactId, companyId, dark = false }: ViewSwitcherProps) {
  const navigate = useNavigate();
  const [openList, setOpenList] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Liste effective des personnes
  const people: ContactRef[] = contacts && contacts.length
    ? contacts
    : (contactId ? [{ id: contactId, name: 'Personne' }] : []);

  useEffect(() => {
    if (!openList) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpenList(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [openList]);

  const handlePersonne = () => {
    if (active === 'personne') return;
    if (people.length === 0) return;
    if (people.length === 1) { navigate(`/contact/${people[0].id}`); return; }
    setOpenList(v => !v);
  };

  const pillStyle = (isActive: boolean) => isActive
    ? { background: '#6E50C8', color: '#fff', boxShadow: '0 2px 10px rgba(110,80,200,0.35)' }
    : { background: dark ? 'rgba(255,255,255,0.9)' : '#fff', color: '#6E50C8' };

  const items: { key: View; label: string; icon: typeof Calendar; path: string | null; onClick?: () => void; hasList?: boolean }[] = [
    { key: 'reunion',  label: 'Réunion',  icon: Calendar,  path: meetingId ? `/meeting/${meetingId}` : null },
    { key: 'personne', label: 'Personne', icon: User,      path: null, onClick: handlePersonne, hasList: people.length > 1 },
    { key: 'compte',   label: 'Compte',   icon: Building2, path: companyId ? `/company/${companyId}` : null },
  ];

  return (
    <div ref={ref} className="relative inline-flex">
      <div
        className="inline-flex items-center gap-1 rounded-full p-1"
        style={{
          background: dark ? 'rgba(255,255,255,0.06)' : 'var(--bg2)',
          border: dark ? '1px solid rgba(255,255,255,0.08)' : '1px solid var(--border)',
        }}
      >
        <span
          className="px-2 text-[9px] font-bold uppercase tracking-widest"
          style={{ color: dark ? 'rgba(255,255,255,0.35)' : 'var(--t3)', fontFamily: 'var(--mono)' }}
        >
          Vue
        </span>
        {items.map(item => {
          const Icon = item.icon;
          const isActive = item.key === active;
          const isPersonne = item.key === 'personne';
          const targetExists = isPersonne ? people.length > 0 : Boolean(item.path);
          const disabled = !isActive && !targetExists;
          return (
            <button
              key={item.key}
              disabled={disabled}
              onClick={() => {
                if (isActive) return;
                if (item.onClick) item.onClick();
                else if (item.path) navigate(item.path);
              }}
              title={disabled ? 'Aucune cible liée' : item.label}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              style={pillStyle(isActive)}
            >
              <Icon className="size-3.5" />
              {item.label}
              {item.hasList && !isActive && <ChevronDown className="size-3" />}
            </button>
          );
        })}
      </div>

      {/* Popover liste des personnes */}
      {openList && people.length > 1 && (
        <div
          className="absolute z-30 top-full left-1/2 -translate-x-1/2 mt-2 w-64 rounded-2xl border border-border bg-card shadow-lg p-2"
        >
          <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground px-2 py-1.5" style={{ fontFamily: 'var(--mono)' }}>
            Choisir une personne
          </p>
          <div className="max-h-64 overflow-y-auto">
            {people.map(p => (
              <button
                key={p.id}
                onClick={() => { setOpenList(false); navigate(`/contact/${p.id}`); }}
                className="w-full flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-muted/40 transition-colors text-left"
              >
                <span className="size-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#6E50C8,#9747FF)' }}>
                  {initials(p.name)}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold truncate text-foreground">{p.name}</span>
                  {p.role && <span className="block text-[11px] text-muted-foreground truncate">{p.role}</span>}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
