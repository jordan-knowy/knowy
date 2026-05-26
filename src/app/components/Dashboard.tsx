import { motion } from 'motion/react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Calendar,
  Video,
  MapPin,
  Users,
  Star,
  Clock,
  Sparkles,
  Plus,
  Download,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import KnowyCard from './knowy/KnowyCard';
import KnowyButton from './knowy/KnowyButton';
import KnowyBadge from './knowy/KnowyBadge';
import { useCurrentProfile } from '../../hooks/useCurrentProfile';
import { useMeetings } from '../../hooks/useMeetings';

interface Meeting {
  id: string;
  title: string;
  company: string;
  logo: string;
  participants: { name: string; avatar?: string }[];
  time: string;
  format: 'video' | 'physical';
  category: string;
  importance: number;
  briefStatus: 'ready' | 'generating' | 'to_generate' | 'insufficient' | 'consulted';
  hasDecisionMaker: boolean;
  isExternal: boolean;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [showPluginBanner, setShowPluginBanner] = useState(true);
  const { profile } = useCurrentProfile();
  const { meetings: domainMeetings } = useMeetings();

  const firstName = profile?.fullName?.split(/\s+/)[0] ?? '';

  const todayDate = new Date().toISOString().slice(0, 10);

  const todaysMeetings: Meeting[] = domainMeetings
    .filter((m) => m.startsAt.slice(0, 10) === todayDate)
    .map((m) => ({
      id: m.id,
      title: m.title,
      company: m.company,
      logo: m.company ? m.company[0].toUpperCase() : '📅',
      participants: [],
      time: new Date(m.startsAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      format: 'video' as const,
      category: 'Réunion',
      importance: m.importanceScore ?? 0,
      briefStatus: (m.briefStatus as Meeting['briefStatus']) ?? 'to_generate',
      hasDecisionMaker: false,
      isExternal: true,
    }));

  const monday = new Date();
  const dayOfWeek = monday.getDay();
  monday.setDate(monday.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  monday.setHours(0, 0, 0, 0);

  const weekDays = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dayStr = d.toISOString().slice(0, 10);
    const dayMeetings = domainMeetings.filter((m) => m.startsAt.slice(0, 10) === dayStr);
    const isToday = dayStr === todayDate;
    const isPast = d.getTime() < new Date(todayDate).getTime();
    const label = d
      .toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })
      .replace(/^(.)/, (c) => c.toUpperCase());
    return {
      day: label,
      meetings: dayMeetings.length,
      strategic: dayMeetings.filter((m) => (m.importanceScore ?? 0) >= 80).length,
      status: isToday ? ('today' as const) : isPast ? ('past' as const) : ('future' as const),
    };
  });

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

  return (
    <div className="size-full bg-background overflow-auto">
      <div className="max-w-7xl mx-auto px-4 py-6 md:px-8 md:py-8">
        {/* Plugin Banner */}
        {showPluginBanner && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex flex-col gap-4 rounded-lg border border-primary/20 bg-primary/5 p-4 md:flex-row md:items-center md:justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="size-10 bg-primary/20 rounded-xl flex items-center justify-center">
                <Sparkles className="size-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Activez le Coach en réunion</p>
                <p className="text-sm text-muted-foreground">Téléchargez le plug-in pour Teams, Meet & Zoom</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <KnowyButton variant="secondary" size="sm" icon={<Download className="size-4" />}>
                Télécharger
              </KnowyButton>
              <button onClick={() => setShowPluginBanner(false)} className="p-2 hover:bg-black/5 rounded-lg transition-colors">
                <X className="size-4 text-muted-foreground" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-2">
            <Clock className="size-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
          <h1 className="mb-2 text-3xl font-black md:text-5xl">
            Bonjour{firstName ? ` ${firstName}` : ''} <span className="inline-block animate-wave">👋</span>
          </h1>
          <p className="text-lg text-muted-foreground">{todaysMeetings.length} réunions aujourd'hui</p>
        </motion.div>

        {/* Quick Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8 grid gap-4 md:grid-cols-3"
        >
          <KnowyCard className="p-6">
            <div className="flex items-center justify-between mb-3">
              <CheckCircle2 className="size-6 text-sage" />
              <KnowyBadge variant="sage" size="sm">Prêts</KnowyBadge>
            </div>
            <p className="text-4xl font-black mb-1">2</p>
            <p className="text-sm text-muted-foreground">Briefs prêts aujourd'hui</p>
          </KnowyCard>

          <KnowyCard className="p-6">
            <div className="flex items-center justify-between mb-3">
              <Calendar className="size-6 text-primary" />
              <KnowyBadge variant="violet" size="sm">Semaine</KnowyBadge>
            </div>
            <p className="text-4xl font-black mb-1">21</p>
            <p className="text-sm text-muted-foreground">Réunions cette semaine</p>
          </KnowyCard>

          <KnowyCard className="p-6">
            <div className="flex items-center justify-between mb-3">
              <AlertCircle className="size-6 text-amber" />
              <KnowyBadge variant="amber" size="sm">Alertes</KnowyBadge>
            </div>
            <p className="text-4xl font-black mb-1">3</p>
            <p className="text-sm text-muted-foreground">Nouvelles alertes réseau</p>
          </KnowyCard>
        </motion.div>

        {/* Today's Meetings */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-black mb-1">Aujourd'hui</h2>
              <p className="text-sm font-mono text-muted-foreground uppercase tracking-wider">
                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
            <KnowyButton
              variant="secondary"
              size="sm"
              icon={<Plus className="size-4" />}
              onClick={() => {}}
            >
              Générer un brief
            </KnowyButton>
          </div>

          <div className="space-y-3">
            {todaysMeetings.map((meeting, i) => {
              const statusConfig = getBriefStatusConfig(meeting.briefStatus);
              const StatusIcon = statusConfig.icon;

              return (
                <KnowyCard
                  key={meeting.id}
                  hover
                  delay={i * 0.05}
                  onClick={() => navigate(`/meeting/${meeting.id}`)}
                  className="p-6"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-6">
                    {/* Time */}
                    <div className="flex flex-col items-center min-w-[60px]">
                      <div className="text-2xl font-black">{meeting.time.split(':')[0]}</div>
                      <div className="text-sm text-muted-foreground">{meeting.time.split(':')[1]}</div>
                    </div>

                    {/* Meeting Info */}
                    <div className="flex-1">
                      <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="flex items-start gap-3">
                          <div className="text-4xl">{meeting.logo}</div>
                          <div>
                            <h3 className="text-xl font-bold mb-1">{meeting.title}</h3>
                            <p className="text-muted-foreground">{meeting.company}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <div className="flex items-center gap-1 mb-1">
                              <Star className="size-4 text-primary fill-primary" />
                              <span className="font-mono font-bold">{meeting.importance}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          {meeting.format === 'video' ? (
                            <Video className="size-4 text-muted-foreground" />
                          ) : (
                            <MapPin className="size-4 text-muted-foreground" />
                          )}
                          <span className="text-muted-foreground">
                            {meeting.format === 'video' ? 'Visio' : 'Physique'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Users className="size-4 text-muted-foreground" />
                          <div className="flex items-center gap-1">
                            {meeting.participants.map((p, idx) => (
                              <span key={idx} className="text-muted-foreground">
                                {p.name}{idx < meeting.participants.length - 1 ? ', ' : ''}
                              </span>
                            ))}
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

                      <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-2">
                          <StatusIcon className={`size-4 ${statusConfig.badge === 'En génération' ? 'animate-spin' : ''}`} />
                          <KnowyBadge variant={statusConfig.variant} size="md">
                            {statusConfig.badge}
                          </KnowyBadge>
                        </div>

                        {meeting.briefStatus === 'ready' && (
                          <KnowyButton variant="primary" size="sm" icon={<Sparkles className="size-4" />}>
                            Voir le brief
                          </KnowyButton>
                        )}

                        {meeting.briefStatus === 'to_generate' && (
                          <KnowyButton variant="secondary" size="sm">
                            Générer
                          </KnowyButton>
                        )}
                      </div>
                    </div>
                  </div>
                </KnowyCard>
              );
            })}
          </div>
        </div>

        {/* This Week Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-black mb-4">Cette semaine</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {weekDays.map((day, i) => (
              <KnowyCard
                key={i}
                delay={i * 0.05}
                className={`p-5 ${
                  day.status === 'today'
                    ? 'border-primary/50 bg-primary/5 ring-2 ring-primary/20'
                    : day.status === 'past'
                    ? 'opacity-60'
                    : ''
                }`}
              >
                <p className="text-sm text-muted-foreground mb-3 font-mono">{day.day}</p>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`size-2 rounded-full ${
                    day.strategic >= 2 ? 'bg-coral' : day.strategic === 1 ? 'bg-amber' : 'bg-sage'
                  }`} />
                  <span className="text-3xl font-black">{day.meetings}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">meetings</p>
                <div className="flex items-center gap-1">
                  <Star className="size-3 fill-primary text-primary" />
                  <span className="text-xs font-semibold text-primary">{day.strategic} stratégiques</span>
                </div>
              </KnowyCard>
            ))}
          </div>
        </motion.div>
      </div>

    </div>
  );
}
