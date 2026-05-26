import { motion } from 'motion/react';
import { useNavigate, useParams } from 'react-router';
import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  RefreshCw,
  Share2,
  Star,
  Users,
  Building2,
  Target,
  Linkedin,
  Mail,
  Database,
  Slack,
  AlertCircle,
  CheckCircle2,
  Shield,
  AlertTriangle,
  CircleDot,
  ArrowRight,
  Sparkles,
  Loader2,
  Clock,
  MapPin,
  Video,
  Calendar,
  ExternalLink,
  UserPlus,
} from 'lucide-react';
import KnowyCard from './knowy/KnowyCard';
import KnowyBadge from './knowy/KnowyBadge';
import KnowyButton from './knowy/KnowyButton';
import RadarChart from './RadarChart';
import { getMeeting, getMeetingParticipants } from '../../lib/api/meetings';
import { getActiveOrganizationId } from '../../lib/api/org';
import { supabase } from '../../lib/supabase';
import type { Meeting } from '../../types/domain';

interface Participant {
  id: string;
  name: string;
  role: string;
  company: string;
  badge: 'champion' | 'decider' | 'gatekeeper' | 'blocker' | null;
  influenceDots: number;
  behavioralSignals: string[];
  resultVsRelation: number;
  speedVsCaution: number;
  structureVsIntuition: number;
  controlVsConsensus: number;
  interactionModes: {
    primary: string[];
    secondary: string[];
  };
  personalAgenda: {
    motivations: string[];
    confidence: number;
  } | null;
  validatesBy?: string[];
  influences?: string[];
  relationContext?: {
    engagementScore: number;
    phase: 'growth' | 'stagnant' | 'decline';
    relationSince: string;
    lastContactDays: number;
    avgFrequencyDays: number;
    totalInteractions: number;
  };
}

