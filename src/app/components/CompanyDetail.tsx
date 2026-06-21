import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ArrowLeft, Building2, Users, Calendar, Mail,
  Clock, Star, Loader2, AlertTriangle,
  TrendingUp, TrendingDown, Minus, RefreshCw, ChevronRight,
  Globe, Sparkles, Crown, Trophy, Puzzle, HeartPulse, Network,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../../lib/supabase';
import { getActiveOrganizationId } from '../../lib/api/org';
import { computeVerdict } from '../../lib/scoring';
import { resolveAccountType, accountTypeConfig } from '../../lib/accountType';
import VerdictCard from './knowr/VerdictCard';
import ConfidenceRing from './knowr/ConfidenceRing';
import ViewSwitcher from './knowr/ViewSwitcher';
import SignalRail, { type Signal } from './knowr/SignalRail';
import CollapsibleSection from './knowr/CollapsibleSection';
import SourcesPanel from './knowr/SourcesPanel';

// ── Types ─────────────────────────────────────────────────────────────────────
interface CompanyRow {
  id: string;
  name: string;
  domain: string | null;
  industry: string | null;
  size_label: string | null;
  public_context: Record<string, any>;
  account_type: string | null;
  account_type_confidence: number | null;
}

interface ContactRow {
  id: string;
  full_name: string;
  email: string | null;
  role_title: string | null;
  avatar_url: string | null;
  linkedin_url: string | null;
  influence_level: number | null;
  badge: string | null;
  engagement_score: number | null;
  score_phase: string | null;
  score_delta: number | null;
  global_confidence: number | null;
  last_contact_at: string | null;
}

interface MeetingRow {
  id: string;
  title: string;
  starts_at: string;
  brief_status: string;
  is_external: boolean | null;
  has_decision_maker: boolean;
}

interface BehavioralSignal {
  id: string;
  contact_id: string;
  signal_type: string;
  text: string;
  inference: string | null;
  inference_level: string;
  confidence: number;
  source_type: string;
  observed_at: string | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function relDate(iso: string): string {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d === 0) return "Aujourd'hui";
  if (d === 1) return 'Hier';
  if (d < 7) return `Il y a ${d}j`;
  if (d < 30) return `Il y a ${Math.floor(d / 7)} sem.`;
  return `Il y a ${Math.floor(d / 30)} mois`;
}

function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

