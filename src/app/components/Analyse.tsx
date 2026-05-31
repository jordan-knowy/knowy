import { motion } from 'motion/react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Search,
  Calendar,
  Clock,
  Users,
  TrendingUp,
  Mic,
  Eye,
  Target,
  MessageSquare,
  ArrowRight,
  Share2,
  Download,
  Play,
  Pause,
  BarChart3,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Zap,
  Filter,
  Building2,
  Video
} from 'lucide-react';

interface Recording {
  id: string;
  title: string;
  date: string;
  duration: number;
  participants: { name: string; role: string; photo: string; internal: boolean }[];
  company: string;
  logo: string;
  type: 'internal' | 'external';
  meetingRole: 'SDR' | 'AM' | 'CSM' | 'Other';
  hasRecording: boolean;
  closingProbability: number;
  productivityScore: number; // For internal meetings
  sentiment: 'positive' | 'neutral' | 'negative';
  analyzed: boolean;
}

export default function Analyse() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'internal' | 'external'>('all');
  const [selectedRecording, setSelectedRecording] = useState<string | null>(null);

  const recordings: Recording[] = [
    {
      id: '1',
      title: 'Q1 Strategic Review',
      date: '2026-05-22',
      duration: 45,
      participants: [
        { name: 'Sarah Chen', role: 'VP Partnerships', photo: '👩‍💼', internal: false },
        { name: 'Marc Dubois', role: 'Head of Product', photo: '👨‍💻', internal: false },
        { name: 'Maxime Durant', role: 'VP Sales', photo: '👨‍💼', internal: true }
      ],
      company: 'Contentsquare',
      logo: '🎯',
      type: 'external',
      meetingRole: 'AM',
      hasRecording: true,
      closingProbability: 85,
      productivityScore: 82,
      sentiment: 'positive',
      analyzed: true
    },
    {
      id: '4',
      title: 'Closing Discussion',
      date: '2026-05-23',
      duration: 60,
      participants: [
        { name: 'Alexandre Garcia', role: 'CFO', photo: '👨‍💼', internal: false },
        { name: 'Maxime Durant', role: 'VP Sales', photo: '👨‍💼', internal: true },
        { name: 'Sophie Martin', role: 'Sales Director', photo: '👩', internal: true }
      ],
      company: 'Qonto',
      logo: '💳',
      type: 'external',
      meetingRole: 'AM',
      hasRecording: true,
      closingProbability: 92,
      productivityScore: 88,
      sentiment: 'positive',
      analyzed: true
    },
    {
      id: '10',
      title: 'Product Review Q4',
      date: '2026-04-15',
      duration: 55,
      participants: [
        { name: 'Sarah Chen', role: 'VP Partnerships', photo: '👩‍💼', internal: false },
        { name: 'Marc Dubois', role: 'Head of Product', photo: '👨‍💻', internal: false },
        { name: 'Maxime Durant', role: 'VP Sales', photo: '👨‍💼', internal: true }
      ],
      company: 'Contentsquare',
      logo: '🎯',
      type: 'external',
      meetingRole: 'SDR',
      hasRecording: true,
      closingProbability: 78,
      productivityScore: 75,
      sentiment: 'neutral',
      analyzed: true
    },
    {
      id: '11',
      title: 'Team Sync - Sales Strategy',
      date: '2026-05-20',
      duration: 30,
      participants: [
        { name: 'Maxime Durant', role: 'VP Sales', photo: '👨‍💼', internal: true },
        { name: 'Sophie Martin', role: 'Sales Director', photo: '👩', internal: true },
        { name: 'Thomas Petit', role: 'SDR Lead', photo: '👨', internal: true }
      ],
      company: 'Knowy (Internal)',
      logo: '🏢',
      type: 'internal',
      meetingRole: 'Other',
      hasRecording: true,
      closingProbability: 0,
      productivityScore: 88,
      sentiment: 'positive',
      analyzed: true
    },
    {
      id: '12',
      title: 'CS Team Weekly Review',
      date: '2026-05-19',
      duration: 45,
      participants: [
        { name: 'Claire Dubois', role: 'CS Director', photo: '👩', internal: true },
        { name: 'Antoine Bernard', role: 'CSM', photo: '👨', internal: true },
        { name: 'Marie Lopez', role: 'CSM', photo: '👩', internal: true }
      ],
      company: 'Knowy (Internal)',
      logo: '🏢',
      type: 'internal',
      meetingRole: 'CSM',
      hasRecording: true,
      closingProbability: 0,
      productivityScore: 92,
      sentiment: 'positive',
      analyzed: true
    }
  ];

  const filteredRecordings = recordings.filter(r => {
    if (filterType !== 'all' && r.type !== filterType) return false;
    if (searchQuery && !r.title.toLowerCase().includes(searchQuery.toLowerCase()) && !r.company.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const activeFiltersCount = (filterType !== 'all' ? 1 : 0);

  // Detailed analysis for selected recording (ID '1' for demo)
  const analysisData = selectedRecording === '1' ? {
    talkTime: [
      { name: 'Sarah Chen', percentage: 45, minutes: 20, role: 'VP Partnerships' },
      { name: 'Maxime Durant', percentage: 35, minutes: 16, role: 'VP Sales' },
      { name: 'Marc Dubois', percentage: 20, minutes: 9, role: 'Head of Product' }
    ],
    engagement: {
      overall: 88,
      visual: 92,
      verbal: 85,
      energy: 87
    },
    insights: [
      {
        type: 'opportunity',
        icon: Target,
        title: 'Signal d\'expansion détecté',
        description: 'Sarah a mentionné 3 fois l\'intérêt d\'étendre à d\'autres départements. Quote: "On pourrait déployer sur toute la région EMEA"',
        timestamp: '12:34',
        confidence: 94
      },
      {
        type: 'risk',
        icon: AlertCircle,
        title: 'Objection pricing non résolue',
        description: 'Marc a exprimé des réserves sur le pricing tier Enterprise. Nécessite un follow-up avec justification ROI',
        timestamp: '28:15',
        confidence: 87
      },
      {
        type: 'positive',
        icon: ThumbsUp,
        title: 'Champion identifié',
        description: 'Sarah s\'est positionnée comme sponsor interne, a utilisé "nous" en parlant du projet 8 fois',
        timestamp: '35:22',
        confidence: 91
      }
    ],
    nextSteps: [
      { action: 'Envoyer le business case ROI à Marc', owner: 'Maxime Durant', deadline: '2026-05-24', priority: 'high', auto: true },
      { action: 'Organiser demo EMEA avec Sarah', owner: 'Sophie Martin', deadline: '2026-05-28', priority: 'high', auto: true },
      { action: 'Préparer slide pricing personnalisé', owner: 'Maxime Durant', deadline: '2026-05-25', priority: 'medium', auto: true }
    ],
    topics: [
      { name: 'Pricing & Budget', mentions: 12, sentiment: 'neutral', percentage: 25 },
      { name: 'Expansion EMEA', mentions: 8, sentiment: 'positive', percentage: 20 },
      { name: 'Intégration technique', mentions: 15, sentiment: 'positive', percentage: 30 },
      { name: 'Timeline déploiement', mentions: 10, sentiment: 'neutral', percentage: 25 }
    ],
    questions: {
      asked: 18,
      answered: 15,
      pending: 3,
      pendingList: [
        'Délai pour intégration Salesforce?',
        'Support en français disponible?',
        'Conditions de paiement flexibles?'
      ]
    },
    keyMoments: [
      { time: '08:15', type: 'positive', description: 'Sarah: "C\'est exactement ce qu\'on cherchait"' },
      { time: '23:40', type: 'neutral', description: 'Discussion pricing - tension détectée' },
      { time: '38:20', type: 'positive', description: 'Accord sur les next steps' }
    ],
    recommendations: [
      'Prioriser le follow-up sur le ROI dans les 24h (objection pricing détectée)',
      'Capitaliser sur l\'enthousiasme de Sarah pour accélérer le cycle',
      'Impliquer un expert technique pour rassurer Marc sur l\'intégration'
    ]
  } : null;

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-success';
      case 'negative': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getSentimentBg = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-success/10';
      case 'negative': return 'bg-destructive/10';
      default: return 'bg-muted/30';
    }
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
          <h1 className="text-4xl font-semibold mb-2">Mémoire Organisationnelle</h1>
          <p className="text-muted-foreground">
            Tous vos meetings analysés et votre intelligence relationnelle consolidée
          </p>
        </motion.div>

        {/* Global Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="grid grid-cols-1 gap-4 mb-8 sm:grid-cols-2 md:grid-cols-4"
        >
          <div className="bg-card rounded-xl p-5 border border-border">
            <div className="flex items-center gap-3 mb-2">
              <Video className="size-5 text-primary" />
              <span className="text-sm text-muted-foreground">Meetings analysés</span>
            </div>
            <p className="text-3xl font-semibold">42</p>
          </div>
          <div className="bg-card rounded-xl p-5 border border-border">
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="size-5 text-accent" />
              <span className="text-sm text-muted-foreground">Entreprises</span>
            </div>
            <p className="text-3xl font-semibold">18</p>
          </div>
          <div className="bg-card rounded-xl p-5 border border-border">
            <div className="flex items-center gap-3 mb-2">
              <Users className="size-5 text-success" />
              <span className="text-sm text-muted-foreground">Stakeholders</span>
            </div>
            <p className="text-3xl font-semibold">127</p>
          </div>
          <div className="bg-card rounded-xl p-5 border border-border">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="size-5 text-warning" />
              <span className="text-sm text-muted-foreground">Score moyen</span>
            </div>
            <p className="text-3xl font-semibold">82%</p>
          </div>
        </motion.div>

        {/* Search & Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8 space-y-4"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher une réunion..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Filter className="size-5 text-muted-foreground" />
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilterType('all')}
                className={`px-4 py-2 rounded-xl transition-colors ${
                  filterType === 'all'
                    ? 'bg-primary text-white'
                    : 'bg-card border border-border hover:bg-muted/50'
                }`}
              >
                Toutes
              </button>
              <button
                onClick={() => setFilterType('internal')}
                className={`px-4 py-2 rounded-xl transition-colors ${
                  filterType === 'internal'
                    ? 'bg-primary text-white'
                    : 'bg-card border border-border hover:bg-muted/50'
                }`}
              >
                Internes
              </button>
              <button
                onClick={() => setFilterType('external')}
                className={`px-4 py-2 rounded-xl transition-colors ${
                  filterType === 'external'
                    ? 'bg-primary text-white'
                    : 'bg-card border border-border hover:bg-muted/50'
                }`}
              >
                Externes
              </button>
            </div>
            {activeFiltersCount > 0 && (
              <button
                onClick={() => setFilterType('all')}
                className="text-sm text-muted-foreground hover:text-primary"
              >
                Réinitialiser ({activeFiltersCount})
              </button>
            )}
          </div>
        </motion.div>

        {/* Recordings List */}
        {!selectedRecording && (
          <div className="space-y-4">
            {filteredRecordings.map((recording, i) => (
              <motion.div
                key={recording.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="bg-card rounded-2xl p-4 border border-border hover:border-primary/30 transition-all cursor-pointer group"
                onClick={() => setSelectedRecording(recording.id)}
              >
                <div className="flex items-center justify-between gap-4">
                  {/* Left side: Logo, Title, Date, Duration */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="text-3xl flex-shrink-0">{recording.logo}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold truncate">{recording.title}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${getSentimentBg(recording.sentiment)} ${getSentimentColor(recording.sentiment)}`}>
                          {recording.sentiment === 'positive' ? 'Positif' : recording.sentiment === 'negative' ? 'Négatif' : 'Neutre'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-medium flex-shrink-0 ${
                          recording.type === 'external'
                            ? 'bg-primary/10 text-primary border border-primary/20'
                            : 'bg-muted text-muted-foreground border border-border'
                        }`}>
                          {recording.type === 'external' ? 'Externe' : 'Interne'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-medium flex-shrink-0 ${
                          recording.meetingRole === 'SDR' ? 'bg-blue-500/10 text-blue-600' :
                          recording.meetingRole === 'AM' ? 'bg-purple-500/10 text-purple-600' :
                          recording.meetingRole === 'CSM' ? 'bg-green-500/10 text-green-600' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {recording.meetingRole}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{recording.company}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3" />
                          {new Date(recording.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          {recording.duration} min
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="size-3" />
                          {recording.participants.length} participants
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="size-3 text-success" />
                          Analysé
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right side: Participants + Closing Score */}
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="flex -space-x-2">
                      {recording.participants.slice(0, 3).map((p, idx) => (
                        <div key={idx} className="size-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm border-2 border-card">
                          {p.photo}
                        </div>
                      ))}
                      {recording.participants.length > 3 && (
                        <div className="size-8 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-card font-medium">
                          +{recording.participants.length - 3}
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${
                        recording.type === 'external' ? 'text-success' : 'text-primary'
                      }`}>
                        {recording.type === 'external' ? recording.closingProbability : recording.productivityScore}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {recording.type === 'external' ? 'Closing' : 'Productivité'}
                      </div>
                    </div>
                    <ArrowRight className="size-5 text-primary group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Detailed Analysis View */}
        {selectedRecording && analysisData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            {/* Back button + Share */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSelectedRecording(null)}
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
              >
                <ArrowRight className="size-4 rotate-180" />
                Retour aux réunions
              </button>
              <div className="flex gap-3">
                <button className="px-4 py-2 bg-card border border-border hover:bg-muted/50 rounded-xl transition-colors flex items-center gap-2">
                  <Download className="size-4" />
                  Télécharger
                </button>
                <button className="px-4 py-2 bg-primary hover:bg-accent text-white rounded-xl transition-colors flex items-center gap-2">
                  <Share2 className="size-4" />
                  Partager via Knowy
                </button>
              </div>
            </div>

            {/* Meeting Header */}
            <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl p-5 border border-primary/10 md:p-8">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="text-5xl">🎯</div>
                  <div>
                    <h2 className="text-3xl font-semibold mb-2">Q1 Strategic Review</h2>
                    <p className="text-lg text-muted-foreground mb-3">Contentsquare</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-2">
                        <Calendar className="size-4" />
                        22 mai 2026
                      </span>
                      <span className="flex items-center gap-2">
                        <Clock className="size-4" />
                        45 minutes
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-5xl font-semibold text-success mb-2">85%</div>
                  <div className="text-sm text-muted-foreground">Probabilité de closing</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {analysisData.talkTime.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 bg-card/80 backdrop-blur-sm rounded-xl">
                    <div className="text-2xl">{recordings[0].participants.find(part => part.name === p.name)?.photo}</div>
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* KPIs Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
              <div className="bg-card rounded-2xl p-6 border border-border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="size-12 bg-success/10 rounded-xl flex items-center justify-center">
                    <Eye className="size-6 text-success" />
                  </div>
                  <div>
                    <p className="text-3xl font-semibold">{analysisData.engagement.overall}%</p>
                    <p className="text-xs text-muted-foreground">Engagement global</p>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-2xl p-6 border border-border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="size-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Mic className="size-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-3xl font-semibold">{analysisData.engagement.verbal}%</p>
                    <p className="text-xs text-muted-foreground">Énergie verbale</p>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-2xl p-6 border border-border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="size-12 bg-accent/10 rounded-xl flex items-center justify-center">
                    <MessageSquare className="size-6 text-accent" />
                  </div>
                  <div>
                    <p className="text-3xl font-semibold">{analysisData.questions.answered}/{analysisData.questions.asked}</p>
                    <p className="text-xs text-muted-foreground">Questions répondues</p>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-2xl p-6 border border-border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="size-12 bg-warning/10 rounded-xl flex items-center justify-center">
                    <Lightbulb className="size-6 text-warning" />
                  </div>
                  <div>
                    <p className="text-3xl font-semibold">{analysisData.insights.length}</p>
                    <p className="text-xs text-muted-foreground">Insights détectés</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Temps de parole */}
            <div className="bg-card rounded-2xl p-5 border border-border md:p-8">
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <BarChart3 className="size-6 text-primary" />
                Répartition du temps de parole
              </h3>
              <div className="space-y-4">
                {analysisData.talkTime.map((person, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{recordings[0].participants.find(p => p.name === person.name)?.photo}</div>
                        <div>
                          <p className="font-medium">{person.name}</p>
                          <p className="text-sm text-muted-foreground">{person.role}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-semibold text-primary">{person.percentage}%</p>
                        <p className="text-xs text-muted-foreground">{person.minutes} min</p>
                      </div>
                    </div>
                    <div className="w-full bg-muted/30 rounded-full h-3">
                      <div
                        className="bg-primary rounded-full h-3 transition-all"
                        style={{ width: `${person.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Insights IA */}
            <div className="bg-card rounded-2xl p-5 border border-border md:p-8">
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Sparkles className="size-6 text-primary" />
                Insights IA
              </h3>
              <div className="space-y-4">
                {analysisData.insights.map((insight, i) => (
                  <div
                    key={i}
                    className={`p-6 rounded-xl border ${
                      insight.type === 'opportunity'
                        ? 'bg-success/5 border-success/20'
                        : insight.type === 'risk'
                        ? 'bg-destructive/5 border-destructive/20'
                        : 'bg-primary/5 border-primary/20'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`size-12 rounded-xl flex items-center justify-center ${
                        insight.type === 'opportunity'
                          ? 'bg-success/10'
                          : insight.type === 'risk'
                          ? 'bg-destructive/10'
                          : 'bg-primary/10'
                      }`}>
                        <insight.icon className={`size-6 ${
                          insight.type === 'opportunity'
                            ? 'text-success'
                            : insight.type === 'risk'
                            ? 'text-destructive'
                            : 'text-primary'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{insight.title}</h4>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-1 bg-background rounded">
                              {insight.timestamp}
                            </span>
                            <span className="text-xs px-2 py-1 bg-background rounded">
                              {insight.confidence}% confiance
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{insight.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Topics */}
            <div className="bg-card rounded-2xl p-5 border border-border md:p-8">
              <h3 className="text-xl font-semibold mb-6">Thèmes abordés</h3>
              <div className="space-y-4">
                {analysisData.topics.map((topic, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <p className="font-medium">{topic.name}</p>
                        <span className={`text-xs px-2 py-1 rounded ${getSentimentBg(topic.sentiment)} ${getSentimentColor(topic.sentiment)}`}>
                          {topic.sentiment === 'positive' ? 'Positif' : topic.sentiment === 'negative' ? 'Négatif' : 'Neutre'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{topic.mentions} mentions</p>
                    </div>
                    <div className="w-full bg-muted/30 rounded-full h-2">
                      <div
                        className={`rounded-full h-2 ${
                          topic.sentiment === 'positive' ? 'bg-success' : topic.sentiment === 'negative' ? 'bg-destructive' : 'bg-muted'
                        }`}
                        style={{ width: `${topic.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-card rounded-2xl p-5 border border-border md:p-8">
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Zap className="size-6 text-primary" />
                Next Steps (détectés automatiquement)
              </h3>
              <div className="space-y-3">
                {analysisData.nextSteps.map((step, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-xl border flex items-center justify-between ${
                      step.priority === 'high'
                        ? 'bg-destructive/5 border-destructive/20'
                        : 'bg-muted/30 border-border'
                    }`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <input type="checkbox" className="size-5 rounded" />
                      <div className="flex-1">
                        <p className="font-medium">{step.action}</p>
                        <p className="text-sm text-muted-foreground">Assigné à {step.owner}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {step.auto && (
                        <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded flex items-center gap-1">
                          <Sparkles className="size-3" />
                          Auto
                        </span>
                      )}
                      <span className="text-xs px-2 py-1 bg-background rounded">
                        {new Date(step.deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        step.priority === 'high' ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'
                      }`}>
                        {step.priority === 'high' ? 'Urgent' : 'Normal'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl p-5 border border-primary/10 md:p-8">
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Lightbulb className="size-6 text-primary" />
                Recommandations IA
              </h3>
              <div className="space-y-3">
                {analysisData.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 bg-card/80 backdrop-blur-sm rounded-xl">
                    <CheckCircle2 className="size-5 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-sm">{rec}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Share CTA */}
            <div className="bg-gradient-to-br from-primary to-accent rounded-2xl p-5 text-white md:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-semibold mb-2">Partagez cette analyse avec vos participants</h3>
                  <p className="text-white/80">
                    Créez de la valeur ajoutée et invitez vos contacts à découvrir Knowy
                  </p>
                </div>
                <button className="px-6 py-3 bg-white text-primary rounded-xl hover:bg-white/90 transition-colors flex items-center gap-2 font-medium">
                  <Share2 className="size-5" />
                  Partager via Knowy
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
