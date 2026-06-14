import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Search, Building2, User, Calendar, Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { getActiveOrganizationId } from '../../../lib/api/org';

interface Co { id: string; name: string; domain: string | null }
interface Pe { id: string; name: string; email: string | null }
interface Me { id: string; title: string; company: string | null; starts_at: string | null }

function initials(name: string) {
  return name.split(/[\s\-&]+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

/**
 * Recherche globale (header Home) — aperçu rapide (3 comptes / 3 personnes / 3 réunions)
 * à l'ouverture, puis filtrage en direct. Chaque résultat est cliquable.
 */
export default function GlobalSearch({ className = 'flex-1 lg:max-w-md' }: { className?: string }) {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [companies, setCompanies] = useState<Co[]>([]);
  const [contacts, setContacts] = useState<Pe[]>([]);
  const [meetings, setMeetings] = useState<Me[]>([]);

  const load = useCallback(async () => {
    if (loaded || !supabase) return;
    setLoading(true);
    try {
      const orgId = await getActiveOrganizationId();
      if (!orgId) { setLoading(false); return; }
      const [co, pe, me] = await Promise.all([
        supabase.from('companies').select('id, name, domain').eq('organization_id', orgId).order('name').limit(200),
        supabase.from('contacts').select('id, full_name, email').eq('organization_id', orgId).is('merged_into_contact_id', null).limit(500),
        supabase.from('meetings').select('id, title, company, starts_at').eq('organization_id', orgId).neq('company', 'Personnel').order('starts_at', { ascending: false }).limit(200),
      ]);
      setCompanies((co.data ?? []).map((c: any) => ({ id: c.id, name: c.name, domain: c.domain })));
      setContacts((pe.data ?? []).map((c: any) => ({ id: c.id, name: c.full_name, email: c.email })));
      setMeetings((me.data ?? []).map((m: any) => ({ id: m.id, title: m.title, company: m.company, starts_at: m.starts_at })));
      setLoaded(true);
    } finally {
      setLoading(false);
    }
  }, [loaded]);

  useEffect(() => {
    if (!open) return;
    load();
    const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open, load]);

  const q = query.trim().toLowerCase();
  const fco = useMemo(() => (q ? companies.filter(c => c.name?.toLowerCase().includes(q) || c.domain?.toLowerCase().includes(q)) : companies).slice(0, 3), [companies, q]);
  const fpe = useMemo(() => (q ? contacts.filter(c => c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q)) : contacts).slice(0, 3), [contacts, q]);
  const fme = useMemo(() => (q ? meetings.filter(m => m.title?.toLowerCase().includes(q) || m.company?.toLowerCase().includes(q)) : meetings).slice(0, 3), [meetings, q]);

  const go = (path: string) => { setOpen(false); setQuery(''); navigate(path); };
  const empty = !loading && fco.length === 0 && fpe.length === 0 && fme.length === 0;

  const fmtDate = (iso: string | null) => iso ? new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '';

  return (
    <div ref={ref} className={`relative ${className}`}>
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
      <input
        type="text"
        value={query}
        onFocusCapture={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        placeholder="Rechercher un compte, une personne…"
        className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
      />

      {open && (
        <div className="absolute z-40 top-full left-0 right-0 mt-2 rounded-2xl border border-border bg-card shadow-lg overflow-hidden">
          {loading ? (
            <div className="flex items-center gap-2 px-4 py-5 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Chargement…
            </div>
          ) : empty ? (
            <div className="px-4 py-5 text-sm text-muted-foreground text-center">
              Aucun résultat{q ? ` pour « ${query} »` : ''}.
            </div>
          ) : (
            <div className="max-h-[70vh] overflow-y-auto py-1">
              {/* Comptes */}
              <Section label="Comptes" icon={<Building2 className="size-3.5" />} />
              {fco.map(c => (
                <button key={c.id} onClick={() => go(`/company/${c.id}`)} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-muted/30 transition-colors text-left">
                  <span className="size-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0" style={{ background: 'linear-gradient(135deg,#6E50C8,#9747FF)' }}>{initials(c.name)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold truncate">{c.name}</span>
                    {c.domain && <span className="block text-[11px] text-muted-foreground truncate">{c.domain}</span>}
                  </span>
                </button>
              ))}
              {fco.length === 0 && <Empty />}

              {/* Personnes */}
              <Section label="Personnes" icon={<User className="size-3.5" />} />
              {fpe.map(c => (
                <button key={c.id} onClick={() => go(`/contact/${c.id}`)} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-muted/30 transition-colors text-left">
                  <span className="size-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0" style={{ background: 'linear-gradient(135deg,#6E50C8,#9747FF)' }}>{initials(c.name)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold truncate">{c.name}</span>
                    {c.email && <span className="block text-[11px] text-muted-foreground truncate">{c.email}</span>}
                  </span>
                </button>
              ))}
              {fpe.length === 0 && <Empty />}

              {/* Réunions */}
              <Section label="Réunions" icon={<Calendar className="size-3.5" />} />
              {fme.map(m => (
                <button key={m.id} onClick={() => go(`/meeting/${m.id}`)} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-muted/30 transition-colors text-left">
                  <span className="size-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(11,136,120,0.1)', color: '#0B8878' }}><Calendar className="size-3.5" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold truncate">{m.title || 'Réunion'}</span>
                    <span className="block text-[11px] text-muted-foreground truncate">{[m.company && m.company !== '—' ? m.company : null, fmtDate(m.starts_at)].filter(Boolean).join(' · ')}</span>
                  </span>
                </button>
              ))}
              {fme.length === 0 && <Empty />}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 px-4 pt-2.5 pb-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground" style={{ fontFamily: 'var(--mono)' }}>
      {icon} {label}
    </div>
  );
}
function Empty() {
  return <p className="px-4 pb-1 text-[11px] text-muted-foreground italic">—</p>;
}
