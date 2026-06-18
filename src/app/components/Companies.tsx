import { motion } from 'motion/react';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import {
  Building2, Search, Users, Calendar, ArrowRight,
  Plus, Loader2, RefreshCw, Filter, Clock,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getActiveOrganizationId } from '../../lib/api/org';
import { resolveAccountType, accountTypeConfig, type AccountType } from '../../lib/accountType';
import PageHeader from './knowr/PageHeader';

interface CompanyRow {
  id: string;
  name: string;
  domain: string | null;
  contactsCount: number;
  meetingsCount: number;
  lastContactDays: number | null;
  topContactName: string | null;
  accountType: AccountType | null;
}

type SortType = 'name' | 'contacts' | 'meetings' | 'recent';
type ScopeFilter = 'mine' | 'org';
type TypeFilter = 'all' | AccountType | 'unknown';

function initials(name: string) {
  return name
    .split(/[\s\-&]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();
}

function getDaysText(days: number | null): string {
  if (days === null) return '—';
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return 'Hier';
  if (days < 7) return `${days}j`;
  if (days < 30) return `${Math.floor(days / 7)}sem`;
  return `${Math.floor(days / 30)}m`;
}

function getDaysColor(days: number | null): string {
  if (days === null) return 'text-muted-foreground';
  if (days <= 7) return 'text-success';
  if (days <= 30) return 'text-amber-600';
  return 'text-destructive';
}

export default function Companies() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortType>('contacts');
  const [scope, setScope] = useState<ScopeFilter>('mine');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [orgId, setOrgId] = useState<string | null>(null);

  const loadCompanies = useCallback(async () => {
    if (!supabase) { setLoading(false); return; }
    setLoading(true);
    try {
      const oid = orgId ?? await getActiveOrganizationId();
      if (!oid) { setLoading(false); return; }
      if (!orgId) setOrgId(oid);

      // Load companies from the companies table
      const { data: companiesData } = await supabase
        .from('companies')
        .select('id, name, domain, account_type, account_type_confidence')
        .eq('organization_id', oid)
        .order('name');

      if (!companiesData?.length) {
        // Pas de comptes encore — la détection les crée à la sync (ingest-communication)
        setCompanies([]);
        setLoading(false);
        return;
      }

      // Enrich with contacts count + last contact (dernier email)
      const ids = companiesData.map(c => c.id);
      const { data: contactsData } = await supabase
        .from('contacts')
        .select('id, full_name, company_id')
        .eq('organization_id', oid)
        .is('merged_into_contact_id', null)
        .in('company_id', ids);

      const contactIds = (contactsData ?? []).map((c: any) => c.id);
      const lastByContact: Record<string, string> = {};
      if (contactIds.length) {
        const { data: msgs } = await supabase
          .from('communication_messages')
          .select('contact_id, sent_at')
          .eq('organization_id', oid)
          .in('contact_id', contactIds)
          .order('sent_at', { ascending: false });
        for (const m of (msgs ?? []) as any[]) {
          if (m.sent_at && !(m.contact_id in lastByContact)) lastByContact[m.contact_id] = m.sent_at;
        }
      }

      const { data: meetingsData } = await supabase
        .from('meetings')
        .select('id, company_id: company')
        .eq('organization_id', oid)
        .in('company', companiesData.map(c => c.name));

      const contactsByCompany: Record<string, any[]> = {};
      const meetingsByCompany: Record<string, number> = {};

      for (const c of (contactsData ?? []) as any[]) {
        if (!c.company_id) continue;
        if (!contactsByCompany[c.company_id]) contactsByCompany[c.company_id] = [];
        contactsByCompany[c.company_id].push(c);
      }
      for (const m of (meetingsData ?? []) as any[]) {
        if (!m.company_id) continue;
        meetingsByCompany[m.company_id] = (meetingsByCompany[m.company_id] ?? 0) + 1;
      }

      const rows: CompanyRow[] = companiesData.map(company => {
        const contacts = contactsByCompany[company.id] ?? [];
        let lastDays: number | null = null;
        let topName: string | null = null;
        for (const c of contacts) {
          if (!topName) topName = c.full_name;
          const lastAt = lastByContact[c.id];
          if (lastAt) {
            const days = Math.floor((Date.now() - new Date(lastAt).getTime()) / 86400000);
            if (lastDays === null || days < lastDays) lastDays = days;
          }
        }
        return {
          id: company.id,
          name: company.name,
          domain: company.domain ?? null,
          contactsCount: contacts.length,
          meetingsCount: meetingsByCompany[company.name] ?? 0,
          lastContactDays: lastDays,
          topContactName: topName,
          accountType: resolveAccountType(
            (company as any).account_type,
            (company as any).account_type_confidence,
          ),
        };
      });

      setCompanies(rows);
    } catch (e) {
      console.error('Companies load error:', e);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => { loadCompanies(); }, [loadCompanies]);

  const filtered = companies
    .filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.domain?.toLowerCase().includes(search.toLowerCase()))
    .filter(c => {
      if (typeFilter === 'all') return true;
      if (typeFilter === 'unknown') return c.accountType === null;
      return c.accountType === typeFilter;
    })
    .sort((a, b) => {
      switch (sort) {
        case 'contacts':  return b.contactsCount - a.contactsCount;
        case 'meetings':  return b.meetingsCount - a.meetingsCount;
        case 'recent':    return (a.lastContactDays ?? 9999) - (b.lastContactDays ?? 9999);
        default:          return a.name.localeCompare(b.name);
      }
    });

  const SORTS: { key: SortType; label: string }[] = [
    { key: 'contacts', label: 'Contacts' },
    { key: 'meetings', label: 'Réunions' },
    { key: 'recent',   label: 'Récents' },
    { key: 'name',     label: 'A→Z' },
  ];

  const TYPE_FILTERS: { key: TypeFilter; label: string }[] = [
    { key: 'all',                label: 'Tous types' },
    { key: 'acquisition',        label: 'Acquisition' },
    { key: 'account_management', label: 'Account mgmt' },
    { key: 'partenaire',         label: 'Partenaire' },
    { key: 'unknown',            label: 'À qualifier' },
  ];

  return (
    <div className="size-full overflow-auto" style={{ background: 'var(--color-background)' }}>
      <div className="max-w-7xl mx-auto px-4 py-5 md:px-8 md:py-8">

        {/* Header */}
        <PageHeader
          title="Comptes"
          subtitle={loading ? '…' : `${filtered.length} compte${filtered.length !== 1 ? 's' : ''}`}
          actions={
            <>
              <button
                onClick={loadCompanies}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-border bg-card rounded-xl hover:bg-muted/50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
                Actualiser
              </button>
              <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-primary text-white rounded-xl hover:bg-accent transition-colors">
                <Plus className="size-3.5" />
                Ajouter
              </button>
            </>
          }
        />

        {/* Search + filters */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-5 space-y-3"
        >
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher un compte…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Filtre Mes / Organisation + tri */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Scope toggle */}
            <div className="flex items-center rounded-xl border border-border bg-card overflow-hidden">
              <button
                onClick={() => setScope('mine')}
                className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                  scope === 'mine' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Mes comptes
              </button>
              <button
                onClick={() => setScope('org')}
                className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                  scope === 'org' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Organisation
              </button>
            </div>

            <div className="flex items-center gap-1 ml-auto">
              <Filter className="size-3.5 text-muted-foreground" />
              {SORTS.map(s => (
                <button
                  key={s.key}
                  onClick={() => setSort(s.key)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    sort === s.key
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Filtre par type de compte (spec-32) */}
          <div className="flex flex-wrap items-center gap-1.5">
            {TYPE_FILTERS.map(t => (
              <button
                key={t.key}
                onClick={() => setTypeFilter(t.key)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  typeFilter === t.key
                    ? 'bg-foreground text-white'
                    : 'text-muted-foreground hover:text-foreground bg-card border border-border'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
            <span className="text-sm">Chargement des comptes…</span>
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 gap-4 text-center"
          >
            <Building2 className="size-12 text-muted-foreground/20" />
            <div>
              <p className="font-semibold text-foreground mb-1">
                {search ? `Aucun compte pour "${search}"` : 'Aucun compte encore'}
              </p>
              <p className="text-sm text-muted-foreground">
                {search
                  ? 'Essayez une autre recherche.'
                  : 'Synchronisez votre agenda pour voir vos comptes apparaître.'}
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-2">
            {filtered.map((company, i) => {
              const accentColor = company.lastContactDays == null
                ? '#C4B8E0'
                : company.lastContactDays < 30 ? '#2EA86A'
                : company.lastContactDays < 90 ? '#C97A20'
                : '#D94F63';
              return (
              <motion.button
                key={company.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
                onClick={() => navigate(`/company/${company.id}`)}
                className="w-full text-left bg-card rounded-2xl border border-border hover:shadow-md p-4 transition-all group overflow-hidden"
                style={{ borderLeft: `3px solid ${accentColor}`, paddingLeft: 20 }}
              >
                <div className="flex items-center gap-4">
                  {/* Logo/initials */}
                  <div
                    className="size-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-black text-white"
                    style={{ background: 'linear-gradient(135deg, #6E50C8, #9747FF)' }}
                  >
                    {initials(company.name)}
                  </div>

                  {/* Name + domain */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-bold text-sm truncate group-hover:text-primary transition-colors">
                        {company.name}
                      </p>
                      {(() => {
                        const cfg = accountTypeConfig(company.accountType);
                        return (
                          <span
                            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 uppercase tracking-wide"
                            style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`, fontFamily: 'var(--mono)' }}
                            title={cfg.label}
                          >
                            {cfg.short}
                          </span>
                        );
                      })()}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {company.domain ?? company.topContactName ?? 'Aucun contact lié'}
                    </p>
                  </div>

                  {/* Metrics */}
                  <div className="hidden sm:flex items-center gap-5 flex-shrink-0">
                    {company.contactsCount > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Users className="size-3.5" />
                        <span className="font-mono font-semibold text-foreground">{company.contactsCount}</span>
                      </div>
                    )}
                    {company.meetingsCount > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="size-3.5" />
                        <span className="font-mono font-semibold text-foreground">{company.meetingsCount}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-xs">
                      <Clock className="size-3.5 text-muted-foreground" />
                      <span className={`font-mono font-semibold ${getDaysColor(company.lastContactDays)}`}>
                        {getDaysText(company.lastContactDays)}
                      </span>
                    </div>
                  </div>

                  <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                </div>
              </motion.button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
