import { motion } from 'motion/react';
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ArrowLeft,
  Sparkles,
  Share2,
  Database,
  TrendingUp,
  TrendingDown,
  Minus,
  Mail,
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  MessageSquare,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Globe,
  Briefcase,
  Target,
  Zap,
  Users,
  FileText,
  Tag,
  Building2,
  User
} from 'lucide-react';
import KnowyCard from './knowy/KnowyCard';
import KnowyButton from './knowy/KnowyButton';
import KnowyBadge from './knowy/KnowyBadge';

type Phase = 'growth' | 'stagnant' | 'decline';

export default function RelationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [openBlocks, setOpenBlocks] = useState({
    behavioral: false,
    career: false,
    history: false,
    topics: false,
    company: false,
    network: false
  });

  const toggleBlock = (block: keyof typeof openBlocks) => {
    setOpenBlocks(prev => ({ ...prev, [block]: !prev[block] }));
  };

  // Mock data - in real app this would come from API
  const contact = {
    name: 'Sarah Chen',
    title: 'VP Partnerships',
    titleConfirmed: true,
    company: 'Contentsquare',
    companyLogo: '🎯',
    sector: 'SaaS · Analytics',
    location: 'Paris, France',
    tenure: '2 ans et 4 mois',
    avatar: 'SC',
    phase: 'growth' as Phase,
    phaseDuration: '6 semaines',
    engagementScore: 87,
    lastContact: {
      date: 'Il y a 3 jours',
      type: 'email'
    },
    frequency: 21,
    nextRecommended: 9,
    reciprocity: 30,
    sources: {
      gmail: true,
      calendar: true,
      linkedin: true,
      crm: false
    }
  };

  const alerts = [
    {
      type: 'news',
      severity: 'success',
      title: 'Actualité favorable',
      message: 'Contentsquare vient de lever 500M$ — fenêtre d\'opportunité',
      date: 'Il y a 2 jours'
    }
  ];

  const stats = [
    { label: 'Emails échangés', value: '47', source: 'Gmail' },
    { label: 'Réunions tenues', value: '8', source: 'Calendar' },
    { label: 'Durée moyenne', value: '42 min', source: 'Calendar' },
    { label: 'Dernier contact', value: 'Il y a 3 jours', source: 'Gmail' },
    { label: 'Taux de réponse', value: '< 4h', source: 'Gmail' },
    { label: 'Réunions manquées', value: '0 / 8', source: 'Calendar' }
  ];

  const interactionProfile = {
    confidence: 72,
    axes: [
      { label: 'Résultat', opposite: 'Relation', value: 75, confidence: 80, description: 'Forte orientation résultat', level: 'Observable' },
      { label: 'Rapidité', opposite: 'Réflexion', value: 85, confidence: 85, description: 'Préfère l\'action rapide', level: 'Observable' },
      { label: 'Structure', opposite: 'Flexibilité', value: 45, confidence: 70, description: 'Préfère la flexibilité', level: 'Inféré' },
      { label: 'Contrôle', opposite: 'Délégation', value: 60, confidence: 65, description: 'Équilibre contrôle/autonomie', level: 'Inféré' }
    ],
    modes: [
      { name: 'Directif', probability: 85, description: 'Communication directe, orientation action' },
      { name: 'Analytique', probability: 60, description: 'Recherche de données factuelles' }
    ]
  };

  const behavioralInsights = [
    {
      icon: Globe,
      type: 'Mobilité / Aventure',
      insight: 'A vécu à l\'étranger 3+ ans → tolérance à l\'incertitude, ouverture au changement',
      source: 'LinkedIn',
      confidence: 65
    },
    {
      icon: Briefcase,
      type: 'Transversalité',
      insight: 'A travaillé dans 3 industries différentes (Tech · Retail · Conseil) → curiosité transversale',
      source: 'LinkedIn',
      confidence: 70
    },
    {
      icon: Target,
      type: 'Style de communication',
      insight: 'Emails courts (23 mots en moyenne), réponses < 2h → directivité, orientation action',
      source: 'Gmail',
      confidence: 80
    },
    {
      icon: Zap,
      type: 'Entrepreneuriat',
      insight: 'A fondé une startup en 2018 → tolérance à l\'ambiguïté, orientation résultat',
      source: 'LinkedIn',
      confidence: 75
    }
  ];

  const careerPath = [
    {
      title: 'VP Partnerships',
      company: 'Contentsquare',
      duration: '2024 - Présent (2 ans 4 mois)',
      sector: 'SaaS',
      isCurrent: true,
      badges: []
    },
    {
      title: 'Director of Business Development',
      company: 'Amplitude',
      duration: '2021 - 2024 (3 ans)',
      sector: 'SaaS',
      isCurrent: false,
      badges: ['Promotion']
    },
    {
      title: 'Senior BD Manager',
      company: 'Shopify',
      duration: '2018 - 2021 (3 ans)',
      sector: 'Tech',
      isCurrent: false,
      badges: ['Pivot']
    },
    {
      title: 'Founder & CEO',
      company: 'FoodTech Startup',
      duration: '2016 - 2018 (2 ans)',
      sector: 'Food',
      isCurrent: false,
      badges: ['Fondateur']
    }
  ];

  const exchangeHistory = [
    {
      type: 'email',
      date: 'Il y a 3 jours',
      subject: 'Re: Partnership discussion Q2',
      tone: 'chaleureux',
      wordCount: 34,
      initiator: 'them'
    },
    {
      type: 'meeting',
      date: 'Il y a 1 semaine',
      title: 'Q1 Partnership Review',
      duration: '45 min',
      planned: '30 min',
      participants: 3,
      hasBrief: true,
      meetingId: '1' // Links to /meeting/1
    },
    {
      type: 'email',
      date: 'Il y a 2 semaines',
      subject: 'Quick sync on analytics integration',
      tone: 'neutre',
      wordCount: 18,
      initiator: 'you'
    },
    {
      type: 'brief',
      date: 'Il y a 3 semaines',
      briefType: 'Commercial',
      confidence: 85
    }
  ];

  const topics = [
    { name: 'Budget', count: 4 },
    { name: 'Intégration technique', count: 3 },
    { name: 'Timeline', count: 2 },
    { name: 'ROI', count: 2 },
    { name: 'Équipe', count: 1 }
  ];

  const objections = [
    {
      objection: 'Complexité d\'intégration',
      firstMentioned: 'Il y a 2 mois',
      mentions: 2,
      status: 'resolved'
    },
    {
      objection: 'Contraintes budgétaires',
      firstMentioned: 'Il y a 1 mois',
      mentions: 3,
      status: 'active'
    }
  ];

  const companyContext = {
    momentum: 'favorable',
    news: 'Levée de 500M$ annoncée',
    newsDate: 'Il y a 2 jours',
    activeJobs: 23,
    signals: ['Levée', 'Expansion', 'Recrutement actif']
  };

  const sharedNetwork = [
    { name: 'Marc Dubois', role: 'AE', interactions: '3 réunions', lastContact: 'Il y a 1 mois' },
    { name: 'Julie Martin', role: 'CSM', interactions: '2 emails', lastContact: 'Il y a 2 semaines' }
  ];

  const getPhaseConfig = (phase: Phase) => {
    const configs = {
      growth: {
        label: 'Développement',
        icon: TrendingUp,
        color: 'text-success',
        bgColor: 'bg-success/10',
        borderColor: 'border-success/20'
      },
      stagnant: {
        label: 'Stagnation',
        icon: Minus,
        color: 'text-muted-foreground',
        bgColor: 'bg-muted/30',
        borderColor: 'border-border'
      },
      decline: {
        label: 'Décroissance',
        icon: TrendingDown,
        color: 'text-destructive',
        bgColor: 'bg-destructive/10',
        borderColor: 'border-destructive/20'
      }
    };
    return configs[phase];
  };

  const phaseConfig = getPhaseConfig(contact.phase);
  const PhaseIcon = phaseConfig.icon;

  return (
    <div className="size-full bg-background overflow-auto">
      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between mb-4"
        >
          <button
            onClick={() => navigate('/relations')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4" />
            <span>Retour aux contacts</span>
          </button>
          <div className="flex items-center gap-3">
            <KnowyButton variant="primary" size="md" icon={<Database className="size-4" />}>
              Synchroniser CRM
            </KnowyButton>
          </div>
        </motion.div>

        {/* BLOC 1 - Identity & Current Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <KnowyCard className={`p-6 mb-4 border-l-4 ${phaseConfig.borderColor}`}>
            <div className="grid grid-cols-3 gap-6">
              {/* Left - Identity */}
              <div>
                <div className="flex items-start gap-4 mb-4">
                  <div className={`size-16 rounded-xl ${phaseConfig.bgColor} ${phaseConfig.color} flex items-center justify-center font-bold text-2xl flex-shrink-0`}>
                    {contact.avatar}
                  </div>
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold mb-1">{contact.name}</h1>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-muted-foreground">{contact.title}</p>
                      {contact.titleConfirmed ? (
                        <CheckCircle className="size-3 text-success" />
                      ) : (
                        <AlertTriangle className="size-3 text-amber-600" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{contact.companyLogo}</span>
                      <p className="font-semibold text-sm">{contact.company}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>{contact.sector}</p>
                  <p>En poste depuis {contact.tenure}</p>
                  <div className="flex items-center gap-1">
                    <MapPin className="size-3" />
                    <span>{contact.location}</span>
                  </div>
                </div>
              </div>

              {/* Center - Engagement */}
              <div className="flex flex-col items-center justify-center border-x border-border px-6">
                <div className="relative size-28 mb-3">
                  <svg className="size-full -rotate-90">
                    <circle
                      cx="56"
                      cy="56"
                      r="48"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="6"
                      className="text-muted/20"
                    />
                    <circle
                      cx="56"
                      cy="56"
                      r="48"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="6"
                      strokeDasharray={`${(contact.engagementScore / 100) * 2 * Math.PI * 48} ${2 * Math.PI * 48}`}
                      className="text-primary transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black">{contact.engagementScore}</span>
                    <span className="text-xs text-muted-foreground">/100</span>
                  </div>
                </div>
                <p className="text-xs font-semibold mb-3 text-muted-foreground">Engagement</p>

                <div className="flex items-center gap-2 mb-2">
                  <PhaseIcon className={`size-3 ${phaseConfig.color}`} />
                  <KnowyBadge variant={contact.phase === 'growth' ? 'sage' : contact.phase === 'decline' ? 'coral' : 'muted'} size="sm">
                    {phaseConfig.label}
                  </KnowyBadge>
                </div>
                <p className="text-xs text-muted-foreground mb-4">depuis {contact.phaseDuration}</p>

                {/* Reciprocity */}
                <div className="w-full">
                  <p className="text-xs text-muted-foreground mb-2 text-center">Réciprocité</p>
                  <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden flex mb-1">
                    <div className="bg-primary" style={{ width: `${contact.reciprocity}%` }} />
                    <div className="bg-accent flex-1" />
                  </div>
                  <p className="text-xs text-center text-muted-foreground">
                    Vous {contact.reciprocity}%
                  </p>
                </div>
              </div>

              {/* Right - Contact Info */}
              <div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Dernier contact</p>
                    <p className="font-semibold text-sm">{contact.lastContact.date}</p>
                    <p className="text-xs text-muted-foreground capitalize">{contact.lastContact.type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Fréquence</p>
                    <p className="font-semibold text-sm">Tous les {contact.frequency}j</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Prochain contact</p>
                    <div className="flex items-center gap-1.5">
                      <Clock className="size-3 text-primary" />
                      <p className="font-semibold text-sm text-primary">Dans {contact.nextRecommended}j</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Sources</p>
                    <div className="flex flex-wrap gap-1.5">
                      <KnowyBadge variant={contact.sources.gmail ? 'sage' : 'muted'} size="sm">
                        Gmail {contact.sources.gmail && '✓'}
                      </KnowyBadge>
                      <KnowyBadge variant={contact.sources.calendar ? 'sage' : 'muted'} size="sm">
                        Calendar {contact.sources.calendar && '✓'}
                      </KnowyBadge>
                      <KnowyBadge variant={contact.sources.linkedin ? 'sage' : 'muted'} size="sm">
                        LinkedIn {contact.sources.linkedin && '✓'}
                      </KnowyBadge>
                      <KnowyBadge variant={contact.sources.crm ? 'sage' : 'muted'} size="sm">
                        CRM {contact.sources.crm && '✓'}
                      </KnowyBadge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </KnowyCard>
        </motion.div>

        {/* MÉMOIRE KNOWY - Timeline de progression des briefs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mb-4"
        >
          <KnowyCard className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/10">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="size-5 text-primary" />
              <h2 className="text-lg font-bold">Mémoire Knowy · Sarah Chen</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              7 réunions mémorisées · Brief #1 → Brief #7
            </p>

            <div className="space-y-4">
              {/* Brief #1 */}
              <div className="relative pl-6 pb-4 border-l-2 border-muted">
                <div className="absolute -left-[9px] top-0 size-4 rounded-full bg-muted border-2 border-background" />
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-sm">BRIEF #1 · JAN 2026</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Données publiques uniquement. Profil LinkedIn + site entreprise.
                    </p>
                  </div>
                  <KnowyBadge variant="coral" size="sm">34%</KnowyBadge>
                </div>
              </div>

              {/* Brief #3 */}
              <div className="relative pl-6 pb-4 border-l-2 border-muted">
                <div className="absolute -left-[9px] top-0 size-4 rounded-full bg-amber-600 border-2 border-background" />
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-sm">BRIEF #3 · MAR 2026</p>
                    <p className="text-xs text-muted-foreground mt-1 mb-2">
                      12 emails analysés. Style de communication inféré. 2 signaux LinkedIn ajoutés.
                    </p>
                    <div className="flex gap-2">
                      <span className="px-2 py-0.5 bg-amber-600/10 text-amber-600 rounded text-xs font-medium">
                        + style comm détecté
                      </span>
                    </div>
                  </div>
                  <KnowyBadge variant="amber" size="sm">58%</KnowyBadge>
                </div>
              </div>

              {/* Brief #5 */}
              <div className="relative pl-6 pb-4 border-l-2 border-primary">
                <div className="absolute -left-[9px] top-0 size-4 rounded-full bg-primary border-2 border-background" />
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-sm">BRIEF #5 · AVR 2026</p>
                    <p className="text-xs text-muted-foreground mt-1 mb-2">
                      3 réunions mémorisées. Mots-clés déclencheurs identifiés. Objections typiques modélisées.
                    </p>
                    <div className="flex gap-2">
                      <span className="px-2 py-0.5 bg-success/10 text-success rounded text-xs font-medium">
                        + objections modélisées
                      </span>
                      <span className="px-2 py-0.5 bg-success/10 text-success rounded text-xs font-medium">
                        + mots-clés détectés
                      </span>
                    </div>
                  </div>
                  <KnowyBadge variant="sage" size="sm">74%</KnowyBadge>
                </div>
              </div>

              {/* Brief #7 - Current */}
              <div className="relative pl-6">
                <div className="absolute -left-[9px] top-0 size-4 rounded-full bg-primary border-2 border-background shadow-lg shadow-primary/50" />
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-sm flex items-center gap-2">
                      BRIEF #7 · AUJOURD'HUI
                      <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium">ACTUEL</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 mb-2">
                      47 interactions analysées. Profil chirurgical. Agenda personnel inféré à 72% de confiance.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium">
                        ✨ niveau chirurgical
                      </span>
                      <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium">
                        + agenda personnel
                      </span>
                    </div>
                  </div>
                  <KnowyBadge variant="sage" size="sm">87%</KnowyBadge>
                </div>
              </div>
            </div>
          </KnowyCard>
        </motion.div>

        {/* 2-Column Layout: Intelligence (left) + Activity Feed (right) */}
        <div className="grid grid-cols-[1fr_400px] gap-6">
          {/* LEFT COLUMN - Intelligence Blocks */}
          <div className="space-y-4">

        {/* BLOC 2 - Active Alerts */}
        {alerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mb-4"
          >
            {alerts.map((alert, i) => (
              <KnowyCard key={i} className={`p-3 mb-2 border-l-4 ${
                alert.severity === 'success' ? 'border-success bg-success/5' :
                alert.severity === 'warning' ? 'border-amber-600 bg-amber-600/5' :
                'border-destructive bg-destructive/5'
              }`}>
                <div className="flex items-start gap-2">
                  <AlertCircle className={`size-4 flex-shrink-0 mt-0.5 ${
                    alert.severity === 'success' ? 'text-success' :
                    alert.severity === 'warning' ? 'text-amber-600' :
                    'text-destructive'
                  }`} />
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm mb-0.5">{alert.title}</h3>
                    <p className="text-xs text-muted-foreground mb-0.5">{alert.message}</p>
                    <p className="text-xs text-muted-foreground opacity-70">{alert.date}</p>
                  </div>
                </div>
              </KnowyCard>
            ))}
          </motion.div>
        )}

        {/* BLOC 3 - Relational Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mb-4"
        >
          <KnowyCard className="p-4">
            <h2 className="text-lg font-bold mb-4">Statistiques relationnelles</h2>
            <div className="grid grid-cols-3 gap-4">
              {stats.map((stat, i) => (
                <div key={i} className="text-center p-3 bg-muted/20 rounded-lg">
                  <p className="text-2xl font-black mb-1">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mb-0.5">{stat.label}</p>
                  <p className="text-xs text-muted-foreground opacity-60">via {stat.source}</p>
                </div>
              ))}
            </div>
          </KnowyCard>
        </motion.div>

        {/* BLOC 4 - Relationship Evolution Graph */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="mb-4"
        >
          <KnowyCard className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Évolution de la relation</h2>
              <div className="flex gap-2">
                {['3M', '6M', '12M', 'Tout'].map((period) => (
                  <button
                    key={period}
                    className="px-3 py-1 text-sm bg-muted/50 hover:bg-muted rounded-lg transition-colors"
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-80 relative">
              <svg viewBox="0 0 800 300" className="w-full h-full">
                {/* Grid lines */}
                <line x1="40" y1="50" x2="760" y2="50" stroke="currentColor" strokeWidth="1" className="text-border" strokeDasharray="4 4" />
                <line x1="40" y1="112.5" x2="760" y2="112.5" stroke="currentColor" strokeWidth="1" className="text-border" strokeDasharray="4 4" />
                <line x1="40" y1="175" x2="760" y2="175" stroke="currentColor" strokeWidth="1" className="text-border" strokeDasharray="4 4" />
                <line x1="40" y1="237.5" x2="760" y2="237.5" stroke="currentColor" strokeWidth="1" className="text-border" strokeDasharray="4 4" />

                {/* Y-axis labels */}
                <text x="25" y="55" className="text-xs fill-muted-foreground" textAnchor="end">100</text>
                <text x="25" y="117" className="text-xs fill-muted-foreground" textAnchor="end">75</text>
                <text x="25" y="180" className="text-xs fill-muted-foreground" textAnchor="end">50</text>
                <text x="25" y="242" className="text-xs fill-muted-foreground" textAnchor="end">25</text>
                <text x="25" y="280" className="text-xs fill-muted-foreground" textAnchor="end">0</text>

                {/* X-axis labels */}
                <text x="100" y="295" className="text-xs fill-muted-foreground" textAnchor="middle">Janv</text>
                <text x="220" y="295" className="text-xs fill-muted-foreground" textAnchor="middle">Fév</text>
                <text x="340" y="295" className="text-xs fill-muted-foreground" textAnchor="middle">Mars</text>
                <text x="460" y="295" className="text-xs fill-muted-foreground" textAnchor="middle">Avr</text>
                <text x="580" y="295" className="text-xs fill-muted-foreground" textAnchor="middle">Mai</text>
                <text x="700" y="295" className="text-xs fill-muted-foreground" textAnchor="middle">Juin</text>

                {/* Area under curve */}
                <path
                  d="M 40 237.5 L 100 225 L 160 200 L 220 187.5 L 280 175 L 340 162.5 L 400 137.5 L 460 125 L 520 112.5 L 580 87.5 L 640 75 L 700 62.5 L 760 50 L 760 275 L 40 275 Z"
                  fill="url(#scoreGradient)"
                  opacity="0.3"
                />

                {/* Gradient definition */}
                <defs>
                  <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="rgb(var(--primary))" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="rgb(var(--primary))" stopOpacity="0.1" />
                  </linearGradient>
                </defs>

                {/* Main curve */}
                <path
                  d="M 40 237.5 L 100 225 L 160 200 L 220 187.5 L 280 175 L 340 162.5 L 400 137.5 L 460 125 L 520 112.5 L 580 87.5 L 640 75 L 700 62.5 L 760 50"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary"
                />

                {/* Event markers */}
                <circle cx="220" cy="187.5" r="6" className="fill-primary stroke-white" strokeWidth="2" />
                <circle cx="400" cy="137.5" r="6" className="fill-primary stroke-white" strokeWidth="2" />
                <circle cx="580" cy="87.5" r="6" className="fill-primary stroke-white" strokeWidth="2" />
                <circle cx="700" cy="62.5" r="6" className="fill-primary stroke-white" strokeWidth="2" />

                {/* Event icons */}
                <text x="220" y="192" className="text-sm" textAnchor="middle">📧</text>
                <text x="400" y="142" className="text-sm" textAnchor="middle">📅</text>
                <text x="580" y="92" className="text-sm" textAnchor="middle">📅</text>
                <text x="700" y="67" className="text-sm" textAnchor="middle">⚡</text>
              </svg>

              {/* Legend */}
              <div className="mt-4 flex items-center justify-center gap-6 text-xs text-muted-foreground flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="size-3 rounded-full bg-primary" />
                  <span>Score d'engagement</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>📧</span>
                  <span>Email</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>📅</span>
                  <span>Réunion</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>⚡</span>
                  <span>Événement</span>
                </div>
              </div>
            </div>
          </KnowyCard>
        </motion.div>

        {/* BLOC 5 - Interaction Profile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="mb-4"
        >
          <KnowyCard className="p-4">
            <h2 className="text-lg font-bold mb-4">Profil interactionnel</h2>
            <div className="grid grid-cols-2 gap-6">
              {/* Left - Radar */}
              <div className="flex flex-col items-center">
                <div className="size-64 relative mb-4">
                  <svg viewBox="0 0 200 200" className="w-full h-full">
                    {/* Background hexagon layers */}
                    <polygon
                      points="100,20 173.2,60 173.2,140 100,180 26.8,140 26.8,60"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                      className="text-border"
                    />
                    <polygon
                      points="100,50 146.6,75 146.6,125 100,150 53.4,125 53.4,75"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                      className="text-border"
                      strokeDasharray="2 2"
                    />

                    {/* Axis lines */}
                    <line x1="100" y1="100" x2="100" y2="20" stroke="currentColor" strokeWidth="1" className="text-border" />
                    <line x1="100" y1="100" x2="173.2" y2="60" stroke="currentColor" strokeWidth="1" className="text-border" />
                    <line x1="100" y1="100" x2="173.2" y2="140" stroke="currentColor" strokeWidth="1" className="text-border" />
                    <line x1="100" y1="100" x2="100" y2="180" stroke="currentColor" strokeWidth="1" className="text-border" />
                    <line x1="100" y1="100" x2="26.8" y2="140" stroke="currentColor" strokeWidth="1" className="text-border" />
                    <line x1="100" y1="100" x2="26.8" y2="60" stroke="currentColor" strokeWidth="1" className="text-border" />

                    {/* Data polygon */}
                    <polygon
                      points="100,40 158.9,70 158.9,115 100,165 56.4,125 61.3,70"
                      fill="currentColor"
                      fillOpacity="0.2"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-primary"
                    />

                    {/* Data points */}
                    <circle cx="100" cy="40" r="4" className="fill-primary" />
                    <circle cx="158.9" cy="70" r="4" className="fill-primary" />
                    <circle cx="158.9" cy="115" r="4" className="fill-primary" />
                    <circle cx="100" cy="165" r="4" className="fill-primary" />
                    <circle cx="56.4" cy="125" r="4" className="fill-primary" />
                    <circle cx="61.3" cy="70" r="4" className="fill-primary" />

                    {/* Labels */}
                    <text x="100" y="15" className="text-xs fill-foreground font-medium" textAnchor="middle">Résultat</text>
                    <text x="180" y="65" className="text-xs fill-foreground font-medium" textAnchor="start">Rapidité</text>
                    <text x="180" y="145" className="text-xs fill-foreground font-medium" textAnchor="start">Structure</text>
                    <text x="100" y="195" className="text-xs fill-foreground font-medium" textAnchor="middle">Relation</text>
                    <text x="20" y="145" className="text-xs fill-foreground font-medium" textAnchor="end">Intuition</text>
                    <text x="20" y="65" className="text-xs fill-foreground font-medium" textAnchor="end">Contrôle</text>
                  </svg>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Confiance {interactionProfile.confidence}% · basé sur 47 emails + 8 réunions
                </p>
              </div>

              {/* Right - Axes Details */}
              <div className="space-y-4">
                {interactionProfile.axes.map((axis, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium">{axis.label}</span>
                      <span className="text-xs font-medium">{axis.opposite}</span>
                    </div>
                    <div className="relative h-1.5 bg-muted/30 rounded-full overflow-hidden">
                      <div
                        className="absolute top-0 left-0 h-full bg-primary rounded-full"
                        style={{ width: `${axis.value}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <p className="text-xs text-muted-foreground">{axis.description}</p>
                      <div className="flex items-center gap-2">
                        <KnowyBadge variant="muted" size="sm">{axis.level}</KnowyBadge>
                        <span className="text-xs text-muted-foreground">{axis.confidence}%</span>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="pt-3 border-t border-border">
                  <p className="text-xs font-medium mb-2 text-muted-foreground">Modes d'interaction</p>
                  <div className="flex flex-wrap gap-2">
                    {interactionProfile.modes.map((mode, i) => (
                      <KnowyBadge key={i} variant="primary" size="sm">
                        {mode.name} · {mode.probability}%
                      </KnowyBadge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </KnowyCard>
        </motion.div>

        {/* BLOC 6 - Behavioral Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
          className="mb-3"
        >
          <KnowyCard className="p-4">
            <button
              onClick={() => toggleBlock('behavioral')}
              className="w-full flex items-center justify-between mb-3 hover:text-primary transition-colors"
            >
              <h2 className="text-base font-bold">Analyse comportementale</h2>
              {openBlocks.behavioral ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </button>
            {openBlocks.behavioral && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                {behavioralInsights.map((insight, i) => {
                  const Icon = insight.icon;
                  return (
                    <div key={i} className="p-3 bg-muted/20 rounded-lg">
                      <div className="flex items-start gap-2 mb-2">
                        <Icon className="size-4 text-primary flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm mb-1">{insight.type}</h3>
                          <p className="text-xs text-muted-foreground mb-2">{insight.insight}</p>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground opacity-70">{insight.source}</p>
                            <KnowyBadge variant="muted" size="sm">{insight.confidence}%</KnowyBadge>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </KnowyCard>
        </motion.div>

        {/* BLOC 7 - Career Path */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.7 }}
          className="mb-3"
        >
          <KnowyCard className="p-4">
            <button
              onClick={() => toggleBlock('career')}
              className="w-full flex items-center justify-between mb-3 hover:text-primary transition-colors"
            >
              <h2 className="text-base font-bold">Parcours & CV observable</h2>
              {openBlocks.career ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </button>
            {openBlocks.career && (
              <>
                <div className="space-y-6 mb-6">
                  {careerPath.map((job, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`size-3 rounded-full ${job.isCurrent ? 'bg-primary' : 'bg-muted'}`} />
                        {i < careerPath.length - 1 && <div className="w-px h-full bg-border mt-2" />}
                      </div>
                      <div className="flex-1 pb-6">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold">{job.title}</h3>
                            <p className="text-sm text-muted-foreground">{job.company}</p>
                          </div>
                          {job.isCurrent && (
                            <KnowyBadge variant="primary" size="sm">Poste actuel</KnowyBadge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{job.duration}</p>
                        <div className="flex gap-2">
                          <KnowyBadge variant="muted" size="sm">{job.sector}</KnowyBadge>
                          {job.badges.map((badge, j) => (
                            <KnowyBadge key={j} variant="blue" size="sm">{badge}</KnowyBadge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    3 industries · 2 pivots · Secteur dominant: Tech
                  </p>
                </div>
              </>
            )}
          </KnowyCard>
        </motion.div>

        {/* BLOC 8 - Exchange History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.8 }}
          className="mb-3"
        >
          <KnowyCard className="p-4">
            <button
              onClick={() => toggleBlock('history')}
              className="w-full flex items-center justify-between mb-3 hover:text-primary transition-colors"
            >
              <h2 className="text-base font-bold">Historique des échanges</h2>
              {openBlocks.history ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </button>
            {openBlocks.history && (
              <div className="space-y-3">
                {exchangeHistory.map((item, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 bg-muted/20 rounded-xl">
                    {item.type === 'email' && (
                      <>
                        <Mail className="size-5 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-medium">{item.subject}</p>
                            <p className="text-sm text-muted-foreground">{item.date}</p>
                          </div>
                          <div className="flex gap-2">
                            <KnowyBadge variant="muted" size="sm">{item.tone}</KnowyBadge>
                            <KnowyBadge variant="muted" size="sm">{item.wordCount} mots</KnowyBadge>
                            <KnowyBadge variant="blue" size="sm">
                              Initié par {item.initiator === 'you' ? 'vous' : 'eux'}
                            </KnowyBadge>
                          </div>
                        </div>
                      </>
                    )}
                    {item.type === 'meeting' && (
                      <>
                        <Calendar className="size-5 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-medium">{item.title}</p>
                            <p className="text-sm text-muted-foreground">{item.date}</p>
                          </div>
                          <div className="flex gap-2">
                            <KnowyBadge variant="muted" size="sm">{item.duration} (planifié {item.planned})</KnowyBadge>
                            <KnowyBadge variant="muted" size="sm">{item.participants} participants</KnowyBadge>
                            {item.hasBrief && (
                              <KnowyBadge variant="primary" size="sm">Brief disponible</KnowyBadge>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                    {item.type === 'brief' && (
                      <>
                        <Sparkles className="size-5 text-primary flex-shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-medium">Brief Knowy - {item.briefType}</p>
                            <p className="text-sm text-muted-foreground">{item.date}</p>
                          </div>
                          <div className="flex gap-2">
                            <KnowyBadge variant="primary" size="sm">Conf. {item.confidence}%</KnowyBadge>
                            <button className="text-sm text-primary hover:underline">Voir le brief →</button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                <button className="w-full py-3 text-sm text-primary hover:underline">
                  Voir les 23 échanges précédents
                </button>
              </div>
            )}
          </KnowyCard>
        </motion.div>

        {/* BLOC 9 - Topics & Objections */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.9 }}
          className="mb-3"
        >
          <KnowyCard className="p-4">
            <button
              onClick={() => toggleBlock('topics')}
              className="w-full flex items-center justify-between mb-3 hover:text-primary transition-colors"
            >
              <h2 className="text-base font-bold">Sujets & Objections historiques</h2>
              {openBlocks.topics ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </button>
            {openBlocks.topics && (
              <div className="grid grid-cols-2 gap-6">
                {/* Topics */}
                <div>
                  <h3 className="font-semibold mb-4">Sujets abordés</h3>
                  <div className="flex flex-wrap gap-2">
                    {topics.map((topic, i) => (
                      <KnowyBadge key={i} variant="blue" size="md">
                        {topic.name} ×{topic.count}
                      </KnowyBadge>
                    ))}
                  </div>
                </div>

                {/* Objections */}
                <div>
                  <h3 className="font-semibold mb-4">Objections identifiées</h3>
                  <div className="space-y-3">
                    {objections.map((obj, i) => (
                      <div key={i} className="p-3 bg-muted/20 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-medium text-sm">{obj.objection}</p>
                          <KnowyBadge
                            variant={obj.status === 'resolved' ? 'sage' : 'coral'}
                            size="sm"
                          >
                            {obj.status === 'resolved' ? 'Résolue' : 'Active'}
                          </KnowyBadge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {obj.firstMentioned} · {obj.mentions} mention{obj.mentions > 1 ? 's' : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </KnowyCard>
        </motion.div>

        {/* BLOC 10 - Company Context */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 1.0 }}
          className="mb-3"
        >
          <KnowyCard className="p-4">
            <button
              onClick={() => toggleBlock('company')}
              className="w-full flex items-center justify-between mb-3 hover:text-primary transition-colors"
            >
              <h2 className="text-base font-bold">Contexte entreprise actuel</h2>
              {openBlocks.company ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </button>
            {openBlocks.company && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <KnowyBadge variant="sage" size="lg">
                    Momentum {companyContext.momentum === 'favorable' ? 'favorable 🟢' : 'neutre ⚪'}
                  </KnowyBadge>
                </div>
                <div className="p-4 bg-success/5 border border-success/20 rounded-xl">
                  <p className="font-semibold mb-1">{companyContext.news}</p>
                  <p className="text-sm text-muted-foreground">{companyContext.newsDate}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="size-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {companyContext.activeJobs} postes ouverts au recrutement
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {companyContext.signals.map((signal, i) => (
                    <KnowyBadge key={i} variant="blue" size="sm">{signal}</KnowyBadge>
                  ))}
                </div>
              </div>
            )}
          </KnowyCard>
        </motion.div>

        {/* BLOC 11 - Shared Network */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 1.1 }}
          className="mb-3"
        >
          <KnowyCard className="p-4">
            <button
              onClick={() => toggleBlock('network')}
              className="w-full flex items-center justify-between mb-3 hover:text-primary transition-colors"
            >
              <h2 className="text-base font-bold">Réseau partagé</h2>
              {openBlocks.network ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </button>
            {openBlocks.network && (
              <div className="space-y-3">
                {sharedNetwork.map((person, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-muted/20 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="size-10 bg-primary/10 rounded-full flex items-center justify-center font-semibold text-primary">
                        {person.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-medium">{person.name}</p>
                        <p className="text-sm text-muted-foreground">{person.role}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{person.interactions}</p>
                      <p className="text-xs text-muted-foreground">{person.lastContact}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </KnowyCard>
        </motion.div>

        {/* BLOC 12 - Action Recommendation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 1.2 }}
          className="mb-6"
        >
          <KnowyCard className="p-4 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
            <h2 className="text-base font-bold mb-3">Recommandation d'action</h2>
            <p className="text-sm text-muted-foreground">
              La relation est en bonne dynamique. Dernier contact il y a 3 jours. Prochain contact recommandé dans 9 jours.
              Angle suggéré : capitaliser sur la récente levée de fonds pour discuter d'expansion du partenariat.
            </p>
          </KnowyCard>
        </motion.div>

          </div>
          {/* END LEFT COLUMN */}

          {/* RIGHT COLUMN - Activity Feed (Sticky) */}
          <div className="sticky top-6 self-start h-fit">
            <KnowyCard className="p-4">
              <h2 className="font-bold mb-4 flex items-center gap-2">
                <Zap className="size-4 text-primary" />
                Activité récente
              </h2>

              {/* Relationship Health Status */}
              <div className="mb-6 p-3 bg-success/10 rounded-xl border border-success/20">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="size-4 text-success" />
                  <span className="font-semibold text-sm text-success">Relation en bonne santé</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Prochain contact recommandé: <strong>4 juin</strong>
                </p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>Derniers 5 jours:</span>
                  <div className="flex items-center gap-1">
                    <Mail className="size-3" />
                    <span>2</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="size-3" />
                    <span>1</span>
                  </div>
                </div>
              </div>

              {/* Activity Timeline */}
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {exchangeHistory.map((item, i) => (
                  <div key={i} className="border-l-2 border-border pl-4 pb-3 relative">
                    <div className="absolute -left-[5px] top-2 size-2.5 rounded-full bg-primary border-2 border-background" />

                    {item.type === 'email' && (
                      <div className="bg-muted/20 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Mail className="size-3 text-primary" />
                          <span className="text-xs font-semibold">Email</span>
                          <span className="text-xs text-muted-foreground ml-auto">{item.date}</span>
                        </div>
                        <p className="text-sm font-medium mb-1">{item.subject}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className={item.tone === 'chaleureux' ? 'text-success' : 'text-muted-foreground'}>
                            Ton: {item.tone}
                          </span>
                          <span>•</span>
                          <span>{item.wordCount} mots</span>
                        </div>
                      </div>
                    )}

                    {item.type === 'meeting' && (
                      <div className="bg-primary/10 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="size-3 text-primary" />
                          <span className="text-xs font-semibold">Réunion</span>
                          <span className="text-xs text-muted-foreground ml-auto">{item.date}</span>
                        </div>
                        <p className="text-sm font-medium mb-2">{item.title}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                          <span>{item.duration}</span>
                          <span>•</span>
                          <span>{item.participants} participants</span>
                        </div>
                        {item.meetingId && (
                          <KnowyButton
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/meeting/${item.meetingId}`)}
                            className="w-full"
                          >
                            Voir la réunion →
                          </KnowyButton>
                        )}
                      </div>
                    )}

                    {item.type === 'brief' && (
                      <div className="bg-violet/10 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Sparkles className="size-3 text-violet" />
                          <span className="text-xs font-semibold">Brief généré</span>
                          <span className="text-xs text-muted-foreground ml-auto">{item.date}</span>
                        </div>
                        <p className="text-sm font-medium mb-1">{item.briefType}</p>
                        <div className="text-xs text-muted-foreground">
                          Confiance: {item.confidence}%
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-4 border-t border-border space-y-2">
                <KnowyButton variant="primary" size="sm" className="w-full" icon={<Mail className="size-4" />}>
                  Envoyer un email
                </KnowyButton>
                <KnowyButton variant="secondary" size="sm" className="w-full" icon={<Calendar className="size-4" />}>
                  Planifier réunion
                </KnowyButton>
              </div>
            </KnowyCard>
          </div>
          {/* END RIGHT COLUMN */}

        </div>
        {/* END 2-COLUMN LAYOUT */}
      </div>
    </div>
  );
}
