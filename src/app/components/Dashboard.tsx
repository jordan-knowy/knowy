import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Calendar, Sparkles, Plus, AlertCircle,
  CheckCircle2, Loader2, Activity, Zap, Database,
  UserCheck, TrendingUp, Cake, Briefcase, ArrowUp,
  Target, Network, Users, Star, RefreshCcw, Mail,
  Building2, ArrowRight, Clock, Search, Shield, Check, X,
  TrendingDown,
} from 'lucide-react';
import KnowrCard from './knowr/KnowrCard';
import KnowrButton from './knowr/KnowrButton';
import KnowrBadge from './knowr/KnowrBadge';
import { useCurrentProfile } from '../../hooks/useCurrentProfile';
import { useMeetings } from '../../hooks/useMeetings';
import { supabase } from '../../lib/supabase';
import { getActiveOrganizationId } from '../../lib/api/org';
import type { Meeting as DomainMeeting } from '../../types/domain';
import { computeVerdict, type VerdictData } from '../../lib/scoring';
import { resolveAccountType } from '../../lib/accountType';
import GlobalSearch from './knowr/GlobalSearch';

// Posture → chip (spec-30/31)
const POSTURE_CHIP: Record<string, { label: string; color: string; bg: string }> = {
  defend:      { label: 'à défendre',  color: '#D94F63', bg: 'rgba(217,79,99,0.10)' },
  capitaliser: { label: 'capitaliser', color: '#6E50C8', bg: 'rgba(110,80,200,0.10)' },
  derisquer:   { label: 'dé-risquer',  color: '#C97A20', bg: 'rgba(201,122,32,0.10)' },
};

interface PortfolioItem {
  id: string;
  name: string;
  subtitle: string | null;     // secteur / domaine
  lastDays: number | null;
  contactsCount: number;
  npsScore: number | null;     // score relationnel 0-100 (moyenne contacts)
  trend: number;               // delta moyen (tendance)
  verdict: VerdictData | null;
}

interface NpsData {
  avgScore: number;     // capital relationnel 0-100 (moyenne)
  value: number;        // NPS %promoteurs − %détracteurs (−100..100)
  promoters: number;
  passives: number;
  detractors: number;
  count: number;
}

// Carte d'action « Cette semaine · à faire » (maquette)
function ActionCard({ eyebrow, eyebrowColor, icon, iconBg, iconColor, title, desc, cta, onClick }: {
  eyebrow: string; eyebrowColor: string; icon: React.ReactNode; iconBg: string; iconColor: string;
  title: string; desc: string; cta: string; onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="text-left rounded-2xl border border-border bg-card p-5 hover:border-primary/30 hover:shadow-sm transition-all group flex flex-col">
      <div className="size-10 rounded-xl flex items-center justify-center mb-4" style={{ background: iconBg, color: iconColor }}>
        {icon}
      </div>
      <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: eyebrowColor, fontFamily: 'var(--mono)' }}>{eyebrow}</p>
      <h3 className="text-base font-bold mb-1.5 leading-tight">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 flex-1 line-clamp-2">{desc}</p>
      <span className="text-sm font-semibold text-primary group-hover:underline">{cta}</span>
    </button>
  );
}

// Bande NPS d'un score 0-100 (spec-22)
function npsBand(score: number | null): { label: string; color: string; bg: string } {
  if (score == null) return { label: '—', color: '#9082B8', bg: 'rgba(144,130,184,0.10)' };
  if (score >= 70) return { label: 'Promoteur', color: '#2EA86A', bg: 'rgba(46,168,106,0.12)' };
  if (score <= 50) return { label: 'Détracteur', color: '#D94F63', bg: 'rgba(217,79,99,0.12)' };
  return { label: 'Passif', color: '#C97A20', bg: 'rgba(201,122,32,0.12)' };
}

// ─── Local types ──────────────────────────────────────────────────────────────
interface Meeting {
  id: string;
  title: string;
  company: string;
  logo: string;
  participants: { name: string }[];
  time: string;
  category: string;
  relationScore: number;
  briefStatus: 'ready' | 'generating' | 'to_generate' | 'insufficient' | 'consulted';
  hasDecisionMaker: boolean;
  isExternal: boolean;
}

interface ActivityItem {
  id: string;
  type: string;
  icon: any;
  color: string;
  bgColor: string;
  title: string;
  description: string;
  time: string;
  link: string | null;
}

interface WeeklyImpact {
  profilesEnriched: number;
  insightsCaptured: number;
  timeSavedMinutes: number;
  evolutionPct: number;
  weeklyMeetings: number;
  activeContacts: number;
  crmSynced: number;
  crmTotal: number;
}

// Feed Signaux (spec-29 §Home) — faits datés taggés par famille
interface SignalFeedItem {
  id: string;
  kind: 'company' | 'person';   // actualité entreprise OU signal comportemental personne
  entityId: string | null;      // company_id ou contact_id
  entityName: string;           // société ou personne
  title: string;                // company: titre actu ; person: ''
  tag: string;                  // famille (libellé court)
  color: string;
  bg: string;
  text: string;                 // résumé / texte du signal
  source: string | null;
  sourceUrl: string | null;
  when: string;
  tsMs: number;                 // pour le tri chronologique
}

function relWhen(iso: string | null): string {
  if (!iso) return '';
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d <= 0) return "Auj.";
  if (d === 1) return 'Hier';
  if (d < 7) return `Il y a ${d}j`;
  if (d < 30) return `Il y a ${Math.floor(d / 7)} sem.`;
  return `Il y a ${Math.floor(d / 30)} mois`;
}

