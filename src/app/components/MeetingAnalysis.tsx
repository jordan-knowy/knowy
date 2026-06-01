import { motion } from 'motion/react';
import { useNavigate, useParams } from 'react-router';
import { useState, useEffect, useRef } from 'react';
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
import { trackEvent } from '../../lib/trackEvent';

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
  const [fullProfiles, setFullProfiles] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let mounted = true;

    async function load() {
      setLoading(true);

      // Load meeting
      const mtg = await getMeeting(id!);
      if (mounted && mtg) setRealMeeting(mtg);

      // Load participants with cognitive profiles
      const parts = await getMeetingParticipants(id!);
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

        // Charger les profils cognitifs complets (jtbd, theory_of_mind, executive_summary, cognitive_mode)
        if (supabase && parts.length > 0) {
          const contactIds = parts.map(p => p.contact.id).filter(Boolean);
          if (contactIds.length > 0) {
            const { data: cps } = await supabase
              .from('cognitive_profiles')
              .select('contact_id, executive_summary, cognitive_mode, cognitive_mode_confidence, interaction_modes_data, jtbd_data, theory_of_mind_data, behavioral_analysis_data, engagement_score, score_phase')
              .in('contact_id', contactIds)
              .order('profile_version', { ascending: false });
            const profileMap: Record<string, any> = {};
            (cps ?? []).forEach((cp: any) => {
              if (!profileMap[cp.contact_id]) profileMap[cp.contact_id] = cp;
            });
            if (mounted) setFullProfiles(profileMap);
          }
        }
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
          .eq('meeting_id', id!)
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

  // ── Behavioral tracking ─────────────────────────────────────────────────────
  const tabOpenedAt = useRef<number>(Date.now());
  const activeTabRef = useRef<string>('prep');

  // Ouverture du brief
  useEffect(() => {
    if (!id || loading) return;
    trackEvent({ event_type: 'brief_open', entity_id: id, entity_type: 'meeting', tab: activeTabRef.current });
    tabOpenedAt.current = Date.now();
    return () => {
      // Fermeture — on enregistre la durée sur l'onglet courant
      trackEvent({
        event_type: 'brief_close',
        entity_id: id,
        entity_type: 'meeting',
        tab: activeTabRef.current,
        duration_ms: Date.now() - tabOpenedAt.current,
      });
    };
  }, [id, loading]);

  function handleTabChange(tab: 'summary' | 'prep' | 'participants') {
    // Clôture de l'onglet précédent avec sa durée
    trackEvent({
      event_type: 'brief_tab',
      entity_id: id ?? undefined,
      entity_type: 'meeting',
      tab: activeTabRef.current,
      duration_ms: Date.now() - tabOpenedAt.current,
    });
    activeTabRef.current = tab;
    tabOpenedAt.current = Date.now();
    setActiveTab(tab);
  }

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

  // Score relationnel = moyenne live des engagement_score des participants enrichis
  const participantScores = loadedParticipants
    .map(p => fullProfiles[p.id]?.engagement_score ?? p.relationContext?.engagementScore ?? 0)
    .filter(s => s > 0);
  const relationScore = participantScores.length > 0
    ? Math.round(participantScores.reduce((a, b) => a + b, 0) / participantScores.length)
    : (realMeeting?.importanceScore ?? 0);

  // Confiance = part des participants ayant un profil cognitif généré
  const enrichedCount = loadedParticipants.filter(p => fullProfiles[p.id]).length;
  const confidenceScore = loadedParticipants.length > 0
    ? Math.round((enrichedCount / loadedParticipants.length) * 100)
    : 0;

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

  // ── Données dérivées des vrais profils cognitifs ──────────────────────────

  // Participants avec score en alerte (relation froide ou en déclin)
  const atRiskParticipants = participants.filter(p => {
    const fp = fullProfiles[p.id];
    return fp?.score_phase === 'decline' ||
      (p.relationContext && p.relationContext.lastContactDays > (p.relationContext.avgFrequencyDays || 30) * 1.5);
  });

  // Questions d'ouverture depuis les JTBD
  const openingQuestions = participants
    .map(p => ({
      participant: p,
      question: fullProfiles[p.id]?.jtbd_data?.qualify_question ?? null,
    }))
    .filter(q => q.question);

  // Recommandations d'adaptation communication basées sur le mode cognitif
  const commAdaptations = participants.map(p => {
    const fp = fullProfiles[p.id];
    const mode = fp?.cognitive_mode;
    const modes = fp?.interaction_modes_data ?? [];
    let tip = '';
    if (mode === 's1_dominant') tip = 'Sois direct et concis. Propose des décisions simples. Évite les longues présentations.';
    else if (mode === 's2_dominant') tip = 'Fournis des données précises. Laisse du temps de réflexion. Structure ta présentation.';
    else tip = 'Adapte selon le contexte. Sonde l\'état d\'esprit en début de réunion.';
    return { participant: p, mode, modes, tip, fp };
  });

  // Signal clé de chaque participant
  const getKeySignal = (participantId: string) => {
    const fp = fullProfiles[participantId];
    if (!fp?.behavioral_analysis_data?.length) return null;
    return fp.behavioral_analysis_data[0];
  };

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
        <div className="max-w-7xl mx-auto px-4 py-4 md:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <KnowyButton
                variant="ghost"
                size="sm"
                icon={<ArrowLeft className="size-4" />}
                onClick={() => navigate('/meetings')}
              >&nbsp;</KnowyButton>
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
              <KnowyButton variant="secondary" size="sm" icon={<Share2 className="size-4" />}>&nbsp;</KnowyButton>
            </div>
          </div>
        </div>
      </div>

      {/* Pills Navigation - Outside sticky header */}
      <div className="bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4 md:px-8">
          <div className="flex gap-2">
            {isPast && (
              <button
                onClick={() => handleTabChange('summary')}
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
              onClick={() => handleTabChange('prep')}
              className={`px-4 py-2 rounded-full font-semibold transition-all ${
                activeTab === 'prep'
                  ? 'bg-primary text-white'
                  : 'bg-muted/30 hover:bg-muted/50'
              }`}
            >
              Préparation
            </button>
            <button
              onClick={() => handleTabChange('participants')}
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

      <div className="max-w-7xl mx-auto px-4 py-5 md:px-8 md:py-8">
        {/* Tab: Préparation */}
        {activeTab === 'prep' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
          {/* Sidebar */}
          <div className="self-start space-y-4 lg:sticky lg:top-28">
            {/* Score relationnel moyen */}
            {relationScore > 0 && (
              <KnowyCard className="p-6 text-center">
                <p className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wide">Score relationnel</p>
                <div className="text-5xl font-black mb-1"
                  style={{ color: relationScore >= 70 ? '#2EA86A' : relationScore >= 40 ? '#6E50C8' : '#D94F63' }}>
                  {relationScore}
                </div>
                <p className="text-[11px] text-muted-foreground mb-3">moyenne des {participantScores.length} participant{participantScores.length > 1 ? 's' : ''} enrichi{participantScores.length > 1 ? 's' : ''}</p>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full"
                    style={{
                      width: `${relationScore}%`,
                      background: relationScore >= 70 ? '#2EA86A' : relationScore >= 40 ? '#6E50C8' : '#D94F63',
                    }}
                  />
                </div>
              </KnowyCard>
            )}

            <KnowyCard className="p-6">
              <div className="text-center mb-4">
                <div className={`text-5xl font-black mb-2 ${confidenceScore >= 60 ? 'text-sage' : 'text-amber'}`}>
                  {confidenceScore}%
                </div>
                <p className="text-xs text-muted-foreground">Profils enrichis ({enrichedCount}/{loadedParticipants.length})</p>
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
                              navigate(`/contact/${p.id}`);
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

            {/* GROUPE 3 — ALERTES & QUESTIONS */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-2xl font-black">Stratégie</h2>
              </div>

              {/* Section F — Alertes relationnelles */}
              {atRiskParticipants.length > 0 && (
                <KnowyCard className="p-6 mb-4 border-l-4 border-l-amber-500">
                  <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                    <AlertTriangle className="size-4 text-amber-600" />
                    <span className="text-amber-600">ALERTES RELATIONNELLES</span>
                  </h3>
                  <div className="space-y-3">
                    {atRiskParticipants.map(p => {
                      const fp = fullProfiles[p.id];
                      const ctx = p.relationContext;
                      return (
                        <div key={p.id} className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                          <div className="flex items-start gap-3">
                            <div className="size-9 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                              {p.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm text-amber-900">{p.name}</p>
                              <p className="text-xs text-amber-700 mt-1">
                                {fp?.score_phase === 'decline' && '📉 Relation en déclin. '}
                                {ctx && ctx.lastContactDays > (ctx.avgFrequencyDays || 30) * 1.5 &&
                                  `⏰ Dernier contact il y a ${ctx.lastContactDays}j (habituel : ${ctx.avgFrequencyDays}j). `}
                              </p>
                              {fp?.executive_summary && (
                                <p className="text-xs text-amber-800 italic mt-1.5 border-t border-amber-200 pt-1.5">
                                  \"{fp.executive_summary}\"
                                </p>
                              )}
                            </div>
                            <KnowyBadge variant="amber" size="sm">
                              {fp?.engagement_score ?? ctx?.engagementScore ?? '?'}/100
                            </KnowyBadge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </KnowyCard>
              )}

              {/* Section G — Questions d'ouverture JTBD */}
              {openingQuestions.length > 0 && (
                <KnowyCard className="p-6 mb-4 border-l-4 border-l-primary">
                  <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                    <Target className="size-4 text-primary" />
                    <span className="text-muted-foreground">QUESTIONS D'OUVERTURE · JTBD</span>
                  </h3>
                  <div className="space-y-4">
                    {openingQuestions.map(({ participant, question }) => {
                      const fp = fullProfiles[participant.id];
                      return (
                        <div key={participant.id} className="flex gap-4">
                          <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                            {participant.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-muted-foreground mb-1">
                              Pour {participant.name}
                              {fp?.interaction_modes_data?.[0] && (
                                <span className="ml-2 text-primary">· {fp.interaction_modes_data[0]}</span>
                              )}
                            </p>
                            <p className="text-sm font-medium italic">❓ \"{question}\"</p>
                            {fp?.jtbd_data?.functional_job?.pitch_angle && (
                              <p className="text-xs text-muted-foreground mt-1">💡 {fp.jtbd_data.functional_job.pitch_angle}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </KnowyCard>
              )}

              {/* Section H — Adapter sa communication */}
              <KnowyCard className="p-6 mb-4">
                <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                  <Sparkles className="size-4 text-primary" />
                  <span className="text-muted-foreground">ADAPTER SA COMMUNICATION · MODE COGNITIF</span>
                </h3>
                {commAdaptations.length > 0 ? (
                  <div className="space-y-4">
                    {commAdaptations.map(({ participant, mode, modes, tip, fp }) => (
                      <div key={participant.id} className="p-4 bg-muted/30 rounded-xl border border-border">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="size-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {participant.name.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="font-bold text-sm">{participant.name}</span>
                              {mode && mode !== 'unavailable' && (
                                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                  {mode === 's1_dominant' ? 'S1 · Décide vite' : mode === 's2_dominant' ? 'S2 · Analyse d\'abord' : 'Contextuel'}
                                </span>
                              )}
                              {(modes ?? []).slice(0, 2).map((m: string) => (
                                <span key={m} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">{m}</span>
                              ))}
                            </div>
                            <p className="text-xs text-foreground">→ {tip}</p>
                          </div>
                        </div>
                        {(() => {
                          const sig = getKeySignal(participant.id);
                          return sig ? (
                            <div className="text-xs text-muted-foreground bg-background rounded-lg px-3 py-2 border border-border">
                              <span className="font-semibold text-primary">Signal : </span>{sig.text}
                            </div>
                          ) : null;
                        })()}
                        {fp?.theory_of_mind_data?.likely_skepticism && (
                          <div className="mt-2 text-xs text-muted-foreground bg-amber-50 rounded-lg px-3 py-2 border border-amber-100">
                            <span className="font-semibold text-amber-700">⚠️ Zone de scepticisme : </span>
                            {fp.theory_of_mind_data.likely_skepticism}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Sparkles className="size-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Enrichissez les contacts pour obtenir des recommandations personnalisées.</p>
                  </div>
                )}
              </KnowyCard>

              {/* Section I — JTBD complets */}
              {participants.some(p => fullProfiles[p.id]?.jtbd_data) && (
                <KnowyCard className="p-6">
                  <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                    <CircleDot className="size-4 text-primary" />
                    <span className="text-muted-foreground">JOBS-TO-BE-DONE · PAR PARTICIPANT</span>
                  </h3>
                  <div className="space-y-5">
                    {participants.filter(p => fullProfiles[p.id]?.jtbd_data).map(p => {
                      const jtbd = fullProfiles[p.id].jtbd_data;
                      return (
                        <div key={p.id}>
                          <div className="flex items-center gap-2 mb-3">
                            <div className="size-7 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">{p.name.charAt(0)}</div>
                            <span className="font-semibold text-sm">{p.name}</span>
                            <span className="text-xs text-muted-foreground">— {p.role || 'Rôle inconnu'}</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pl-9">
                            {[
                              { key: 'functional_job', label: '⚙️ Fonctionnel', color: 'bg-blue-50 border-blue-100' },
                              { key: 'social_job', label: '👥 Social', color: 'bg-violet-50 border-violet-100' },
                              { key: 'emotional_job', label: '💭 Émotionnel', color: 'bg-teal-50 border-teal-100' },
                            ].map(({ key, label, color }) => jtbd[key] ? (
                              <div key={key} className={`p-3 rounded-xl border ${color}`}>
                                <p className="text-[10px] font-bold text-muted-foreground mb-1">{label}</p>
                                <p className="text-xs leading-relaxed">{jtbd[key].text}</p>
                                {jtbd[key].pitch_angle && (
                                  <p className="text-[10px] text-primary italic mt-1.5 border-t border-current/10 pt-1.5">💡 {jtbd[key].pitch_angle}</p>
                                )}
                              </div>
                            ) : null)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </KnowyCard>
              )}
            </div>

            {/* GROUPE 4 — ACTION */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-2xl font-black">Action</h2>
              </div>
              <KnowyCard className="p-6">
                <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-primary" />
                  <span className="text-muted-foreground">PROCHAINES ÉTAPES</span>
                </h3>
                <div className="space-y-3">
                  {participants.length > 0 ? participants.map((p, i) => {
                    const fp = fullProfiles[p.id];
                    const q = fp?.jtbd_data?.qualify_question;
                    return (
                      <div key={p.id} className="flex items-start gap-3 p-3 bg-muted/30 rounded-xl border border-border">
                        <div className="size-5 rounded border-2 border-primary/40 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">
                            {q ? `Poser à ${p.name} : \"${q}\"` : `Suivre la relation avec ${p.name}`}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {fp?.score_phase === 'decline' ? '⚠️ Priorité haute — relation en déclin' :
                             fp?.score_phase === 'growth' ? '✓ Relation en croissance — maintenir le rythme' :
                             'Relation stable — consolider'}
                          </p>
                        </div>
                        <KnowyBadge variant={i === 0 ? 'violet' : 'muted'} size="sm">P{i + 1}</KnowyBadge>
                      </div>
                    );
                  }) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Aucun participant enrichi pour cette réunion.
                    </p>
                  )}
                </div>
              </KnowyCard>
            </div>
          </div>
        </div>
        )}

        {/* Tab: Résumé (Past meetings only) */}
        {activeTab === 'summary' && isPast && (
          <div className="space-y-6">

            {/* BLOC 1 — Compte-rendu IA */}
            <KnowyCard className="p-6 border-l-4 border-l-primary">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black">COMPTE-RENDU</h2>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="size-3" />
                  {meeting.date}
                  {durationMin && <span>· {durationMin}min</span>}
                  {participants.length > 0 && <span>· {participants.length} participant{participants.length > 1 ? 's' : ''}</span>}
                </div>
              </div>

              {postSummary ? (
                <>
                  {/* Résumé texte */}
                  {postSummary.summary_text && (
                    <div className="p-4 bg-primary/5 rounded-xl mb-6">
                      <p className="text-base leading-relaxed italic">{postSummary.summary_text}</p>
                    </div>
                  )}

                  {/* Décisions */}
                  {(postSummary.key_decisions ?? []).length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <CheckCircle2 className="size-5 text-success" />
                        Décisions ({postSummary.key_decisions.length})
                      </h3>
                      <div className="space-y-2">
                        {postSummary.key_decisions.map((d: any, i: number) => (
                          <div key={i} className="p-3 bg-success/10 border border-success/20 rounded-lg">
                            <p className="font-medium text-sm">{typeof d === 'string' ? d : d.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  {(postSummary.action_items ?? []).length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Target className="size-5 text-primary" />
                        Actions ({postSummary.action_items.length})
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {postSummary.action_items.map((a: any, i: number) => (
                          <div key={i} className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg">
                            <div className="size-5 rounded-full border-2 border-muted flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{typeof a === 'string' ? a : a.task}</p>
                              {typeof a !== 'string' && (a.owner || a.due) && (
                                <p className="text-xs text-muted-foreground">{a.owner}{a.due ? ` · ${a.due}` : ''}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {(postSummary.tags ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {postSummary.tags.map((tag: any, i: number) => (
                        <KnowyBadge key={i} variant={tag.variant ?? 'muted'}>{tag.label ?? tag}</KnowyBadge>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                /* État vide : pas encore de compte-rendu IA */
                <div className="text-center py-10 bg-muted/20 rounded-xl">
                  <Sparkles className="size-10 mx-auto mb-3 text-muted-foreground/40" />
                  <p className="text-base font-semibold mb-2">Compte-rendu IA non disponible</p>
                  <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                    Le compte-rendu est généré à partir des transcriptions et des profils des participants.
                    Activez la synchronisation pour les prochaines réunions.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <button className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-accent transition-colors">
                      Activer la transcription
                    </button>
                    <button className="px-5 py-2.5 bg-muted/50 rounded-xl text-sm font-medium hover:bg-muted/70 transition-colors">
                      Saisir manuellement
                    </button>
                  </div>
                </div>
              )}
            </KnowyCard>

            {/* BLOC 2 — Profils des participants (vraies données) */}
            {participants.length > 0 && (
              <KnowyCard className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-l-4 border-l-primary">
                <div className="flex items-center gap-3 mb-6">
                  <Sparkles className="size-6 text-primary" />
                  <h2 className="text-2xl font-black">PROFILS DES PARTICIPANTS</h2>
                </div>

                <p className="text-sm text-muted-foreground mb-6">
                  Synthèse des profils cognitifs et relationnels enrichis par Knowy.
                </p>

                <div className="space-y-4">
                  {participants.map((p) => {
                    const fp = fullProfiles[p.id];
                    const signals = (fp?.behavioral_analysis_data ?? p.behavioralSignals ?? []).slice(0, 3);
                    const jtbd = fp?.jtbd_data;
                    const insightCount = [
                      fp?.executive_summary,
                      jtbd?.functional_job?.text,
                      jtbd?.social_job?.text,
                      jtbd?.emotional_job?.text,
                      ...(fp?.behavioral_analysis_data ?? []).slice(0, 3),
                    ].filter(Boolean).length;

                    return (
                      <div key={p.id} className="p-4 bg-card rounded-xl border border-border">
                        <div className="flex items-start gap-3 mb-4">
                          <div className="size-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0">
                            {p.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className="font-bold">{p.name}</h3>
                              {insightCount > 0 && (
                                <KnowyBadge variant="sage">+{insightCount} insights</KnowyBadge>
                              )}
                              {fp?.cognitive_mode && fp.cognitive_mode !== 'unavailable' && (
                                <KnowyBadge variant="violet" size="sm">
                                  {fp.cognitive_mode === 's1_dominant' ? 'S1 · Décide vite' : 'S2 · Analyse'}
                                </KnowyBadge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{p.role}{p.company ? ` · ${p.company}` : ''}</p>
                          </div>
                          {p.relationContext && (
                            <KnowyBadge variant={
                              p.relationContext.engagementScore > 65 ? 'sage' :
                              p.relationContext.engagementScore >= 35 ? 'amber' : 'coral'
                            }>
                              {p.relationContext.engagementScore}/100
                            </KnowyBadge>
                          )}
                        </div>

                        <div className="space-y-2">
                          {/* Résumé exécutif */}
                          {fp?.executive_summary && (
                            <div className="flex items-start gap-2 p-3 bg-primary/10 rounded-lg">
                              <Sparkles className="size-4 text-primary mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="text-sm font-medium mb-1">{fp.executive_summary}</p>
                                <KnowyBadge variant="blue" size="sm">Synthèse IA</KnowyBadge>
                              </div>
                            </div>
                          )}

                          {/* JTBD fonctionnel */}
                          {jtbd?.functional_job?.text && (
                            <div className="flex items-start gap-2 p-3 bg-primary/10 rounded-lg">
                              <Target className="size-4 text-primary mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="text-sm font-medium mb-1">{jtbd.functional_job.text}</p>
                                <KnowyBadge variant="violet" size="sm">Objectif principal</KnowyBadge>
                              </div>
                            </div>
                          )}

                          {/* Signaux comportementaux */}
                          {signals.length > 0 && (
                            <div className="flex items-start gap-2 p-3 bg-primary/10 rounded-lg">
                              <CircleDot className="size-4 text-primary mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="text-sm font-medium mb-1">
                                  {typeof signals[0] === 'string' ? signals[0] : signals[0]?.text}
                                </p>
                                <KnowyBadge variant="amber" size="sm">Signal comportemental</KnowyBadge>
                              </div>
                            </div>
                          )}
                        </div>

                        <KnowyButton
                          variant="ghost"
                          size="sm"
                          className="w-full mt-3"
                          onClick={() => navigate(`/contact/${p.id}`)}
                        >
                          Voir profil complet →
                        </KnowyButton>
                      </div>
                    );
                  })}
                </div>
              </KnowyCard>
            )}

            {/* BLOC 3 — Suivi relationnel post-réunion */}
            <KnowyCard className="p-6">
              <div className="flex items-center gap-3 mb-5">
                <CheckCircle2 className="size-5 text-primary" />
                <h2 className="text-xl font-black">SUIVI POST-RÉUNION</h2>
              </div>

              <div className="space-y-3">
                {participants.length > 0 ? participants.map((p) => {
                  const fp = fullProfiles[p.id];
                  const isAtRisk = fp?.score_phase === 'decline' ||
                    (p.relationContext && p.relationContext.lastContactDays > (p.relationContext.avgFrequencyDays ?? 30) * 1.5);
                  return (
                    <div key={p.id} className="flex items-start gap-3 p-4 bg-muted/30 rounded-xl border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/contact/${p.id}`)}>
                      <div className="size-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {p.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-semibold text-sm">{p.name}</p>
                          {isAtRisk && <AlertTriangle className="size-3.5 text-amber-600 flex-shrink-0" />}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {isAtRisk
                            ? `Relancer — dernier contact il y a ${p.relationContext?.lastContactDays ?? '?'}j`
                            : fp?.score_phase === 'growth'
                            ? 'Relation en croissance — maintenir le rythme'
                            : 'Relation stable — consolider'
                          }
                        </p>
                      </div>
                      <KnowyBadge variant={isAtRisk ? 'amber' : fp?.score_phase === 'growth' ? 'sage' : 'muted'} size="sm">
                        {isAtRisk ? 'Relancer' : fp?.score_phase === 'growth' ? 'Croissance' : 'Stable'}
                      </KnowyBadge>
                    </div>
                  );
                }) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucun participant enrichi pour cette réunion.
                  </p>
                )}
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
                        onClick={() => navigate(`/contact/${p.id}`)}
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
