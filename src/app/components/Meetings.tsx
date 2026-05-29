import { motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useMeetings } from '../../hooks/useMeetings';
import {
  Calendar,
  Search,
  Filter,
  ChevronDown,
  Video,
  MapPin,
  Users,
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
import KnowyCard from './knowy/KnowyCard';
import KnowyBadge from './knowy/KnowyBadge';
import KnowyButton from './knowy/KnowyButton';
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
  format: 'video' | 'physical';
  location?: string;
  category: string;
  relationScore: number; // Moyenne des scores relationnels
  briefStatus: 'ready' | 'generating' | 'to_generate' | 'insufficient' | 'consulted';
  hasDecisionMaker: boolean;
  isExternal: boolean;
  crmSynced: boolean;
  crmUrl?: string;
  isPast: boolean;
}

export default function Meetings() {
  const navigate = useNavigate();
  const { meetings: domainMeetings, loading, reload } = useMeetings();
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

      const providerToken = session.provider_token;
      if (!providerToken) {
        setSyncResult({
          error: 'Token Google expiré. Déconnectez-vous puis reconnectez-vous avec Google pour réactiver la synchronisation.'
        });
        return;
      }

      const orgId = await getActiveOrganizationId();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      const res = await fetch(`${supabaseUrl}/functions/v1/sync-google-calendar`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: orgId, providerToken }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSyncResult({ error: data.error || 'Erreur de synchronisation' });
      } else {
        // Ingest Gmail metadata alongside calendar (best-effort)
        fetch(`${supabaseUrl}/functions/v1/ingest-communication`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ organizationId: orgId, providerToken, lookbackDays: 90 }),
        }).catch(() => {});
        setSyncResult({ stats: data.stats });
        reload?.();
      }
    } catch (e: any) {
      setSyncResult({ error: e.message || 'Erreur inattendue' });
    } finally {
      setSyncing(false);
    }
  }

  const today = new Date().toISOString().slice(0, 10);

  // Map domain meetings → display Meeting
  const allMeetings: Meeting[] = useMemo(() =>
    domainMeetings.map(m => ({
      id: m.id,
      title: m.title,
      company: m.company,
      logo: m.company ? m.company[0].toUpperCase() : '📅',
      participants: [],
      date: m.startsAt.slice(0, 10),
      time: new Date(m.startsAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      format: 'video' as const,
      location: undefined,
      category: (m as any).category ?? 'Réunion',
      relationScore: 0,
      briefStatus: ((m.briefStatus as Meeting['briefStatus']) ?? 'to_generate'),
      hasDecisionMaker: (m as any).has_decision_maker ?? false,
      isExternal: (m as any).is_external ?? true,
      crmSynced: (m as any).crm_synced ?? false,
      crmUrl: (m as any).crm_external_url ?? undefined,
      isPast: m.startsAt.slice(0, 10) < today,
    })),
  [domainMeetings, today]);

  // Filtrage
  const filteredMeetings = allMeetings.filter(meeting => {
    // Recherche
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

    // Filtre temps
    if (filterTime === 'future' && meeting.isPast) return false;
    if (filterTime === 'past' && !meeting.isPast) return false;

    // Filtre type
    if (filterType === 'external' && !meeting.isExternal) return false;
    if (filterType === 'internal' && meeting.isExternal) return false;

    // Filtre brief
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
      ready: { badge: 'Brief prêt', variant: 'sage' as const, icon: CheckCircle2 },
      generating: { badge: 'En génération', variant: 'amber' as const, icon: Loader2 },
      to_generate: { badge: 'À générer', variant: 'muted' as const, icon: Sparkles },
      insufficient: { badge: 'Données insuffisantes', variant: 'coral' as const, icon: AlertCircle },
      consulted: { badge: 'Consulté', variant: 'violet' as const, icon: CheckCircle2 }
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

    return (
      <KnowyCard
        hover
        delay={delay}
        onClick={() => navigate(`/meeting/${meeting.id}`)}
        className="p-6 cursor-pointer"
      >
        <div className="flex items-start gap-6">
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

          {/* Divider */}
          <div className="h-auto w-px bg-border" />

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="text-4xl">{meeting.logo}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold mb-1 truncate">{meeting.title}</h3>
                  <p className="text-muted-foreground">{meeting.company}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className={`flex items-center justify-center size-12 rounded-full ${getRelationScoreBg(meeting.relationScore)}`}>
                  <span className={`font-mono font-bold text-lg ${getRelationScoreColor(meeting.relationScore)}`}>
                    {meeting.relationScore}
                  </span>
                </div>
              </div>
            </div>

            {/* Info Row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm mb-4">
              <div className="flex items-center gap-2">
                {meeting.format === 'video' ? (
                  <Video className="size-4 text-muted-foreground" />
                ) : (
                  <MapPin className="size-4 text-muted-foreground" />
                )}
                <span className="text-muted-foreground">{meeting.location}</span>
              </div>

              <div className="flex items-center gap-2">
                <Users className="size-4 text-muted-foreground" />
                <div className="flex items-center gap-1">
                  {meeting.participants.slice(0, 2).map((p, idx) => (
                    <span key={idx} className="text-muted-foreground">
                      {p.name}
                      {idx < Math.min(meeting.participants.length - 1, 1) ? ', ' : ''}
                    </span>
                  ))}
                  {meeting.participants.length > 2 && (
                    <span className="text-muted-foreground">{meeting.participants[2].name}</span>
                  )}
                </div>
              </div>

              {meeting.hasDecisionMaker && (
                <div className="flex items-center gap-1 text-primary">
                  <Star className="size-4 fill-primary" />
                  <span className="font-semibold">Décideur</span>
                </div>
              )}

              <KnowyBadge variant={meeting.isExternal ? 'violet' : 'muted'} size="sm">
                {meeting.isExternal ? 'Externe' : 'Interne'}
              </KnowyBadge>

              <KnowyBadge variant="blue" size="sm">
                {meeting.category}
              </KnowyBadge>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div className="flex items-center gap-2">
                <StatusIcon className={`size-4 ${statusConfig.badge === 'En génération' ? 'animate-spin' : ''}`} />
                <KnowyBadge variant={statusConfig.variant} size="md">
                  {statusConfig.badge}
                </KnowyBadge>
              </div>

              <div className="flex items-center gap-2">
                {meeting.crmUrl && (
                  <KnowyButton
                    variant="ghost"
                    size="sm"
                    icon={<ArrowUpRight className="size-4" />}
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(meeting.crmUrl, '_blank');
                    }}
                  >
                    Voir dans CRM
                  </KnowyButton>
                )}
                {meeting.isPast ? (
                  <button
                    onClick={(e) => toggleMeetingSync(meeting.id, isSynced, e)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
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
                      <KnowyButton variant="primary" size="sm" icon={<Sparkles className="size-4" />}>
                        Voir le brief
                      </KnowyButton>
                    )}
                    {meeting.briefStatus === 'to_generate' && (
                      <KnowyButton variant="secondary" size="sm" icon={<Sparkles className="size-4" />}>
                        Générer le brief
                      </KnowyButton>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </KnowyCard>
    );
  };

  return (
    <div className="size-full bg-background overflow-auto">
      <div className="max-w-7xl mx-auto px-4 py-5 md:px-8 md:py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="mb-2">Réunions</h1>
              <p className="text-muted-foreground">
                {sortedMeetings.length} réunion{sortedMeetings.length > 1 ? 's' : ''}
                {activeFiltersCount > 0 && ` • ${activeFiltersCount} filtre${activeFiltersCount > 1 ? 's' : ''} actif${activeFiltersCount > 1 ? 's' : ''}`}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <KnowyButton
                variant="secondary"
                size="md"
                icon={syncing ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                onClick={handleGoogleCalendarSync}
                disabled={syncing}
              >
                {syncing ? 'Synchronisation...' : 'Sync Google Calendar'}
              </KnowyButton>
              <KnowyButton
                variant="secondary"
                size="md"
                icon={<TrendingUp className="size-4" />}
                onClick={() => {}}
              >
                Statistiques
              </KnowyButton>
            </div>
          </div>

          {/* Sync result banner */}
          {syncResult && (
            <div className={`mb-4 p-4 rounded-xl border flex items-start gap-3 ${
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

          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher par titre, entreprise, participant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <KnowyButton
              variant={showFilters ? 'primary' : 'secondary'}
              size="sm"
              icon={<Filter className="size-4" />}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filtres {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </KnowyButton>

            {showFilters && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-wrap items-center gap-3"
              >
                {/* Temps */}
                <div className="flex max-w-full items-center gap-2 overflow-x-auto bg-card border border-border rounded-xl p-1">
                  {[
                    { value: 'all', label: 'Toutes' },
                    { value: 'future', label: 'À venir' },
                    { value: 'past', label: 'Passées' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setFilterTime(option.value as any)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                        filterTime === option.value
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                {/* Type */}
                <div className="flex max-w-full items-center gap-2 overflow-x-auto bg-card border border-border rounded-xl p-1">
                  {[
                    { value: 'all', label: 'Tous types' },
                    { value: 'external', label: 'Externes' },
                    { value: 'internal', label: 'Internes' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setFilterType(option.value as any)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                        filterType === option.value
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                {/* Brief Status */}
                <div className="flex max-w-full items-center gap-2 overflow-x-auto bg-card border border-border rounded-xl p-1">
                  {[
                    { value: 'all', label: 'Tous briefs' },
                    { value: 'ready', label: 'Prêts' },
                    { value: 'to_generate', label: 'À générer' },
                    { value: 'consulted', label: 'Consultés' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setFilterBrief(option.value as any)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                        filterBrief === option.value
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                {activeFiltersCount > 0 && (
                  <button
                    onClick={() => {
                      setFilterTime('all');
                      setFilterType('all');
                      setFilterBrief('all');
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="size-4" />
                    Réinitialiser
                  </button>
                )}
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
            <h3 className="text-xl font-semibold mb-2">Aucune réunion trouvée</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery
                ? `Aucun résultat pour "${searchQuery}"`
                : 'Aucune réunion ne correspond aux filtres sélectionnés'}
            </p>
            {(searchQuery || activeFiltersCount > 0) && (
              <KnowyButton
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
              </KnowyButton>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
