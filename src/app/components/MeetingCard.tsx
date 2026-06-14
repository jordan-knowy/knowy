import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import {
  Star,
  Users,
  Calendar,
  Video,
  MapPin,
  Brain,
  TrendingUp,
  AlertCircle,
  Sparkles
} from 'lucide-react';

interface Participant {
  name: string;
  role: string;
  influenceScore: number;
  communicationStyle: string;
  isDecisionMaker: boolean;
}

interface MeetingCardProps {
  meeting: {
    id: string;
    title: string;
    company: string;
    logo: string;
    participants: Participant[];
    participantCount: number;
    category: string;
    strategicScore: number;
    type: 'external' | 'internal';
    format: 'video' | 'physical';
    date: string;
    time: string;
    hasDecisionMaker: boolean;
    relationshipHealth: 'excellent' | 'good' | 'neutral' | 'warning';
    role: 'SDR' | 'AM' | 'CSM' | 'Other';
    prepared?: boolean;
    context?: string;
    keyInsights?: string[];
    companySignals?: {
      growth: string;
      hiring: string;
      recentNews?: string;
    };
  };
  delay?: number;
}

export default function MeetingCard({ meeting, delay = 0 }: MeetingCardProps) {
  const navigate = useNavigate();

  const categoryColors: Record<string, string> = {
    'Partnership': 'bg-primary/10 text-primary border-primary/20',
    'Prospection': 'bg-secondary/10 text-secondary border-secondary/20',
    'Closing': 'bg-success/10 text-success border-success/20',
    'Customer Success': 'bg-accent/10 text-accent border-accent/20',
    'Interne': 'bg-muted text-muted-foreground border-border'
  };

  const healthColors: Record<string, string> = {
    'excellent': 'bg-success',
    'good': 'bg-primary',
    'neutral': 'bg-warning',
    'warning': 'bg-destructive'
  };

  const roleColors: Record<string, string> = {
    'SDR': 'bg-secondary/10 text-secondary border-secondary/20',
    'AM': 'bg-primary/10 text-primary border-primary/20',
    'CSM': 'bg-success/10 text-success border-success/20',
    'Other': 'bg-muted text-muted-foreground border-border'
  };

  const isUpcoming = new Date(meeting.date) >= new Date();
  const needsPrep = !meeting.prepared && new Date(meeting.date) <= new Date(Date.now() + 48 * 60 * 60 * 1000);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="bg-card rounded-2xl border border-border hover:border-primary/30 transition-all overflow-hidden group"
    >
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4 flex-1">
            <div className="text-4xl">{meeting.logo}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-bold">{meeting.title}</h3>
                {needsPrep && (
                  <span className="relative flex size-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                    <span className="relative inline-flex rounded-full size-2 bg-destructive"></span>
                  </span>
                )}
              </div>
              <p className="text-muted-foreground">{meeting.company}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-lg">
              <Star className="size-4 text-primary fill-primary" />
              <span className="font-semibold text-primary">{meeting.strategicScore}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg text-sm">
            <Calendar className="size-4" />
            <span>{new Date(meeting.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} à {meeting.time}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg text-sm">
            {meeting.format === 'video' ? <Video className="size-4" /> : <MapPin className="size-4" />}
            <span>{meeting.format === 'video' ? 'Visio' : 'Physique'}</span>
          </div>
          <div className={`px-3 py-1.5 rounded-lg text-xs border ${categoryColors[meeting.category]}`}>
            {meeting.category}
          </div>
          <div className={`px-3 py-1.5 rounded-lg text-xs border ${roleColors[meeting.role]}`}>
            {meeting.role}
          </div>
          <div className="flex items-center gap-2">
            <div className={`size-2 rounded-full ${healthColors[meeting.relationshipHealth]}`} />
            <span className="text-xs text-muted-foreground">
              {meeting.relationshipHealth === 'excellent' ? 'Excellente relation' :
               meeting.relationshipHealth === 'good' ? 'Bonne relation' :
               meeting.relationshipHealth === 'neutral' ? 'Relation neutre' :
               'Relation à risque'}
            </span>
          </div>
        </div>
      </div>

      {/* Intelligence cognitive */}
      <div className="p-6 bg-muted/20 border-b border-border">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="size-5 text-primary" />
          <h4 className="font-bold">Intelligence Cognitive</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {meeting.participants.slice(0, 2).map((participant, i) => (
            <div key={i} className="bg-card rounded-xl p-4 border border-border">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="font-medium">{participant.name}</p>
                  <p className="text-sm text-muted-foreground">{participant.role}</p>
                </div>
                {participant.isDecisionMaker && (
                  <Star className="size-4 text-primary fill-primary flex-shrink-0" />
                )}
              </div>
              <div className="space-y-2 mt-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="size-3.5 text-primary" />
                  <span className="text-xs">Influence: {participant.influenceScore}/100</span>
                </div>
                <div className="flex items-start gap-2">
                  <Brain className="size-3.5 text-accent flex-shrink-0 mt-0.5" />
                  <span className="text-xs text-muted-foreground">{participant.communicationStyle}</span>
                </div>
              </div>
            </div>
          ))}
          {meeting.participantCount > 2 && (
            <div className="bg-card rounded-xl p-4 border border-border flex items-center justify-center">
              <div className="text-center">
                <Users className="size-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium">+{meeting.participantCount - 2} autres</p>
                <p className="text-xs text-muted-foreground">participants</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Data intelligence */}
      {(meeting.context || meeting.keyInsights || meeting.companySignals) && (
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="size-5 text-accent" />
            <h4 className="font-bold">Intelligence Contextuelle</h4>
          </div>

          <div className="space-y-3">
            {meeting.context && (
              <div className="bg-accent/5 rounded-xl p-4 border border-accent/20">
                <p className="text-sm">{meeting.context}</p>
              </div>
            )}

            {meeting.keyInsights && meeting.keyInsights.length > 0 && (
              <div className="space-y-2">
                {meeting.keyInsights.map((insight, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <AlertCircle className="size-4 text-warning flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{insight}</span>
                  </div>
                ))}
              </div>
            )}

            {meeting.companySignals && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                {meeting.companySignals.growth && (
                  <div className="bg-success/5 rounded-lg p-3 border border-success/20">
                    <p className="text-xs text-success font-medium mb-1">Croissance</p>
                    <p className="text-xs">{meeting.companySignals.growth}</p>
                  </div>
                )}
                {meeting.companySignals.hiring && (
                  <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
                    <p className="text-xs text-primary font-medium mb-1">Recrutement</p>
                    <p className="text-xs">{meeting.companySignals.hiring}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="p-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/meeting/${meeting.id}`)}
            className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
              needsPrep
                ? 'bg-destructive hover:bg-destructive/90 text-white shadow-lg shadow-destructive/20'
                : 'bg-primary hover:bg-accent text-white'
            }`}
          >
            <Sparkles className="size-4" />
            {needsPrep ? 'Préparer maintenant' : 'Voir le brief'}
          </button>
          {isUpcoming && (
            <button
              onClick={() => navigate(`/meeting/${meeting.id}`)}
              className="px-4 py-3 bg-muted hover:bg-muted/70 rounded-xl transition-colors text-sm"
            >
              Mode 5min
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