export default function MeetingAnalysis() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [selectedParticipant, setSelectedParticipant] = useState<string>('');

  // Real meeting data
  const [realMeeting, setRealMeeting] = useState<Meeting | null>(null);
  const [loadedParticipants, setLoadedParticipants] = useState<Participant[]>([]);
  const [loadedSources, setLoadedSources] = useState<{ name: string; icon: any; connected: boolean; gain?: number }[]>([]);
  const [postSummary, setPostSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let mounted = true;

    async function load() {
      setLoading(true);

      // Load meeting
      const mtg = await getMeeting(id);
      if (mounted && mtg) setRealMeeting(mtg);

      // Load participants with cognitive profiles
      const parts = await getMeetingParticipants(id);
      if (mounted && parts.length > 0) {
        // Load relationship snapshots for each participant
        const snapshots: Record<string, any> = {};
        if (supabase) {
          const { data: snaps } = await supabase
            .from('relationship_snapshots')
            .select('*')
            .in('contact_id', parts.map(p => p.contact.id));
          (snaps ?? []).forEach((s: any) => { snapshots[s.contact_id] = s; });
        }

        const mapped: Participant[] = parts.map((p, idx) => {
          const prof = p.profile;
          const snap = snapshots[p.contact.id];

          // Map axes from cognitive profile
          const getAxisValue = (axis: string) => prof?.axes.find(a => a.axis === axis)?.value ?? 50;
          const getModes = (primary: boolean) => {
            if (!prof) return [];
            const sorted = [...prof.interactionModes].sort((a, b) => b.score - a.score);
            const top = sorted.filter(m => m.score >= 60);
            if (primary) return top.slice(0, 2).map(m => m.mode);
            return sorted.filter(m => m.score >= 40 && m.score < 60).slice(0, 1).map(m => m.mode);
          };

          return {
            id: p.contact.id,
            name: p.contact.name,
            role: p.contact.title,
            company: p.contact.company,
            badge: null,
            influenceDots: Math.max(1, Math.min(5, Math.round((prof?.globalConfidence ?? 0) / 20))),
            behavioralSignals: prof?.signals.slice(0, 3).map(s => s.text) ?? [],
            resultVsRelation: getAxisValue('relation_result'),
            speedVsCaution: getAxisValue('caution_speed'),
            structureVsIntuition: getAxisValue('intuition_structure'),
            controlVsConsensus: getAxisValue('consensus_control'),
            interactionModes: { primary: getModes(true) as any[], secondary: getModes(false) as any[] },
            personalAgenda: null,
            relationContext: snap ? {
              engagementScore: snap.engagement_score ?? 0,
              phase: snap.phase ?? 'stagnant',
              relationSince: '—',
              lastContactDays: snap.last_contact_date
                ? Math.floor((Date.now() - new Date(snap.last_contact_date).getTime()) / 86400000)
                : 0,
              avgFrequencyDays: snap.frequency_days ?? 30,
              totalInteractions: (snap.emails_exchanged ?? 0) + (snap.meetings_count ?? 0),
            } : undefined,
          };
        });
        setLoadedParticipants(mapped);
        if (mapped.length > 0) setSelectedParticipant(mapped[0].id);
      }

      // Load connector statuses for the sidebar
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: connectors } = await supabase
            .from('connectors')
            .select('provider, status')
            .eq('user_id', user.id);
          const map: Record<string, boolean> = {};
          (connectors ?? []).forEach((c: any) => { map[c.provider] = c.status === 'connected'; });
          setLoadedSources([
            { name: 'Gmail', icon: Mail, connected: map['google'] ?? false },
            { name: 'Slack', icon: Slack, connected: map['slack'] ?? false, gain: 20 },
            { name: 'LinkedIn', icon: Linkedin, connected: map['linkedin'] ?? false },
            { name: 'HubSpot', icon: Database, connected: map['hubspot'] ?? false, gain: 12 },
          ]);
        }
      }

      // Load post-meeting summary if exists
      if (supabase) {
        const { data: psum } = await supabase
          .from('meeting_post_summaries')
          .select('*')
          .eq('meeting_id', id)
          .maybeSingle();
        if (mounted) setPostSummary(psum ?? null);
      }

      if (mounted) setLoading(false);
    }

    load();
    return () => { mounted = false; };
  }, [id]);

  // Derive display values from real data (fall back to placeholders)
  const isPast = realMeeting ? new Date(realMeeting.startsAt) < new Date() : false;
  const [activeTab, setActiveTab] = useState<'summary' | 'prep' | 'participants'>('prep');

  // Duration in minutes
  const durationMin = realMeeting && (realMeeting as any).endsAt
    ? Math.round((new Date((realMeeting as any).endsAt).getTime() - new Date(realMeeting.startsAt).getTime()) / 60000)
    : null;

  // Use real meeting or placeholder
  const meeting = realMeeting ? {
    title: realMeeting.title,
    company: realMeeting.company || '—',
    logo: '📅',
    type: realMeeting.briefStatus === 'ready' || realMeeting.briefStatus === 'consulted' ? 'Brief prêt' : 'Brief en attente',
    date: new Date(realMeeting.startsAt).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    time: new Date(realMeeting.startsAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    timeEnd: (realMeeting as any).endsAt
      ? new Date((realMeeting as any).endsAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      : null,
    location: (realMeeting as any).location ?? null,
    platform: (realMeeting as any).format === 'physical' ? 'Présentiel' : 'Google Meet',
    isExternal: (realMeeting as any).isExternal ?? true,
  } : {
    title: 'Réunion',
    company: '—',
    logo: '📅',
    type: '—',
    date: '—',
    time: '—',
    timeEnd: null,
    location: null,
    platform: '—',
    isExternal: true,
  };

  const confidenceScore = realMeeting?.importanceScore ?? 0;
  const sources = loadedSources.length > 0 ? loadedSources : [
    { name: 'Gmail', icon: Mail, connected: false },
    { name: 'Slack', icon: Slack, connected: false, gain: 20 },
    { name: 'LinkedIn', icon: Linkedin, connected: false },
    { name: 'HubSpot', icon: Database, connected: false, gain: 12 },
  ];
  const participants = loadedParticipants;

  // executiveSummary — comes from AI post-processing (meeting_post_summaries table)
  // When empty, display "Brief not yet generated" state
  const executiveSummary = postSummary ? {
    text: postSummary.summary_text ?? '',
    tags: (postSummary.tags ?? []).map((t: any) => ({ label: t.label, variant: (t.variant ?? 'muted') as any })),
    sources: postSummary.sources ?? [],
  } : null;

  // companyContext — would come from company_signals table (loaded per participant company)
  // Left as null for now; will be populated by future AI processing
  const companyContext = null;

  const meddpicc = [
    { letter: 'M', label: 'Metrics', status: 'unknown', detail: 'Non qualifié' },
    { letter: 'E', label: 'Economic Buyer', status: 'complete', detail: 'Sarah Chen · VP Partnerships' },
    { letter: 'D', label: 'Decision Criteria', status: 'partial', detail: 'ROI + Time-to-value confirmés' },
    { letter: 'D', label: 'Decision Process', status: 'partial', detail: 'Timeline Q2 · Process non documenté' },
    { letter: 'P', label: 'Paper Process', status: 'unknown', detail: 'Non qualifié' },
    { letter: 'I', label: 'Identify Pain', status: 'complete', detail: 'Gap sales enablement' },
    { letter: 'C', label: 'Champion', status: 'complete', detail: 'Sarah Chen confirmée' },
    { letter: 'C', label: 'Competition', status: 'risk', detail: '2 compétiteurs actifs' }
  ];

  const competition = {
    qualified: false,
    competitors: [
      { name: 'Gong', status: 'probable', source: 'LinkedIn post Sarah' },
      { name: 'Chorus.ai', status: 'confirmé', source: 'Email Marc' }
    ],
    questionsToAsk: [
      'Quelles solutions évaluez-vous actuellement ?',
      'Qui utilise quoi dans votre stack actuel ?',
      'Qu\'est-ce qui vous bloque avec votre solution actuelle ?'
    ]
  };

  const selectionCriteria = [
    { rank: 1, criterion: 'ROI démontrable', probability: 95, source: 'Email Marc' },
    { rank: 2, criterion: 'Time-to-value < 30j', probability: 85, source: 'Call Sarah' },
    { rank: 3, criterion: 'Intégration Salesforce', probability: 70, source: 'Mémoire Knowy' },
    { rank: 4, criterion: 'Support en français', probability: 45, source: 'Hypothèse' }
  ];

  const inactionCost = {
    currentProvider: 'Process manuel + Gong partiel',
    inactionLevel: 'élevé',
    window: 'se ferme',
    insight: 'Leur VP Sales part en Q3. S\'ils n\'ont pas de solution avant, le projet sera gelé 6 mois.',
    sources: ['LinkedIn', 'Gmail']
  };

  const objections = [
    {
      objection: '"On utilise déjà Gong, pourquoi changer ?"',
      type: 'statu quo',
      probability: 85,
      response: 'Gong fait du coaching call. Knowy fait de l\'intelligence relationnelle — on se complète. Vous gardez Gong pour les calls, on ajoute le layer relationnel.',
      source: 'LinkedIn · Sarah a mentionné Gong'
    },
    {
      objection: '"C\'est quoi le ROI chiffré ?"',
      type: 'ROI',
      probability: 95,
      response: '3 clients comparables : +22% win rate en 90j. Je peux vous montrer les chiffres exacts si vous signez un NDA.',
      source: 'Profil Marc · analytique'
    },
    {
      objection: '"On n\'a pas le temps de déployer ça maintenant"',
      type: 'timing',
      probability: 70,
      response: 'Justement — pilote 30j, 3 AE seulement. Vous voyez les résultats avant de scaler. Pas de projet lourd.',
      source: 'Agenda Sarah · cherche quick win'
    }
  ];

  const recommendations = [
    { num: 1, phase: 'Ouverture · min 0–5', action: 'Qualifier les metrics de succès', rationale: 'Marc attend des KPIs — sans ça, il bloquera. Poser la question avant de pitcher.' },
    { num: 2, phase: 'Découverte · min 5–15', action: 'Ancrer sur le départ du VP Sales Q3', rationale: 'Fenêtre d\'opportunité courte — créer l\'urgence sans forcer.' },
    { num: 3, phase: 'Démo · min 15–35', action: 'Montrer un pilote 30j au lieu d\'un déploiement 6 mois', rationale: 'Sarah cherche un quick win — lui proposer exactement ça.' },
    { num: 4, phase: 'Clôture · min 35–45', action: 'Proposer 3 prochaines étapes avec deadlines', rationale: 'Marc est méthodique — lui donner une roadmap claire rassure.' }
  ];

  const risks = [
    {
      risk: 'Momentum en baisse',
      level: 'high' as const,
      description: 'Dernier contact il y a 23 jours',
      consequence: 'Le deal peut refroidir si on ne réactive pas rapidement',
      mitigation: 'Proposer un follow-up dans les 48h avec une deadline'
    },
    {
      risk: 'Concurrence non qualifiée',
      level: 'medium' as const,
      description: '2 compétiteurs actifs mais process de sélection inconnu',
      consequence: 'On peut perdre sans savoir pourquoi',
      mitigation: 'Qualifier les critères et le process dès cette réunion'
    }
  ];

  const nextSteps = [
    { task: 'Qualifier metrics de succès avec Marc', timing: 'En meeting', priority: 1, assignee: 'Vous' },
    { task: 'Envoyer benchmark ROI sous NDA', timing: 'J+1', priority: 1, assignee: 'Vous' },
    { task: 'Proposer pilot 30j avec 3 AE', timing: 'J+1', priority: 1, assignee: 'Vous' },
    { task: 'Qualifier concurrence et process', timing: 'En meeting', priority: 2, assignee: 'Vous' },
    { task: 'Update HubSpot deal stage', timing: 'J+1', priority: 2, assignee: 'Vous' },
    { task: 'Scheduler démo technique', timing: 'J+2 à J+7', priority: 2, assignee: 'Marc' }
  ];

  const currentParticipant = participants.find(p => p.id === selectedParticipant) || participants[0];

  if (loading) {
    return (
      <div className="size-full flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="size-10 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement de la réunion…</p>
        </div>
      </div>
    );
  }

  if (!realMeeting) {
    return (
      <div className="size-full flex items-center justify-center bg-background">
        <div className="text-center">
          <Calendar className="size-12 text-muted-foreground mx-auto mb-4 opacity-40" />
          <h2 className="text-xl font-semibold mb-2">Réunion introuvable</h2>
          <p className="text-muted-foreground mb-6">Cette réunion n'existe pas ou a été supprimée.</p>
          <button onClick={() => navigate('/meetings')} className="px-4 py-2 bg-primary text-white rounded-xl text-sm">
            Retour aux réunions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="size-full overflow-auto bg-background">
      {/* Header Sticky */}
      <div className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <KnowyButton
                variant="ghost"
                size="sm"
                icon={<ArrowLeft className="size-4" />}
                onClick={() => navigate('/meetings')}
              />
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-black">{meeting.title}</h1>
                  {meeting.company !== '—' && (
                    <span className="text-lg text-muted-foreground font-normal">· {meeting.company}</span>
                  )}
                  <KnowyBadge variant={isPast ? 'muted' : 'violet'}>
                    {isPast ? 'Terminée' : meeting.type}
                  </KnowyBadge>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3" />
                    {meeting.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" />
                    {meeting.time}{meeting.timeEnd ? ` → ${meeting.timeEnd}` : ''}{durationMin ? ` (${durationMin}min)` : ''}
                  </span>
                  {meeting.location ? (
                    <a href={meeting.location} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-primary transition-colors">
                      <Video className="size-3" /> {meeting.platform} <ExternalLink className="size-2.5" />
                    </a>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Video className="size-3" /> {meeting.platform}
                    </span>
                  )}
                  {participants.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Users className="size-3" /> {participants.length} participant{participants.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {confidenceScore > 0 && (
                <div className="text-right">
                  <p className="text-xs text-muted-foreground mb-1">Confiance</p>
                  <p className={`text-2xl font-black ${confidenceScore >= 60 ? 'text-sage' : 'text-amber'}`}>
                    {confidenceScore}%
                  </p>
                </div>
              )}
              <KnowyButton variant="secondary" size="sm" icon={<Share2 className="size-4" />} />
            </div>
          </div>
        </div>
      </div>

      {/* Pills Navigation - Outside sticky header */}
      <div className="bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex gap-2">
            {isPast && (
              <button
                onClick={() => setActiveTab('summary')}
                className={`px-4 py-2 rounded-full font-semibold transition-all ${
                  activeTab === 'summary'
                    ? 'bg-primary text-white'
                    : 'bg-muted/30 hover:bg-muted/50'
                }`}
              >
                Résumé
              </button>
            )}
            <button
              onClick={() => setActiveTab('prep')}
              className={`px-4 py-2 rounded-full font-semibold transition-all ${
                activeTab === 'prep'
                  ? 'bg-primary text-white'
                  : 'bg-muted/30 hover:bg-muted/50'
              }`}
            >
              Préparation
            </button>
            <button
              onClick={() => setActiveTab('participants')}
              className={`px-4 py-2 rounded-full font-semibold transition-all ${
                activeTab === 'participants'
                  ? 'bg-primary text-white'
                  : 'bg-muted/30 hover:bg-muted/50'
              }`}
            >
              Participants
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Tab: Préparation */}
        {activeTab === 'prep' && (
        <div className="grid grid-cols-[280px_1fr] gap-6">
          {/* Sidebar */}
          <div className="sticky top-28 self-start space-y-4">
            <KnowyCard className="p-6">
              <div className="text-center mb-4">
                <div className={`text-5xl font-black mb-2 ${confidenceScore >= 60 ? 'text-sage' : 'text-amber'}`}>
                  {confidenceScore}%
                </div>
                <p className="text-xs text-muted-foreground">Score de confiance</p>
              </div>

              <div className="h-2 bg-muted rounded-full overflow-hidden mb-4">
                <div
                  className={`h-full ${confidenceScore >= 60 ? 'bg-sage' : 'bg-amber'}`}
                  style={{ width: `${confidenceScore}%` }}
                />
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-xs font-bold mb-2 text-muted-foreground">SOURCES CONNECTÉES</p>
                {sources.map((source, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <source.icon className={`size-3 ${source.connected ? 'text-sage' : 'text-muted-foreground'}`} />
                      <span className={source.connected ? '' : 'text-muted-foreground'}>{source.name}</span>
                    </div>
                    {source.connected ? (
                      <CheckCircle2 className="size-3 text-sage" />
                    ) : (
                      <span className="text-amber font-mono">+{source.gain}%</span>
                    )}
                  </div>
                ))}
              </div>

              {sources.find(s => s.gain && !s.connected) && (
                <div className="p-3 bg-amber/10 rounded-xl border border-amber/20">
                  <p className="text-xs font-bold mb-1 text-amber">Recommandé</p>
                  <p className="text-xs text-muted-foreground mb-2">
                    Connecter Slack → +20%
                  </p>
                  <button className="text-xs text-primary hover:underline">
                    Gérer les connecteurs →
                  </button>
                </div>
              )}
            </KnowyCard>
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            {/* GROUPE 1 — CONTEXTE */}
            <div >
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-2xl font-black">Contexte</h2>
              </div>

              {/* Section A — Résumé Exécutif */}
              <KnowyCard className="p-6 mb-4 border-l-4 border-l-primary">
                <h3 className="text-sm font-bold mb-3 text-muted-foreground">RÉSUMÉ EXÉCUTIF</h3>

                {/* Alerte si au moins une relation refroidit */}
                {participants.some(p =>
                  p.relationContext && p.relationContext.lastContactDays > (p.relationContext.avgFrequencyDays * 1.8)
                ) && (
                  <div className="mb-3 p-3 bg-amber-600/10 border border-amber-600/20 rounded-lg flex items-start gap-2">
                    <AlertTriangle className="size-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-amber-600 mb-1">⚠️ Attention : Relation(s) en refroidissement</p>
                      <p className="text-xs text-muted-foreground">
                        {participants
                          .filter(p => p.relationContext && p.relationContext.lastContactDays > (p.relationContext.avgFrequencyDays * 1.8))
                          .map(p => p.name)
                          .join(', ')
                        } — Dernier contact au-delà de la fréquence habituelle. Réactiver rapidement.
                      </p>
                    </div>
                  </div>
                )}

                {executiveSummary ? (
                  <>
                    <div className="p-4 bg-primary/5 rounded-xl mb-3">
                      <p className="text-base leading-relaxed italic">{executiveSummary.text}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {executiveSummary.tags.map((tag: any, i: number) => (
                        <KnowyBadge key={i} variant={tag.variant}>{tag.label}</KnowyBadge>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 bg-muted/20 rounded-xl">
                    <Sparkles className="size-8 mx-auto mb-2 text-muted-foreground/50" />
                    <p className="text-sm font-semibold mb-1">Brief IA non encore généré</p>
                    <p className="text-xs text-muted-foreground mb-4">
                      Le résumé exécutif sera généré automatiquement avant votre réunion.
                    </p>
                    <button className="px-4 py-2 bg-primary text-white rounded-xl text-sm hover:bg-accent transition-colors">
                      Générer le brief maintenant
                    </button>
                  </div>
                )}
              </KnowyCard>

              {/* Section B — Contexte Entreprise */}
              <KnowyCard className="p-6">
                <h3 className="text-sm font-bold mb-4 text-muted-foreground">CONTEXTE ENTREPRISE</h3>

                <div className="text-center py-6 text-muted-foreground text-sm">
                  <p>Données entreprise non disponibles.</p>
                  <p className="text-xs mt-1">Connectez LinkedIn ou HubSpot pour enrichir le contexte.</p>
                </div>
              </KnowyCard>
            </div>

            {/* GROUPE 2 — PERSONNES */}
            <div >
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-2xl font-black">Personnes</h2>
              </div>

              {/* Section C — Participants */}
              <KnowyCard className="p-6 mb-4">
                <h3 className="text-sm font-bold mb-4 text-muted-foreground">PARTICIPANTS & INFLUENCE</h3>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  {participants.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedParticipant(p.id)}
                      className={`text-left p-4 rounded-xl border-2 transition-all ${
                        selectedParticipant === p.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/30'
                      }`}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="size-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-black flex-shrink-0">
                          {p.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm mb-1">{p.name}</p>
                          <p className="text-xs text-muted-foreground mb-2">{p.role}</p>
                          <div className="flex gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <div
                                key={i}
                                className={`size-2 rounded-full ${
                                  i < p.influenceDots ? 'bg-primary' : 'bg-muted'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      {p.badge && (
                        <KnowyBadge variant={
                          p.badge === 'champion' ? 'sage' :
                          p.badge === 'decider' ? 'violet' :
                          p.badge === 'gatekeeper' ? 'amber' : 'coral'
                        } size="sm">
                          {p.badge === 'champion' ? 'Champion' :
                           p.badge === 'decider' ? 'Décideur' :
                           p.badge === 'gatekeeper' ? 'Gatekeeper' : 'Bloqueur'}
                        </KnowyBadge>
                      )}

                      {/* Contexte relationnel */}
                      {p.relationContext && (
                        <div className="mt-3 p-3 bg-muted/30 rounded-lg border border-border">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-muted-foreground">CONTEXTE RELATIONNEL</span>
                            <KnowyBadge
                              variant={
                                p.relationContext.engagementScore > 65 ? 'sage' :
                                p.relationContext.engagementScore >= 35 ? 'amber' : 'coral'
                              }
                              size="sm"
                            >
                              {p.relationContext.engagementScore}
                            </KnowyBadge>
                          </div>

                          {/* Alerte si relation refroidit */}
                          {p.relationContext.lastContactDays > (p.relationContext.avgFrequencyDays * 1.8) && (
                            <div className="flex items-center gap-1.5 mb-2 text-amber-600">
                              <AlertTriangle className="size-3 flex-shrink-0" />
                              <span className="text-xs font-medium">Relation en refroidissement</span>
                            </div>
                          )}

                          <div className="text-xs text-muted-foreground space-y-1 mb-2">
                            <p>Relation depuis {p.relationContext.relationSince}</p>
                            <p>Dernier contact: Il y a {p.relationContext.lastContactDays}j {p.relationContext.lastContactDays > p.relationContext.avgFrequencyDays && `(vs ${p.relationContext.avgFrequencyDays}j hab.)`}</p>
                            <p>{p.relationContext.totalInteractions} échanges au total</p>
                          </div>

                          <KnowyButton
                            variant="ghost"
                            size="sm"
                            className="w-full mt-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/relation/${p.id}`);
                            }}
                          >
                            Voir profil complet →
                          </KnowyButton>
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                <div className="p-4 bg-muted/50 rounded-xl">
                  <p className="text-xs font-bold mb-3 text-muted-foreground">DYNAMIQUES POLITIQUES</p>
                  <div className="space-y-2 text-sm">
                    {participants.map((p) => (
                      <div key={p.id}>
                        {p.validatesBy && p.validatesBy.length > 0 && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span className="font-bold text-foreground">{p.name}</span>
                            <ArrowRight className="size-3" />
                            <span>valide auprès de {p.validatesBy.join(', ')}</span>
                          </div>
                        )}
                        {p.influences && p.influences.length > 0 && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span className="font-bold text-foreground">{p.name}</span>
                            <ArrowRight className="size-3" />
                            <span>influence {p.influences.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </KnowyCard>

              {/* Section D — Profil Interactionnel */}
              <KnowyCard className="p-6 mb-4">
                <h3 className="text-sm font-bold mb-4 text-muted-foreground">
                  PROFIL INTERACTIONNEL · {currentParticipant.name}
                </h3>

                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <p className="text-xs font-bold mb-3 text-muted-foreground">Radar comportemental</p>
                    <div className="flex items-center justify-center bg-muted/50 rounded-xl p-4">
                      <RadarChart
                        size={220}
                        data={[
                          { label: 'Résultat', value: currentParticipant.resultVsRelation },
                          { label: 'Rapidité', value: currentParticipant.speedVsCaution },
                          { label: 'Structure', value: currentParticipant.structureVsIntuition },
                          { label: 'Relation', value: 100 - currentParticipant.resultVsRelation },
                          { label: 'Intuition', value: 100 - currentParticipant.structureVsIntuition },
                          { label: 'Contrôle', value: currentParticipant.controlVsConsensus }
                        ]}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    {[
                      { left: 'Résultat', right: 'Relation', value: currentParticipant.resultVsRelation },
                      { left: 'Rapidité', right: 'Prudence', value: currentParticipant.speedVsCaution },
                      { left: 'Structure', right: 'Intuition', value: currentParticipant.structureVsIntuition },
                      { left: 'Contrôle', right: 'Consensus', value: currentParticipant.controlVsConsensus }
                    ].map((axis, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-xs mb-2 text-muted-foreground">
                          <span>{axis.left}</span>
                          <span className="font-mono font-bold text-primary">{axis.value}%</span>
                          <span>{axis.right}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${axis.value}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Interaction Modes */}
                <div className="mb-4">
                  <p className="text-xs font-bold mb-3 text-muted-foreground">MODES D'INTERACTION</p>
                  <div className="flex flex-wrap gap-2">
                    {currentParticipant.interactionModes.primary.map((mode, i) => (
                      <KnowyBadge key={i} variant="blue">{mode}</KnowyBadge>
                    ))}
                    {currentParticipant.interactionModes.secondary.map((mode, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-full text-xs font-medium border-2 border-primary text-primary bg-card"
                      >
                        {mode}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-primary/5 rounded-xl">
                  <p className="text-xs font-bold mb-3 text-muted-foreground">ANALYSE COMPORTEMENTALE</p>
                  <div className="space-y-2">
                    {currentParticipant.behavioralSignals.map((signal, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CircleDot className="size-3 mt-1 flex-shrink-0 text-primary" />
                        <span className="text-sm">{signal}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </KnowyCard>

              {/* Section E — Agenda Personnel */}
              <KnowyCard className="p-6">
                <h3 className="text-sm font-bold mb-4 text-muted-foreground">
                  AGENDA PERSONNEL · {currentParticipant.name}
                </h3>

                {currentParticipant.personalAgenda ? (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs text-muted-foreground">Confiance:</span>
                      <span className="text-xs font-mono font-bold text-primary">
                        {currentParticipant.personalAgenda.confidence}%
                      </span>
                    </div>
                    <div className="space-y-2">
                      {currentParticipant.personalAgenda.motivations.map((motivation, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-primary/5 rounded-xl">
                          <Target className="size-4 mt-0.5 flex-shrink-0 text-primary" />
                          <span className="text-sm">{motivation}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-muted/50 rounded-xl">
                    <AlertCircle className="size-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm mb-2 text-muted-foreground">
                      Agenda inconnu — à qualifier en ouverture
                    </p>
                  </div>
                )}
              </KnowyCard>
            </div>

            {/* GROUPE 3 — DEAL */}
            <div >
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-2xl font-black">Deal</h2>
              </div>

              {/* Section F — MEDDPICC */}
              <KnowyCard className="p-6 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-muted-foreground">MEDDPICC</h3>
                  <KnowyBadge variant="amber">3/8 qualifiés</KnowyBadge>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">Progression</span>
                    <span className="text-xs font-mono font-bold text-amber-600">37%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-amber-600" style={{ width: '37%' }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    → Priorités cette réunion : <span className="font-semibold">M</span> (Metrics), <span className="font-semibold">D</span> (Decision Process), <span className="font-semibold">P</span> (Paper Process)
                  </p>
                </div>

                <div className="grid grid-cols-4 gap-3 mb-4">
                  {meddpicc.map((item, i) => (
                    <div
                      key={i}
                      className={`p-4 rounded-xl border-2 ${
                        item.status === 'complete' ? 'bg-sage/10 border-sage' :
                        item.status === 'partial' ? 'bg-amber/10 border-amber' :
                        item.status === 'risk' ? 'bg-coral/10 border-coral' :
                        'bg-muted/50 border-muted'
                      }`}
                    >
                      <p className="text-3xl font-black mb-1 text-primary">{item.letter}</p>
                      <p className="text-[10px] font-bold mb-2 text-muted-foreground">{item.label}</p>
                      <p className="text-xs">{item.detail}</p>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-amber/10 rounded-lg border border-amber/20">
                  <p className="text-xs text-muted-foreground">
                    ⚠️ 5 cases non qualifiées — priorité de cette réunion
                  </p>
                </div>
              </KnowyCard>

              {/* Section G — Concurrence */}
              <KnowyCard className="p-6 mb-4">
                <h3 className="text-sm font-bold mb-4 text-muted-foreground">CONCURRENCE & STATU QUO</h3>

                {!competition.qualified && (
                  <div className="p-3 bg-amber/10 rounded-lg border border-amber/20 mb-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="size-4 text-amber" />
                      <span className="text-xs font-bold text-amber">Concurrence non qualifiée</span>
                    </div>
                  </div>
                )}

                <div className="space-y-2 mb-4">
                  {competition.competitors.map((comp, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm font-bold">{comp.name}</span>
                      <div className="flex items-center gap-2">
                        <KnowyBadge variant={comp.status === 'confirmé' ? 'coral' : 'amber'} size="sm">
                          {comp.status}
                        </KnowyBadge>
                        <span className="text-[10px] text-muted-foreground">{comp.source}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-primary/5 rounded-xl">
                  <p className="text-xs font-bold mb-2 text-primary">Questions à poser</p>
                  <ul className="space-y-1">
                    {competition.questionsToAsk.map((q, i) => (
                      <li key={i} className="text-sm text-muted-foreground">• {q}</li>
                    ))}
                  </ul>
                </div>
              </KnowyCard>

              {/* Section H — Critères de Sélection */}
              <KnowyCard className="p-6 mb-4">
                <h3 className="text-sm font-bold mb-4 text-muted-foreground">CRITÈRES DE SÉLECTION</h3>

                <div className="space-y-3">
                  {selectionCriteria.map((item) => (
                    <div key={item.rank}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-muted-foreground">#{item.rank}</span>
                          <span className="text-sm font-bold">{item.criterion}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-primary">{item.probability}%</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${item.probability}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </KnowyCard>

              {/* Section I — Coût de l'Inaction */}
              <KnowyCard className="p-6">
                <h3 className="text-sm font-bold mb-4 text-muted-foreground">COÛT DE L'INACTION</h3>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Fournisseur actuel</p>
                    <p className="text-sm font-bold">{inactionCost.currentProvider}</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Coût inaction</p>
                    <p className={`text-sm font-bold ${
                      inactionCost.inactionLevel === 'élevé' ? 'text-coral' :
                      inactionCost.inactionLevel === 'moyen' ? 'text-amber' : 'text-sage'
                    }`}>
                      {inactionCost.inactionLevel}
                    </p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Fenêtre</p>
                    <p className={`text-sm font-bold ${
                      inactionCost.window === 'se ferme' ? 'text-coral' :
                      inactionCost.window === 'ouverte' ? 'text-sage' : 'text-amber'
                    }`}>
                      {inactionCost.window}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-primary/5 rounded-lg mb-3">
                  <p className="text-sm italic leading-relaxed">{inactionCost.insight}</p>
                </div>
              </KnowyCard>
            </div>

            {/* GROUPE 4 — ACTION */}
            <div >
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-2xl font-black">Action</h2>
              </div>

              {/* Section J — Recommandations */}
              <KnowyCard className="p-6 mb-4">
                <h3 className="text-sm font-bold mb-4 text-muted-foreground">RECOMMANDATIONS MEETING</h3>

                <div className="space-y-4">
                  {recommendations.map((rec) => (
                    <div key={rec.num} className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="size-8 bg-sage/20 rounded-full flex items-center justify-center">
                          <span className="font-black text-sage">{rec.num}</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-1">{rec.phase}</p>
                        <p className="font-bold mb-1">{rec.action}</p>
                        <p className="text-sm text-muted-foreground">→ {rec.rationale}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </KnowyCard>

              {/* Section K — Objections */}
              <KnowyCard className="p-6 mb-4 border-l-4 border-l-sage">
                <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                  <Shield className="size-5 text-sage" />
                  <span className="text-sage">OBJECTIONS PROBABLES</span>
                </h3>

                <div className="space-y-4">
                  {objections.map((obj, i) => (
                    <div key={i} className="p-4 bg-sage/10 rounded-xl border border-sage/20">
                      <div className="flex items-start justify-between mb-3">
                        <p className="text-sm font-bold italic flex-1">"{obj.objection}"</p>
                        <div className="flex items-center gap-2">
                          <KnowyBadge variant="sage" size="sm">{obj.type}</KnowyBadge>
                          <span className="text-xs font-mono font-bold text-sage">{obj.probability}%</span>
                        </div>
                      </div>
                      <div className="p-3 bg-card rounded-lg mb-2">
                        <p className="text-xs font-bold mb-1 text-sage">Réponse préparée:</p>
                        <p className="text-sm italic">{obj.response}</p>
                      </div>
                      <p className="text-[10px] text-muted-foreground">Source: {obj.source}</p>
                    </div>
                  ))}
                </div>
              </KnowyCard>

              {/* Section L — Risques */}
              <KnowyCard className="p-6 mb-4">
                <h3 className="text-sm font-bold mb-4 text-muted-foreground">RISQUES IDENTIFIÉS</h3>

                <div className="space-y-3">
                  {risks.map((risk, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl border-l-4"
                      style={{
                        backgroundColor: risk.level === 'high' ? '#FEF2F2' :
                                         risk.level === 'medium' ? '#FFFBEB' : '#ECFDF5',
                        borderLeftColor: risk.level === 'high' ? '#DC2626' :
                                          risk.level === 'medium' ? '#D97706' : '#059669'
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-bold">{risk.risk}</p>
                        <KnowyBadge variant={
                          risk.level === 'high' ? 'coral' :
                          risk.level === 'medium' ? 'amber' : 'sage'
                        } size="sm">
                          {risk.level === 'high' ? 'Élevé' : risk.level === 'medium' ? 'Moyen' : 'Faible'}
                        </KnowyBadge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{risk.description}</p>
                      <p className="text-xs text-muted-foreground mb-2">
                        <strong>Conséquence:</strong> {risk.consequence}
                      </p>
                      <p className="text-xs text-sage">
                        <strong>Mitigation:</strong> {risk.mitigation}
                      </p>
                    </div>
                  ))}
                </div>
              </KnowyCard>

              {/* Section M — Next Steps CRM */}
              <KnowyCard className="p-6">
                <h3 className="text-sm font-bold mb-4 text-muted-foreground">NEXT STEPS CRM</h3>

                <div className="grid grid-cols-2 gap-3">
                  {nextSteps.map((step, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <input type="checkbox" className="mt-1" />
                      <div className="flex-1">
                        <p className="text-sm font-bold mb-1">
                          {step.task}
                          {step.priority === 1 && (
                            <KnowyBadge variant="coral" size="sm" className="ml-2">P1</KnowyBadge>
                          )}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <KnowyBadge variant="blue" size="sm">{step.timing}</KnowyBadge>
                          <span>· {step.assignee}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </KnowyCard>
            </div>
          </div>
        </div>
        )}

        {/* Tab: Résumé (Past meetings only) */}
        {activeTab === 'summary' && isPast && (
          <div className="space-y-6">
            {/* BLOC 1 — POINTS CLÉS */}
            <KnowyCard className="p-6 border-l-4 border-l-primary">
              <h2 className="text-2xl font-black mb-6">POINTS CLÉS</h2>

              {/* En un coup d'œil */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-muted/20 rounded-xl">
                  <p className="text-sm text-muted-foreground mb-1">Durée réelle</p>
                  <p className="text-2xl font-bold">1h12</p>
                  <p className="text-xs text-muted-foreground">vs 1h30 prévue</p>
                </div>
                <div className="p-4 bg-muted/20 rounded-xl">
                  <p className="text-sm text-muted-foreground mb-1">Décisions prises</p>
                  <p className="text-2xl font-bold text-success">3</p>
                </div>
                <div className="p-4 bg-muted/20 rounded-xl">
                  <p className="text-sm text-muted-foreground mb-1">Actions assignées</p>
                  <p className="text-2xl font-bold text-primary">5</p>
                </div>
              </div>

              {/* Décisions */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle2 className="size-5 text-success" />
                  Décisions
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
                    <p className="font-medium">Pilote 30j validé - démarrage 15 juin</p>
                  </div>
                  <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
                    <p className="font-medium">Budget 150K€ confirmé</p>
                  </div>
                  <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
                    <p className="font-medium">Timeline Q2 maintenue</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Target className="size-5 text-primary" />
                  Actions (5)
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { owner: 'Sarah Chen', task: 'Envoyer contrat pilote', due: '30 mai', status: 'pending' },
                    { owner: 'Marc Dubois', task: 'Valider specs techniques', due: '5 juin', status: 'pending' },
                    { owner: 'Maxime Durant', task: 'Préparer ROI deck', due: '28 mai', status: 'done' },
                    { owner: 'Sarah Chen', task: 'Organiser kickoff interne', due: '10 juin', status: 'pending' },
                    { owner: 'Marc Dubois', task: 'Identifier beta testers', due: '15 juin', status: 'pending' }
                  ].map((action, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                      <div className={`size-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        action.status === 'done' ? 'bg-success border-success' : 'border-muted'
                      }`}>
                        {action.status === 'done' && <CheckCircle2 className="size-3 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{action.task}</p>
                        <p className="text-xs text-muted-foreground">{action.owner} · {action.due}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Objections */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <AlertCircle className="size-5 text-amber-600" />
                  Objections soulevées
                </h3>
                <div className="space-y-2">
                  <div className="p-3 border-l-4 border-success bg-success/5 rounded-r-lg">
                    <div className="flex items-start gap-2 mb-1">
                      <CheckCircle2 className="size-4 text-success mt-0.5 flex-shrink-0" />
                      <p className="text-sm font-semibold flex-1">"On utilise déjà Gong, pourquoi changer ?"</p>
                    </div>
                    <p className="text-xs text-muted-foreground ml-6">
                      ✓ Traitée — Argumenté complémentarité
                    </p>
                  </div>
                  <div className="p-3 border-l-4 border-amber-600 bg-amber-600/5 rounded-r-lg">
                    <div className="flex items-start gap-2 mb-1">
                      <CircleDot className="size-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm font-semibold flex-1">"Quel ROI chiffré exactement ?"</p>
                    </div>
                    <p className="text-xs text-muted-foreground ml-6">
                      → À suivre — Envoyer case studies sous NDA
                    </p>
                  </div>
                  <div className="p-3 border-l-4 border-success bg-success/5 rounded-r-lg">
                    <div className="flex items-start gap-2 mb-1">
                      <CheckCircle2 className="size-4 text-success mt-0.5 flex-shrink-0" />
                      <p className="text-sm font-semibold flex-1">"Vous pouvez vraiment déployer en 30j ?"</p>
                    </div>
                    <p className="text-xs text-muted-foreground ml-6">
                      ✓ Traitée — Timeline détaillée partagée
                    </p>
                  </div>
                </div>
              </div>

              {/* Temps de parole */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Users className="size-5 text-muted-foreground" />
                  Répartition temps de parole
                </h3>
                <div className="space-y-3">
                  {[
                    { name: 'Sarah Chen', percentage: 42, minutes: 18, color: 'bg-primary' },
                    { name: 'Marc Dubois', percentage: 31, minutes: 13, color: 'bg-accent' },
                    { name: 'Maxime Durant', percentage: 27, minutes: 11, color: 'bg-success' }
                  ].map((speaker, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{speaker.name}</span>
                        <span className="text-xs text-muted-foreground">{speaker.percentage}% ({speaker.minutes}min)</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full ${speaker.color}`} style={{ width: `${speaker.percentage}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </KnowyCard>

            {/* BLOC 2 — PROFILS ENRICHIS (THE MAGIC MOMENT) */}
            <KnowyCard className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-l-4 border-l-primary">
              <div className="flex items-center gap-3 mb-6">
                <Sparkles className="size-6 text-primary" />
                <h2 className="text-2xl font-black">PROFILS ENRICHIS PAR CETTE RÉUNION</h2>
              </div>

              <p className="text-sm text-muted-foreground mb-6">
                Knowy a capturé et enrichi automatiquement les profils relationnels pendant la réunion.
              </p>

              <div className="space-y-4">
                {/* Sarah Chen */}
                <div className="p-4 bg-card rounded-xl border border-border">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="size-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0">
                      SC
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold">Sarah Chen</h3>
                        <KnowyBadge variant="sage">+7 insights</KnowyBadge>
                      </div>
                      <p className="text-sm text-muted-foreground">VP of Partnerships · Contentsquare</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-start gap-2 p-3 bg-primary/10 rounded-lg">
                      <Sparkles className="size-4 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium mb-1">Budget confirmé: 150K€</p>
                        <KnowyBadge variant="blue" size="sm">Deal</KnowyBadge>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 p-3 bg-primary/10 rounded-lg">
                      <Sparkles className="size-4 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium mb-1">Cherche quick win avant Q2 pour prouver sa valeur</p>
                        <KnowyBadge variant="violet" size="sm">Motivation</KnowyBadge>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 p-3 bg-primary/10 rounded-lg">
                      <Sparkles className="size-4 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium mb-1">Utilise déjà Gong pour coaching calls</p>
                        <KnowyBadge variant="amber" size="sm">Contexte</KnowyBadge>
                      </div>
                    </div>
                  </div>

                  <KnowyButton
                    variant="ghost"
                    size="sm"
                    className="w-full mt-3"
                    onClick={() => navigate('/relation/1')}
                  >
                    Voir profil complet →
                  </KnowyButton>
                </div>

                {/* Marc Dubois */}
                <div className="p-4 bg-card rounded-xl border border-border">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="size-12 bg-gradient-to-br from-accent to-primary rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0">
                      MD
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold">Marc Dubois</h3>
                        <KnowyBadge variant="sage">+5 insights</KnowyBadge>
                      </div>
                      <p className="text-sm text-muted-foreground">Head of Product Strategy · Contentsquare</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-start gap-2 p-3 bg-primary/10 rounded-lg">
                      <Sparkles className="size-4 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium mb-1">Besoin de ROI chiffré et KPIs précis</p>
                        <KnowyBadge variant="violet" size="sm">Critère décision</KnowyBadge>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 p-3 bg-primary/10 rounded-lg">
                      <Sparkles className="size-4 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium mb-1">Profil analytique, data-driven (background Finance)</p>
                        <KnowyBadge variant="blue" size="sm">Comportement</KnowyBadge>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 p-3 bg-primary/10 rounded-lg">
                      <Sparkles className="size-4 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium mb-1">Responsable validation specs techniques</p>
                        <KnowyBadge variant="amber" size="sm">Rôle</KnowyBadge>
                      </div>
                    </div>
                  </div>

                  <KnowyButton
                    variant="ghost"
                    size="sm"
                    className="w-full mt-3"
                    onClick={() => navigate('/relation/2')}
                  >
                    Voir profil complet →
                  </KnowyButton>
                </div>
              </div>
            </KnowyCard>

            {/* BLOC 3 — SYNCHRONISATION CRM */}
            <KnowyCard className="p-6 border-l-4 border-l-muted">
              <div className="flex items-center gap-3 mb-6">
                <Database className="size-6 text-muted-foreground" />
                <h2 className="text-2xl font-black">SYNCHRONISATION CRM</h2>
              </div>

              <p className="text-sm text-muted-foreground mb-6">
                Les informations suivantes seront synchronisées automatiquement dans HubSpot.
              </p>

              {/* Deal Update */}
              <div className="mb-4 p-4 bg-muted/20 rounded-xl border border-border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Target className="size-5 text-primary" />
                    <h3 className="font-semibold">Deal: Contentsquare - Q1 Strategic Review</h3>
                  </div>
                  <KnowyBadge variant="blue">HubSpot</KnowyBadge>
                </div>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Stage:</span>
                    <span className="font-medium">Négociation → Verbal commitment</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Montant:</span>
                    <span className="font-medium">150 000 €</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date de clôture:</span>
                    <span className="font-medium">15 juin 2026</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Next step:</span>
                    <span className="font-medium">Envoyer contrat pilote</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <KnowyButton variant="primary" size="sm" className="flex-1">
                    <CheckCircle2 className="size-4" />
                    Valider et synchroniser
                  </KnowyButton>
                  <KnowyButton variant="ghost" size="sm">
                    Ignorer
                  </KnowyButton>
                </div>
              </div>

              {/* Tasks Created */}
              <div className="p-4 bg-muted/20 rounded-xl border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="size-5 text-success" />
                  <h3 className="font-semibold">5 tâches créées</h3>
                </div>

                <div className="space-y-2 mb-4">
                  {[
                    { task: 'Envoyer contrat pilote', owner: 'Sarah Chen', due: '30 mai' },
                    { task: 'Valider specs techniques', owner: 'Marc Dubois', due: '5 juin' },
                    { task: 'Préparer ROI deck', owner: 'Maxime Durant', due: '28 mai' }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm p-2 bg-card rounded-lg">
                      <span>{item.task}</span>
                      <span className="text-xs text-muted-foreground">{item.owner} · {item.due}</span>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground text-center pt-2">+ 2 autres tâches</p>
                </div>

                <div className="flex gap-2">
                  <KnowyButton variant="primary" size="sm" className="flex-1">
                    <CheckCircle2 className="size-4" />
                    Valider et synchroniser
                  </KnowyButton>
                  <KnowyButton variant="ghost" size="sm">
                    Modifier
                  </KnowyButton>
                </div>
              </div>
            </KnowyCard>
          </div>
        )}

        {/* Tab: Participants */}
        {activeTab === 'participants' && (
          <div className="space-y-6">
            <KnowyCard className="p-6">
              <h2 className="text-xl font-bold mb-4">👥 Participants ({participants.length})</h2>
              <div className="space-y-4">
                {participants.map((p) => (
                  <div key={p.id} className="p-4 bg-muted/20 rounded-xl hover:bg-muted/30 transition-colors">
                    <div className="flex items-start gap-4 mb-3">
                      <div className="size-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center text-white font-bold">
                        {p.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold">{p.name}</h3>
                          {p.badge && (
                            <KnowyBadge variant={
                              p.badge === 'champion' ? 'sage' :
                              p.badge === 'decider' ? 'violet' :
                              p.badge === 'gatekeeper' ? 'amber' : 'coral'
                            }>
                              {p.badge}
                            </KnowyBadge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{p.role} · {p.company}</p>
                      </div>
                      <KnowyButton
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/relation/${p.id}`)}
                      >
                        Voir profil →
                      </KnowyButton>
                    </div>

                    {p.relationContext && (
                      <div className="mt-3 p-3 bg-card rounded-lg border border-border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-muted-foreground">CONTEXTE RELATIONNEL</span>
                          <KnowyBadge variant={
                            p.relationContext.engagementScore > 65 ? 'sage' :
                            p.relationContext.engagementScore >= 35 ? 'amber' : 'coral'
                          }>
                            {p.relationContext.engagementScore}
                          </KnowyBadge>
                        </div>
                        <div className="text-sm space-y-1">
                          <p>Relation depuis {p.relationContext.relationSince}</p>
                          <p>Dernier contact: Il y a {p.relationContext.lastContactDays}j</p>
                          <p>{p.relationContext.totalInteractions} échanges au total</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </KnowyCard>
          </div>
        )}
      </div>
    </div>
  );
}