function initials(name: string) {
  return name.split(/[\s\-&]+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function scoreColor(s: number | null) {
  if (s === null) return '#9082B8';
  if (s >= 70) return '#2EA86A';
  if (s >= 40) return '#6E50C8';
  return '#D94F63';
}

function PhaseIcon({ phase }: { phase: string | null }) {
  if (phase === 'growth')  return <TrendingUp  className="size-3.5 text-success" />;
  if (phase === 'decline') return <TrendingDown className="size-3.5 text-destructive" />;
  return <Minus className="size-3.5 text-muted-foreground" />;
}

// Map signal_type → SignalRail tag
const SIGNAL_TAG_MAP: Record<string, Signal['tag']> = {
  churn:      'Churn',
  risk:       'Risque',
  risque:     'Risque',
  objection:  'Risque',
  lever:      'Levier',
  levier:     'Levier',
  opportunit: 'Levier',
  job_change: 'Mobilité',
  mobility:   'Mobilité',
  mobilite:   'Mobilité',
  reseau:     'Réseau',
  network:    'Réseau',
  market:     'Marché',
  marche:     'Marché',
  growth:     'Croissance',
  croissance: 'Croissance',
  presence:   'Présence',
  linkedin:   'Présence',
};

function mapSignalTag(signal_type: string): Signal['tag'] {
  const lower = signal_type.toLowerCase();
  for (const [key, tag] of Object.entries(SIGNAL_TAG_MAP)) {
    if (lower.includes(key)) return tag;
  }
  return 'Présence';
}

// Power Map cell (Miller Heiman) — dérivé des contacts du compte
function PowerCell({ role, icon, tone, contact, note, src, onClick }: {
  role: string; icon: ReactNode; tone: string;
  contact: ContactRow; note: string; src: string; onClick: () => void;
}) {
  return (
    <button onClick={onClick}
      className="w-full text-left rounded-xl border border-border p-3 hover:bg-muted/30 transition-colors group">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ color: tone, background: `${tone}1A` }}>
          {icon} {role}
        </span>
      </div>
      <div className="flex items-center gap-2.5">
        <div className="size-8 flex-shrink-0 rounded-lg flex items-center justify-center text-xs font-bold text-white"
          style={{ background: 'linear-gradient(135deg,#6E50C8,#9747FF)' }}>
          {initials(contact.full_name)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{contact.full_name}</p>
          <p className="text-xs text-muted-foreground truncate">{contact.role_title || '—'}</p>
        </div>
        {contact.engagement_score !== null
          ? <span className="text-sm font-black font-mono" style={{ color: scoreColor(contact.engagement_score) }}>{contact.engagement_score}</span>
          : <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(201,122,32,0.12)', color: '#C97A20' }}>à confirmer</span>}
      </div>
      <p className="text-[11px] text-muted-foreground leading-snug mt-2">{note}</p>
      <p className="text-[9px] text-muted-foreground mt-1.5" style={{ fontFamily: 'var(--mono)' }}>{src}</p>
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function CompanyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [company,   setCompany]   = useState<CompanyRow | null>(null);
  const [contacts,  setContacts]  = useState<ContactRow[]>([]);
  const [meetings,  setMeetings]  = useState<MeetingRow[]>([]);
  const [signals,   setSignals]   = useState<BehavioralSignal[]>([]);
  const [emailCount30d, setEmailCount30d] = useState<number>(0);
  const [loading,   setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAllMeetings, setShowAllMeetings] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [companyEnrich, setCompanyEnrich] = useState<any | null>(null);
  const [enriching, setEnriching] = useState(false);
  const [enrichMsg, setEnrichMsg] = useState<string | null>(null);
  const [scoreHistory, setScoreHistory] = useState<{ date: string; score: number }[]>([]);
  const [firstContactAt, setFirstContactAt] = useState<string | null>(null);
  const [nextMeeting, setNextMeeting] = useState<MeetingRow | null>(null);

  const enrichCompany = async () => {
    if (!supabase || !company || enriching) return;
    setEnriching(true); setEnrichMsg(null);
    try {
      const oid = orgId ?? await getActiveOrganizationId();
      const { data, error } = await supabase.functions.invoke('enrich-agent', {
        body: { companyId: company.id, organizationId: oid, forceRefresh: true },
      });
      if (error) { setEnrichMsg('Échec — vérifie que le workflow n8n est actif.'); }
      else { if ((data as any)?.enrichment) setCompanyEnrich((data as any).enrichment); setEnrichMsg('✓ Compte enrichi'); }
    } catch { setEnrichMsg('Erreur réseau'); }
    finally { setEnriching(false); setTimeout(() => setEnrichMsg(null), 5000); }
  };

  const loadData = useCallback(async () => {
    if (!supabase || !id) { setLoading(false); return; }
    try {
      const orgId = await getActiveOrganizationId();
      if (!orgId) { setLoading(false); return; }

      // ── 1. Load company ────────────────────────────────────────────────
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      let companyData: CompanyRow | null = null;

      if (isUUID) {
        const { data } = await supabase
          .from('companies')
          .select('id, name, domain, industry, size_label, public_context, account_type, account_type_confidence, enrichment_data')
          .eq('id', id)
          .eq('organization_id', orgId)
          .maybeSingle();
        companyData = data as CompanyRow | null;
      }

      // Fallback: search by name-slug if UUID lookup failed
      if (!companyData) {
        const { data } = await supabase
          .from('companies')
          .select('id, name, domain, industry, size_label, public_context, account_type, account_type_confidence, enrichment_data')
          .eq('organization_id', orgId)
          .ilike('name', `%${decodeURIComponent(id)}%`)
          .limit(1)
          .maybeSingle();
        companyData = data as CompanyRow | null;
      }

      if (!companyData) { setLoading(false); return; }
      setCompany(companyData);
      setOrgId(orgId);
      if ((companyData as any).enrichment_data) setCompanyEnrich((companyData as any).enrichment_data);

      // ── 2. Load contacts for this company ─────────────────────────────
      const { data: rawContacts } = await supabase
        .from('contacts')
        .select('id, full_name, email, role_title, avatar_url, linkedin_url, influence_level, badge')
        .eq('company_id', companyData.id)
        .eq('organization_id', orgId)
        .is('merged_into_contact_id', null);

      const contactRows = (rawContacts ?? []) as any[];
      const contactIds = contactRows.map(c => c.id);

      // ── 3. Load cognitive profiles for contacts ────────────────────────
      let profileMap: Record<string, any> = {};
      if (contactIds.length) {
        const { data: profiles } = await supabase
          .from('cognitive_profiles')
          .select('contact_id, engagement_score, score_phase, score_delta, global_confidence')
          .in('contact_id', contactIds)
          .eq('organization_id', orgId)
          .order('profile_version', { ascending: false });

        for (const p of (profiles ?? []) as any[]) {
          if (!profileMap[p.contact_id]) profileMap[p.contact_id] = p;
        }
      }

      // ── 4. Last contact date per contact (latest email or meeting) ─────
      let lastContactMap: Record<string, string> = {};
      if (contactIds.length) {
        const since30 = new Date(Date.now() - 30 * 86400000).toISOString();

        const [{ data: msgs }, { data: meetParts }] = await Promise.all([
          supabase
            .from('communication_messages')
            .select('contact_id, sent_at')
            .eq('organization_id', orgId)
            .in('contact_id', contactIds)
            .order('sent_at', { ascending: false }),
          supabase
            .from('meeting_participants')
            .select('contact_id, meetings(starts_at)')
            .eq('organization_id', orgId)
            .in('contact_id', contactIds),
        ]);

        // emails 30d count
        const recent = (msgs ?? []).filter((m: any) => m.sent_at && m.sent_at > since30);
        setEmailCount30d(recent.length);

        for (const m of (msgs ?? []) as any[]) {
          if (!lastContactMap[m.contact_id] || m.sent_at > lastContactMap[m.contact_id]) {
            lastContactMap[m.contact_id] = m.sent_at;
          }
        }
        for (const mp of (meetParts ?? []) as any[]) {
          const sa = mp.meetings?.starts_at;
          if (sa && (!lastContactMap[mp.contact_id] || sa > lastContactMap[mp.contact_id])) {
            lastContactMap[mp.contact_id] = sa;
          }
        }

        // 1er contact observé (plus ancien email du compte)
        const oldest = (msgs ?? []).reduce<string | null>((min, m: any) =>
          m.sent_at && (!min || m.sent_at < min) ? m.sent_at : min, null);
        setFirstContactAt(oldest);
      }

      // ── 4b. Historique de score du compte (agrégé par mois) ────────────
      if (contactIds.length) {
        const { data: hist } = await supabase
          .from('contact_score_history')
          .select('score, snapshot_date')
          .eq('organization_id', orgId)
          .in('contact_id', contactIds)
          .order('snapshot_date', { ascending: true });

        const byDate: Record<string, { sum: number; n: number }> = {};
        for (const h of (hist ?? []) as any[]) {
          if (typeof h.score !== 'number') continue;
          const d = h.snapshot_date as string;
          (byDate[d] ??= { sum: 0, n: 0 });
          byDate[d].sum += h.score; byDate[d].n += 1;
        }
        setScoreHistory(
          Object.entries(byDate)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([d, { sum, n }]) => ({
              date: new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
              score: Math.round(sum / n),
            })),
        );
      }

      const enrichedContacts: ContactRow[] = contactRows.map(c => ({
        ...c,
        engagement_score:  profileMap[c.id]?.engagement_score  ?? null,
        score_phase:       profileMap[c.id]?.score_phase       ?? null,
        score_delta:       profileMap[c.id]?.score_delta       ?? null,
        global_confidence: profileMap[c.id]?.global_confidence ?? null,
        last_contact_at:   lastContactMap[c.id]                ?? null,
      }));

      setContacts(enrichedContacts.sort((a, b) => (b.engagement_score ?? 0) - (a.engagement_score ?? 0)));

      // ── 5. Load meetings for company ───────────────────────────────────
      const { data: mtgs } = await supabase
        .from('meetings')
        .select('id, title, starts_at, brief_status, is_external, has_decision_maker')
        .eq('company_id', companyData.id)
        .eq('organization_id', orgId)
        .order('starts_at', { ascending: false })
        .limit(20);

      const meetingRows = (mtgs ?? []) as MeetingRow[];
      setMeetings(meetingRows);
      const now = Date.now();
      const upcoming = meetingRows
        .filter(m => m.starts_at && new Date(m.starts_at).getTime() > now)
        .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
      setNextMeeting(upcoming[0] ?? null);

      // ── 6. Load behavioral signals for all contacts ────────────────────
      if (contactIds.length) {
        const { data: sigs } = await supabase
          .from('behavioral_signals')
          .select('id, contact_id, signal_type, text, inference, inference_level, confidence, source_type, observed_at')
          .eq('organization_id', orgId)
          .in('contact_id', contactIds)
          .order('observed_at', { ascending: false })
          .limit(24);

        setSignals((sigs ?? []) as BehavioralSignal[]);
      }

    } catch (e) {
      console.error('CompanyDetail load error:', e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Derived values ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="size-full flex items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="size-5 animate-spin text-primary" />
          <span>Chargement du compte…</span>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="size-full flex flex-col items-center justify-center gap-4">
        <AlertTriangle className="size-10 text-warning" />
        <p className="text-muted-foreground">Compte introuvable.</p>
        <button onClick={() => navigate('/companies')} className="text-primary text-sm underline">
          Retour aux Comptes
        </button>
      </div>
    );
  }

  // Compute company-level metrics
  const scores = contacts.map(c => c.engagement_score).filter((s): s is number => s !== null);
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
  const minScore = scores.length ? Math.min(...scores) : null;

  const confidences = contacts.map(c => c.global_confidence).filter((s): s is number => s !== null);
  const avgConfidence = confidences.length
    ? Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length)
    : null;

  // Last contact = min days across all contacts
  const allLastDates = contacts.map(c => c.last_contact_at).filter(Boolean) as string[];
  const lastContactAt = allLastDates.length ? allLastDates.reduce((a, b) => a > b ? a : b) : null;
  const lastContactDays = daysSince(lastContactAt);

  // Type de compte effectif (spec-32, seuil τ appliqué)
  const accountType = resolveAccountType(company.account_type, company.account_type_confidence);
  const typeCfg = accountTypeConfig(accountType);

  // Pénétration (spec-28 §3) + site web (spec-33) — lus dans public_context (sourcé, jamais inventé)
  const pubCtx: Record<string, any> = company.public_context ?? {};
  const headcount: number | null =
    typeof pubCtx.headcount === 'number' ? pubCtx.headcount
    : typeof pubCtx.effectif === 'number' ? pubCtx.effectif
    : null;
  const headcountSource: string | null = pubCtx.headcount_source ?? pubCtx.effectif_source ?? null;
  const knownContacts = contacts.length;
  const penetrationPct = headcount && headcount > 0
    ? Math.min(100, Math.round((knownContacts / headcount) * 100))
    : null;

  const webDescription: string | null = typeof pubCtx.description === 'string' ? pubCtx.description : null;
  const webInsights: string[] = Array.isArray(pubCtx.insights) ? pubCtx.insights : [];
  const webProvenance = pubCtx.web_provenance ?? null; // { pages, date }
  const hasWebData = Boolean(webDescription || webInsights.length);

  // Verdict: computed from min (most at-risk) score + company signals, modulé par le type (spec-32)
  const verdictInput = minScore ?? avgScore;
  const verdictSignals = signals.map(s => ({ signal_type: s.signal_type }));
  const verdict = computeVerdict(verdictInput, lastContactDays, verdictSignals, null, accountType);

  // Rail signals from behavioral_signals
  const railSignals: Signal[] = signals.slice(0, 8).map(s => ({
    tag: mapSignalTag(s.signal_type),
    text: s.text,
    source: s.source_type,
    date: s.observed_at ? relDate(s.observed_at) : undefined,
    provenance: (s.inference_level === 'observable' ? 'observable'
      : s.inference_level === 'inferred' ? 'inferred' : 'public') as Signal['provenance'],
  }));

  // ── Santé relationnelle du compte (dérivée des données réelles) ─────────
  const activeContacts = contacts.filter(c => {
    const d = daysSince(c.last_contact_at);
    return d !== null && d <= 30;
  });
  const coverage = activeContacts.length <= 1
    ? { value: 'Mono-thread', note: activeContacts.length === 1
        ? `Un seul contact actif (${activeContacts[0].full_name.split(' ')[0]}). Identifier un relais interne sécurise le compte.`
        : 'Aucun contact actif sur 30 j. Réactiver un interlocuteur clé.', tone: 'warn' as const }
    : { value: `Multi-contacts · ${activeContacts.length}`,
        note: `${activeContacts.length} interlocuteurs actifs — couverture saine du compte.`, tone: 'ok' as const };

  const nature = meetings.length > 0 && emailCount30d > 0
    ? { value: 'Multi-canal', note: 'Réunions + échanges email récents — relation suivie sur plusieurs canaux.' }
    : meetings.length > 0
      ? { value: 'Rythmée par les RDV', note: 'Relation portée par les réunions. Maintenir le fil email entre deux RDV.' }
      : emailCount30d > 0
        ? { value: 'Transactionnelle', note: 'Échanges email centrés sur l’exécution — ouvrir un sujet « produit ».' }
        : { value: 'En veille', note: 'Pas d’échange récent — relancer pour rouvrir le canal.' };

  const nextContact = nextMeeting
    ? { value: nextMeeting.title || 'RDV à venir', note: `Prochaine réunion le ${new Date(nextMeeting.starts_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}.` }
    : { value: 'À planifier', note: 'Aucun RDV à venir. Proposer un prochain point pour entretenir la relation.' };

  // ── Power Map · qui décide (Miller Heiman, dérivé des contacts) ─────────
  const rankedContacts = [...contacts].sort((a, b) =>
    (b.influence_level ?? 0) - (a.influence_level ?? 0) ||
    (b.engagement_score ?? 0) - (a.engagement_score ?? 0));
  const economicBuyer = rankedContacts[0] ?? null;
  const champion = rankedContacts.find(c => (c.engagement_score ?? 0) >= 50 && c.id !== economicBuyer?.id) ?? null;
  const toQualify = rankedContacts.filter(c =>
    c.id !== economicBuyer?.id && c.id !== champion?.id).slice(0, 2);

  const visibleMeetings = showAllMeetings ? meetings : meetings.slice(0, 4);

  const daysText = (d: number | null) => {
    if (d === null) return '—';
    if (d === 0) return "Auj.";
    if (d === 1) return 'Hier';
    if (d < 7) return `${d}j`;
    if (d < 30) return `${Math.floor(d / 7)}sem`;
    return `${Math.floor(d / 30)}m`;
  };

  const daysColor = (d: number | null) => {
    if (d === null) return 'text-muted-foreground';
    if (d <= 7) return 'text-success';
    if (d <= 30) return 'text-amber-600';
    return 'text-destructive';
  };

  return (
    <div className="size-full overflow-auto" style={{ background: 'var(--color-background)' }}>
      <div className="max-w-6xl mx-auto px-4 py-6 md:px-8">

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-5"
        >
          <ArrowLeft className="size-4" /> Retour
        </button>

        {/* Commutateur de vue Réunion · Personne · Compte (spec-25 §B) */}
        <div className="flex justify-center mb-4">
          <ViewSwitcher
            active="compte"
            meetingId={meetings[0]?.id ?? null}
            contacts={contacts.map(c => ({ id: c.id, name: c.full_name, role: c.role_title }))}
            companyId={company.id}
          />
        </div>

        {/* ══ HERO DARK ════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl overflow-hidden mb-4"
          style={{ background: '#13111E' }}
        >
          <div className="p-6 flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
            {/* Logo */}
            <div
              className="size-16 flex-shrink-0 rounded-xl flex items-center justify-center text-xl font-black text-white"
              style={{ background: 'linear-gradient(135deg, #6E50C8, #9747FF)' }}
            >
              {initials(company.name)}
            </div>

            {/* Name + meta */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-black leading-tight" style={{ color: '#fff' }}>
                  {company.name}
                </h1>
                {/* Pastille type de compte (spec-32) */}
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
                  style={{
                    color: accountType ? '#fff' : 'rgba(255,255,255,0.5)',
                    background: accountType ? typeCfg.color : 'rgba(255,255,255,0.08)',
                    fontFamily: 'var(--mono)',
                  }}
                  title={typeCfg.label}
                >
                  {typeCfg.label}
                </span>
              </div>
              <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {[company.industry, company.size_label, company.domain].filter(Boolean).join(' · ')}
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-2.5">
                {company.domain && (
                  <a
                    href={`https://${company.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs transition-colors"
                    style={{ color: 'rgba(255,255,255,0.35)' }}
                  >
                    <Globe className="size-3" /> {company.domain}
                  </a>
                )}
                {contacts.length > 0 && (
                  <span className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    <Users className="size-3" /> {contacts.length} contact{contacts.length > 1 ? 's' : ''}
                  </span>
                )}
                {lastContactAt && (
                  <span className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    <Clock className="size-3" /> {relDate(lastContactAt)}
                  </span>
                )}
              </div>
            </div>

            {/* Hero canonique = 3 blocs : Score · Confiance · Dernier contact (doctrine #4) */}
            <div className="flex items-center gap-5 flex-shrink-0">
              {/* Bloc 1 — Score moyen */}
              {avgScore !== null && (
                <>
                  <div className="text-center">
                    <p className="text-[9px] font-bold uppercase tracking-widest mb-1"
                      style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--mono)' }}>Score moy.</p>
                    <p className="text-4xl font-black leading-none" style={{ color: scoreColor(avgScore) }}>{avgScore}</p>
                    <p className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--mono)' }}>/100</p>
                  </div>
                  <div className="w-px h-10" style={{ background: 'rgba(255,255,255,0.08)' }} />
                </>
              )}

              {/* Bloc 2 — Confiance (anneau %) */}
              {avgConfidence !== null && (
                <>
                  <ConfidenceRing value={avgConfidence} size={48} dark />
                  <div className="w-px h-10" style={{ background: 'rgba(255,255,255,0.08)' }} />
                </>
              )}

              {/* Bloc 3 — Dernier contact */}
              <div className="text-center">
                <p className="text-[9px] font-bold uppercase tracking-widest mb-1"
                  style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--mono)' }}>Dernier contact</p>
                <p className="text-sm font-semibold" style={{ color: '#fff' }}>
                  {lastContactAt ? relDate(lastContactAt) : '—'}
                </p>
                <p className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--mono)' }}>
                  {meetings.length} réunion{meetings.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Metrics bar */}
          <div className="px-6 pb-4 flex items-center gap-4 flex-wrap">
            {[
              { label: 'Emails 30j',   value: emailCount30d, icon: Mail },
              { label: 'Contacts',     value: contacts.length, icon: Users },
              { label: 'Réunions',     value: meetings.length, icon: Calendar },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(110,80,200,0.2)', color: '#B39DDB', border: '1px solid rgba(110,80,200,0.3)' }}>
                  <Icon className="size-3 inline mr-1" />{value} {label}
                </span>
              </div>
            ))}
            <button
              onClick={async () => {
                setRefreshing(true);
                try { await loadData(); } finally { setRefreshing(false); }
              }}
              disabled={refreshing}
              className="ml-auto flex items-center gap-1.5 text-[11px] font-semibold transition-all cursor-pointer"
              style={{
                color: refreshing ? 'rgba(212,197,245,0.4)' : 'rgba(212,197,245,0.75)',
                background: 'rgba(110,80,200,0.18)',
                border: '1px solid rgba(110,80,200,0.3)',
                borderRadius: 8,
                padding: '4px 10px',
              }}
            >
              {refreshing
                ? <Loader2 className="size-3.5 animate-spin" />
                : <RefreshCw className="size-3.5" />}
              Actualiser
            </button>
            <button
              onClick={enrichCompany}
              disabled={enriching}
              className="flex items-center gap-1.5 text-[11px] font-semibold transition-all cursor-pointer"
              style={{ color: '#fff', background: '#6E50C8', border: '1px solid #6E50C8', borderRadius: 8, padding: '4px 10px', opacity: enriching ? 0.6 : 1 }}
              title="Recherche IA approfondie (OpenRouter + Perplexity)"
            >
              {enriching ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
              {enriching ? 'Recherche…' : 'Enrichir (IA)'}
            </button>
            {enrichMsg && <span className="text-[11px]" style={{ color: enrichMsg.startsWith('✓') ? '#96DDB8' : '#F0A0AD' }}>{enrichMsg}</span>}
          </div>
        </motion.div>

        {/* ══ LAYOUT: MAIN + ASIDE ════════════════════════════════════════ */}
        <div className="flex flex-col lg:flex-row gap-5">

          {/* ── MAIN COL ─────────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-4">

            {/* SOURCES CONNECTÉES (hsrc) */}
            <SourcesPanel
              organizationId={orgId}
              hasPublicData={Boolean(companyEnrich || hasWebData)}
              provenanceNote={
                companyEnrich || hasWebData
                  ? 'Firmographie via sources publiques (Pappers · Societe.com · LinkedIn). Relation opérationnelle via la messagerie.'
                  : 'Relation suivie via la messagerie. Enrichir (IA) pour capter la firmographie publique.'
              }
            />

            {/* LEVIER STRATÉGIQUE (depuis l'enrichissement IA) */}
            {companyEnrich?.summary && (
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl overflow-hidden" style={{ background: '#13111E' }}
              >
                <div className="px-5 pt-4 pb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[9px] font-bold uppercase tracking-widest"
                      style={{ color: 'rgba(255,255,255,0.3)' }}>🎯 Levier stratégique</span>
                    <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                  </div>
                  <p className="text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.82)', fontStyle: 'italic' }}>
                    "{companyEnrich.summary}"
                  </p>
                </div>
              </motion.div>
            )}

            {/* MÉMOIRE RELATIONNELLE DU COMPTE (courbe de score) */}
            {(scoreHistory.length > 1 || avgScore !== null) && (
              <CollapsibleSection
                title="Mémoire relationnelle du compte"
                icon={<TrendingUp className="size-4" />}
                defaultOpen={true}
              >
                {/* Métriques */}
                <div className="flex items-center gap-5 mb-4 flex-wrap">
                  {avgScore !== null && (
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Score compte</p>
                      <span className="text-3xl font-black" style={{ color: scoreColor(avgScore) }}>{avgScore}</span>
                    </div>
                  )}
                  {firstContactAt && (
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Début relation</p>
                      <p className="text-sm font-semibold text-foreground">
                        {new Date(firstContactAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      <p className="text-[10px] text-muted-foreground">1ᵉʳ échange observé</p>
                    </div>
                  )}
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Dossiers</p>
                    <p className="text-sm font-semibold text-foreground">{meetings.length || contacts.length}</p>
                    <p className="text-[10px] text-muted-foreground">{meetings.length ? 'réunions' : 'contacts suivis'}</p>
                  </div>
                </div>

                {scoreHistory.length > 1 ? (
                  <>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Score relationnel du compte</p>
                    <ResponsiveContainer width="100%" height={150}>
                      <AreaChart data={scoreHistory} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                        <defs>
                          <linearGradient id="coScoreGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#6E50C8" stopOpacity={0.35} />
                            <stop offset="100%" stopColor="#6E50C8" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9082B8' }} axisLine={false} tickLine={false} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#9082B8' }} axisLine={false} tickLine={false} width={32} />
                        <Tooltip
                          contentStyle={{ borderRadius: 12, border: '1px solid #E8E3F5', fontSize: 12 }}
                          formatter={(v: any) => [`${v}/100`, 'Score']}
                        />
                        <Area type="monotone" dataKey="score" stroke="#6E50C8" strokeWidth={2.5} fill="url(#coScoreGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <span className="size-2 rounded-full" style={{ background: '#2EA86A' }} /> Étape positive
                      </span>
                      <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <span className="size-2 rounded-full" style={{ background: '#D94F63' }} /> Friction
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="rounded-xl border border-dashed border-border p-4 text-center">
                    <p className="text-xs text-muted-foreground">
                      Courbe de score — historique en cours de constitution (un point par mois d’activité).
                    </p>
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground mt-3" style={{ fontFamily: 'var(--mono)' }}>
                  Messagerie · Observable — recalculé à chaque synchro
                </p>
              </CollapsibleSection>
            )}

            {/* SANTÉ RELATIONNELLE DU COMPTE (diagnostics dérivés) */}
            <CollapsibleSection
              title="Santé relationnelle du compte"
              icon={<HeartPulse className="size-4" />}
              defaultOpen={true}
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { lbl: 'Couverture du compte', ...coverage, src: 'Messagerie · Observable' },
                  { lbl: 'Nature de la relation', ...nature, tone: 'ok' as const, src: 'Messagerie · Observable' },
                  { lbl: 'Prochain contact', ...nextContact, tone: (nextMeeting ? 'ok' : 'warn') as const, src: nextMeeting ? 'Agenda · Observable' : 'Inféré' },
                ].map((d: any) => (
                  <div key={d.lbl} className="rounded-xl border border-border bg-muted/20 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5" style={{ fontFamily: 'var(--mono)' }}>{d.lbl}</p>
                    <p className="text-sm font-bold mb-1"
                      style={{ color: d.tone === 'warn' ? '#C97A20' : d.tone === 'ok' ? '#2EA86A' : 'var(--color-foreground)' }}>
                      {d.value}
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-snug mb-2">{d.note}</p>
                    <p className="text-[9px] text-muted-foreground" style={{ fontFamily: 'var(--mono)' }}>{d.src}</p>
                  </div>
                ))}
              </div>
            </CollapsibleSection>

            {/* POWER MAP · QUI DÉCIDE (Miller Heiman, dérivé) */}
            {contacts.length > 0 && (
              <CollapsibleSection
                title="Power Map · qui décide"
                icon={<Network className="size-4" />}
                defaultOpen={false}
              >
                <div className="space-y-2.5">
                  {economicBuyer && (
                    <PowerCell
                      role="Economic Buyer" icon={<Crown className="size-3.5" />} tone="#C97A20"
                      contact={economicBuyer}
                      note="Contact le plus influent et engagé du compte — point d’entrée pour décider et signer."
                      src={economicBuyer.engagement_score !== null ? 'Messagerie · Observable' : 'Inféré'}
                      onClick={() => navigate(`/contact/${economicBuyer.id}`)}
                    />
                  )}
                  {champion && (
                    <PowerCell
                      role="Champion" icon={<Trophy className="size-3.5" />} tone="#2EA86A"
                      contact={champion}
                      note="Relation chaude — relais interne pour porter le sujet."
                      src="Messagerie · Observable"
                      onClick={() => navigate(`/contact/${champion.id}`)}
                    />
                  )}
                  {toQualify.map(c => (
                    <PowerCell
                      key={c.id}
                      role="À qualifier" icon={<Puzzle className="size-3.5" />} tone="#9082B8"
                      contact={c}
                      note={c.engagement_score === null
                        ? 'Aucun échange direct observé — rôle à confirmer en RDV.'
                        : 'Co-décideur possible — statut à clarifier.'}
                      src={c.engagement_score === null ? 'Mention · cc' : 'Messagerie · Observable'}
                      onClick={() => navigate(`/contact/${c.id}`)}
                    />
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {/* SITE WEB & DESCRIPTION ENTREPRISE (spec-33) */}
            <CollapsibleSection
              title="Site web & description entreprise"
              icon={<Globe className="size-4" />}
              defaultOpen={hasWebData}
            >
              {company.domain ? (
                <a
                  href={`https://${company.domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline mb-3"
                >
                  <Globe className="size-3.5" /> {company.domain}
                </a>
              ) : (
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-3"
                  style={{ background: 'rgba(201,122,32,0.12)', color: '#C97A20', fontFamily: 'var(--mono)' }}>
                  À CAPTER
                </span>
              )}

              {hasWebData ? (
                <>
                  {webDescription && (
                    <div className="rounded-xl border border-border bg-muted/20 p-4 mb-3">
                      <p className="text-sm text-foreground leading-relaxed">{webDescription}</p>
                    </div>
                  )}
                  {webInsights.length > 0 && (
                    <ul className="space-y-1.5 mb-3">
                      {webInsights.map((insight, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="text-primary mt-0.5">›</span>
                          <span>{insight}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="text-[11px] text-muted-foreground italic mb-2">
                    Ces insights nourrissent la fiche et adaptent les briefs de réunion.
                  </p>
                  {webProvenance && (
                    <p className="text-[10px] text-muted-foreground" style={{ fontFamily: 'var(--mono)' }}>
                      Source : site officiel
                      {webProvenance.pages ? ` · ${webProvenance.pages} pages` : ''}
                      {webProvenance.date ? ` · ${webProvenance.date}` : ''}
                    </p>
                  )}
                </>
              ) : (
                <div className="text-center py-6">
                  <Globe className="size-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Site web pas encore capté. La description sera générée à l'ingestion (spec-33).
                  </p>
                </div>
              )}
            </CollapsibleSection>

            {/* RECHERCHE IA (agent n8n) */}
            {companyEnrich && (
              <CollapsibleSection title="Recherche IA" icon={<Sparkles className="size-4" />} defaultOpen={true}>
                <div className="space-y-4">
                  {companyEnrich.summary && (
                    <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">{companyEnrich.summary}</p>
                  )}
                  {companyEnrich.company && (companyEnrich.company.industry || companyEnrich.company.size || companyEnrich.company.hq) && (
                    <p className="text-xs" style={{ color: 'var(--t3, #9082B8)' }}>
                      {[companyEnrich.company.industry, companyEnrich.company.size, companyEnrich.company.hq].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  {Array.isArray(companyEnrich.company?.recentNews) && companyEnrich.company.recentNews.length > 0 && (
                    <div>
                      <p className="text-[11px] font-mono uppercase tracking-wide mb-1.5" style={{ color: 'var(--t3, #9082B8)' }}>Actualités récentes</p>
                      <div className="space-y-1.5">
                        {companyEnrich.company.recentNews.slice(0, 6).map((a: any, i: number) => (
                          <a key={i} href={a.url || undefined} target="_blank" rel="noreferrer" className="block text-sm rounded-lg border border-border px-3 py-2 hover:bg-muted/30 transition-colors">
                            {a.title}<span className="text-[11px] text-muted-foreground">{a.date ? ` · ${a.date}` : ''}{a.source ? ` · ${a.source}` : ''}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  {Array.isArray(companyEnrich.relatedPeople) && companyEnrich.relatedPeople.length > 0 && (
                    <div>
                      <p className="text-[11px] font-mono uppercase tracking-wide mb-1.5" style={{ color: 'var(--t3, #9082B8)' }}>Personnes clés</p>
                      <div className="space-y-1.5">
                        {companyEnrich.relatedPeople.slice(0, 8).map((p: any, i: number) => (
                          <div key={i} className="text-sm rounded-lg border border-border px-3 py-2">
                            <span className="font-semibold">{p.name}</span>{p.role ? <span className="text-muted-foreground"> · {p.role}</span> : null}
                            {p.why && <p className="text-xs text-muted-foreground mt-0.5">{p.why}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {Array.isArray(companyEnrich.talkingPoints) && companyEnrich.talkingPoints.length > 0 && (
                    <div>
                      <p className="text-[11px] font-mono uppercase tracking-wide mb-1.5" style={{ color: 'var(--t3, #9082B8)' }}>Angles d'approche</p>
                      <ul className="space-y-1">
                        {companyEnrich.talkingPoints.slice(0, 5).map((t: string, i: number) => (
                          <li key={i} className="text-sm flex gap-2"><span style={{ color: 'var(--violet, #6E50C8)' }}>›</span><span>{t}</span></li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {Array.isArray(companyEnrich.sources) && companyEnrich.sources.length > 0 && (
                    <p className="text-[11px] text-muted-foreground break-all">
                      Sources : {companyEnrich.sources.slice(0, 6).map((s: string, i: number) => (
                        <a key={i} href={s} target="_blank" rel="noreferrer" className="underline mr-2" style={{ color: 'var(--violet, #6E50C8)' }}>[{i + 1}]</a>
                      ))}
                    </p>
                  )}
                </div>
              </CollapsibleSection>
            )}

            {/* CONTACTS */}
            <CollapsibleSection
              title="Contacts"
              icon={<Users className="size-4" />}
              badge={contacts.length > 0 ? String(contacts.length) : undefined}
              defaultOpen={true}
            >
              {/* Pénétration du compte (spec-28 §3) */}
              {knownContacts > 0 && (
                <div className="mb-4 rounded-xl border border-border bg-muted/20 p-3">
                  <div className="flex items-baseline justify-between mb-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground" style={{ fontFamily: 'var(--mono)' }}>
                      Pénétration du compte
                    </p>
                    <p className="text-xs font-mono font-semibold text-foreground">
                      {penetrationPct !== null
                        ? `${knownContacts}/${headcount} · ${penetrationPct}%`
                        : `${knownContacts} connu${knownContacts > 1 ? 's' : ''}`}
                    </p>
                  </div>
                  {penetrationPct !== null ? (
                    <>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: '#E8EBF0' }}>
                        <motion.div
                          initial={{ width: 0 }} animate={{ width: `${penetrationPct}%` }}
                          transition={{ duration: 0.9, ease: 'easeOut' }}
                          className="h-full rounded-full"
                          style={{ background: 'linear-gradient(90deg, #D4C5F5, #6E50C8)' }}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1.5" style={{ fontFamily: 'var(--mono)' }}>
                        Effectif total : {headcountSource ?? 'source à confirmer'}
                      </p>
                    </>
                  ) : (
                    <p className="text-[11px] text-muted-foreground">
                      Effectif total à confirmer (presse / Société.info / connecteur) pour calculer le % de couverture.
                    </p>
                  )}
                </div>
              )}

              {contacts.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="size-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Aucun contact associé à ce compte.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {contacts.map((c, i) => {
                    const days = daysSince(c.last_contact_at);
                    return (
                      <motion.button
                        key={c.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        onClick={() => navigate(`/contact/${c.id}`)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/30 transition-colors text-left border border-border group"
                      >
                        {/* Avatar */}
                        {c.avatar_url ? (
                          <img src={c.avatar_url} alt={c.full_name}
                            className="size-9 rounded-lg object-cover flex-shrink-0" />
                        ) : (
                          <div className="size-9 flex-shrink-0 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                            style={{ background: 'linear-gradient(135deg,#6E50C8,#9747FF)' }}>
                            {initials(c.full_name)}
                          </div>
                        )}

                        {/* Name + role */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                              {c.full_name}
                            </p>
                            {(c.influence_level ?? 0) >= 4 && (
                              <Star className="size-3 fill-primary text-primary flex-shrink-0" />
                            )}
                            {c.badge && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                                style={{ background: 'rgba(110,80,200,0.12)', color: '#6E50C8' }}>
                                {c.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{c.role_title || '—'}</p>
                        </div>

                        {/* Score + last contact */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                          {c.engagement_score !== null && (
                            <div className="flex items-center gap-1">
                              <PhaseIcon phase={c.score_phase ?? null} />
                              <span className="text-sm font-black font-mono"
                                style={{ color: scoreColor(c.engagement_score) }}>
                                {c.engagement_score}
                              </span>
                            </div>
                          )}
                          <span className={`text-xs font-mono font-semibold ${daysColor(days)}`}>
                            {daysText(days)}
                          </span>
                        </div>

                        <ChevronRight className="size-4 text-muted-foreground flex-shrink-0" />
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </CollapsibleSection>

            {/* RÉUNIONS */}
            <CollapsibleSection
              title="Réunions"
              icon={<Calendar className="size-4" />}
              badge={meetings.length > 0 ? String(meetings.length) : undefined}
              defaultOpen={true}
            >
              {meetings.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="size-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Aucune réunion enregistrée.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {visibleMeetings.map(m => (
                      <button
                        key={m.id}
                        onClick={() => navigate(`/meeting/${m.id}`)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/30 transition-colors text-left border border-border group"
                      >
                        <div className="size-8 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: 'rgba(11,136,120,0.1)', color: '#0B8878' }}>
                          <Calendar className="size-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                            {m.title || 'Réunion'}
                          </p>
                          <p className="text-xs text-muted-foreground">{relDate(m.starts_at)}</p>
                        </div>
                        {m.has_decision_maker && (
                          <Star className="size-3 fill-primary text-primary flex-shrink-0" />
                        )}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${
                          m.brief_status === 'ready' ? 'bg-success/10 text-success' :
                          m.brief_status === 'generating' ? 'bg-primary/10 text-primary' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {m.brief_status === 'ready' ? 'Brief prêt' :
                           m.brief_status === 'generating' ? 'En génération' : 'À générer'}
                        </span>
                        <ChevronRight className="size-4 text-muted-foreground flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                  {meetings.length > 4 && (
                    <button
                      onClick={() => setShowAllMeetings(v => !v)}
                      className="mt-3 w-full text-xs text-primary font-medium hover:underline"
                    >
                      {showAllMeetings ? 'Réduire' : `Voir les ${meetings.length - 4} précédentes`}
                    </button>
                  )}
                </>
              )}
            </CollapsibleSection>

            {/* MÉTRIQUES RELATIONNELLES */}
            {(avgScore !== null || emailCount30d > 0) && (
              <CollapsibleSection
                title="Métriques relationnelles"
                icon={<TrendingUp className="size-4" />}
                defaultOpen={false}
              >
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Score moyen',     value: avgScore !== null ? `${avgScore}/100` : '—', color: scoreColor(avgScore) },
                    { label: 'Emails 30j',      value: String(emailCount30d), color: '#6E50C8' },
                    { label: 'Réunions',        value: String(meetings.length), color: '#0B8878' },
                    { label: 'Contacts actifs', value: `${contacts.filter(c => daysSince(c.last_contact_at) !== null && (daysSince(c.last_contact_at) ?? 999) <= 30).length}/${contacts.length}`, color: '#C97A20' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="bg-muted/30 rounded-xl border border-border p-3 text-center">
                      <p className="text-2xl font-black" style={{ color }}>{value}</p>
                      <p className="text-[11px] text-muted-foreground mt-1">{label}</p>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}
          </div>

          {/* ── SIGNAL RAIL ──────────────────────────────────────────────── */}
          <aside className="lg:w-64 xl:w-72 flex-shrink-0">
            <div className="lg:sticky lg:top-6 space-y-0">

              {/* VerdictCard en tête du rail */}
              <AnimatePresence>
                {verdict && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <VerdictCard
                      {...verdict}
                      onAction={() => navigate('/meetings')}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* SignalRail — faits atomiques */}
              <SignalRail
                signals={railSignals}
                title={`Signaux · ${company.name}`}
              />

              {/* Carte récap compte */}
              <div className="mt-4 rounded-2xl border border-border bg-card p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                  Fiche Compte
                </p>
                <div className="space-y-2">
                  {[
                    { label: 'Secteur',    value: company.industry    ?? '—' },
                    { label: 'Taille',     value: company.size_label  ?? '—' },
                    { label: 'Domaine',    value: company.domain      ?? '—' },
                    { label: 'Contacts',   value: String(contacts.length) },
                    { label: 'Réunions',   value: String(meetings.length) },
                    { label: 'Dernier contact', value: daysText(lastContactDays) },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-mono font-semibold text-foreground truncate max-w-[120px] text-right">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
