import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Calendar, Sparkles, Plus, Download, X, AlertCircle,
  CheckCircle2, Loader2, Activity, Zap, Database,
  UserCheck, TrendingUp, Cake, Briefcase, ArrowUp,
  Target, Network, Users, Star, RefreshCcw
} from 'lucide-react';
import KnowyCard from './knowy/KnowyCard';
import KnowyButton from './knowy/KnowyButton';
import KnowyBadge from './knowy/KnowyBadge';
import { useCurrentProfile } from '../../hooks/useCurrentProfile';
import { useMeetings } from '../../hooks/useMeetings';
import { supabase } from '../../lib/supabase';
import { getActiveOrganizationId } from '../../lib/api/org';
import type { Meeting as DomainMeeting } from '../../types/domain';

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
  notification_urgent:   { text: 'text-destructive',  bg: 'bg-destructive/10'  },
  notification_important:{ text: 'text-amber-600',     bg: 'bg-amber-600/10'    },
  notification_info:     { text: 'text-primary',       bg: 'bg-primary/10'      },
  profile_enriched:      { text: 'text-success',       bg: 'bg-success/10'      },
  brief_ready:           { text: 'text-primary',       bg: 'bg-primary/10'      },
  crm_sync:              { text: 'text-blue-600',      bg: 'bg-blue-600/10'     },
  alert:                 { text: 'text-amber-600',     bg: 'bg-amber-600/10'    },
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
  ready:       { badge: 'Brief prêt',            variant: 'sage'   as const, icon: CheckCircle2 },
  generating:  { badge: 'En génération',         variant: 'amber'  as const, icon: Loader2      },
  to_generate: { badge: 'À générer',             variant: 'muted'  as const, icon: Sparkles     },
  insufficient:{ badge: 'Données insuffisantes', variant: 'coral'  as const, icon: AlertCircle  },
  consulted:   { badge: 'Consulté',              variant: 'violet' as const, icon: CheckCircle2 },
}[status]);

