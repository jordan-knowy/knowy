import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ArrowLeft,
  Sparkles,
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
  ChevronDown,
  ChevronUp,
  Globe,
  Briefcase,
  Target,
  Zap,
  Users,
  Loader2,
  ExternalLink,
  Plus
} from 'lucide-react';
import KnowrCard from './knowr/KnowrCard';
import KnowrButton from './knowr/KnowrButton';
import KnowrBadge from './knowr/KnowrBadge';
import { getContact, getCognitiveProfile } from '../../lib/api/contacts';
import { getActiveOrganizationId } from '../../lib/api/org';
import { supabase } from '../../lib/supabase';
import type { CognitiveProfile } from '../../types/domain';

type Phase = 'growth' | 'stagnant' | 'decline';

function relDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return "Aujourd'hui";
  if (d === 1) return 'Hier';
  if (d < 7) return `Il y a ${d} jours`;
  if (d < 30) return `Il y a ${Math.floor(d / 7)} sem.`;
  return `Il y a ${Math.floor(d / 30)} mois`;
}

function jobDuration(job: any): string {
  const start = job.started_at ? new Date(job.started_at).getFullYear() : null;
  const end = job.is_current ? 'Présent' : (job.ended_at ? new Date(job.ended_at).getFullYear() : null);
  if (!start) return '';
  const startMs = new Date(job.started_at).getTime();
  const endMs = job.is_current ? Date.now() : (job.ended_at ? new Date(job.ended_at).getTime() : Date.now());
  const months = Math.round((endMs - startMs) / (1000 * 60 * 60 * 24 * 30));
  const years = Math.floor(months / 12);
  const rem = months % 12;
  const dur = years > 0 ? `${years} an${years > 1 ? 's' : ''}${rem > 0 ? ` ${rem} mois` : ''}` : `${months} mois`;
  return `${start} - ${end} (${dur})`;
}

const axisLabelMap: Record<string, { label: string; opposite: string }> = {
  relation_result: { label: 'Résultat', opposite: 'Relation' },
  caution_speed: { label: 'Rapidité', opposite: 'Réflexion' },
  intuition_structure: { label: 'Structure', opposite: 'Flexibilité' },
  consensus_control: { label: 'Contrôle', opposite: 'Délégation' },
};

const sourceLabel: Record<string, string> = {
  gmail: 'Gmail',
  calendar: 'Calendar',
  linkedin_public: 'LinkedIn',
  crm: 'CRM',
  slack: 'Slack',
  meeting_transcript: 'Réunion',
  public_news: 'Actualités',
  knowy_memory: 'Mémoire Knowy',
};

