import { motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useMeetings } from '../../hooks/useMeetings';
import {
  Calendar,
  Search,
  Filter,
  Video,
  MapPin,
  Star,
  Clock,
  Sparkles,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Database,
  ArrowUpRight,
  TrendingUp,
  X,
  RefreshCw,
} from 'lucide-react';
import KnowrCard from './knowr/KnowrCard';
import KnowrBadge from './knowr/KnowrBadge';
import KnowrButton from './knowr/KnowrButton';
import PageHeader from './knowr/PageHeader';
import { supabase } from '../../lib/supabase';
import { getActiveOrganizationId } from '../../lib/api/org';

interface Meeting {
  id: string;
  title: string;
  company: string;
  logo: string;
  participants: { name: string; role?: string }[];
  date: string;
  time: string;
  durationMin: number | null;
  format: 'video' | 'physical';
  location?: string;
  category: string;
  relationScore: number;
  briefStatus: 'ready' | 'generating' | 'to_generate' | 'insufficient' | 'consulted';
  hasDecisionMaker: boolean;
  isExternal: boolean;
  crmSynced: boolean;
  crmUrl?: string;
  isPast: boolean;
}

export default function Meetings() {
  const navigate = useNavigate();
  const { meetings: domainMeetings, reload } = useMeetings();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTime, setFilterTime] = useState<'all' | 'future' | 'past'>('all');
  const [filterType, setFilterType] = useState<'all' | 'external' | 'internal'>('all');
  const [filterBrief, setFilterBrief] = useState<'all' | 'ready' | 'to_generate' | 'consulted'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [meetingSyncs, setMeetingSyncs] = useState<Record<string, boolean>>({});
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ stats?: any; error?: string } | null>(null);

  async function handleGoogleCalendarSync() {
    if (!supabase || syncing) return;
    setSyncing(true);
    setSyncResult(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Non authentifié');

      const orgId = await getActiveOrganizationId();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const headers = { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' };
      const providerToken = session.provider_token;

      // Détecte les providers connectés
      const { data: connectors } = await supabase
        .from('connectors')
        .select('provider, status')
        .eq('organization_id', orgId)
        .eq('status', 'connected');

      const connected = new Set((connectors ?? []).map((c: any) => c.provider as string));
      const hasGoogle    = connected.has('google');
      const hasMicrosoft = connected.has('microsoft');

      if (!hasGoogle && !hasMicrosoft) {
        setSyncResult({ error: 'Aucun compte connecté. Allez dans Paramètres → Connexions.' });
        return;
      }

      let combinedStats = { total_events: 0, meeting_events: 0, created: 0, updated: 0, skipped: 0 };

      // ── Google ────────────────────────────────────────────────────────────
      if (hasGoogle) {
        if (providerToken) {
          const res = await fetch(`${supabaseUrl}/functions/v1/sync-google-calendar`, {
            method: 'POST', headers,
            body: JSON.stringify({ organizationId: orgId, providerToken }),
          });
          const data = await res.json();
          if (res.ok && data.stats) {
            combinedStats.total_events   += data.stats.total_events   ?? 0;
            combinedStats.meeting_events += data.stats.meeting_events ?? 0;
            combinedStats.created        += data.stats.created        ?? 0;
            combinedStats.updated        += data.stats.updated        ?? 0;
          }
        }
        // Emails : ingest résout le token depuis connectors.metadata (stocké par sync-google-calendar)
        fetch(`${supabaseUrl}/functions/v1/ingest-communication`, {
          method: 'POST', headers,
          body: JSON.stringify({ organizationId: orgId, providerToken: providerToken ?? null, provider: 'google', lookbackDays: 3650 }),
        }).catch(() => {});
      }

      // ── Microsoft / Outlook / Teams ───────────────────────────────────────
      if (hasMicrosoft) {
        const { data: msConnector } = await supabase
          .from('connectors')
          .select('metadata')
          .eq('organization_id', orgId)
          .eq('provider', 'microsoft')
          .eq('status', 'connected')
          .maybeSingle();
        const msToken = (msConnector?.metadata as any)?.access_token ?? (!hasGoogle ? providerToken : null);

        if (msToken) {
          const res = await fetch(`${supabaseUrl}/functions/v1/sync-outlook-calendar`, {
            method: 'POST', headers,
            body: JSON.stringify({ organizationId: orgId, providerToken: msToken }),
          });
          const data = await res.json();
          if (res.ok && data.stats) {
            combinedStats.total_events   += data.stats.total_events   ?? 0;
            combinedStats.meeting_events += data.stats.meeting_events ?? 0;
            combinedStats.created        += data.stats.created        ?? 0;
            combinedStats.updated        += data.stats.updated        ?? 0;
          }
        }
        fetch(`${supabaseUrl}/functions/v1/ingest-communication`, {
          method: 'POST', headers,
          body: JSON.stringify({ organizationId: orgId, providerToken: msToken ?? null, provider: 'microsoft', lookbackDays: 3650 }),
        }).catch(() => {});
      }

      setSyncResult({ stats: combinedStats });
      reload?.();
    } catch (e: any) {
      setSyncResult({ error: e.message || 'Erreur inattendue' });
    } finally {
      setSyncing(false);
    }
  }

  const today = new Date().toISOString().slice(0, 10);

  // Map domain meetings → display Meeting
  const allMeetings: Meeting[] = useMemo(() =>
    domainMeetings.map(m => {
      const names: string[] = (m as any).participantNames ?? [];
      const durationMin = m.endsAt
        ? Math.round((new Date(m.endsAt).getTime() - new Date(m.startsAt).getTime()) / 60000)
        : null;
      return {
        id: m.id,
        title: m.title,
        company: m.company || '—',
        logo: m.company ? m.company[0].toUpperCase() : '?',
        participants: names.map(n => ({ name: n })),
        date: m.startsAt.slice(0, 10),
        time: new Date(m.startsAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        durationMin,
        format: (m.format === 'physical' ? 'physical' : 'video') as 'video' | 'physical',
        location: m.location ?? undefined,
        category: (m as any).category ?? 'Réunion',
        relationScore: m.importanceScore ?? 0,
        briefStatus: ((m.briefStatus as Meeting['briefStatus']) ?? 'to_generate'),
        hasDecisionMaker: (m as any).has_decision_maker ?? false,
        isExternal: (m as any).is_external ?? true,
        crmSynced: false,
        crmUrl: undefined,
        isPast: m.startsAt.slice(0, 10) < today,
      };
    }),
  [domainMeetings, today]);

  // Filtrage
  const filteredMeetings = allMeetings.filter(meeting => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !meeting.title.toLowerCase().includes(query) &&
        !meeting.company.toLowerCase().includes(query) &&
        !meeting.participants.some(p => p.name.toLowerCase().includes(query))
      ) {
        return false;
      }
    }
    if (filterTime === 'future' && meeting.isPast) return false;
    if (filterTime === 'past' && !meeting.isPast) return false;
    if (filterType === 'external' && !meeting.isExternal) return false;
    if (filterType === 'internal' && meeting.isExternal) return false;
    if (filterBrief === 'ready' && meeting.briefStatus !== 'ready') return false;
    if (filterBrief === 'to_generate' && meeting.briefStatus !== 'to_generate') return false;
    if (filterBrief === 'consulted' && meeting.briefStatus !== 'consulted') return false;
    return true;
  });

  // Tri par date (futures en premier, puis passées)
  const sortedMeetings = [...filteredMeetings].sort((a, b) => {
    if (a.isPast !== b.isPast) return a.isPast ? 1 : -1;
    return new Date(a.date + ' ' + a.time).getTime() - new Date(b.date + ' ' + b.time).getTime();
  });

  const futureMeetings = sortedMeetings.filter(m => !m.isPast);
  const pastMeetings = sortedMeetings.filter(m => m.isPast);

  const getBriefStatusConfig = (status: Meeting['briefStatus']) => {
    const configs = {
      ready:        { badge: 'Brief prêt',            variant: 'sage'   as const, icon: CheckCircle2 },
      generating:   { badge: 'En génération',         variant: 'amber'  as const, icon: Loader2      },
      to_generate:  { badge: 'À générer',             variant: 'muted'  as const, icon: Sparkles     },
      insufficient: { badge: 'Données insuffisantes', variant: 'coral'  as const, icon: AlertCircle  },
      consulted:    { badge: 'Consulté',              variant: 'violet' as const, icon: CheckCircle2 },
    };
    return configs[status];
  };

  const getRelationScoreColor = (score: number) => {
    if (score > 65) return 'text-success';
    if (score >= 35) return 'text-amber-600';
    return 'text-destructive';
  };

  const getRelationScoreBg = (score: number) => {
    if (score > 65) return 'bg-success/10';
    if (score >= 35) return 'bg-amber-600/10';
    return 'bg-destructive/10';
  };

  const activeFiltersCount =
    (filterTime !== 'all' ? 1 : 0) +
    (filterType !== 'all' ? 1 : 0) +
    (filterBrief !== 'all' ? 1 : 0);

  const toggleMeetingSync = (meetingId: string, currentSync: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    setMeetingSyncs(prev => ({ ...prev, [meetingId]: !currentSync }));
  };

  const MeetingCardComponent = ({ meeting, delay }: { meeting: Meeting; delay: number }) => {
    const statusConfig = getBriefStatusConfig(meeting.briefStatus);
    const StatusIcon = statusConfig.icon;
    const isSynced = meetingSyncs[meeting.id] !== undefined ? meetingSyncs[meeting.id] : meeting.crmSynced;
    const durationLabel = meeting.durationMin && meeting.durationMin > 0
      ? meeting.durationMin >= 60
        ? `${Math.floor(meeting.durationMin / 60)}h${meeting.durationMin % 60 > 0 ? String(meeting.durationMin % 60).padStart(2, '0') : ''}`
        : `${meeting.durationMin} min`
      : null;

    return (
      <KnowrCard
        hover
        delay={delay}
        onClick={() => navigate(`/meeting/${meeting.id}`)}
        className="p-4 sm:p-6 cursor-pointer rounded-2xl"
      >
        {/* ── MOBILE layout (< sm) ──────────────────────────────── */}
        <div className="flex flex-col gap-3 sm:hidden">
          {/* Row 1 : logo + titre + score */}
          <div className="flex items-start gap-3">
            <div
              className="size-10 rounded-xl flex-shrink-0 flex items-center justify-center font-bold text-white text-base"
              style={{ background: meeting.company === 'Optee' ? '#6E50C8' : meeting.company === 'Limayrac' ? '#0B8878' : '#9082B8' }}
            >
              {meeting.logo}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold leading-tight line-clamp-2 mb-0.5">{meeting.title}</h3>
              <p className="text-xs text-muted-foreground font-medium">{meeting.company}</p>
            </div>
            {meeting.relationScore > 0 && (
              <div className={`flex items-center justify-center size-9 rounded-full flex-shrink-0 ${getRelationScoreBg(meeting.relationScore)}`}>
                <span className={`font-mono font-bold text-xs ${getRelationScoreColor(meeting.relationScore)}`}>
                  {meeting.relationScore}
                </span>
              </div>
            )}
          </div>

          {/* Row 2 : date · heure · durée · format */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">
              {new Date(meeting.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
            <span className="font-mono">{meeting.time}</span>
            {durationLabel && (
              <span className="flex items-center gap-1">
                <Clock className="size-3" />
                {durationLabel}
              </span>
            )}
            <span className="flex items-center gap-1">
              {meeting.format === 'video' ? <Video className="size-3" /> : <MapPin className="size-3" />}
              {meeting.format === 'video' ? 'Visio' : (meeting.location ?? 'Présentiel')}
            </span>
            {meeting.hasDecisionMaker && (
              <span className="flex items-center gap-1 text-primary font-semibold">
                <Star className="size-3 fill-primary" />
                Décideur
              </span>
            )}
          </div>

          {/* Row 3 : participants */}
          {meeting.participants.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {meeting.participants.slice(0, 3).map((p, i) => (
                <div key={i} className="flex items-center gap-1 px-2 py-0.5 bg-muted/50 rounded-full border border-border">
                  <div className="size-4 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[8px] font-bold flex-shrink-0">
                    {p.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-[11px] font-medium truncate max-w-[80px]">{p.name}</span>
                </div>
              ))}
              {meeting.participants.length > 3 && (
                <div className="flex items-center px-2 py-0.5 bg-muted/30 rounded-full border border-border">
                  <span className="text-[11px] text-muted-foreground">+{meeting.participants.length - 3}</span>
                </div>
              )}
            </div>
          )}

          {/* Row 4 : footer */}
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <div className="flex items-center gap-1.5">
              <StatusIcon className={`size-3.5 ${statusConfig.badge === 'En génération' ? 'animate-spin' : ''}`} />
              <KnowrBadge variant={statusConfig.variant} size="sm">{statusConfig.badge}</KnowrBadge>
            </div>
            <div className="flex items-center gap-1.5">
              {meeting.isPast ? (
                <button
                  onClick={(e) => toggleMeetingSync(meeting.id, isSynced, e)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    isSynced
                      ? 'bg-success/10 text-success border border-success'
                      : 'bg-muted/50 text-muted-foreground border border-border'
                  }`}
                >
                  <Database className="size-3.5" />
                  {isSynced ? 'Synchronisé' : 'Sync'}
                </button>
              ) : (
                <>
                  {meeting.briefStatus === 'ready' && (
                    <KnowrButton variant="primary" size="sm" icon={<Sparkles className="size-3.5" />}>Brief</KnowrButton>
                  )}
                  {meeting.briefStatus === 'to_generate' && (
                    <KnowrButton variant="secondary" size="sm" icon={<Sparkles className="size-3.5" />}>Générer</KnowrButton>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── DESKTOP layout (>= sm) ───────────────────────────── */}
        <div className="hidden sm:flex items-start gap-6">
          {/* Date/Time */}
          <div className="flex flex-col items-center min-w-[80px]">
            <div className="text-xs text-muted-foreground uppercase mb-1">
              {new Date(meeting.date).toLocaleDateString('fr-FR', { weekday: 'short' })}
            </div>
            <div className="text-3xl font-black mb-1">
              {new Date(meeting.date).getDate()}
            </div>
            <div className="text-sm text-muted-foreground mb-2">
              {new Date(meeting.date).toLocaleDateString('fr-FR', { month: 'short' })}
            </div>
            <div className="text-sm font-mono font-semibold">{meeting.time}</div>
          </div>

          <div className="h-auto w-px bg-border" />

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div
                  className="size-10 rounded-xl flex-shrink-0 flex items-center justify-center font-bold text-white text-base"
                  style={{ background: meeting.company === 'Optee' ? '#6E50C8' : meeting.company === 'Limayrac' ? '#0B8878' : '#9082B8' }}
                >
                  {meeting.logo}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold leading-tight truncate mb-0.5">{meeting.title}</h3>
                  <p className="text-sm text-muted-foreground font-medium">{meeting.company}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {meeting.relationScore > 0 && (
                  <div className="flex flex-col items-center" title="Score relationnel moyen des participants">
                    <div className={`flex items-center justify-center size-10 rounded-full ${getRelationScoreBg(meeting.relationScore)}`}>
                      <span className={`font-mono font-bold text-sm ${getRelationScoreColor(meeting.relationScore)}`}>
                        {meeting.relationScore}
                      </span>
                    </div>
                    <span className="text-[9px] text-muted-foreground mt-0.5">Score</span>
                  </div>
                )}
                <KnowrBadge variant={meeting.isExternal ? 'violet' : 'muted'} size="sm">
                  {meeting.category}
                </KnowrBadge>
              </div>
            </div>

            {meeting.participants.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {meeting.participants.slice(0, 4).map((p, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 bg-muted/50 rounded-full border border-border">
                    <div className="size-5 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[9px] font-bold flex-shrink-0">
                      {p.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-xs font-medium text-foreground truncate max-w-[100px]">{p.name}</span>
                  </div>
                ))}
                {meeting.participants.length > 4 && (
                  <div className="flex items-center px-2.5 py-1 bg-muted/30 rounded-full border border-border">
                    <span className="text-xs text-muted-foreground">+{meeting.participants.length - 4}</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground mb-3">
              <div className="flex items-center gap-1.5">
                {meeting.format === 'video' ? <Video className="size-3.5" /> : <MapPin className="size-3.5" />}
                <span>{meeting.format === 'video' ? 'Visio' : (meeting.location ?? 'Présentiel')}</span>
              </div>
              {durationLabel && (
                <div className="flex items-center gap-1.5">
                  <Clock className="size-3.5" />
                  <span>{durationLabel}</span>
                </div>
              )}
              {meeting.hasDecisionMaker && (
                <div className="flex items-center gap-1 text-primary font-semibold">
                  <Star className="size-3.5 fill-primary" />
                  <span>Décideur présent</span>
                </div>
              )}
              <KnowrBadge variant="blue" size="sm">{meeting.category}</KnowrBadge>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div className="flex items-center gap-2">
                <StatusIcon className={`size-4 ${statusConfig.badge === 'En génération' ? 'animate-spin' : ''}`} />
                <KnowrBadge variant={statusConfig.variant} size="md">{statusConfig.badge}</KnowrBadge>
              </div>
              <div className="flex items-center gap-2">
                {meeting.crmUrl && (
                  <KnowrButton
                    variant="ghost" size="sm"
                    icon={<ArrowUpRight className="size-4" />}
                    onClick={(e) => { e.stopPropagation(); window.open(meeting.crmUrl, '_blank'); }}
                  >
                    Voir dans CRM
                  </KnowrButton>
                )}
                {meeting.isPast ? (
                  <button
                    onClick={(e) => toggleMeetingSync(meeting.id, isSynced, e)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all ${
                      isSynced
                        ? 'bg-success/10 text-success border-2 border-success hover:bg-success/20'
                        : 'bg-muted/50 text-muted-foreground border-2 border-border hover:bg-muted'
                    }`}
                  >
                    <Database className="size-4" />
                    {isSynced ? 'Synchronisé' : 'Synchroniser'}
                  </button>
                ) : (
                  <>
                    {meeting.briefStatus === 'ready' && (
                      <KnowrButton variant="primary" size="sm" icon={<Sparkles className="size-4" />}>Voir le brief</KnowrButton>
                    )}
                    {meeting.briefStatus === 'to_generate' && (
                      <KnowrButton variant="secondary" size="sm" icon={<Sparkles className="size-4" />}>Générer le brief</KnowrButton>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </KnowrCard>
    );
  };

  return (
    <div className="size-full overflow-auto" style={{ background: 'var(--color-background)' }}>
      <div className="max-w-7xl mx-auto px-4 py-5 md:px-8 md:py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <PageHeader
            title="Réunions"
            subtitle={`${sortedMeetings.length} réunion${sortedMeetings.length > 1 ? 's' : ''}${activeFiltersCount > 0 ? ` • ${activeFiltersCount} filtre${activeFiltersCount > 1 ? 's' : ''} actif${activeFiltersCount > 1 ? 's' : ''}` : ''}`}
            actions={
              <>
                <KnowrButton
                  variant="secondary"
                  size="md"
                  icon={syncing ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                  onClick={handleGoogleCalendarSync}
                  disabled={syncing}
                >
                  <span className="hidden sm:inline">{syncing ? 'Synchronisation...' : 'Synchroniser'}</span>
                  <span className="sm:hidden">{syncing ? '...' : 'Sync'}</span>
                </KnowrButton>
                <KnowrButton
                  variant="secondary"
                  size="md"
                  icon={<TrendingUp className="size-4" />}
                  onClick={() => {}}
                  className="hidden sm:inline-flex"
                >
                  Statistiques
                </KnowrButton>
                <KnowrButton
                  variant="primary"
                  size="md"
                  icon={<Sparkles className="size-4" />}
                  onClick={() => navigate('/brief-externe')}
                >
                  <span className="hidden sm:inline">Brief externe</span>
                  <span className="sm:hidden">Brief</span>
                </KnowrButton>
              </>
            }
          />

          {/* Sync result banner — rounded-2xl */}
          {syncResult && (
            <div className={`mb-4 p-4 rounded-2xl border flex items-start gap-3 ${
              syncResult.error
                ? 'bg-destructive/10 border-destructive/20 text-destructive'
                : 'bg-success/10 border-success/20 text-success'
            }`}>
              {syncResult.error ? (
                <>
                  <AlertCircle className="size-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">{syncResult.error}</p>
                    {syncResult.error.includes('Token') && (
                      <p className="text-xs mt-1 opacity-80">
                        Allez dans Paramètres → déconnexion → reconnectez-vous avec Google en cliquant "Continuer avec Google"
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Synchronisation réussie !</p>
                    <p className="text-xs mt-1 opacity-80">
                      {syncResult.stats?.created} nouvelle{syncResult.stats?.created !== 1 ? 's' : ''} réunion{syncResult.stats?.created !== 1 ? 's' : ''} importée{syncResult.stats?.created !== 1 ? 's' : ''} ·{' '}
                      {syncResult.stats?.updated} mise{syncResult.stats?.updated !== 1 ? 's' : ''} à jour ·{' '}
                      {syncResult.stats?.meeting_events} réunion{syncResult.stats?.meeting_events !== 1 ? 's' : ''} trouvée{syncResult.stats?.meeting_events !== 1 ? 's' : ''} sur {syncResult.stats?.total_events} événements
                    </p>
                  </div>
                </>
              )}
              <button onClick={() => setSyncResult(null)} className="ml-auto opacity-60 hover:opacity-100">
                <X className="size-4" />
              </button>
            </div>
          )}

          {/* Search — rounded-2xl */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher par titre, entreprise, participant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`self-start inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                showFilters
                  ? 'bg-primary text-white border-primary'
                  : 'bg-card text-muted-foreground border-border hover:text-foreground hover:border-primary/30'
              }`}
            >
              <Filter className="size-4" />
              Filtres {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </button>

            {showFilters && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0"
              >
                <div className="flex items-center gap-3 min-w-max sm:flex-wrap sm:min-w-0">
                  {/* Filtre Temps */}
                  <div className="flex items-center gap-1 rounded-full p-1 bg-card border border-border">
                    {[
                      { value: 'all',    label: 'Toutes'  },
                      { value: 'future', label: 'À venir' },
                      { value: 'past',   label: 'Passées' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setFilterTime(option.value as 'all' | 'future' | 'past')}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                          filterTime === option.value
                            ? 'bg-primary text-white shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  {/* Filtre Type */}
                  <div className="flex items-center gap-1 rounded-full p-1 bg-card border border-border">
                    {[
                      { value: 'all',      label: 'Tous types' },
                      { value: 'external', label: 'Externes'   },
                      { value: 'internal', label: 'Internes'   },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setFilterType(option.value as 'all' | 'external' | 'internal')}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                          filterType === option.value
                            ? 'bg-primary text-white shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  {/* Filtre Brief */}
                  <div className="flex items-center gap-1 rounded-full p-1 bg-card border border-border">
                    {[
                      { value: 'all',         label: 'Tous briefs' },
                      { value: 'ready',       label: 'Prêts'       },
                      { value: 'to_generate', label: 'À générer'   },
                      { value: 'consulted',   label: 'Consultés'   },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setFilterBrief(option.value as 'all' | 'ready' | 'to_generate' | 'consulted')}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                          filterBrief === option.value
                            ? 'bg-primary text-white shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  {activeFiltersCount > 0 && (
                    <button
                      onClick={() => { setFilterTime('all'); setFilterType('all'); setFilterBrief('all'); }}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm text-muted-foreground hover:text-foreground border border-transparent hover:border-border transition-all whitespace-nowrap"
                    >
                      <X className="size-4" />
                      Réinitialiser
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* À venir */}
        {futureMeetings.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-black mb-4 flex items-center gap-2">
              <Clock className="size-6 text-primary" />
              À venir ({futureMeetings.length})
            </h2>
            <div className="space-y-4">
              {futureMeetings.map((meeting, i) => (
                <MeetingCardComponent key={meeting.id} meeting={meeting} delay={i * 0.05} />
              ))}
            </div>
          </div>
        )}

        {/* Passées */}
        {pastMeetings.length > 0 && (
          <div>
            <h2 className="text-2xl font-black mb-4 flex items-center gap-2">
              <Calendar className="size-6 text-muted-foreground" />
              Passées ({pastMeetings.length})
            </h2>
            <div className="space-y-4 opacity-80">
              {pastMeetings.map((meeting, i) => (
                <MeetingCardComponent key={meeting.id} meeting={meeting} delay={i * 0.05} />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {sortedMeetings.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="size-20 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="size-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">Aucune réunion trouvée</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery
                ? `Aucun résultat pour "${searchQuery}"`
                : 'Aucune réunion ne correspond aux filtres sélectionnés'}
            </p>
            {(searchQuery || activeFiltersCount > 0) && (
              <KnowrButton
                variant="secondary"
                size="md"
                onClick={() => {
                  setSearchQuery('');
                  setFilterTime('all');
                  setFilterType('all');
                  setFilterBrief('all');
                }}
              >
                Réinitialiser les filtres
              </KnowrButton>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