// ─── Component ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const { profile } = useCurrentProfile();
  const { meetings: domainMeetings, reload: reloadMeetings } = useMeetings();
  const [showPluginBanner, setShowPluginBanner] = useState(true);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [impact, setImpact] = useState<WeeklyImpact | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [totalContacts, setTotalContacts] = useState<number>(0);
  const [totalEmails, setTotalEmails] = useState<number>(0);
  const [displayedEmails, setDisplayedEmails] = useState<number>(0);

  async function handleCalendarSync() {
    if (!supabase || syncing) return;
    setSyncing(true);
    setSyncMsg(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Non authentifié');
      const providerToken = session.provider_token;
      if (!providerToken) {
        setSyncMsg({ type: 'error', text: 'Token Google expiré — déconnectez-vous et reconnectez-vous avec Google.' });
        return;
      }
      const orgId = await getActiveOrganizationId();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      // 1. Sync Calendar
      const calRes = await fetch(`${supabaseUrl}/functions/v1/sync-google-calendar`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: orgId, providerToken }),
      });
      const calData = await calRes.json();
      if (!calRes.ok) throw new Error(calData.error || 'Erreur sync calendar');

      // 2. Ingest Gmail metadata (best-effort — don't fail if token lacks gmail scope)
      try {
        await fetch(`${supabaseUrl}/functions/v1/ingest-communication`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ organizationId: orgId, providerToken, lookbackDays: 90 }),
        });
      } catch {
        // Gmail ingestion is best-effort — calendar sync success is enough
      }

      setSyncMsg({ type: 'success', text: `✓ ${calData.stats?.created ?? 0} nouvelles réunions · Emails synchronisés` });
      reloadMeetings?.();
    } catch (e: any) {
      setSyncMsg({ type: 'error', text: e.message });
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMsg(null), 5000);
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
      <KnowyCard
        hover
        delay={i * 0.05}
        onClick={() => navigate(`/meeting/${meeting.id}`)}
        className="p-5"
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
              <KnowyBadge variant="blue" size="sm">{meeting.category}</KnowyBadge>
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
                <KnowyBadge variant={statusConfig.variant} size="sm">{statusConfig.badge}</KnowyBadge>
              </div>
              {meeting.briefStatus === 'ready' && (
                <KnowyButton variant="primary" size="sm" icon={<Sparkles className="size-3" />}>
                  Consulter
                </KnowyButton>
              )}
              {meeting.briefStatus === 'to_generate' && (
                <KnowyButton variant="secondary" size="sm" icon={<Sparkles className="size-3" />}>
                  Générer
                </KnowyButton>
              )}
              {meeting.briefStatus === 'generating' && (
                <KnowyButton variant="ghost" size="sm" disabled>
                  <Loader2 className="size-3 animate-spin" />
                </KnowyButton>
              )}
            </div>
          </div>
        </div>
      </KnowyCard>
    );
  }

  return (
    <div className="size-full bg-background overflow-auto">
      <div className="max-w-7xl mx-auto px-4 py-5 md:px-8 md:py-8">

        {/* Plugin Banner */}
        {showPluginBanner && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-2xl p-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
              <div className="size-10 bg-primary/20 rounded-xl flex items-center justify-center">
                <Sparkles className="size-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Activez le Coach en réunion</p>
                <p className="text-sm text-muted-foreground">Téléchargez le plug-in pour Teams, Meet &amp; Zoom</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <KnowyButton variant="secondary" size="sm" icon={<Download className="size-4" />}
                onClick={() => navigate('/coaching')}>
                Télécharger
              </KnowyButton>
              <button onClick={() => setShowPluginBanner(false)} className="p-2 hover:bg-black/5 rounded-lg transition-colors">
                <X className="size-4 text-muted-foreground" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-black mb-2 sm:text-4xl md:text-5xl">
                Bonjour{firstName ? ` ${firstName}` : ''} <span className="inline-block animate-wave">👋</span>
              </h1>
              <p className="text-lg text-muted-foreground">Votre vue d'ensemble</p>
            </div>
            <div className="flex flex-col gap-2 sm:mt-1 sm:items-end">
              <button
                onClick={handleCalendarSync}
                disabled={syncing}
                className="flex items-center gap-2 px-4 py-2 bg-card border border-border hover:border-primary/40 hover:bg-muted/50 rounded-xl text-sm font-medium transition-all disabled:opacity-60"
              >
                {syncing
                  ? <><Loader2 className="size-4 animate-spin text-primary" /> Synchronisation…</>
                  : <><RefreshCcw className="size-4 text-primary" /> Sync Google Calendar</>
                }
              </button>
              {syncMsg && (
                <p className={`text-xs px-3 py-1.5 rounded-lg ${
                  syncMsg.type === 'success' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                }`}>
                  {syncMsg.text}
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Widget Impact + KPIs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 gap-4 mb-8 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]"
        >
          <KnowyCard className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
            <div className="flex items-center gap-2 mb-4">
              <Target className="size-5 text-primary" />
              <h3 className="font-bold">Votre impact cette semaine</h3>
            </div>
            {impact ? (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-3xl font-black mb-1">{impact.profilesEnriched}</p>
                    <p className="text-xs text-muted-foreground">Profils enrichis</p>
                  </div>
                  <div>
                    <p className="text-3xl font-black mb-1">{impact.insightsCaptured}</p>
                    <p className="text-xs text-muted-foreground">Insights capturés</p>
                  </div>
                  <div>
                    <p className="text-3xl font-black mb-1">{Math.round(impact.timeSavedMinutes / 60)}h</p>
                    <p className="text-xs text-muted-foreground">Temps économisé</p>
                  </div>
                </div>
                {impact.evolutionPct !== 0 && (
                  <div className="mt-4 pt-3 border-t border-border flex items-center gap-2 text-success">
                    <ArrowUp className="size-4" />
                    <span className="text-sm font-semibold">+{impact.evolutionPct}% vs semaine dernière</span>
                  </div>
                )}
              </>
            ) : (
              <div className="text-sm text-muted-foreground py-2">
                Les stats apparaîtront après vos premières réunions.
              </div>
            )}
          </KnowyCard>

          <KnowyCard className="p-5">
            <Calendar className="size-5 text-primary mb-3" />
            <p className="text-3xl font-black mb-1">{impact?.weeklyMeetings ?? weeklyMeetingsCount}</p>
            <p className="text-xs text-muted-foreground">Réunions semaine</p>
          </KnowyCard>

          <KnowyCard className="p-5">
            <Network className="size-5 text-success mb-3" />
            <p className="text-3xl font-black mb-1">{totalContacts > 0 ? totalContacts : (impact?.activeContacts ?? '—')}</p>
            <p className="text-xs text-muted-foreground">Contacts</p>
          </KnowyCard>

          <KnowyCard className="p-5">
            <div className="flex items-center justify-between mb-3">
              <Mail className="size-5 text-primary" />
              {totalEmails > 0 && (
                <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full animate-pulse">
                  LIVE
                </span>
              )}
            </div>
            <p className="text-3xl font-black mb-1 tabular-nums">
              {displayedEmails > 0 ? displayedEmails.toLocaleString('fr-FR') : '—'}
            </p>
            <p className="text-xs text-muted-foreground">Mails synchronisés</p>
          </KnowyCard>

        </motion.div>

        {/* Main 60/40 grid */}
        <div className="grid grid-cols-1 gap-6 mb-8 items-start lg:grid-cols-[60%_40%]">

          {/* LEFT — Meetings */}
          <div className="flex flex-col gap-6">
            {/* Today */}
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-2xl font-black mb-1">Aujourd'hui</h2>
                  <p className="text-sm font-mono text-muted-foreground uppercase tracking-wider">
                    {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                </div>
                <KnowyButton variant="secondary" size="sm" icon={<Plus className="size-4" />}
                  onClick={() => navigate('/meetings')}>
                  Voir tout
                </KnowyButton>
              </div>

              {todaysMeetings.length === 0 ? (
                <KnowyCard className="p-8 text-center">
                  <Calendar className="mx-auto mb-3 size-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">Aucune réunion aujourd'hui.</p>
                </KnowyCard>
              ) : (
                <div className="space-y-3">
                  {todaysMeetings.map((m, i) => <MeetingCard key={m.id} meeting={m} i={i} />)}
                </div>
              )}
            </div>

            {/* Upcoming */}
            {upcomingMeetings.length > 0 && (
              <div>
                <h2 className="text-2xl font-black mb-4">À venir</h2>
                <div className="space-y-3">
                  {upcomingMeetings.map((m, i) => <MeetingCard key={m.id} meeting={m} i={i} />)}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT — Activity feed */}
          <KnowyCard className="p-6 flex flex-col min-h-[400px]">
            <div className="flex items-center gap-2 mb-6">
              <Activity className="size-5 text-primary" />
              <h2 className="text-lg font-bold">Activité Knowy</h2>
              <KnowyBadge variant="violet" size="sm">Aujourd'hui</KnowyBadge>
            </div>

            {activity.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                <Activity className="size-8 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">L'activité apparaîtra ici une fois vos sources connectées.</p>
              </div>
            ) : (
              <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                {activity.map((a) => {
                  const Icon = a.icon;
                  return (
                    <button key={a.id}
                      onClick={() => a.link && navigate(a.link)}
                      disabled={!a.link}
                      className={`w-full text-left p-3 rounded-xl transition-all ${a.link ? 'hover:bg-muted/30 cursor-pointer' : 'cursor-default bg-muted/10'}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`size-9 ${a.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
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

            <div className="mt-4 pt-4 border-t border-border flex-shrink-0">
              <KnowyButton variant="ghost" size="sm" className="w-full" onClick={() => navigate('/dashboard')}>
                Voir toute l'activité →
              </KnowyButton>
            </div>
          </KnowyCard>
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