export default function RelationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [openBlocks, setOpenBlocks] = useState({
    behavioral: false,
    career: false,
    history: false,
    topics: false,
    company: false,
    network: false,
  });

  const [loading, setLoading] = useState(true);
  const [rawContact, setRawContact] = useState<any>(null);
  const [snapshot, setSnapshot] = useState<any>(null);
  const [cogProfile, setCogProfile] = useState<CognitiveProfile | null>(null);
  const [cogScore, setCogScore] = useState<any>(null);
  const [emailCount, setEmailCount] = useState<number>(0);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [topicsData, setTopicsData] = useState<any[]>([]);
  const [objectionsData, setObjectionsData] = useState<any[]>([]);
  const [careerData, setCareerData] = useState<any[]>([]);
  const [memoryData, setMemoryData] = useState<any[]>([]);
  const [companySignalsData, setCompanySignalsData] = useState<any[]>([]);
  const [meetingsHistory, setMeetingsHistory] = useState<any[]>([]);

  const toggleBlock = (block: keyof typeof openBlocks) =>
    setOpenBlocks((prev) => ({ ...prev, [block]: !prev[block] }));

  useEffect(() => {
    if (!id) return;
    let mounted = true;

    async function load() {
      setLoading(true);

      if (!supabase) {
        setLoading(false);
        return;
      }

      // 1. Load contact with company join
      const rcRes = await supabase
        .from('contacts')
        .select('*, companies(name, industry)')
        .eq('id', id)
        .maybeSingle();
      if (rcRes.error) console.error('Contact fetch error:', rcRes.error.message);
      const rc = rcRes.data;
      if (mounted && rc) setRawContact(rc);

      const orgId = await getActiveOrganizationId();

      // 2. Parallel v2 table queries (graceful — tables may not exist)
      const [snapRes, alertsRes, topicsRes, objRes, careerRes, memRes] = await Promise.all([
        supabase
          .from('relationship_snapshots')
          .select('*')
          .eq('contact_id', id)
          .order('snapshot_date', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('contact_alerts')
          .select('*')
          .eq('contact_id', id)
          .eq('is_active', true)
          .order('created_at', { ascending: false }),
        supabase
          .from('contact_topics')
          .select('*')
          .eq('contact_id', id)
          .order('mention_count', { ascending: false }),
        supabase
          .from('contact_objections')
          .select('*')
          .eq('contact_id', id),
        supabase
          .from('contact_career_path')
          .select('*')
          .eq('contact_id', id)
          .order('started_at', { ascending: false }),
        supabase
          .from('knowy_memory_snapshots')
          .select('*')
          .eq('contact_id', id)
          .order('brief_number', { ascending: true }),
      ]);

      if (mounted) {
        if (!snapRes.error) setSnapshot(snapRes.data ?? null);
        if (!alertsRes.error) setAlerts(alertsRes.data ?? []);
        if (!topicsRes.error) setTopicsData(topicsRes.data ?? []);
        if (!objRes.error) setObjectionsData(objRes.data ?? []);
        if (!careerRes.error) setCareerData(careerRes.data ?? []);
        if (!memRes.error) setMemoryData(memRes.data ?? []);
      }

      // 3. Company signals — needs company name from contact
      if (rc?.companies?.name) {
        const { data: sigData } = await supabase
          .from('company_signals')
          .select('*')
          .ilike('company_name', `%${rc.companies.name}%`)
          .eq('is_active', true)
          .order('signal_date', { ascending: false })
          .limit(5);
        if (mounted && sigData) setCompanySignalsData(sigData);
      }

      // 4. Recent meetings involving this contact
      if (orgId) {
        const { data: partRows } = await supabase
          .from('meeting_participants')
          .select('meeting_id')
          .eq('contact_id', id);

        if (partRows?.length) {
          const mids = partRows.map((p: any) => p.meeting_id);
          const { data: mts } = await supabase
            .from('meetings')
            .select('id, title, starts_at, actual_duration_minutes, brief_status')
            .in('id', mids)
            .eq('organization_id', orgId)
            .order('starts_at', { ascending: false })
            .limit(8);
          if (mounted) setMeetingsHistory(mts ?? []);
        }
      }

      // 5. Cognitive profile (existing API with mock fallback)
      const cog = await getCognitiveProfile(id);
      if (mounted) setCogProfile(cog);

      // 6. Score réel + count emails depuis les tables de scoring
      const [cpRes, emailRes] = await Promise.all([
        supabase
          .from('cognitive_profiles')
          .select('engagement_score, score_intensite, score_reciprocite, score_longevite, score_phase, score_delta')
          .eq('contact_id', id!)
          .order('profile_version', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('communication_messages')
          .select('id', { count: 'exact', head: true })
          .eq('contact_id', id!),
      ]);
      if (mounted) {
        if (!cpRes.error && cpRes.data) setCogScore(cpRes.data);
        if (!emailRes.error) setEmailCount(emailRes.count ?? 0);
      }

      if (mounted) setLoading(false);
    }

    load();
    return () => { mounted = false; };
  }, [id]);

  // ─── Derived display objects ────────────────────────────────────────────────

  const contact = rawContact
    ? {
        name: rawContact.full_name ?? '—',
        title: rawContact.role_title ?? '—',
        titleConfirmed: rawContact.title_confirmed ?? false,
        company: rawContact.companies?.name ?? rawContact.company_name ?? '—',
        companyLogo: '🏢',
        sector: rawContact.companies?.industry ?? '—',
        location: '—',
        avatar: (rawContact.full_name ?? '?')
          .split(/\s+/)
          .map((n: string) => n[0] ?? '')
          .join('')
          .slice(0, 2)
          .toUpperCase(),
        phase: (snapshot?.phase ?? 'stagnant') as Phase,
        phaseDuration: snapshot?.phase_since_weeks
          ? `${snapshot.phase_since_weeks} semaines`
          : '—',
        engagementScore: cogScore?.engagement_score ?? snapshot?.engagement_score ?? 0,
        lastContact: {
          date: relDate(snapshot?.last_contact_date),
          type: snapshot?.last_contact_type ?? '—',
        },
        frequency: snapshot?.frequency_days ?? 0,
        nextRecommended: snapshot?.next_contact_recommended_days ?? 0,
        reciprocity: snapshot?.reciprocity_you_percentage ?? 50,
        sources: {
          gmail: snapshot?.source_gmail ?? false,
          calendar: snapshot?.source_calendar ?? false,
          linkedin: snapshot?.source_linkedin ?? false,
          crm: snapshot?.source_crm ?? false,
        },
      }
    : null;

  const displayAlerts = alerts.map((a: any) => ({
    type: a.alert_type,
    severity: a.severity as 'success' | 'warning' | 'danger' | 'info',
    title: a.title,
    message: a.message ?? '',
    date: relDate(a.created_at),
  }));

  const stats = [
    { label: 'Emails échangés', value: String(emailCount > 0 ? emailCount : (snapshot?.emails_exchanged ?? 0)), source: 'Gmail' },
    { label: 'Réunions tenues', value: String(meetingsHistory.length > 0 ? meetingsHistory.length : (snapshot?.meetings_count ?? 0)), source: 'Calendar' },
    {
      label: 'Score intensité',
      value: cogScore ? `${cogScore.score_intensite}/100` : '—',
      source: 'Knowr',
    },
    {
      label: 'Score réciprocité',
      value: cogScore ? `${cogScore.score_reciprocite}/100` : '—',
      source: 'Knowr',
    },
    {
      label: 'Taux de réponse',
      value: snapshot?.response_rate_hours
        ? `< ${Math.round(snapshot.response_rate_hours)}h`
        : '—',
      source: 'Gmail',
    },
    { label: 'Dernier contact', value: relDate(snapshot?.last_contact_date), source: 'Gmail' },
  ];

  const interactionProfile = cogProfile
    ? {
        confidence: cogProfile.globalConfidence ?? 0,
        axes: cogProfile.axes.map((a) => ({
          label: axisLabelMap[a.axis]?.label ?? a.axis,
          opposite: axisLabelMap[a.axis]?.opposite ?? '—',
          value: a.value ?? 50,
          confidence: a.confidence ?? 0,
          level: a.level === 'observable' ? 'Observable' : 'Inféré',
        })),
        modes: cogProfile.interactionModes.slice(0, 3).map((m) => ({
          name: m.mode,
          probability: m.score ?? 0,
        })),
      }
    : null;

  const behavioralInsights = (cogProfile?.signals ?? []).slice(0, 4).map((sig) => ({
    type: sig.type,
    insight: sig.text,
    source: sourceLabel[sig.sourceType] ?? sig.sourceType,
    confidence: sig.confidence ?? 0,
  }));

  const careerPath = careerData.map((job: any) => ({
    title: job.job_title,
    company: job.company_name,
    duration: jobDuration(job),
    sector: job.sector ?? '—',
    isCurrent: job.is_current ?? false,
    badges: job.career_badges ?? [],
  }));

  const topics = topicsData.map((t: any) => ({
    name: t.topic_name,
    count: t.mention_count ?? 1,
  }));

  const objections = objectionsData.map((o: any) => ({
    objection: o.objection_text,
    firstMentioned: relDate(o.first_mentioned_at),
    mentions: o.mention_count ?? 1,
    status: o.status ?? 'active',
  }));

  const companyContext =
    companySignalsData.length > 0
      ? {
          momentum: companySignalsData.some((s: any) => s.impact === 'positive')
            ? 'favorable'
            : 'neutre',
          news: companySignalsData[0]?.signal_title ?? '',
          newsDate: relDate(companySignalsData[0]?.signal_date),
          signals: companySignalsData.map((s: any) => s.signal_type).slice(0, 4),
        }
      : null;

  const exchangeHistory = meetingsHistory.map((m: any) => ({
    type: 'meeting' as const,
    date: relDate(m.starts_at),
    title: m.title,
    duration: m.actual_duration_minutes ? `${m.actual_duration_minutes} min` : '—',
    hasBrief: m.brief_status === 'ready' || m.brief_status === 'consulted',
    meetingId: m.id,
  }));

  const sharedNetwork = (cogProfile?.relationships ?? []).slice(0, 4).map((rel) => ({
    contactId: rel.toContactId,
    role: rel.relationType,
    strength: rel.strength,
  }));

  const getPhaseConfig = (phase: Phase) =>
    ({
      growth: {
        label: 'Développement',
        icon: TrendingUp,
        color: 'text-success',
        bgColor: 'bg-success/10',
        borderColor: 'border-success/20',
      },
      stagnant: {
        label: 'Stagnation',
        icon: Minus,
        color: 'text-muted-foreground',
        bgColor: 'bg-muted/30',
        borderColor: 'border-border',
      },
      decline: {
        label: 'Décroissance',
        icon: TrendingDown,
        color: 'text-destructive',
        bgColor: 'bg-destructive/10',
        borderColor: 'border-destructive/20',
      },
    })[phase];

  // ─── Loading & not-found states ──────────────────────────────────────────────

  if (loading) {
    return (
      <div className="size-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm">Chargement du profil relationnel…</p>
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="size-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold mb-2">Contact introuvable</p>
          <p className="text-muted-foreground mb-6">Ce contact n'existe pas ou vous n'y avez pas accès.</p>
          <KnowrButton variant="primary" onClick={() => navigate('/relations')}>
            Retour aux contacts
          </KnowrButton>
        </div>
      </div>
    );
  }

  const phaseConfig = getPhaseConfig(contact.phase);
  const PhaseIcon = phaseConfig.icon;

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="size-full bg-background overflow-auto">
      <div className="max-w-6xl mx-auto px-4 py-5 sm:px-6 sm:py-6">
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
            <KnowrButton
              variant="primary"
              size="md"
              icon={<Sparkles className="size-4" />}
              onClick={() => id && navigate(`/contact/${id}`)}
            >
              Voir la fiche enrichie
            </KnowrButton>
          </div>
        </motion.div>

        {/* BLOC 1 — Identity & Current Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <KnowrCard className={`p-6 mb-4 border-l-4 ${phaseConfig.borderColor}`}>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {/* Left - Identity */}
              <div>
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className={`size-16 rounded-xl ${phaseConfig.bgColor} ${phaseConfig.color} flex items-center justify-center font-bold text-2xl flex-shrink-0`}
                  >
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
                  {contact.sector !== '—' && <p>{contact.sector}</p>}
                  {contact.location !== '—' && (
                    <div className="flex items-center gap-1">
                      <MapPin className="size-3" />
                      <span>{contact.location}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Center - Engagement */}
              <div className="flex flex-col items-center justify-center border-y border-border px-0 py-6 md:border-x md:border-y-0 md:px-6 md:py-0">
                <div className="relative size-28 mb-3">
                  <svg className="size-full -rotate-90">
                    <circle cx="56" cy="56" r="48" fill="none" stroke="currentColor" strokeWidth="6" className="text-muted/20" />
                    <circle
                      cx="56" cy="56" r="48" fill="none" stroke="currentColor" strokeWidth="6"
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
                  <KnowrBadge
                    variant={contact.phase === 'growth' ? 'sage' : contact.phase === 'decline' ? 'coral' : 'muted'}
                    size="sm"
                  >
                    {phaseConfig.label}
                  </KnowrBadge>
                </div>
                <p className="text-xs text-muted-foreground mb-4">depuis {contact.phaseDuration}</p>

                {/* Reciprocity */}
                <div className="w-full">
                  <p className="text-xs text-muted-foreground mb-2 text-center">Réciprocité</p>
                  <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden flex mb-1">
                    <div className="bg-primary" style={{ width: `${contact.reciprocity}%` }} />
                    <div className="bg-accent flex-1" />
                  </div>
                  <p className="text-xs text-center text-muted-foreground">Vous {contact.reciprocity}%</p>
                </div>
              </div>

              {/* Right - Contact Info */}
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Dernier contact</p>
                  <p className="font-semibold text-sm">{contact.lastContact.date}</p>
                  <p className="text-xs text-muted-foreground capitalize">{contact.lastContact.type}</p>
                </div>
                {contact.frequency > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Fréquence</p>
                    <p className="font-semibold text-sm">Tous les {contact.frequency}j</p>
                  </div>
                )}
                {contact.nextRecommended > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Prochain contact</p>
                    <div className="flex items-center gap-1.5">
                      <Clock className="size-3 text-primary" />
                      <p className="font-semibold text-sm text-primary">Dans {contact.nextRecommended}j</p>
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Sources</p>
                  <div className="flex flex-wrap gap-1.5">
                    <KnowrBadge variant={contact.sources.gmail ? 'sage' : 'muted'} size="sm">
                      Gmail {contact.sources.gmail && '✓'}
                    </KnowrBadge>
                    <KnowrBadge variant={contact.sources.calendar ? 'sage' : 'muted'} size="sm">
                      Calendar {contact.sources.calendar && '✓'}
                    </KnowrBadge>
                    <KnowrBadge variant={contact.sources.linkedin ? 'sage' : 'muted'} size="sm">
                      LinkedIn {contact.sources.linkedin && '✓'}
                    </KnowrBadge>
                  </div>
                </div>
              </div>
            </div>
          </KnowrCard>
        </motion.div>

        {/* MÉMOIRE KNOWY */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mb-4"
        >
          <KnowrCard className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/10">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="size-5 text-primary" />
              <h2 className="text-lg font-bold">Mémoire Knowr · {contact.name}</h2>
            </div>

            {memoryData.length === 0 ? (
              <div className="text-center py-8">
                <Sparkles className="size-10 mx-auto mb-3 text-primary/30" />
                <p className="text-sm text-muted-foreground mb-1">Aucun brief généré pour ce contact</p>
                <p className="text-xs text-muted-foreground">
                  Planifiez une réunion pour générer votre premier brief Knowr.
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-6">
                  {memoryData.length} brief{memoryData.length > 1 ? 's' : ''} mémorisé{memoryData.length > 1 ? 's' : ''}
                  {' '}· Brief #1 → Brief #{memoryData[memoryData.length - 1]?.brief_number ?? memoryData.length}
                </p>
                <div className="space-y-4">
                  {memoryData.map((snap: any, i: number) => {
                    const isLast = i === memoryData.length - 1;
                    const score = snap.confidence_score ?? 0;
                    const scoreVariant = score >= 70 ? 'sage' : score >= 50 ? 'amber' : 'coral';
                    return (
                      <div key={snap.id} className={`relative pl-6 ${isLast ? '' : 'pb-4'} border-l-2 ${isLast ? 'border-primary' : 'border-muted'}`}>
                        <div className={`absolute -left-[9px] top-0 size-4 rounded-full border-2 border-background ${isLast ? 'bg-primary shadow-lg shadow-primary/50' : score >= 60 ? 'bg-amber-600' : 'bg-muted'}`} />
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-sm flex items-center gap-2">
                              BRIEF #{snap.brief_number} · {snap.brief_date ? new Date(snap.brief_date).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }).toUpperCase() : '—'}
                              {isLast && <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium">ACTUEL</span>}
                            </p>
                            {snap.summary && (
                              <p className="text-xs text-muted-foreground mt-1 mb-2">{snap.summary}</p>
                            )}
                            {snap.new_insights?.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-1">
                                {snap.new_insights.map((ins: string, j: number) => (
                                  <span key={j} className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium">
                                    + {ins}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <KnowrBadge variant={scoreVariant} size="sm">{score}%</KnowrBadge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </KnowrCard>
        </motion.div>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px]">
          {/* LEFT COLUMN */}
          <div className="space-y-4">

            {/* Active Alerts */}
            {displayAlerts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                {displayAlerts.map((alert, i) => (
                  <KnowrCard
                    key={i}
                    className={`p-3 mb-2 border-l-4 ${
                      alert.severity === 'success' ? 'border-success bg-success/5' :
                      alert.severity === 'warning' ? 'border-amber-600 bg-amber-600/5' :
                      'border-destructive bg-destructive/5'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <AlertCircle className={`size-4 flex-shrink-0 mt-0.5 ${alert.severity === 'success' ? 'text-success' : alert.severity === 'warning' ? 'text-amber-600' : 'text-destructive'}`} />
                      <div className="flex-1">
                        <h3 className="font-bold text-sm mb-0.5">{alert.title}</h3>
                        <p className="text-xs text-muted-foreground mb-0.5">{alert.message}</p>
                        <p className="text-xs text-muted-foreground opacity-70">{alert.date}</p>
                      </div>
                    </div>
                  </KnowrCard>
                ))}
              </motion.div>
            )}

            {/* Relational Stats */}
            {stats.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                <KnowrCard className="p-4">
                  <h2 className="text-lg font-bold mb-4">Statistiques relationnelles</h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {stats.map((stat, i) => (
                      <div key={i} className="text-center p-3 bg-muted/20 rounded-lg">
                        <p className="text-2xl font-black mb-1">{stat.value}</p>
                        <p className="text-xs text-muted-foreground mb-0.5">{stat.label}</p>
                        <p className="text-xs text-muted-foreground opacity-60">via {stat.source}</p>
                      </div>
                    ))}
                  </div>
                </KnowrCard>
              </motion.div>
            )}

            {/* Interaction Profile */}
            {interactionProfile && interactionProfile.axes.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.5 }}
              >
                <KnowrCard className="p-4">
                  <h2 className="text-lg font-bold mb-4">Profil interactionnel</h2>
                  <div className="space-y-4">
                    {interactionProfile.axes.map((axis, i) => (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-medium">{axis.label}</span>
                          <span className="text-xs font-medium">{axis.opposite}</span>
                        </div>
                        <div className="relative h-1.5 bg-muted/30 rounded-full overflow-hidden">
                          <div className="absolute top-0 left-0 h-full bg-primary rounded-full" style={{ width: `${axis.value}%` }} />
                        </div>
                        <div className="flex items-center justify-between mt-1.5">
                          <KnowrBadge variant="muted" size="sm">{axis.level}</KnowrBadge>
                          <span className="text-xs text-muted-foreground">{axis.confidence}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {interactionProfile.modes.length > 0 && (
                    <div className="pt-3 border-t border-border mt-4">
                      <p className="text-xs font-medium mb-2 text-muted-foreground">Modes d'interaction</p>
                      <div className="flex flex-wrap gap-2">
                        {interactionProfile.modes.map((mode, i) => (
                          <KnowrBadge key={i} variant="primary" size="sm">
                            {mode.name} · {mode.probability}%
                          </KnowrBadge>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-3">
                    Confiance globale: {interactionProfile.confidence}%
                  </p>
                </KnowrCard>
              </motion.div>
            )}

            {/* Behavioral Analysis */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.6 }}
            >
              <KnowrCard className="p-4">
                <button
                  onClick={() => toggleBlock('behavioral')}
                  className="w-full flex items-center justify-between mb-3 hover:text-primary transition-colors"
                >
                  <h2 className="text-base font-bold">Analyse comportementale</h2>
                  {openBlocks.behavioral ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                </button>
                {openBlocks.behavioral && (
                  behavioralInsights.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                      Pas encore assez d'échanges pour inférer les signaux comportementaux.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      {behavioralInsights.map((insight, i) => (
                        <div key={i} className="p-3 bg-muted/20 rounded-lg">
                          <h3 className="font-bold text-sm mb-1">{insight.type}</h3>
                          <p className="text-xs text-muted-foreground mb-2">{insight.insight}</p>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground opacity-70">{insight.source}</p>
                            <KnowrBadge variant="muted" size="sm">{insight.confidence}%</KnowrBadge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </KnowrCard>
            </motion.div>

            {/* Career Path */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.7 }}
            >
              <KnowrCard className="p-4">
                <button
                  onClick={() => toggleBlock('career')}
                  className="w-full flex items-center justify-between mb-3 hover:text-primary transition-colors"
                >
                  <h2 className="text-base font-bold">Parcours & CV observable</h2>
                  {openBlocks.career ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                </button>
                {openBlocks.career && (
                  careerPath.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                      Parcours professionnel non encore renseigné.
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {careerPath.map((job, i) => (
                        <div key={i} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className={`size-3 rounded-full ${job.isCurrent ? 'bg-primary' : 'bg-muted'}`} />
                            {i < careerPath.length - 1 && <div className="w-px h-full bg-border mt-2" />}
                          </div>
                          <div className="flex-1 pb-6">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="font-bold">{job.title}</h3>
                                <p className="text-sm text-muted-foreground">{job.company}</p>
                              </div>
                              {job.isCurrent && <KnowrBadge variant="primary" size="sm">Poste actuel</KnowrBadge>}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{job.duration}</p>
                            <div className="flex gap-2 flex-wrap">
                              <KnowrBadge variant="muted" size="sm">{job.sector}</KnowrBadge>
                              {job.badges.map((badge: string, j: number) => (
                                <KnowrBadge key={j} variant="blue" size="sm">{badge}</KnowrBadge>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </KnowrCard>
            </motion.div>

            {/* Exchange History */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.8 }}
            >
              <KnowrCard className="p-4">
                <button
                  onClick={() => toggleBlock('history')}
                  className="w-full flex items-center justify-between mb-3 hover:text-primary transition-colors"
                >
                  <h2 className="text-base font-bold">Historique des échanges</h2>
                  {openBlocks.history ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                </button>
                {openBlocks.history && (
                  exchangeHistory.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                      Aucune réunion enregistrée avec ce contact.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {exchangeHistory.map((item, i) => (
                        <div key={i} className="flex items-start gap-4 p-4 bg-muted/20 rounded-xl">
                          <Calendar className="size-5 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-medium">{item.title}</p>
                              <p className="text-sm text-muted-foreground">{item.date}</p>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                              <KnowrBadge variant="muted" size="sm">{item.duration}</KnowrBadge>
                              {item.hasBrief && <KnowrBadge variant="primary" size="sm">Brief disponible</KnowrBadge>}
                              <button
                                onClick={() => navigate(`/meeting/${item.meetingId}`)}
                                className="text-xs text-primary hover:underline ml-1"
                              >
                                Voir la réunion →
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </KnowrCard>
            </motion.div>

            {/* Topics & Objections */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.9 }}
            >
              <KnowrCard className="p-4">
                <button
                  onClick={() => toggleBlock('topics')}
                  className="w-full flex items-center justify-between mb-3 hover:text-primary transition-colors"
                >
                  <h2 className="text-base font-bold">Sujets & Objections historiques</h2>
                  {openBlocks.topics ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                </button>
                {openBlocks.topics && (
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-bold mb-4">Sujets abordés</h3>
                      {topics.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Aucun sujet détecté.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {topics.map((topic, i) => (
                            <KnowrBadge key={i} variant="blue" size="md">
                              {topic.name} ×{topic.count}
                            </KnowrBadge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold mb-4">Objections identifiées</h3>
                      {objections.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Aucune objection enregistrée.</p>
                      ) : (
                        <div className="space-y-3">
                          {objections.map((obj, i) => (
                            <div key={i} className="p-3 bg-muted/20 rounded-lg">
                              <div className="flex items-start justify-between mb-2">
                                <p className="font-medium text-sm">{obj.objection}</p>
                                <KnowrBadge variant={obj.status === 'resolved' ? 'sage' : 'coral'} size="sm">
                                  {obj.status === 'resolved' ? 'Résolue' : 'Active'}
                                </KnowrBadge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {obj.firstMentioned} · {obj.mentions} mention{obj.mentions > 1 ? 's' : ''}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </KnowrCard>
            </motion.div>

            {/* Company Context */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 1.0 }}
            >
              <KnowrCard className="p-4">
                <button
                  onClick={() => toggleBlock('company')}
                  className="w-full flex items-center justify-between mb-3 hover:text-primary transition-colors"
                >
                  <h2 className="text-base font-bold">Contexte entreprise actuel</h2>
                  {openBlocks.company ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                </button>
                {openBlocks.company && (
                  !companyContext ? (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                      Aucun signal d'entreprise détecté pour {contact.company}.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <KnowrBadge variant="sage" size="md">
                        Momentum {companyContext.momentum === 'favorable' ? 'favorable 🟢' : 'neutre ⚪'}
                      </KnowrBadge>
                      <div className="p-4 bg-success/5 border border-success/20 rounded-xl">
                        <p className="font-semibold mb-1">{companyContext.news}</p>
                        <p className="text-sm text-muted-foreground">{companyContext.newsDate}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {companyContext.signals.map((sig, i) => (
                          <KnowrBadge key={i} variant="blue" size="sm">{sig}</KnowrBadge>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </KnowrCard>
            </motion.div>

            {/* Shared Network */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 1.1 }}
            >
              <KnowrCard className="p-4">
                <button
                  onClick={() => toggleBlock('network')}
                  className="w-full flex items-center justify-between mb-3 hover:text-primary transition-colors"
                >
                  <h2 className="text-base font-bold">Réseau partagé</h2>
                  {openBlocks.network ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                </button>
                {openBlocks.network && (
                  sharedNetwork.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                      Aucune relation connue dans le réseau partagé.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sharedNetwork.map((person, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-muted/20 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="size-10 bg-primary/10 rounded-full flex items-center justify-center font-semibold text-primary">
                              <Users className="size-4" />
                            </div>
                            <div>
                              <p className="font-medium text-sm font-mono text-xs">{person.contactId.slice(0, 8)}…</p>
                              <p className="text-sm text-muted-foreground capitalize">{person.role.replace(/_/g, ' ')}</p>
                            </div>
                          </div>
                          <KnowrBadge variant="muted" size="sm">Force {Math.round(person.strength * 100)}%</KnowrBadge>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </KnowrCard>
            </motion.div>

            {/* Action Recommendation */}
            {(snapshot || cogProfile) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 1.2 }}
                className="mb-6"
              >
                <KnowrCard className="p-4 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
                  <h2 className="text-base font-bold mb-3">Recommandation d'action</h2>
                  <p className="text-sm text-muted-foreground">
                    {contact.phase === 'growth'
                      ? `La relation avec ${contact.name} est en phase de développement.`
                      : contact.phase === 'decline'
                      ? `⚠️ La relation avec ${contact.name} est en décroissance — réactivez rapidement.`
                      : `La relation avec ${contact.name} est stable.`}
                    {contact.nextRecommended > 0 &&
                      ` Prochain contact recommandé dans ${contact.nextRecommended} jours.`}
                  </p>
                </KnowrCard>
              </motion.div>
            )}

          </div>
          {/* END LEFT COLUMN */}

          {/* RIGHT COLUMN — Activity Feed */}
          <div className="sticky top-6 self-start h-fit">
            <KnowrCard className="p-4">
              <h2 className="font-bold mb-4 flex items-center gap-2">
                <Zap className="size-4 text-primary" />
                Activité récente
              </h2>

              {/* Health Status */}
              <div className={`mb-6 p-3 rounded-xl border ${contact.phase === 'decline' ? 'bg-destructive/10 border-destructive/20' : contact.phase === 'growth' ? 'bg-success/10 border-success/20' : 'bg-muted/20 border-border'}`}>
                <div className={`flex items-center gap-2 mb-2 ${contact.phase === 'decline' ? 'text-destructive' : contact.phase === 'growth' ? 'text-success' : 'text-muted-foreground'}`}>
                  <PhaseIcon className="size-4" />
                  <span className="font-semibold text-sm">{phaseConfig.label}</span>
                </div>
                {contact.nextRecommended > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Prochain contact: <strong>dans {contact.nextRecommended} jours</strong>
                  </p>
                )}
              </div>

              {/* Timeline */}
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {exchangeHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    <Calendar className="size-8 mx-auto mb-2 opacity-30" />
                    <p>Aucune activité enregistrée</p>
                    <p className="text-xs mt-1">Connectez Gmail et Calendar pour voir les échanges.</p>
                  </div>
                ) : (
                  exchangeHistory.map((item, i) => (
                    <div key={i} className="border-l-2 border-border pl-4 pb-3 relative">
                      <div className="absolute -left-[5px] top-2 size-2.5 rounded-full bg-primary border-2 border-background" />
                      <div className="bg-primary/10 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="size-3 text-primary" />
                          <span className="text-xs font-semibold">Réunion</span>
                          <span className="text-xs text-muted-foreground ml-auto">{item.date}</span>
                        </div>
                        <p className="text-sm font-medium mb-2">{item.title}</p>
                        {item.hasBrief && (
                          <KnowrButton
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/meeting/${item.meetingId}`)}
                            className="w-full"
                          >
                            Voir la réunion →
                          </KnowrButton>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Actions */}
              <div className="mt-4 pt-4 border-t border-border space-y-2">
                <KnowrButton variant="primary" size="sm" className="w-full" icon={<Mail className="size-4" />}>
                  Envoyer un email
                </KnowrButton>
                <KnowrButton variant="secondary" size="sm" className="w-full" icon={<Calendar className="size-4" />}>
                  Planifier réunion
                </KnowrButton>
              </div>
            </KnowrCard>
          </div>
          {/* END RIGHT COLUMN */}

        </div>
      </div>
    </div>
  );
}