// Mappe signal_type → tag/couleur du Feed Signaux
function signalFeedTag(signalType: string): { tag: string; color: string; bg: string } {
  const s = signalType.toLowerCase();
  if (/churn|resign|cancel|annul/.test(s))            return { tag: 'Churn',      color: '#D94F63', bg: 'rgba(217,79,99,0.10)' };
  if (/risk|risque|objection|payment|paiement/.test(s)) return { tag: 'Risque',     color: '#C97A20', bg: 'rgba(201,122,32,0.10)' };
  if (/levier|lever|opportunit|recovery|reengage/.test(s)) return { tag: 'Levier', color: '#6E50C8', bg: 'rgba(110,80,200,0.10)' };
  if (/mobil|job.change|new.decision|arrivant|promo/.test(s)) return { tag: 'Mobilité', color: '#2EA86A', bg: 'rgba(46,168,106,0.10)' };
  if (/march|market|m&a|rachat|control/.test(s))      return { tag: 'Marché',     color: '#3D6FCC', bg: 'rgba(61,111,204,0.10)' };
  if (/growth|croissance|fund|levee/.test(s))         return { tag: 'Croissance', color: '#2896A8', bg: 'rgba(40,150,168,0.10)' };
  return { tag: 'Présence', color: '#9082B8', bg: 'rgba(144,130,184,0.10)' };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function mapDomainToDisplay(m: DomainMeeting): Meeting {
  return {
    id: m.id,
    title: m.title,
    company: m.company,
    logo: m.company ? m.company[0].toUpperCase() : '📅',
    participants: [],
    time: new Date(m.startsAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    category: 'Réunion',
    relationScore: 0,
    briefStatus: (m.briefStatus as Meeting['briefStatus']) ?? 'to_generate',
    hasDecisionMaker: false,
    isExternal: true,
  };
}

const ICON_MAP: Record<string, any> = {
  job_change: TrendingUp,
  profile_enriched: UserCheck,
  brief_ready: Zap,
  crm_sync: Database,
  alert: AlertCircle,
  birthday: Cake,
  default: Briefcase,
};

const COLOR_MAP: Record<string, { text: string; bg: string }> = {
  notification_urgent:    { text: 'text-destructive',  bg: 'bg-destructive/10'  },
  notification_important: { text: 'text-amber-600',    bg: 'bg-amber-600/10'    },
  notification_info:      { text: 'text-primary',      bg: 'bg-primary/10'      },
  profile_enriched:       { text: 'text-success',      bg: 'bg-success/10'      },
  brief_ready:            { text: 'text-primary',      bg: 'bg-primary/10'      },
  crm_sync:               { text: 'text-blue-600',     bg: 'bg-blue-600/10'     },
  alert:                  { text: 'text-amber-600',    bg: 'bg-amber-600/10'    },
};

function getScoreColor(s: number) {
  if (s > 65) return 'text-success';
  if (s >= 35) return 'text-amber-600';
  return 'text-destructive';
}
function getScoreBg(s: number) {
  if (s > 65) return 'bg-success/10';
  if (s >= 35) return 'bg-amber-600/10';
  return 'bg-destructive/10';
}

const getBriefStatusConfig = (status: Meeting['briefStatus']) => ({
  ready:        { badge: 'Brief prêt',            variant: 'sage'   as const, icon: CheckCircle2 },
  generating:   { badge: 'En génération',         variant: 'amber'  as const, icon: Loader2      },
  to_generate:  { badge: 'À générer',             variant: 'muted'  as const, icon: Sparkles     },
  insufficient: { badge: 'Données insuffisantes', variant: 'coral'  as const, icon: AlertCircle  },
  consulted:    { badge: 'Consulté',              variant: 'violet' as const, icon: CheckCircle2 },
}[status]);

// ─── Component ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const { profile } = useCurrentProfile();
  const { meetings: domainMeetings, reload: reloadMeetings } = useMeetings();
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [impact, setImpact] = useState<WeeklyImpact | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [newContactsFound, setNewContactsFound] = useState(0);
  const [totalContacts, setTotalContacts] = useState<number>(0);
  const [totalEmails, setTotalEmails] = useState<number>(0);
  const [displayedEmails, setDisplayedEmails] = useState<number>(0);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [nps, setNps] = useState<NpsData | null>(null);
  const [npsHistory, setNpsHistory] = useState<Array<{ date: string; value: number; score: number }>>([]);
  const [signalsFeed, setSignalsFeed] = useState<SignalFeedItem[]>([]);
  const [companiesCount, setCompaniesCount] = useState<number>(0);
  const [comptesSort, setComptesSort] = useState<'prio' | 'nps'>('prio');
  const [signalState, setSignalState] = useState<Record<string, 'ok' | 'no'>>({});
  const [veilleRunning, setVeilleRunning] = useState(false);
  const [veilleMsg, setVeilleMsg] = useState<string | null>(null);
  const [digestDismissed, setDigestDismissed] = useState(false);
  const [lastVisitMs] = useState<number>(() => {
    const stored = localStorage.getItem('tohu_home_last_visit');
    const prev = stored ? parseInt(stored, 10) : 0;
    localStorage.setItem('tohu_home_last_visit', String(Date.now()));
    return prev;
  });

  async function handleCalendarSync() {
    if (!supabase || syncing) return;
    setSyncing(true);
    setSyncMsg(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Non authentifié');
      const orgId = await getActiveOrganizationId();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const headers = { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' };
      const providerToken = session.provider_token;

      // Détecte les providers connectés en base (tout sauf déconnecté — l'edge function rafraîchit le token si needs_reauth/expired)
      const { data: connectors } = await supabase
        .from('connectors')
        .select('provider, status')
        .eq('organization_id', orgId)
        .not('status', 'in', '("disconnected","not_connected")');

      const connected = new Set((connectors ?? []).map((c: any) => c.provider as string));
      // Détecte si la session courante est une session Microsoft OAuth (azure = provider Supabase pour MS)
      const sessionAuthProvider = (session.user?.app_metadata as any)?.provider ?? '';
      const isMsSession = sessionAuthProvider === 'azure' || sessionAuthProvider === 'microsoft';
      // Repli : une session OAuth fraîche fournit un provider_token même sans ligne connecteur
      const hasGoogle    = connected.has('google')    || (!isMsSession && !!providerToken);
      const hasMicrosoft = connected.has('microsoft') || (isMsSession && !!providerToken);

      if (!hasGoogle && !hasMicrosoft) {
        setSyncMsg({ type: 'error', text: 'Aucun compte connecté. Allez dans Paramètres → Connexions.' });
        return;
      }

      let totalCreated = 0;
      let totalEmails = 0;
      const syncedProviders: string[] = [];

      // ── Google : calendrier + emails ──────────────────────────────────────
      if (hasGoogle) {
        // Sème le token frais (+ refresh) si la session en a un, pour le renouvellement serveur
        if (!isMsSession && providerToken && session.user) {
          await (supabase.from('connectors') as any).upsert({
            organization_id: orgId, user_id: session.user.id, provider: 'google', status: 'connected',
            metadata: { access_token: providerToken, refresh_token: (session as any).provider_refresh_token ?? null, email: session.user.email, token_stored_at: new Date().toISOString() },
            updated_at: new Date().toISOString(),
          }, { onConflict: 'organization_id,user_id,provider' });
        }
        // Calendrier — invoke (JWT frais) ; le serveur résout/rafraîchit le token Google
        const { data: calData, error: calErr } = await supabase.functions.invoke('sync-google-calendar', {
          body: { organizationId: orgId, providerToken: providerToken ?? null },
        });
        if (!calErr) {
          totalCreated += (calData as any)?.stats?.created ?? 0;
          syncedProviders.push('Google');
        }
        // Emails Gmail — ingest résout le token depuis connectors.metadata (refresh serveur)
        const { data: emailData, error: emailErr } = await supabase.functions.invoke('ingest-communication', {
          body: { organizationId: orgId, providerToken: providerToken ?? null, provider: 'google', lookbackDays: 3650 },
        });
        if (!emailErr) totalEmails += (emailData as any)?.stats?.messages ?? 0;
      }

      // ── Microsoft : calendrier Outlook/Teams + emails ─────────────────────
      if (hasMicrosoft) {
        const { data: msConnector } = await supabase
          .from('connectors')
          .select('metadata')
          .eq('organization_id', orgId)
          .eq('provider', 'microsoft')
          .eq('status', 'connected')
          .maybeSingle();
        // Token MS : on privilégie le token FRAIS de la session MS, sinon le token stocké
        let msToken: string | null = (isMsSession && providerToken) ? providerToken : ((msConnector?.metadata as any)?.access_token ?? null);
        // Sème le refresh_token MS pour le renouvellement auto côté serveur
        if (isMsSession && providerToken && session.user) {
          await (supabase.from('connectors') as any).upsert({
            organization_id: orgId, user_id: session.user.id, provider: 'microsoft', status: 'connected',
            metadata: { ...(msConnector?.metadata ?? {}), access_token: providerToken, refresh_token: (session as any).provider_refresh_token ?? (msConnector?.metadata as any)?.refresh_token ?? null, email: session.user.email, token_stored_at: new Date().toISOString() },
            updated_at: new Date().toISOString(),
          }, { onConflict: 'organization_id,user_id,provider' });
        }

        // Calendrier Outlook — invoke ; le serveur résout/rafraîchit le token depuis le connecteur
        const { data: calData, error: calErr } = await supabase.functions.invoke('sync-outlook-calendar', {
          body: { organizationId: orgId, providerToken: msToken ?? null },
        });
        if (!calErr) {
          totalCreated += (calData as any)?.stats?.created ?? 0;
          syncedProviders.push('Outlook');
          const { data: msConnFresh } = await supabase
            .from('connectors').select('metadata')
            .eq('organization_id', orgId).eq('provider', 'microsoft').eq('status', 'connected').maybeSingle();
          const freshToken = (msConnFresh?.metadata as any)?.access_token;
          if (freshToken) msToken = freshToken;
        }
        // Emails Outlook
        const { data: emailData, error: emailErr } = await supabase.functions.invoke('ingest-communication', {
          body: { organizationId: orgId, providerToken: msToken ?? null, provider: 'microsoft', lookbackDays: 3650 },
        });
        if (!emailErr) totalEmails += (emailData as any)?.stats?.messages ?? 0;
      }

      // ── Auto-discover nouveaux contacts depuis les emails ─────────────────
      let newSuggestions = 0;
      try {
        // Relit le connector Microsoft (token stocké par sync-outlook-calendar qui vient de s'exécuter)
        const { data: msConnFresh } = hasMicrosoft ? await supabase
          .from('connectors').select('metadata')
          .eq('organization_id', orgId).eq('provider', 'microsoft').eq('status', 'connected').maybeSingle()
          : { data: null };

        const discoverBody: Record<string, any> = { organizationId: orgId, lookbackDays: 90, minExchanges: 1 };
        if (hasGoogle) discoverBody.googleToken = providerToken ?? null;
        if (hasMicrosoft) discoverBody.microsoftToken = (isMsSession && providerToken) ? providerToken : ((msConnFresh?.metadata as any)?.access_token ?? null);

        const { data: discData, error: discErr } = await supabase.functions.invoke('discover-contacts', {
          body: discoverBody,
        });
        if (!discErr) {
          newSuggestions = (discData as any)?.suggestions?.length ?? 0;
          setNewContactsFound(newSuggestions);
        }
      } catch { /* non-bloquant */ }

      const emailPart = totalEmails > 0 ? ` · ${totalEmails} email${totalEmails > 1 ? 's' : ''} ingéré${totalEmails > 1 ? 's' : ''}` : ' · Emails synchronisés';
      const contactPart = newSuggestions > 0 ? ` · ${newSuggestions} contact${newSuggestions > 1 ? 's' : ''} à importer` : '';
      setSyncMsg({
        type: 'success',
        text: `✓ ${totalCreated} nouvelle${totalCreated > 1 ? 's' : ''} réunion${totalCreated > 1 ? 's' : ''}${emailPart}${contactPart}${syncedProviders.length ? ` (${syncedProviders.join(' + ')})` : ''}`,
      });
      // Rafraîchit le compteur KPI "Mails synchronisés" depuis la base
      const { count: refreshedEmailCount } = await supabase
        .from('communication_messages')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId);
      if (refreshedEmailCount !== null) setTotalEmails(refreshedEmailCount);
      // Recalcule le scoring relationnel sur les contacts fraîchement synchronisés
      try { await supabase.functions.invoke('score-batch', { body: { organizationId: orgId } }); } catch { /* non-bloquant */ }
      reloadMeetings?.();
    } catch (e: any) {
      setSyncMsg({ type: 'error', text: e.message });
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMsg(null), 6000);
    }
  }

  const firstName = profile?.fullName?.split(/\s+/)[0] ?? '';
  const todayDate  = new Date().toISOString().slice(0, 10);

  // Split meetings into today / upcoming
  const todaysMeetings = domainMeetings
    .filter(m => m.startsAt.slice(0, 10) === todayDate)
    .map(mapDomainToDisplay);

  const upcomingMeetings = domainMeetings
    .filter(m => m.startsAt.slice(0, 10) > todayDate)
    .slice(0, 5)
    .map(mapDomainToDisplay);

  // Animation compteur emails — monte de 0 → totalEmails en 1.2s
  useEffect(() => {
    if (totalEmails === 0) return;
    const duration = 1200;
    const steps = 40;
    const increment = totalEmails / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= totalEmails) {
        setDisplayedEmails(totalEmails);
        clearInterval(timer);
      } else {
        setDisplayedEmails(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [totalEmails]);

  // Weekly meetings count for KPIs
  const monday = new Date();
  const dow = monday.getDay();
  monday.setDate(monday.getDate() - (dow === 0 ? 6 : dow - 1));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
  const weeklyMeetingsCount = domainMeetings.filter(m => {
    const d = new Date(m.startsAt);
    return d >= monday && d <= sunday;
  }).length;

  // Load activity feed + weekly impact from Supabase
  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!supabase) return;
      const orgId = await getActiveOrganizationId();
      if (!orgId || !mounted) return;

      // Activity feed
      const { data: events } = await supabase
        .from('knowy_activity_events')
        .select('id, event_type, title, description, entity_link, created_at')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (mounted && events?.length) {
        setActivity(events.map((e: any) => {
          const colors = COLOR_MAP[e.event_type] ?? COLOR_MAP.alert;
          const Icon = ICON_MAP[e.event_type] ?? ICON_MAP.default;
          return {
            id: e.id,
            type: e.event_type,
            icon: Icon,
            color: colors.text,
            bgColor: colors.bg,
            title: e.title,
            description: e.description,
            time: new Date(e.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            link: e.entity_link ?? null,
          };
        }));
      }

      // Contacts total + emails synchronisés
      const [{ count: contactCount }, { count: emailCount }] = await Promise.all([
        supabase.from('contacts').select('*', { count: 'exact', head: true })
          .eq('organization_id', orgId).is('merged_into_contact_id', null),
        supabase.from('communication_messages').select('*', { count: 'exact', head: true })
          .eq('organization_id', orgId),
      ]);
      if (mounted) {
        setTotalContacts(contactCount ?? 0);
        setTotalEmails(emailCount ?? 0);
      }

      // Portefeuille priorisé (gravité × urgence, spec-30) + NPS (spec-22)
      try {
        const [{ data: companiesRaw }, { data: profs }, { data: sigRows }, { data: msgRows }] = await Promise.all([
          supabase
            .from('companies')
            .select('id, name, domain, industry, account_type, account_type_confidence, contacts(id)')
            .eq('organization_id', orgId)
            .limit(50),
          supabase
            .from('cognitive_profiles')
            .select('contact_id, engagement_score, score_delta')
            .eq('organization_id', orgId)
            .order('profile_version', { ascending: false }),
          supabase
            .from('behavioral_signals')
            .select('contact_id, signal_type')
            .eq('organization_id', orgId)
            .limit(500),
          supabase
            .from('communication_messages')
            .select('contact_id, sent_at')
            .eq('organization_id', orgId)
            .order('sent_at', { ascending: false })
            .limit(2000),
        ]);

        // Map score + delta par contact (dernière version)
        const scoreByContact: Record<string, { score: number | null; delta: number | null }> = {};
        for (const p of (profs ?? []) as any[]) {
          if (!(p.contact_id in scoreByContact)) {
            scoreByContact[p.contact_id] = { score: p.engagement_score ?? null, delta: p.score_delta ?? null };
          }
        }
        // Signaux par contact
        const sigsByContact: Record<string, { signal_type: string }[]> = {};
        for (const s of (sigRows ?? []) as any[]) {
          (sigsByContact[s.contact_id] ??= []).push({ signal_type: s.signal_type });
        }
        // Dernier contact par contact (depuis les emails)
        const lastByContact: Record<string, string> = {};
        for (const m of (msgRows ?? []) as any[]) {
          if (m.sent_at && !(m.contact_id in lastByContact)) lastByContact[m.contact_id] = m.sent_at;
        }

        // NPS portefeuille (Promoteur ≥70, Détracteur ≤50) + capital relationnel moyen
        const allScores = Object.values(scoreByContact).map(v => v.score).filter((s): s is number => s != null);
        if (mounted && allScores.length) {
          const promoters = allScores.filter(s => s >= 70).length;
          const detractors = allScores.filter(s => s <= 50).length;
          const passives = allScores.length - promoters - detractors;
          const avgScore = Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length);
          const npsValue = Math.round((promoters / allScores.length) * 100 - (detractors / allScores.length) * 100);
          setNps({ avgScore, value: npsValue, promoters, passives, detractors, count: allScores.length });

          // Snapshot NPS du jour (idempotent) → la courbe se construit dans le temps
          if (orgId) {
            try {
              await (supabase.from('nps_snapshots') as any).upsert({
                organization_id: orgId, snapshot_date: new Date().toISOString().slice(0, 10),
                nps_value: npsValue, avg_score: avgScore, promoters, detractors, total: allScores.length,
              }, { onConflict: 'organization_id,snapshot_date' });
              const { data: hist } = await supabase.from('nps_snapshots')
                .select('snapshot_date, nps_value, avg_score')
                .eq('organization_id', orgId)
                .order('snapshot_date', { ascending: true }).limit(30);
              if (mounted && hist) {
                setNpsHistory((hist as any[]).map(h => ({
                  date: new Date(h.snapshot_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
                  value: h.nps_value ?? 0, score: h.avg_score ?? 0,
                })));
              }
            } catch { /* table absente / RLS — non bloquant */ }
          }
        }

        if (mounted) setCompaniesCount(companiesRaw?.length ?? 0);

        if (companiesRaw?.length) {
          const rows: PortfolioItem[] = (companiesRaw as any[]).map((c: any) => {
            const contacts = c.contacts ?? [];
            let minDays: number | null = null;
            let minScore: number | null = null;
            let scoreSum = 0, scoreCount = 0;
            let deltaSum = 0, deltaCount = 0;
            const companySignals: { signal_type: string }[] = [];
            for (const ct of contacts) {
              const sc = scoreByContact[ct.id];
              if (sc?.score != null) {
                minScore = minScore == null ? sc.score : Math.min(minScore, sc.score);
                scoreSum += sc.score; scoreCount++;
              }
              if (sc?.delta != null) { deltaSum += sc.delta; deltaCount++; }
              const lastAt = lastByContact[ct.id];
              if (lastAt) {
                const d = Math.floor((Date.now() - new Date(lastAt).getTime()) / 86400000);
                if (minDays === null || d < minDays) minDays = d;
              }
              if (sigsByContact[ct.id]) companySignals.push(...sigsByContact[ct.id]);
            }
            const accountType = resolveAccountType(c.account_type, c.account_type_confidence);
            const verdict = computeVerdict(
              minScore, minDays, companySignals,
              deltaCount ? deltaSum / deltaCount : null,
              accountType,
            );
            return {
              id: c.id,
              name: c.name,
              subtitle: c.industry ?? c.domain ?? null,
              lastDays: minDays,
              contactsCount: contacts.length,
              npsScore: scoreCount ? Math.round(scoreSum / scoreCount) : null,
              trend: deltaCount ? Math.round(deltaSum / deltaCount) : 0,
              verdict,
            };
          });
          if (mounted) setPortfolio(rows);
        }
      } catch { /* companies table might not exist yet */ }

      // Feed Signaux — fusion : actualités entreprise (veille) + signaux comportementaux (personnes)
      try {
        const [{ data: compSigs }, { data: behSigs }] = await Promise.all([
          supabase
            .from('company_signals')
            .select('id, company_id, family, title, summary, source, source_url, observed_at, companies(name)')
            .eq('organization_id', orgId)
            .neq('status', 'dismissed')
            .order('observed_at', { ascending: false, nullsFirst: false })
            .limit(20),
          supabase
            .from('behavioral_signals')
            .select('id, contact_id, signal_type, text, source_type, observed_at, contacts(full_name)')
            .eq('organization_id', orgId)
            .order('observed_at', { ascending: false })
            .limit(20),
        ]);

        const merged: SignalFeedItem[] = [];
        for (const s of (compSigs ?? []) as any[]) {
          const cfg = signalFeedTag(s.family ?? '');
          merged.push({
            id: s.id, kind: 'company', entityId: s.company_id, entityName: s.companies?.name ?? 'Compte',
            title: s.title ?? '', tag: cfg.tag, color: cfg.color, bg: cfg.bg, text: s.summary ?? '',
            source: s.source ?? null, sourceUrl: s.source_url ?? null,
            when: relWhen(s.observed_at), tsMs: s.observed_at ? new Date(s.observed_at).getTime() : 0,
          });
        }
        for (const s of (behSigs ?? []) as any[]) {
          const cfg = signalFeedTag(s.signal_type ?? '');
          merged.push({
            id: s.id, kind: 'person', entityId: s.contact_id, entityName: s.contacts?.full_name ?? 'Contact',
            title: '', tag: cfg.tag, color: cfg.color, bg: cfg.bg, text: s.text ?? '',
            source: s.source_type ?? 'Analyse Tohu', sourceUrl: null,
            when: relWhen(s.observed_at), tsMs: s.observed_at ? new Date(s.observed_at).getTime() : 0,
          });
        }
        merged.sort((a, b) => b.tsMs - a.tsMs);
        if (mounted) setSignalsFeed(merged.slice(0, 30));
      } catch { /* signals might be empty */ }

      // Weekly impact
      const weekStart = monday.toISOString().slice(0, 10);
      const { data: statsRaw } = await supabase
        .from('weekly_impact_stats')
        .select('*')
        .eq('organization_id', orgId)
        .eq('week_start', weekStart)
        .maybeSingle();

      const stats = statsRaw as any;
      if (mounted && stats) {
        setImpact({
          profilesEnriched:  stats.profiles_enriched  ?? 0,
          insightsCaptured:  stats.insights_captured  ?? 0,
          timeSavedMinutes:  stats.time_saved_minutes ?? 0,
          evolutionPct:      stats.evolution_pct      ?? 0,
          weeklyMeetings:    weeklyMeetingsCount,
          activeContacts:    stats.active_contacts    ?? 0,
          crmSynced:         stats.crm_synced_count   ?? 0,
          crmTotal:          stats.crm_total_count    ?? 0,
        });
      }
    }
    load();
    return () => { mounted = false; };
  }, [weeklyMeetingsCount]);

  // Meeting card renderer (shared)
  function MeetingCard({ meeting, i }: { meeting: Meeting; i: number }) {
    const statusConfig = getBriefStatusConfig(meeting.briefStatus);
    const StatusIcon = statusConfig.icon;
    return (
      <KnowrCard
        hover
        delay={i * 0.05}
        onClick={() => navigate(`/meeting/${meeting.id}`)}
        className="p-5 rounded-2xl"
      >
        <div className="flex items-start gap-4">
          <div className="flex flex-col items-center min-w-[50px]">
            <div className="text-xl font-black">{meeting.time.split(':')[0]}</div>
            <div className="text-xs text-muted-foreground">{meeting.time.split(':')[1]}</div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="text-3xl">{meeting.logo}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold mb-1 truncate">{meeting.title}</h3>
                  <p className="text-sm text-muted-foreground truncate">{meeting.company}</p>
                </div>
              </div>
              {meeting.relationScore > 0 && (
                <div className={`flex items-center justify-center size-10 rounded-full flex-shrink-0 ml-2 ${getScoreBg(meeting.relationScore)}`}>
                  <span className={`font-mono font-bold text-sm ${getScoreColor(meeting.relationScore)}`}>
                    {meeting.relationScore}
                  </span>
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs mb-3">
              {meeting.hasDecisionMaker && (
                <div className="flex items-center gap-1 text-primary">
                  <Star className="size-3 fill-primary" />
                  <span className="font-semibold">Décideur</span>
                </div>
              )}
              <KnowrBadge variant="blue" size="sm">{meeting.category}</KnowrBadge>
              {meeting.participants.length > 0 && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Users className="size-3" />
                  <span>{meeting.participants.length}</span>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <div className="flex items-center gap-2">
                <StatusIcon className={`size-3 ${statusConfig.badge === 'En génération' ? 'animate-spin' : ''}`} />
                <KnowrBadge variant={statusConfig.variant} size="sm">{statusConfig.badge}</KnowrBadge>
              </div>
              {meeting.briefStatus === 'ready' && (
                <KnowrButton variant="primary" size="sm" icon={<Sparkles className="size-3" />}>
                  Consulter
                </KnowrButton>
              )}
              {meeting.briefStatus === 'to_generate' && (
                <KnowrButton variant="secondary" size="sm" icon={<Sparkles className="size-3" />}>
                  Générer
                </KnowrButton>
              )}
              {meeting.briefStatus === 'generating' && (
                <KnowrButton variant="ghost" size="sm" disabled>
                  <Loader2 className="size-3 animate-spin" />
                </KnowrButton>
              )}
            </div>
          </div>
        </div>
      </KnowrCard>
    );
  }

  // Lance la veille actualités (LinkedIn / presse / web) sur les comptes
  async function runVeille() {
    if (!supabase || veilleRunning) return;
    setVeilleRunning(true);
    setVeilleMsg(null);
    try {
      const orgId = await getActiveOrganizationId();
      const { data, error } = await supabase.functions.invoke('monitor-company-news', {
        body: { organizationId: orgId },
      });
      if (error) {
        let msg = error.message ?? 'Erreur veille.';
        try { const b = await (error as any)?.context?.json?.(); if (b?.error) msg = b.error; } catch { /* ignore */ }
        setVeilleMsg(msg);
      } else if (data?.error) {
        setVeilleMsg(data.error);
      } else {
        setVeilleMsg(`${data?.inserted ?? 0} actualité(s) ajoutée(s) sur ${data?.scanned ?? 0} compte(s).`);
        // Recharge le feed (actualités entreprise + signaux personnes)
        const [{ data: compSigs }, { data: behSigs }] = await Promise.all([
          supabase.from('company_signals')
            .select('id, company_id, family, title, summary, source, source_url, observed_at, companies(name)')
            .eq('organization_id', orgId).neq('status', 'dismissed')
            .order('observed_at', { ascending: false, nullsFirst: false }).limit(20),
          supabase.from('behavioral_signals')
            .select('id, contact_id, signal_type, text, source_type, observed_at, contacts(full_name)')
            .eq('organization_id', orgId).order('observed_at', { ascending: false }).limit(20),
        ]);
        const merged: SignalFeedItem[] = [];
        for (const s of (compSigs ?? []) as any[]) {
          const cfg = signalFeedTag(s.family ?? '');
          merged.push({ id: s.id, kind: 'company', entityId: s.company_id, entityName: s.companies?.name ?? 'Compte',
            title: s.title ?? '', tag: cfg.tag, color: cfg.color, bg: cfg.bg, text: s.summary ?? '',
            source: s.source ?? null, sourceUrl: s.source_url ?? null,
            when: relWhen(s.observed_at), tsMs: s.observed_at ? new Date(s.observed_at).getTime() : 0 });
        }
        for (const s of (behSigs ?? []) as any[]) {
          const cfg = signalFeedTag(s.signal_type ?? '');
          merged.push({ id: s.id, kind: 'person', entityId: s.contact_id, entityName: s.contacts?.full_name ?? 'Contact',
            title: '', tag: cfg.tag, color: cfg.color, bg: cfg.bg, text: s.text ?? '',
            source: s.source_type ?? 'Analyse Tohu', sourceUrl: null,
            when: relWhen(s.observed_at), tsMs: s.observed_at ? new Date(s.observed_at).getTime() : 0 });
        }
        merged.sort((a, b) => b.tsMs - a.tsMs);
        setSignalsFeed(merged.slice(0, 30));
      }
    } catch (e: any) {
      setVeilleMsg(e?.message ?? 'Erreur inconnue.');
    } finally {
      setVeilleRunning(false);
    }
  }

  // Valide / écarte un signal. Persistant pour les actualités entreprise (company_signals).
  async function setSignalStatus(signalId: string, status: 'ok' | 'no', kind: 'company' | 'person') {
    setSignalState(p => ({ ...p, [signalId]: status }));
    if (!supabase || kind !== 'company') return;
    try {
      await supabase.from('company_signals')
        .update({ status: status === 'ok' ? 'validated' : 'dismissed', updated_at: new Date().toISOString() })
        .eq('id', signalId);
    } catch { /* best-effort */ }
  }

  // ── Dérivés Home (maquette) ────────────────────────────────────────────────
  const topMeeting = todaysMeetings[0] ?? upcomingMeetings[0] ?? null;
  const defendList = portfolio.filter(c => c.verdict?.posture === 'defend')
    .sort((a, b) => (b.verdict?.score ?? 0) - (a.verdict?.score ?? 0));
  const topDefend = defendList[0] ?? null;
  const leverList = portfolio.filter(c => c.verdict && c.verdict.posture !== 'defend')
    .sort((a, b) => (b.verdict?.score ?? 0) - (a.verdict?.score ?? 0));
  const topLever = leverList[0] ?? null;
  const defendCount = defendList.length;

  const signalCounts = {
    risque: signalsFeed.filter(s => s.tag === 'Risque' || s.tag === 'Churn').length,
    levier: signalsFeed.filter(s => s.tag === 'Levier' || s.tag === 'Croissance').length,
    marche: signalsFeed.filter(s => s.tag === 'Marché' || s.tag === 'Mobilité').length,
  };

  const comptesSorted = [...portfolio].sort((a, b) => {
    if (comptesSort === 'nps') return (b.npsScore ?? -1) - (a.npsScore ?? -1);
    return (b.verdict?.score ?? -1) - (a.verdict?.score ?? -1);
  });

  // Top 5 NPS — leaderboard Meilleurs / À risque (maquette)
  const npsRanked = portfolio.filter(c => c.npsScore != null).sort((a, b) => (b.npsScore ?? 0) - (a.npsScore ?? 0));
  const top5Best = npsRanked.slice(0, 5);
  const top5Risk = [...npsRanked].reverse().slice(0, 5).filter(c => !top5Best.includes(c));

  // Digest « depuis ta dernière visite » — nouveaux signaux depuis le dernier passage sur Home
  const newSignalsSinceVisit = signalsFeed.filter(s => s.tsMs > lastVisitMs).length;

  return (
    <div className="size-full overflow-auto" style={{ background: 'var(--color-background)' }}>
      <div className="max-w-7xl mx-auto px-4 py-5 md:px-8 md:py-8">

        {/* Header — titre Home (recherche + Nouveau brief sont dans la barre du haut) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <h1 className="text-3xl font-black tracking-tight leading-tight">Home</h1>
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mt-1" style={{ fontFamily: 'var(--mono)' }}>
            Mon espace relationnel
          </p>
        </motion.div>

        {/* Bandeau offre */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-border bg-card px-5 py-3 mb-5">
          <p className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ background: 'var(--violet-s)', color: 'var(--violet-d)', fontFamily: 'var(--mono)' }}>
              Offre gratuite
            </span>
            <b className="text-foreground">{companiesCount} compte{companiesCount > 1 ? 's' : ''}</b> suivis · synchronisation automatique
          </p>
          <button onClick={handleCalendarSync} disabled={syncing}
            className="flex items-center gap-2 text-xs font-semibold text-primary hover:underline disabled:opacity-50 flex-shrink-0">
            {syncing ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCcw className="size-3.5" />}
            {syncing ? 'Synchronisation…' : 'Synchroniser'}
          </button>
        </div>
        {syncMsg && (
          <p className={`text-xs px-3 py-1.5 rounded-full mb-3 w-fit ${
            syncMsg.type === 'success' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
          }`}>
            {syncMsg.text}
          </p>
        )}
        {newContactsFound > 0 && (
          <button
            onClick={() => { setNewContactsFound(0); navigate('/contacts?discover=1'); }}
            className="flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors mb-5 w-fit"
          >
            <Users className="size-3.5" />
            {newContactsFound} nouveau{newContactsFound > 1 ? 'x' : ''} contact{newContactsFound > 1 ? 's' : ''} détecté{newContactsFound > 1 ? 's' : ''} dans vos emails — Importer →
          </button>
        )}

        {/* Digest « Depuis ta dernière visite » (maquette) */}
        {!digestDismissed && lastVisitMs > 0 && newSignalsSinceVisit > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between gap-3 rounded-2xl px-5 py-3 mb-5"
            style={{ background: 'var(--violet-s)', border: '1px solid var(--border-m)' }}
          >
            <p className="text-sm flex items-center gap-2" style={{ color: 'var(--t1, #1A1040)' }}>
              <Sparkles className="size-4 text-primary flex-shrink-0" />
              Depuis ta dernière visite : <b>{newSignalsSinceVisit} nouveau{newSignalsSinceVisit > 1 ? 'x' : ''} signal{newSignalsSinceVisit > 1 ? 'aux' : ''}</b>
              {defendCount > 0 && <> · <b>{defendCount} compte{defendCount > 1 ? 's' : ''}</b> à défendre</>}
            </p>
            <button onClick={() => setDigestDismissed(true)} className="text-muted-foreground hover:text-foreground flex-shrink-0">
              <X className="size-4" />
            </button>
          </motion.div>
        )}

        {/* ══ Rangée KPI — 4 cartes (maquette) ══════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="grid grid-cols-1 gap-3 mb-6 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]"
        >
          {/* ── NPS — carte anneau violette ──────────────────────────────── */}
          <div
            className="rounded-2xl flex items-center gap-4 flex-shrink-0"
            style={{ background: '#6E50C8', padding: '16px 20px', boxShadow: '0 6px 28px rgba(110,80,200,0.22)' }}
          >
            {/* Ring donut */}
            <div
              className="flex-shrink-0 flex items-center justify-center"
              style={{
                width: 76, height: 76, borderRadius: '50%',
                background: `conic-gradient(rgba(255,255,255,0.88) ${(nps?.avgScore ?? 0) * 3.6}deg, rgba(255,255,255,0.15) 0deg)`,
              }}
            >
              <div
                className="flex flex-col items-center justify-center"
                style={{ width: 60, height: 60, borderRadius: '50%', background: '#5A3EAA' }}
              >
                <span style={{ fontFamily: 'Epilogue, sans-serif', fontWeight: 900, fontSize: 26, color: '#fff', lineHeight: 1 }}>
                  {nps?.avgScore ?? '—'}
                </span>
                <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 8, color: 'rgba(255,255,255,0.45)', marginTop: 1 }}>
                  / 100
                </span>
              </div>
            </div>
            {/* Labels */}
            <div className="min-w-0">
              <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.10em', color: 'rgba(255,255,255,0.48)', marginBottom: 6 }}>
                Capital Relationnel · NPS
              </p>
              <p style={{ fontFamily: 'Epilogue, sans-serif', fontWeight: 800, fontSize: 17, color: '#fff', lineHeight: 1.25 }}>
                {npsBand(nps?.avgScore ?? null).label}
                {nps && nps.value !== 0 && (
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.60)', marginLeft: 6 }}>
                    {nps.value > 0 ? '↗' : '↘'} {nps.value > 0 ? '+' : ''}{nps.value} ce mois
                  </span>
                )}
              </p>
              {/* Courbe NPS (tendance) */}
              {npsHistory.length >= 2 ? (
                <svg width="160" height="34" viewBox="0 0 160 34" preserveAspectRatio="none" style={{ marginTop: 8, display: 'block', overflow: 'visible' }}>
                  {(() => {
                    const vals = npsHistory.map(h => h.score);
                    const min = Math.min(...vals), max = Math.max(...vals);
                    const range = (max - min) || 1;
                    const pts = npsHistory.map((h, i) => {
                      const x = (i / (npsHistory.length - 1)) * 158 + 1;
                      const y = 32 - ((h.score - min) / range) * 28;
                      return `${x.toFixed(1)},${y.toFixed(1)}`;
                    });
                    return (
                      <>
                        <polygon points={`1,33 ${pts.join(' ')} 159,33`} fill="rgba(255,255,255,0.14)" />
                        <polyline points={pts.join(' ')} fill="none" stroke="rgba(255,255,255,0.92)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                      </>
                    );
                  })()}
                </svg>
              ) : (
                <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 8, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>
                  Courbe NPS — historique en cours
                </p>
              )}
            </div>
          </div>

          {/* ── Comptes ────────────────────────────────────────────────────── */}
          <div
            className="rounded-2xl flex items-center"
            style={{ background: '#fff', border: '1px solid rgba(110,80,200,0.10)', boxShadow: '0 1px 4px rgba(110,80,200,0.07)', padding: '16px 20px' }}
          >
            <span style={{ fontFamily: 'Epilogue, sans-serif', fontWeight: 900, fontSize: 40, color: '#1A1040', lineHeight: 1, marginRight: 10 }}>
              {companiesCount || '—'}
            </span>
            <span style={{ fontFamily: 'Epilogue, sans-serif', fontSize: 15, color: '#5A4880', lineHeight: 1.4 }}>
              comptes
            </span>
          </div>

          {/* ── Contacts ───────────────────────────────────────────────────── */}
          <div
            className="rounded-2xl flex items-center gap-2 flex-wrap"
            style={{ background: '#fff', border: '1px solid rgba(110,80,200,0.10)', boxShadow: '0 1px 4px rgba(110,80,200,0.07)', padding: '16px 20px' }}
          >
            <span style={{ fontFamily: 'Epilogue, sans-serif', fontWeight: 900, fontSize: 40, color: '#1A1040', lineHeight: 1, marginRight: 8 }}>
              {totalContacts || '—'}
            </span>
            <span style={{ fontFamily: 'Epilogue, sans-serif', fontSize: 15, color: '#5A4880', lineHeight: 1.4 }}>
              contacts
            </span>
            {totalEmails > 0 && (
              <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 8, fontWeight: 700, padding: '2px 7px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '.06em', color: '#2EA86A', background: 'rgba(46,168,106,0.12)', marginLeft: 2 }}>
                ↗ {totalEmails.toLocaleString('fr-FR')} emails
              </span>
            )}
          </div>

          {/* ── Signaux ────────────────────────────────────────────────────── */}
          <div
            className="rounded-2xl flex flex-col justify-center"
            style={{ background: '#fff', border: '1px solid rgba(110,80,200,0.10)', boxShadow: '0 1px 4px rgba(110,80,200,0.07)', padding: '16px 20px' }}
          >
            <div className="flex items-center" style={{ marginBottom: signalsFeed.length > 0 ? 8 : 0 }}>
              <span style={{ fontFamily: 'Epilogue, sans-serif', fontWeight: 900, fontSize: 40, color: '#1A1040', lineHeight: 1, marginRight: 10 }}>
                {signalsFeed.length || '—'}
              </span>
              <span style={{ fontFamily: 'Epilogue, sans-serif', fontSize: 15, color: '#5A4880', lineHeight: 1.4 }}>
                signaux
              </span>
            </div>
            {signalsFeed.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {signalCounts.risque > 0 && (
                  <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 8, fontWeight: 700, padding: '2px 7px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '.06em', color: '#D94F63', background: 'rgba(217,79,99,0.12)' }}>
                    {signalCounts.risque} risque
                  </span>
                )}
                {signalCounts.levier > 0 && (
                  <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 8, fontWeight: 700, padding: '2px 7px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '.06em', color: '#2EA86A', background: 'rgba(46,168,106,0.12)' }}>
                    {signalCounts.levier} levier
                  </span>
                )}
                {signalCounts.marche > 0 && (
                  <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 8, fontWeight: 700, padding: '2px 7px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '.06em', color: '#3D6FCC', background: 'rgba(61,111,204,0.12)' }}>
                    {signalCounts.marche} marché
                  </span>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* ══ Top 5 · NPS — leaderboard Meilleurs / À risque (maquette) ══════ */}
        {npsRanked.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            <KnowrCard className="p-5 rounded-2xl">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5" style={{ color: 'var(--sage)', fontFamily: 'var(--mono)' }}>
                <TrendingUp className="size-3.5" /> Top 5 · Meilleurs comptes
              </p>
              <div className="space-y-1">
                {top5Best.map((c, i) => (
                  <button key={c.id} onClick={() => navigate(`/company/${c.id}`)}
                    className="w-full flex items-center gap-3 py-1.5 px-1.5 rounded-lg hover:bg-muted/50 transition-colors text-left">
                    <span className="text-xs font-bold text-muted-foreground w-4 flex-shrink-0">{i + 1}</span>
                    <span className="text-sm font-semibold flex-1 truncate">{c.name}</span>
                    <span className="text-sm font-black" style={{ color: 'var(--sage)' }}>{c.npsScore}</span>
                  </button>
                ))}
              </div>
            </KnowrCard>
            <KnowrCard className="p-5 rounded-2xl">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5" style={{ color: 'var(--coral)', fontFamily: 'var(--mono)' }}>
                <TrendingDown className="size-3.5" /> Top 5 · À risque
              </p>
              <div className="space-y-1">
                {top5Risk.map((c, i) => (
                  <button key={c.id} onClick={() => navigate(`/company/${c.id}`)}
                    className="w-full flex items-center gap-3 py-1.5 px-1.5 rounded-lg hover:bg-muted/50 transition-colors text-left">
                    <span className="text-xs font-bold text-muted-foreground w-4 flex-shrink-0">{i + 1}</span>
                    <span className="text-sm font-semibold flex-1 truncate">{c.name}</span>
                    <span className="text-sm font-black" style={{ color: 'var(--coral)' }}>{c.npsScore}</span>
                  </button>
                ))}
              </div>
            </KnowrCard>
          </div>
        )}

        {/* Cette semaine · à faire (maquette) */}
        <div className="flex items-baseline justify-between gap-3 mb-4">
          <h2 className="text-xl font-black flex items-center gap-2">
            <Calendar className="size-5 text-primary" /> Cette semaine · à faire
          </h2>
          <p className="text-sm text-muted-foreground hidden sm:block">
            <b className="text-foreground">{defendCount} compte{defendCount > 1 ? 's' : ''}</b> à défendre · <b className="text-foreground">{todaysMeetings.length + upcomingMeetings.length} réunion{(todaysMeetings.length + upcomingMeetings.length) > 1 ? 's' : ''}</b> à préparer
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 mb-8 lg:grid-cols-3">
          {/* Réunion à préparer */}
          <ActionCard
            eyebrow="Réunion · à préparer" eyebrowColor="#6E50C8"
            icon={<Calendar className="size-5" />} iconBg="var(--violet-s)" iconColor="#6E50C8"
            title={topMeeting ? `${topMeeting.title}` : 'Aucune réunion à préparer'}
            desc={topMeeting ? `${topMeeting.company !== '—' ? topMeeting.company + ' · ' : ''}Brief ${topMeeting.briefStatus === 'ready' ? 'prêt — à relire avant l\'appel.' : 'à générer avant l\'appel.'}` : 'Synchronisez votre agenda pour préparer vos réunions.'}
            cta={topMeeting ? 'Ouvrir le brief →' : 'Voir les réunions →'}
            onClick={() => navigate(topMeeting ? `/meeting/${topMeeting.id}` : '/meetings')}
          />
          {/* Compte à défendre */}
          <ActionCard
            eyebrow="Compte · à défendre" eyebrowColor="#D94F63"
            icon={<Shield className="size-5" />} iconBg="rgba(217,79,99,0.10)" iconColor="#D94F63"
            title={topDefend ? `${topDefend.name} · ${topDefend.verdict?.pilote ?? 'à défendre'}` : 'Aucun compte sous tension'}
            desc={topDefend ? `Priorité ${topDefend.verdict?.score} · ${topDefend.verdict?.reason ?? ''}`.slice(0, 110) : 'Tous vos comptes sont sains pour le moment.'}
            cta={topDefend ? 'Ouvrir le compte →' : 'Voir les comptes →'}
            onClick={() => navigate(topDefend ? `/company/${topDefend.id}` : '/companies')}
          />
          {/* Levier à saisir */}
          <ActionCard
            eyebrow="Levier · à saisir" eyebrowColor="#2EA86A"
            icon={<Zap className="size-5" />} iconBg="rgba(46,168,106,0.10)" iconColor="#2EA86A"
            title={topLever ? `${topLever.name} · ${topLever.verdict?.pilote ?? 'opportunité'}` : 'Aucun levier détecté'}
            desc={topLever ? `${topLever.verdict?.reason ?? ''}`.slice(0, 110) : 'Les opportunités apparaîtront ici.'}
            cta={topLever ? 'Ouvrir la fiche →' : 'Voir les comptes →'}
            onClick={() => navigate(topLever ? `/company/${topLever.id}` : '/companies')}
          />
        </div>

        {/* Comptes (Priorité/NPS) + Feed signaux (maquette) */}
        <div className="grid grid-cols-1 gap-6 items-start lg:grid-cols-[58%_42%]">

          {/* ── LEFT : Réunions + Comptes ──────────────────────────────── */}
          <div className="flex flex-col gap-6">

            {/* Aujourd'hui */}
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-xl font-black mb-0.5">Aujourd'hui</h2>
                  <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                    {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                </div>
                <KnowrButton variant="secondary" size="sm" icon={<Plus className="size-4" />} onClick={() => navigate('/meetings')}>
                  Voir tout
                </KnowrButton>
              </div>
              {todaysMeetings.length === 0 ? (
                <KnowrCard className="p-8 text-center rounded-2xl">
                  <Calendar className="mx-auto mb-3 size-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">Aucune réunion aujourd'hui.</p>
                </KnowrCard>
              ) : (
                <div className="space-y-3">
                  {todaysMeetings.map((m, i) => <MeetingCard key={m.id} meeting={m} i={i} />)}
                </div>
              )}
            </div>

            {/* À venir */}
            {upcomingMeetings.length > 0 && (
              <div>
                <h2 className="text-xl font-black mb-4">À venir</h2>
                <div className="space-y-3">
                  {upcomingMeetings.map((m, i) => <MeetingCard key={m.id} meeting={m} i={i} />)}
                </div>
              </div>
            )}

            {/* Comptes — remonté au-dessus des réunions */}
            <div className="order-first">
            <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-black">Comptes</h2>
                <div className="inline-flex items-center rounded-full p-0.5" style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
                  {(['prio', 'nps'] as const).map(k => (
                    <button key={k} onClick={() => setComptesSort(k)}
                      className="px-3 py-1 rounded-full text-xs font-bold transition-colors"
                      style={comptesSort === k ? { background: '#6E50C8', color: '#fff' } : { color: 'var(--t3)' }}>
                      {k === 'prio' ? 'Priorité' : 'NPS'}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => navigate('/companies')} className="text-sm font-semibold text-primary hover:underline">
                Tout voir → {companiesCount} comptes
              </button>
            </div>

            {comptesSorted.length === 0 ? (
              <KnowrCard className="p-6 text-center rounded-2xl">
                <Building2 className="mx-auto mb-3 size-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">Les comptes apparaîtront ici après synchronisation.</p>
              </KnowrCard>
            ) : (
              <KnowrCard className="rounded-2xl overflow-hidden p-0">
                {/* En-tête colonnes */}
                <div className="flex items-center gap-3 border-b border-border" style={{ padding: '10px 20px 10px 20px' }}>
                  <span className="flex-1" style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--t3, #9082B8)' }}>Compte</span>
                  <span className="w-28 text-center" style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--t3, #9082B8)' }}>NPS</span>
                  <span className="w-12 text-right" style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--t3, #9082B8)' }}>Vu</span>
                  <span className="w-10 text-right" style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--t3, #9082B8)' }}>→</span>
                </div>
                <div className="divide-y divide-border max-h-[420px] overflow-y-auto">
                  {comptesSorted.slice(0, 12).map(company => {
                    const days = company.lastDays;
                    const daysText = days === null ? '—' : days === 0 ? "Auj." : days === 1 ? 'Hier' : days < 7 ? `${days}j` : days < 30 ? `${Math.floor(days / 7)} sem` : `${days} j`;
                    const band = npsBand(company.npsScore);
                    const chip = company.verdict ? POSTURE_CHIP[company.verdict.posture] : null;
                    const TrendIcon = company.trend > 1 ? TrendingUp : company.trend < -1 ? TrendingDown : ArrowRight;
                    const trendColor = company.trend > 1 ? '#2EA86A' : company.trend < -1 ? '#D94F63' : '#9082B8';
                    return (
                      <div key={company.id} className="relative flex items-center gap-3 py-3 hover:bg-muted/20 transition-colors group"
                        style={{ paddingLeft: '17px', paddingRight: '20px', borderLeft: `3px solid ${band.color}` }}>
                        {/* Compte */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate">{company.name}</p>
                          {company.subtitle && <p className="text-[11px] text-muted-foreground truncate">{company.subtitle}</p>}
                          {chip && (
                            <span className="inline-block mt-1 uppercase"
                              style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '8px', fontWeight: 700, padding: '2px 7px', borderRadius: '999px', letterSpacing: '.06em', color: chip.color, background: chip.bg }}>
                              Prio {company.verdict!.score} · {chip.label}
                            </span>
                          )}
                        </div>
                        {/* NPS */}
                        <div className="w-28 flex items-center justify-center gap-1.5">
                          {company.npsScore != null ? (
                            <>
                              <span style={{ fontFamily: 'Epilogue, sans-serif', fontWeight: 800, fontSize: '16px', color: band.color }}>{company.npsScore}</span>
                              <span className="uppercase" style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '8px', fontWeight: 700, padding: '2px 5px', borderRadius: '4px', color: band.color, background: band.bg }}>{band.label}</span>
                              <TrendIcon className="size-3" style={{ color: trendColor }} />
                            </>
                          ) : <span className="text-xs text-muted-foreground">—</span>}
                        </div>
                        {/* Vu */}
                        <span className="w-12 text-right font-semibold" style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '11px', color: 'var(--t3, #9082B8)' }}>{daysText}</span>
                        {/* Action */}
                        <button onClick={() => navigate(`/company/${company.id}`)}
                          className="w-10 flex justify-end" title="Ouvrir le compte">
                          <span className="size-8 rounded-full flex items-center justify-center text-white" style={{ background: '#6E50C8' }}>
                            <ArrowRight className="size-4" />
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </KnowrCard>
            )}
            </div>
          </div>

          {/* ── RIGHT : Feed signaux + Activité ─────────────────────────── */}
          <div className="flex flex-col gap-6">
            <div>
            <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
              <h2 className="text-xl font-black flex items-center gap-2"><Zap className="size-5 text-primary" /> Feed signaux</h2>
              <button
                onClick={runVeille}
                disabled={veilleRunning}
                className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline disabled:opacity-50"
              >
                {veilleRunning ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCcw className="size-3.5" />}
                {veilleRunning ? 'Veille en cours…' : 'Lancer la veille'}
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-3">Actualités des comptes (LinkedIn · presse · web) — valide ou écarte chaque info.</p>
            {veilleMsg && <p className="text-[11px] text-muted-foreground mb-3" style={{ fontFamily: 'var(--mono)' }}>{veilleMsg}</p>}

            {signalsFeed.filter(s => signalState[s.id] !== 'no').length === 0 ? (
              <KnowrCard className="p-6 text-center rounded-2xl">
                <Zap className="mx-auto mb-3 size-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground mb-3">Aucune actualité encore. Lance la veille pour scanner tes comptes.</p>
                <button onClick={runVeille} disabled={veilleRunning}
                  className="text-xs font-semibold text-white px-3 py-2 rounded-xl disabled:opacity-50" style={{ background: '#6E50C8' }}>
                  {veilleRunning ? 'Veille en cours…' : 'Lancer la veille'}
                </button>
              </KnowrCard>
            ) : (
              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                {signalsFeed.filter(s => signalState[s.id] !== 'no').map(s => {
                  const validated = signalState[s.id] === 'ok';
                  return (
                    <KnowrCard key={s.id} className="p-4 rounded-2xl">
                      <div className="flex items-start gap-3">
                        <div className="size-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: s.bg }}>
                          <Zap className="size-4" style={{ color: s.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            {s.kind === 'company' ? (
                              <p className="text-sm font-bold leading-tight">{s.title}</p>
                            ) : (
                              <button onClick={() => s.entityId && navigate(`/contact/${s.entityId}`)}
                                className="text-sm font-bold leading-tight text-left hover:text-primary transition-colors">
                                {s.entityName}
                              </button>
                            )}
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase flex-shrink-0" style={{ color: s.color, background: s.bg, fontFamily: 'var(--mono)' }}>{s.tag}</span>
                          </div>
                          {s.text && <p className="text-xs text-muted-foreground line-clamp-3 mb-2">{s.text}</p>}
                          {/* Source · date · entité */}
                          <div className="flex items-center gap-2 flex-wrap mb-2 text-[10px] text-muted-foreground" style={{ fontFamily: 'var(--mono)' }}>
                            {s.source && (
                              s.sourceUrl
                                ? <a href={s.sourceUrl} target="_blank" rel="noopener noreferrer" className="px-1.5 py-0.5 rounded" style={{ background: 'var(--bg2)', color: 'var(--violet-d)' }}>{s.source} ↗</a>
                                : <span className="px-1.5 py-0.5 rounded" style={{ background: 'var(--bg2)' }}>{s.source}</span>
                            )}
                            {s.when && <span>{s.when}</span>}
                            {s.kind === 'company' && s.entityId && (
                              <button onClick={() => navigate(`/company/${s.entityId}`)} className="hover:text-primary">· {s.entityName}</button>
                            )}
                          </div>
                          {/* Valider / écarter */}
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground" style={{ fontFamily: 'var(--mono)' }}>Pertinent ?</span>
                            <button
                              onClick={() => setSignalStatus(s.id, 'ok', s.kind)}
                              className="size-6 rounded-lg flex items-center justify-center border transition-colors"
                              style={validated ? { background: '#2EA86A', borderColor: '#2EA86A', color: '#fff' } : { borderColor: 'var(--border)', color: 'var(--t3)' }}
                              title="Valider"
                            >
                              <Check className="size-3.5" />
                            </button>
                            <button
                              onClick={() => setSignalStatus(s.id, 'no', s.kind)}
                              className="size-6 rounded-lg flex items-center justify-center border border-border text-muted-foreground hover:border-destructive hover:text-destructive transition-colors"
                              title="Écarter"
                            >
                              <X className="size-3.5" />
                            </button>
                            {validated && <span className="text-[10px] font-semibold text-success ml-1">Validé ✓</span>}
                          </div>
                        </div>
                      </div>
                    </KnowrCard>
                  );
                })}
              </div>
            )}
            </div>

            {/* Activité Tohu */}
            <KnowrCard className="p-6 flex flex-col rounded-2xl">
              <div className="flex items-center gap-2 mb-5">
                <Activity className="size-5 text-primary" />
                <h2 className="text-xl font-black">Activité Tohu</h2>
                <KnowrBadge variant="violet" size="sm">Aujourd'hui</KnowrBadge>
              </div>
              {activity.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
                  <Activity className="size-8 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">L'activité apparaîtra ici une fois vos sources connectées.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                  {activity.map((a) => {
                    const Icon = a.icon;
                    return (
                      <button key={a.id}
                        onClick={() => a.link && navigate(a.link)}
                        disabled={!a.link}
                        className={`w-full text-left p-3 rounded-2xl transition-all ${a.link ? 'hover:bg-muted/30 cursor-pointer' : 'cursor-default bg-muted/10'}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`size-9 ${a.bgColor} rounded-full flex items-center justify-center flex-shrink-0`}>
                            <Icon className={`size-4 ${a.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm mb-1">{a.title}</p>
                            <p className="text-xs text-muted-foreground mb-1 line-clamp-2">{a.description}</p>
                            <p className="text-[10px] text-muted-foreground">{a.time}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </KnowrCard>
          </div>
        </div>

        {/* ══ Bohu — mémoire relationnelle d'équipe (bientôt) ═══════════════ */}
        <div className="p-6 rounded-2xl mt-6" style={{ background: 'linear-gradient(135deg, var(--night), var(--night2))' }}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.10)' }}>
                <Network className="size-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg font-black text-white">Bohu</h2>
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/15 text-white">Bientôt</span>
                </div>
                <p className="text-sm text-white/70 max-w-md">La mémoire relationnelle de ton entreprise. Pose une question, obtiens une réponse ancrée dans le graphe de ton équipe — chaque affirmation porte sa source.</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
            {['Que sait déjà l\'équipe sur un compte ?', 'Qui connaît quelqu\'un chez un prospect ?', 'Qui a déjà géré cette relation ?', 'Qui bouge sur tout le portefeuille ?'].map((q) => (
              <div key={q} className="text-xs text-white/60 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)' }}>
                {q}
              </div>
            ))}
          </div>
        </div>

      </div>

      <style>{`
        @keyframes wave {
          0%   { transform: rotate(0deg); }
          10%  { transform: rotate(14deg); }
          20%  { transform: rotate(-8deg); }
          30%  { transform: rotate(14deg); }
          40%  { transform: rotate(-4deg); }
          50%  { transform: rotate(10deg); }
          60%  { transform: rotate(0deg); }
          100% { transform: rotate(0deg); }
        }
        .animate-wave { animation: wave 2s ease-in-out infinite; display: inline-block; transform-origin: 70% 70%; }
      `}</style>
    </div>
  );
}
