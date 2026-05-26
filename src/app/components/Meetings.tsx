import { motion } from 'motion/react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
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
  X
} from 'lucide-react';
import KnowyCard from './knowy/KnowyCard';
import KnowyBadge from './knowy/KnowyBadge';
import KnowyButton from './knowy/KnowyButton';

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
  importance: number;
  briefStatus: 'ready' | 'generating' | 'to_generate' | 'insufficient' | 'consulted';
  hasDecisionMaker: boolean;
  isExternal: boolean;
  crmSynced: boolean;
  crmUrl?: string;
  isPast: boolean;
}

export default function Meetings() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTime, setFilterTime] = useState<'all' | 'future' | 'past'>('all');
  const [filterType, setFilterType] = useState<'all' | 'external' | 'internal'>('all');
  const [filterBrief, setFilterBrief] = useState<'all' | 'ready' | 'to_generate' | 'consulted'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const allMeetings: Meeting[] = [
    // FUTURES
    {
      id: '1',
      title: 'Q1 Strategic Review',
      company: 'Contentsquare',
      logo: '🎯',
      participants: [{ name: 'Sarah Chen', role: 'VP Partnerships' }, { name: 'Marc Dubois', role: 'Head of Product' }, { name: '+2' }],
      date: '2026-05-28',
      time: '14:00',
      format: 'video',
      location: 'Google Meet',
      category: 'Partnership',
      importance: 95,
      briefStatus: 'ready',
      hasDecisionMaker: true,
      isExternal: true,
      crmSynced: true,
      crmUrl: 'https://hubspot.com/deal/123',
      isPast: false
    },
    {
      id: '2',
      title: 'Product Demo - Enterprise',
      company: 'Swile',
      logo: '🍔',
      participants: [{ name: 'Julie Martin', role: 'Head of Procurement' }],
      date: '2026-05-28',
      time: '16:30',
      format: 'video',
      location: 'Zoom',
      category: 'Prospection',
      importance: 88,
      briefStatus: 'ready',
      hasDecisionMaker: true,
      isExternal: true,
      crmSynced: true,
      crmUrl: 'https://hubspot.com/deal/124',
      isPast: false
    },
    {
      id: '3',
      title: 'Customer Success Check-in',
      company: 'Alan',
      logo: '💙',
      participants: [{ name: 'Thomas Lebrun', role: 'Sales Ops Manager' }, { name: '+2' }],
      date: '2026-05-29',
      time: '10:00',
      format: 'video',
      location: 'Teams',
      category: 'Customer Success',
      importance: 72,
      briefStatus: 'to_generate',
      hasDecisionMaker: false,
      isExternal: true,
      crmSynced: true,
      isPast: false
    },
    {
      id: '4',
      title: 'Closing Discussion',
      company: 'Qonto',
      logo: '💳',
      participants: [
        { name: 'Alexandre Garcia', role: 'CFO' },
        { name: 'Sophie Durand', role: 'VP RevOps' },
        { name: '+3' }
      ],
      date: '2026-05-29',
      time: '15:00',
      format: 'physical',
      location: '8 Rue de Londres, Paris',
      category: 'Closing',
      importance: 92,
      briefStatus: 'generating',
      hasDecisionMaker: true,
      isExternal: true,
      crmSynced: true,
      crmUrl: 'https://hubspot.com/deal/125',
      isPast: false
    },
    {
      id: '5',
      title: 'Weekly Team Sync',
      company: 'Knowy',
      logo: '🎯',
      participants: [{ name: 'Équipe Sales' }, { name: '+7' }],
      date: '2026-05-30',
      time: '09:00',
      format: 'video',
      location: 'Google Meet',
      category: 'Interne',
      importance: 45,
      briefStatus: 'to_generate',
      hasDecisionMaker: false,
      isExternal: false,
      crmSynced: false,
      isPast: false
    },
    {
      id: '6',
      title: 'Partnership Strategy',
      company: 'Stripe',
      logo: '💳',
      participants: [{ name: 'Emma Wilson', role: 'Director of Partnerships' }, { name: '+2' }],
      date: '2026-06-02',
      time: '11:00',
      format: 'video',
      location: 'Zoom',
      category: 'Partnership',
      importance: 90,
      briefStatus: 'to_generate',
      hasDecisionMaker: true,
      isExternal: true,
      crmSynced: true,
      isPast: false
    },

    // PASSÉES
    {
      id: '7',
      title: 'Discovery Call - Expansion',
      company: 'Doctolib',
      logo: '🏥',
      participants: [{ name: 'Pierre Dubois', role: 'Sales Director' }],
      date: '2026-05-24',
      time: '14:00',
      format: 'video',
      location: 'Teams',
      category: 'Prospection',
      importance: 85,
      briefStatus: 'consulted',
      hasDecisionMaker: true,
      isExternal: true,
      crmSynced: true,
      isPast: true
    },
    {
      id: '8',
      title: 'QBR Q1 2026',
      company: 'Payfit',
      logo: '💰',
      participants: [{ name: 'Marie Laurent', role: 'VP Sales' }, { name: '+4' }],
      date: '2026-05-23',
      time: '10:00',
      format: 'physical',
      location: '10 Rue de la Paix, Paris',
      category: 'Customer Success',
      importance: 78,
      briefStatus: 'consulted',
      hasDecisionMaker: true,
      isExternal: true,
      crmSynced: true,
      isPast: true
    },
    {
      id: '9',
      title: 'Product Roadmap Sync',
      company: 'Spendesk',
      logo: '💵',
      participants: [{ name: 'Lucas Martin', role: 'CPO' }],
      date: '2026-05-22',
      time: '16:00',
      format: 'video',
      location: 'Google Meet',
      category: 'Partnership',
      importance: 70,
      briefStatus: 'consulted',
      hasDecisionMaker: false,
      isExternal: true,
      crmSynced: true,
      isPast: true
    },
    {
      id: '10',
      title: 'Demo Follow-up',
      company: 'Ledger',
      logo: '🔐',
      participants: [{ name: 'Anna Schmidt', role: 'Enterprise Sales' }],
      date: '2026-05-21',
      time: '11:30',
      format: 'video',
      location: 'Zoom',
      category: 'Prospection',
      importance: 82,
      briefStatus: 'consulted',
      hasDecisionMaker: false,
      isExternal: true,
      crmSynced: true,
      isPast: true
    }
  ];

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

  const activeFiltersCount =
    (filterTime !== 'all' ? 1 : 0) +
    (filterType !== 'all' ? 1 : 0) +
    (filterBrief !== 'all' ? 1 : 0);

  const MeetingCardComponent = ({ meeting, delay }: { meeting: Meeting; delay: number }) => {
    const statusConfig = getBriefStatusConfig(meeting.briefStatus);
    const StatusIcon = statusConfig.icon;

    return (
      <KnowyCard
        hover
        delay={delay}
        onClick={() => navigate(`/meeting/${meeting.id}`)}
        className="cursor-pointer p-4 md:p-6"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-6">
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
          <div className="hidden h-auto w-px bg-border md:block" />

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="text-4xl">{meeting.logo}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold mb-1 truncate">{meeting.title}</h3>
                  <p className="text-muted-foreground">{meeting.company}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Star className="size-4 text-primary fill-primary" />
                  <span className="font-mono font-bold text-lg">{meeting.importance}</span>
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

              {meeting.crmSynced && (
                <div className="flex items-center gap-1 text-success">
                  <Database className="size-4" />
                  <span className="text-xs font-medium">CRM synced</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex flex-col gap-3 border-t border-border pt-4 md:flex-row md:items-center md:justify-between">
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
              </div>
            </div>
          </div>
        </div>
      </KnowyCard>
    );
  };

  return (
    <div className="size-full bg-background overflow-auto">
      <div className="max-w-7xl mx-auto px-4 py-6 md:px-8 md:py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="mb-2">Réunions</h1>
              <p className="text-muted-foreground">
                {sortedMeetings.length} réunion{sortedMeetings.length > 1 ? 's' : ''}
                {activeFiltersCount > 0 && ` • ${activeFiltersCount} filtre${activeFiltersCount > 1 ? 's' : ''} actif${activeFiltersCount > 1 ? 's' : ''}`}
              </p>
            </div>

            <div className="flex items-center gap-3">
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
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
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
                <div className="flex items-center gap-2 bg-card border border-border rounded-xl p-1">
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
                <div className="flex items-center gap-2 bg-card border border-border rounded-xl p-1">
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
                <div className="flex items-center gap-2 bg-card border border-border rounded-xl p-1">
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
