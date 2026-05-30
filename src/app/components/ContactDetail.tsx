import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ArrowLeft, Mail, Calendar, ExternalLink, RefreshCw,
  TrendingUp, Minus, TrendingDown, Sparkles, Clock,
  Brain, Target, Zap, Users, AlertTriangle, CheckCircle,
  MessageSquare, Building2, Globe, Loader2,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../../lib/supabase';
import { getActiveOrganizationId } from '../../lib/api/org';
import { findMergeCandidates, mergeContacts, type MergeCandidate } from '../../lib/api/contacts';

// ── Types ─────────────────────────────────────────────────────────────────────
interface ContactRow {
  id: string; full_name: string; email?: string; role_title?: string;
  company_name?: string; avatar_url?: string; linkedin_url?: string;
  enrichment_status: 'pending' | 'running' | 'done' | 'failed';
  last_enriched_at?: string; web_bio?: string;
  companies?: { name: string; domain?: string };
}

interface CognitiveProfile {
  id: string; global_confidence: number; executive_summary?: string;
  cognitive_mode?: string; cognitive_mode_confidence?: number;
  interaction_modes_data?: string[]; jtbd_data?: any;
  theory_of_mind_data?: any; behavioral_analysis_data?: any[];
  engagement_score?: number; score_phase?: string;
  score_intensite?: number; score_reciprocite?: number;
  score_longevite?: number; score_delta?: number;
}

interface Axis {
  axis: string; value: number; confidence: number; inference_level: string;
}

interface Message {
  id: string; direction: string; sent_at: string; subject?: string;
}

interface Meeting {
  id: string; title?: string; starts_at: string; actual_duration_minutes?: number;
}

interface Note {
  id: string; body: string; created_at: string; meeting_id?: string;
}

interface ScorePoint {
  date: string; score: number; phase: string;
  score_intensite?: number; score_reciprocite?: number; score_longevite?: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function relDate(iso: string): string {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d === 0) return "Aujourd'hui";
  if (d === 1) return 'Hier';
  if (d < 7) return `Il y a ${d}j`;
  if (d < 30) return `Il y a ${Math.floor(d / 7)} sem.`;
  return `Il y a ${Math.floor(d / 30)} mois`;
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();
}

const LEVEL_CONFIG = {
  observable:  { label: 'Observable',  color: 'text-success bg-success/10' },
  inferred:    { label: 'Inféré',       color: 'text-primary bg-primary/10' },
  hypothetical:{ label: 'Hypothétique', color: 'text-warning bg-warning/10' },
  unavailable: { label: 'N/D',          color: 'text-muted-foreground bg-muted' },
};

const AXIS_CONFIG = {
  relation_result:    { left: 'Relation',  right: 'Résultat'  },
  intuition_structure:{ left: 'Intuition', right: 'Structure' },
  caution_speed:      { left: 'Prudence',  right: 'Rapidité'  },
  consensus_control:  { left: 'Consensus', right: 'Contrôle'  },
};

const MODE_COLORS: Record<string, string> = {
  'Operator':          'bg-blue-50 text-blue-700 border-blue-200',
  'Validator':         'bg-violet-50 text-violet-700 border-violet-200',
  'Strategist':        'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Challenger':        'bg-red-50 text-red-700 border-red-200',
  'Consensus Builder': 'bg-green-50 text-green-700 border-green-200',
  'Explorer':          'bg-amber-50 text-amber-700 border-amber-200',
};

// ── Score circle ──────────────────────────────────────────────────────────────
function ScoreRing({ score, phase, delta }: { score: number; phase: string; delta?: number }) {
  const r = 36; const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 70 ? '#2EA86A' : score >= 45 ? '#6E50C8' : '#D94F63';
  const PhaseIcon = phase === 'growth' ? TrendingUp : phase === 'decline' ? TrendingDown : Minus;
  const phaseColor = phase === 'growth' ? 'text-success' : phase === 'decline' ? 'text-destructive' : 'text-muted-foreground';
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative size-[88px]">
        <svg width="88" height="88" viewBox="0 0 88 88" className="-rotate-90">
          <circle cx="44" cy="44" r={r} fill="none" strokeWidth="6" stroke="rgba(110,80,200,0.1)" />
          <circle cx="44" cy="44" r={r} fill="none" strokeWidth="6" stroke={color}
            strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1s ease' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold leading-none" style={{ color }}>{score}</span>
          <span className="text-[10px] text-muted-foreground font-medium">/100</span>
        </div>
      </div>
      <div className={`flex items-center gap-1 text-xs font-semibold ${phaseColor}`}>
        <PhaseIcon className="size-3" />
        {delta != null && delta !== 0 && <span>{delta > 0 ? '+' : ''}{delta} pts</span>}
      </div>
    </div>
  );
}

// ── Axis bar ──────────────────────────────────────────────────────────────────
function AxisBar({ axis, value, confidence, inference_level }: Axis) {
  const cfg = AXIS_CONFIG[axis as keyof typeof AXIS_CONFIG];
  if (!cfg) return null;
  const lvl = LEVEL_CONFIG[inference_level as keyof typeof LEVEL_CONFIG] ?? LEVEL_CONFIG.unavailable;
  const pct = Math.round(clamp(value, 0, 100));
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground font-medium">{cfg.left}</span>
        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${lvl.color}`}>{lvl.label}</span>
        <span className="text-muted-foreground font-medium">{cfg.right}</span>
      </div>
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 w-0.5 bg-border/60"
          style={{ left: '50%' }}
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ background: `linear-gradient(90deg, #D4C5F5, #6E50C8)` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 size-3 rounded-full bg-primary border-2 border-white shadow-sm"
          style={{ left: `calc(${pct}% - 6px)`, transition: 'left 0.8s ease' }}
        />
      </div>
      <div className="flex justify-end">
        <span className="text-[10px] text-muted-foreground font-mono">{pct} · conf. {confidence}%</span>
      </div>
    </div>
  );
}

function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }

// ── JTBD Card ─────────────────────────────────────────────────────────────────
function JTBDCard({ type, data }: { type: 'functional' | 'social' | 'emotional'; data: any }) {
  const config = {
    functional: { label: 'Fonctionnel', icon: Target,  bg: 'bg-blue-50',   border: 'border-blue-100',  icon_color: 'text-blue-600' },
    social:     { label: 'Social',      icon: Users,   bg: 'bg-violet-50', border: 'border-violet-100',icon_color: 'text-violet-600' },
    emotional:  { label: 'Émotionnel',  icon: Brain,   bg: 'bg-teal-50',   border: 'border-teal-100',  icon_color: 'text-teal-600' },
  }[type];
  const Icon = config.icon;
  const conf = Math.round((data?.confidence ?? 0) * 100);
  return (
    <div className={`rounded-xl border p-4 ${config.bg} ${config.border}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`size-4 ${config.icon_color}`} />
        <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{config.label}</span>
        {conf > 0 && <span className="ml-auto text-[10px] font-mono text-muted-foreground">{conf}%</span>}
      </div>
      <p className="text-sm text-foreground leading-relaxed mb-2">{data?.text ?? '—'}</p>
      {data?.pitch_angle && (
        <p className="text-xs text-muted-foreground italic border-t border-current/10 pt-2">
          💡 {data.pitch_angle}
        </p>
      )}
    </div>
  );
}

// ── Enriching state ───────────────────────────────────────────────────────────
function EnrichingState({ name }: { name: string }) {
  const steps = ['Analyse des échanges…', 'Calcul du scoring relationnel…', 'Génération du profil cognitif…', 'Sauvegarde en mémoire…'];
  const [step, setStep] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setStep(s => (s + 1) % steps.length), 2000);
    return () => clearInterval(i);
  }, []);
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-6">
      <div className="size-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
        <Sparkles className="size-8 text-white animate-pulse" />
      </div>
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold">Knowy analyse {name}</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          L'IA construit le profil cognitif à partir de vos échanges et de la mémoire relationnelle.
        </p>
      </div>
      <div className="flex flex-col items-center gap-3 w-64">
        {steps.map((s, i) => (
          <motion.div
            key={s}
            initial={{ opacity: 0.3 }}
            animate={{ opacity: i <= step ? 1 : 0.3 }}
            className="flex items-center gap-2 text-sm w-full"
          >
            {i < step ? (
              <CheckCircle className="size-4 text-success flex-shrink-0" />
            ) : i === step ? (
              <div className="size-4 rounded-full border-2 border-primary border-t-transparent animate-spin flex-shrink-0" />
            ) : (
              <div className="size-4 rounded-full border border-border flex-shrink-0" />
            )}
            <span className={i <= step ? 'text-foreground' : 'text-muted-foreground'}>{s}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── Score tooltip ─────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-md text-xs">
      <p className="font-semibold mb-1">{label}</p>
      <p className="text-primary font-mono">{payload[0]?.value}/100</p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ContactDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [contact, setContact] = useState<ContactRow | null>(null);
  const [profile, setProfile] = useState<CognitiveProfile | null>(null);
  const [axes, setAxes] = useState<Axis[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [scoreHistory, setScoreHistory] = useState<ScorePoint[]>([]);
  const [activeTab, setActiveTab] = useState<'profil' | 'memoire' | 'echanges'>('profil');
  const [loading, setLoading] = useState(true);
  const [enriching, setEnriching] = useState(false);
  const [enrichError, setEnrichError] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [mergeCandidates, setMergeCandidates] = useState<MergeCandidate[]>([]);
  const [merging, setMerging] = useState(false);
  const [emailAnalysis, setEmailAnalysis] = useState<any | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  // ── Load all data ────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!supabase || !id) { setLoading(false); return; }
    try {
    const oid = orgId ?? await getActiveOrganizationId();
    if (!oid) { setLoading(false); return; }
    if (!orgId) setOrgId(oid);

    // ── 1. Contact de base — colonnes qui existent depuis l'origine ──────────
    // On ne requête PAS les nouvelles colonnes (enrichment_status, web_bio) ici
    // pour être résilient si la migration 202605290004 n'a pas encore été appliquée
    const { data: c, error: contactError } = await supabase.from('contacts')
      .select('id, full_name, email, role_title, avatar_url, linkedin_url, companies(name, domain)')
      .eq('id', id).eq('organization_id', oid).maybeSingle();

    if (contactError || !c) {
      setLoading(false);
      return;
    }

    // ── 2. Colonnes enrichissement + email_analysis (optionnelles) ───────────
    let enrichmentData: any = {};
    try {
      const { data: ed } = await supabase.from('contacts')
        .select('enrichment_status, last_enriched_at, web_bio, email_analysis')
        .eq('id', id).maybeSingle();
      if (ed) {
        enrichmentData = ed;
        if ((ed as any).email_analysis) setEmailAnalysis((ed as any).email_analysis);
      }
    } catch { /* migration pas encore appliquée */ }

    const fullContact: ContactRow = {
      ...(c as any),
      enrichment_status: enrichmentData.enrichment_status ?? 'pending',
      last_enriched_at:  enrichmentData.last_enriched_at  ?? null,
      web_bio:           enrichmentData.web_bio           ?? null,
    };

    // ── 3. Profil cognitif ────────────────────────────────────────────────────
    const { data: prof } = await supabase.from('cognitive_profiles')
      .select('id, global_confidence, executive_summary, cognitive_mode, cognitive_mode_confidence, interaction_modes_data, jtbd_data, theory_of_mind_data, behavioral_analysis_data, engagement_score, score_phase, score_intensite, score_reciprocite, score_longevite, score_delta')
      .eq('contact_id', id).eq('organization_id', oid)
      .order('profile_version', { ascending: false }).limit(1).maybeSingle();

    // ── 4. Axes interactionnels — via profile_id direct (pas de sous-requête) ─
    let ax: any[] = [];
    if (prof?.id) {
      const { data: axData } = await supabase.from('interaction_axis_scores')
        .select('axis, value, confidence, inference_level')
        .eq('profile_id', prof.id);
      ax = axData ?? [];
    }

    // ── 5. Emails, réunions, notes, historique score ─────────────────────────
    const [
      { data: msgs },
      { data: meetParts },
      { data: notesData },
      { data: hist },
    ] = await Promise.all([
      supabase.from('communication_messages')
        .select('id, direction, sent_at, subject')
        .eq('contact_id', id).eq('organization_id', oid)
        .order('sent_at', { ascending: false }).limit(100),
      supabase.from('meeting_participants')
        .select('meetings(id, title, starts_at, actual_duration_minutes)')
        .eq('contact_id', id).eq('organization_id', oid),
      supabase.from('notes')
        .select('id, body, created_at, meeting_id')
        .eq('contact_id', id).eq('organization_id', oid)
        .order('created_at', { ascending: false }).limit(30),
      // contact_score_history — optionnel si migration non appliquée
      supabase.from('contact_score_history')
        .select('score, phase, snapshot_date, score_intensite, score_reciprocite, score_longevite')
        .eq('contact_id', id).eq('organization_id', oid)
        .order('snapshot_date', { ascending: true }).limit(30)
        .then(r => r) // never throws
        .catch(() => ({ data: null })),
    ]);

    setContact(fullContact);
    setProfile(prof as CognitiveProfile | null);
    setAxes(ax as Axis[]);
    setMessages((msgs ?? []) as Message[]);
    setMeetings(((meetParts ?? []).map((p: any) => p.meetings).filter(Boolean).flat()) as Meeting[]);
    setNotes((notesData ?? []) as Note[]);
    setScoreHistory((hist ?? []).map((h: any) => ({
      date: new Date(h.snapshot_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
      score: h.score, phase: h.phase,
      score_intensite: h.score_intensite, score_reciprocite: h.score_reciprocite, score_longevite: h.score_longevite,
    })));
    setLoading(false);

    // Déclenche l'enrichissement IA si le profil est en attente
    if (fullContact.enrichment_status === 'pending' || fullContact.enrichment_status === 'failed') {
      triggerEnrichment(id, oid);
    }

    // Recherche les homonymes (doublons potentiels) en arrière-plan
    findMergeCandidates(id).then(c => setMergeCandidates(c)).catch(() => {});
    } catch (e) {
      console.error('ContactDetail load error:', e);
      setLoading(false);
    }
  }, [id, orgId]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Fusion d'un homonyme dans ce contact ─────────────────────────────────────
  const handleMerge = async (secondaryId: string) => {
    if (!id || merging) return;
    setMerging(true);
    try {
      const ok = await mergeContacts(id, secondaryId);
      if (ok) {
        setMergeCandidates(prev => prev.filter(c => c.id !== secondaryId));
        await loadData();
        // Ré-enrichit avec les données fusionnées
        if (orgId) triggerEnrichment(id, orgId, true);
      }
    } finally {
      setMerging(false);
    }
  };

  // ── Analyse IA des échanges email ────────────────────────────────────────────
  const handleAnalyzeEmails = async () => {
    if (!supabase || !id || !orgId || analyzing) return;
    setAnalyzing(true);
    setAnalyzeError(null);
    try {
      // Tente d'abord un refresh de session pour avoir un token frais
      const { data: { session } } = await supabase.auth.getSession();
      const providerToken = session?.provider_token ?? null;

      const { data, error } = await supabase.functions.invoke('analyze-email-exchanges', {
        body: { contactId: id, organizationId: orgId, providerToken },
      });

      if (error) {
        // Supabase renvoie un message générique — on tente d'extraire le corps réel
        let realMsg: string | null = null;
        try {
          const body = await (error as any)?.context?.json?.();
          realMsg = body?.error ?? null;
          if (body?.code === 'NO_MESSAGES') {
            realMsg = 'Aucun email synchronisé pour ce contact. Lancez d\'abord une sync Gmail dans Paramètres → Connexions.';
          } else if (body?.code === 'BODY_READ_FAILED') {
            realMsg = 'Impossible de lire les emails (token expiré ?). Relancez une sync Gmail dans Paramètres pour rafraîchir le token, puis réessayez.';
          } else if (body?.code === 'TOKEN_MISSING') {
            realMsg = 'Token Google expiré. Relancez une sync Gmail dans Paramètres → Connexions.';
          } else if (body?.code === 'AI_FAILED') {
            // Affiche le vrai message d'erreur de la fonction pour diagnostiquer
            realMsg = body?.error ?? 'Analyse IA échouée — voir détails dans les logs Supabase.';
          } else if (body?.code === 'INTERNAL_ERROR') {
            realMsg = body?.error ?? 'Erreur interne dans la fonction.';
          }
        } catch { /* ignore parse error */ }
        setAnalyzeError(realMsg ?? (error as any)?.message ?? 'Erreur inconnue');
      } else if (data?.analysis) {
        setEmailAnalysis(data.analysis);
      } else {
        setAnalyzeError('Réponse inattendue de l\'analyse IA.');
      }
    } catch (e: any) {
      setAnalyzeError(e?.message ?? 'Erreur inconnue');
    } finally {
      setAnalyzing(false);
    }
  };

  // ── Enrichment trigger ───────────────────────────────────────────────────────
  const triggerEnrichment = async (contactId: string, oid: string, force = false) => {
    if (!supabase) return;
    setEnriching(true);
    setEnrichError(null);
    try {
      const { error } = await supabase.functions.invoke('enrich-contact', {
        body: { contactId, organizationId: oid, forceRefresh: force },
      });
      if (error) {
        const msg = (error as any)?.message ?? String(error);
        if (msg.includes('non-2xx') || msg.includes('404') || msg.includes('FunctionsHttpError')) {
          setEnrichError('deploy');
        } else {
          setEnrichError(msg);
        }
      } else {
        await loadData();
      }
    } catch (e: any) {
      setEnrichError('deploy');
    } finally {
      setEnriching(false);
    }
  };

  // ── Loading state ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="size-full flex items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="size-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span>Chargement du profil…</span>
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="size-full flex flex-col items-center justify-center gap-4">
        <AlertTriangle className="size-10 text-warning" />
        <p className="text-muted-foreground">Contact introuvable.</p>
        <button onClick={() => navigate(-1)} className="text-primary text-sm underline">Retour</button>
      </div>
    );
  }

  const companyName = (contact.companies as any)?.name ?? '';
  const score = profile?.engagement_score ?? null;
  const phase = profile?.score_phase as 'growth' | 'stagnant' | 'decline' | undefined;
  const allDates = [...messages.map(m => m.sent_at), ...meetings.map(m => m.starts_at)].filter(Boolean).sort().reverse();
  const lastContact = allDates[0];
  const sources = ['Gmail', 'Calendar'].filter((s, i) => i === 0 ? messages.length > 0 : meetings.length > 0);

  const scoreColor = score == null ? '#9082B8' : score >= 70 ? '#2EA86A' : score >= 40 ? '#6E50C8' : '#D94F63';
  const phaseLabel = phase === 'growth' ? 'Développement' : phase === 'decline' ? 'Déclin' : 'Stable';
  const phaseColor = phase === 'growth' ? '#2EA86A' : phase === 'decline' ? '#D94F63' : 'rgba(255,255,255,0.4)';

  // Brief express — 4 clés extraites du profil cognitif
  const briefExpress = profile ? [
    {
      label: '🎯 Insight clef',
      text: profile.executive_summary ?? '—',
    },
    {
      label: '⚡ Action prioritaire',
      text: profile.jtbd_data?.functional_job?.pitch_angle
        ?? (profile.behavioral_analysis_data?.[0] as any)?.inference
        ?? '—',
    },
    {
      label: '⚠️ Risque principal',
      text: profile.theory_of_mind_data?.likely_skepticism
        ?? profile.theory_of_mind_data?.credibility_gaps
        ?? '—',
    },
    {
      label: '❓ Question d\'ouverture',
      text: profile.jtbd_data?.qualify_question ?? '—',
    },
  ] : null;

  const tabs = [
    { id: 'profil',   label: 'Profil Cognitif',       icon: Brain },
    { id: 'memoire',  label: 'Mémoire Relationnelle',  icon: TrendingUp },
    { id: 'echanges', label: 'Échanges',               icon: MessageSquare },
  ] as const;

  return (
    <div className="size-full overflow-auto" style={{ background: '#F0F2F7' }}>
      <div className="max-w-5xl mx-auto px-4 py-6 md:px-8">

        {/* ── Back ──────────────────────────────────────────────────────────── */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-5"
        >
          <ArrowLeft className="size-4" /> Retour
        </button>

        {/* ══ DARK HEADER CARD ══════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl overflow-hidden mb-4"
          style={{ background: '#13111E' }}
        >
          <div className="p-6 flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
            {/* Avatar */}
            {contact.avatar_url ? (
              <img src={contact.avatar_url} alt={contact.full_name}
                className="size-14 rounded-xl object-cover flex-shrink-0" />
            ) : (
              <div className="size-14 flex-shrink-0 rounded-xl flex items-center justify-center text-white text-xl font-bold"
                style={{ background: 'linear-gradient(135deg, #6E50C8, #9747FF)' }}>
                {initials(contact.full_name)}
              </div>
            )}

            {/* Name + role */}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold leading-tight" style={{ color: '#fff' }}>
                {contact.full_name}
              </h1>
              <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {[contact.role_title, companyName].filter(Boolean).join(' · ')}
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-2.5">
                {contact.email && (
                  <a href={`mailto:${contact.email}`}
                    className="flex items-center gap-1.5 text-xs transition-colors"
                    style={{ color: 'rgba(255,255,255,0.35)' }}>
                    <Mail className="size-3" /> {contact.email}
                  </a>
                )}
                {contact.linkedin_url && (
                  <a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs"
                    style={{ color: 'rgba(255,255,255,0.35)' }}>
                    <ExternalLink className="size-3" /> LinkedIn
                  </a>
                )}
                {lastContact && (
                  <span className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    <Clock className="size-3" /> {relDate(lastContact)}
                  </span>
                )}
              </div>
            </div>

            {/* Score + Phase */}
            <div className="flex items-center gap-5 flex-shrink-0">
              {score != null && (
                <>
                  <div className="text-center">
                    <p className="text-[9px] font-bold uppercase tracking-widest mb-1"
                      style={{ color: 'rgba(255,255,255,0.3)' }}>Score</p>
                    <p className="text-5xl font-black leading-none" style={{ color: scoreColor }}>{score}</p>
                    <p className="text-[10px] font-mono mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>/100</p>
                  </div>
                  <div className="w-px h-12" style={{ background: 'rgba(255,255,255,0.08)' }} />
                  <div className="text-center">
                    <p className="text-[9px] font-bold uppercase tracking-widest mb-1"
                      style={{ color: 'rgba(255,255,255,0.3)' }}>Phase · 30j</p>
                    <div className="flex items-center gap-1.5">
                      {phase === 'growth' ? <TrendingUp className="size-4" style={{ color: phaseColor }} />
                        : phase === 'decline' ? <TrendingDown className="size-4" style={{ color: phaseColor }} />
                        : <Minus className="size-4" style={{ color: phaseColor }} />}
                      <span className="text-sm font-semibold" style={{ color: phaseColor }}>{phaseLabel}</span>
                    </div>
                    {profile?.score_delta != null && profile.score_delta !== 0 && (
                      <p className="text-[10px] font-mono mt-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
                        {profile.score_delta > 0 ? '+' : ''}{profile.score_delta} pts
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Sources + actions bar */}
          <div className="px-6 pb-4 flex items-center gap-3 flex-wrap">
            {sources.map(s => (
              <span key={s} className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(46,168,106,0.15)', color: '#2EA86A', border: '1px solid rgba(46,168,106,0.3)' }}>
                {s} ✓
              </span>
            ))}
            {contact.web_bio && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(251,191,36,0.12)', color: '#F59E0B', border: '1px solid rgba(251,191,36,0.25)' }}>
                Perplexity ✓
              </span>
            )}
            {profile && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(110,80,200,0.2)', color: '#B39DDB', border: '1px solid rgba(110,80,200,0.3)' }}>
                Conf. {profile.global_confidence}%
              </span>
            )}
            <button
              onClick={() => orgId && triggerEnrichment(id!, orgId, true)}
              disabled={enriching}
              className="flex items-center gap-1.5 text-[11px] transition-colors disabled:opacity-40 ml-auto"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              <RefreshCw className={`size-3.5 ${enriching ? 'animate-spin' : ''}`} />
              {enriching ? 'Analyse…' : 'Ré-enrichir'}
            </button>
          </div>
        </motion.div>

        {/* ══ SUGGESTION DE FUSION (homonymes) ══════════════════════════════ */}
        {mergeCandidates.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border p-4 mb-4"
            style={{ background: 'rgba(110,80,200,0.06)', borderColor: 'rgba(110,80,200,0.25)' }}
          >
            <div className="flex items-start gap-3">
              <Users className="size-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground mb-1">
                  Même personne, autre adresse ?
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  {mergeCandidates.length === 1 ? 'Un contact porte' : `${mergeCandidates.length} contacts portent`} le même nom avec un email différent.
                  Fusionner regroupe tous les échanges et réunions sur une seule fiche.
                </p>
                <div className="space-y-2">
                  {mergeCandidates.map(c => (
                    <div key={c.id} className="flex items-center gap-3 bg-card rounded-xl border border-border px-3 py-2">
                      <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                        {initials(c.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{c.email || c.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {c.emailCount} email{c.emailCount > 1 ? 's' : ''} · {c.meetingCount} réunion{c.meetingCount > 1 ? 's' : ''}
                        </p>
                      </div>
                      <button
                        onClick={() => handleMerge(c.id)}
                        disabled={merging}
                        className="px-3 py-1.5 text-xs font-semibold text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
                        style={{ background: '#6E50C8' }}
                      >
                        {merging ? <Loader2 className="size-3 animate-spin" /> : null}
                        Fusionner
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ══ BRIEF EXPRESS ═════════════════════════════════════════════════ */}
        {briefExpress && !enriching && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-2xl overflow-hidden mb-4 relative"
            style={{ background: '#13111E' }}
          >
            {/* subtle gradient */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(135deg, transparent 60%, rgba(110,80,200,0.06))' }} />
            <div className="relative px-6 pt-5 pb-1">
              <div className="flex items-center gap-3 mb-5">
                <span className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: 'rgba(255,255,255,0.3)' }}>Brief express · 30 secondes</span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                {(profile?.interaction_modes_data ?? []).slice(0, 2).map(m => (
                  <span key={m} className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(110,80,200,0.25)', color: '#B39DDB', border: '1px solid rgba(110,80,200,0.4)' }}>
                    {m}
                  </span>
                ))}
                {profile?.cognitive_mode && profile.cognitive_mode !== 'unavailable' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(110,80,200,0.25)', color: '#B39DDB', border: '1px solid rgba(110,80,200,0.4)' }}>
                    {profile.cognitive_mode === 's1_dominant' ? 'S1' : profile.cognitive_mode === 's2_dominant' ? 'S2' : 'Contextuel'}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pb-5">
                {briefExpress.map((item, i) => (
                  <div key={i}>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-2"
                      style={{ color: 'rgba(255,255,255,0.3)' }}>{item.label}</p>
                    <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.82)', fontStyle: 'italic' }}>
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Enriching overlay ─────────────────────────────────────────────── */}
        <AnimatePresence>
          {enriching && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="bg-card rounded-2xl border border-primary/20 mb-4">
              <EnrichingState name={contact.full_name} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Deploy banner ─────────────────────────────────────────────────── */}
        {enrichError === 'deploy' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
            <p className="text-sm font-semibold text-amber-800 mb-1">⚠️ Edge Functions non déployées</p>
            <p className="text-xs text-amber-700 mb-3">Lance ces commandes :</p>
            <pre className="bg-amber-100 rounded-xl px-4 py-3 text-xs font-mono text-amber-900 overflow-x-auto">{`supabase functions deploy enrich-contact\nsupabase functions deploy ingest-communication`}</pre>
          </motion.div>
        )}

        {/* ── Tabs ──────────────────────────────────────────────────────────── */}
        <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all text-sm font-semibold ${
                activeTab === tab.id
                  ? 'text-white shadow-sm'
                  : 'bg-card border border-border hover:bg-muted/50 text-muted-foreground'
              }`}
              style={activeTab === tab.id ? { background: '#6E50C8' } : {}}
            >
              <tab.icon className="size-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB: PROFIL COGNITIF                                                */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'profil' && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

            {!profile && !enriching && (
              <div className="bg-card rounded-2xl border border-border p-8 text-center space-y-3">
                <Sparkles className="size-10 text-primary mx-auto opacity-40" />
                <p className="text-muted-foreground text-sm">Le profil cognitif n'a pas encore été généré.</p>
                <button
                  onClick={() => orgId && triggerEnrichment(id!, orgId)}
                  className="px-5 py-2.5 text-white rounded-xl text-sm font-semibold transition-colors"
                  style={{ background: '#6E50C8' }}
                >
                  Lancer l'analyse IA
                </button>
              </div>
            )}

            {profile && (
              <>
                {/* Modes + cognitif */}
                <div className="bg-card rounded-2xl border border-border p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="size-4 text-primary" />
                    <span className="text-sm font-semibold">Modes d'interaction</span>
                    {profile.cognitive_mode && profile.cognitive_mode !== 'unavailable' && (
                      <span className="ml-auto text-[11px] font-mono text-muted-foreground">
                        {profile.cognitive_mode === 's1_dominant' ? 'S1 · décide vite, intuitif'
                          : profile.cognitive_mode === 's2_dominant' ? 'S2 · analyse avant de décider'
                          : 'Contextuel'}
                        {profile.cognitive_mode_confidence != null && ` · ${Math.round((profile.cognitive_mode_confidence ?? 0) * 100)}%`}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(profile.interaction_modes_data ?? []).map((mode, i) => (
                      <span key={mode} className={`px-3 py-1.5 rounded-xl text-sm font-semibold border ${
                        MODE_COLORS[mode] ?? 'bg-muted text-muted-foreground border-border'
                      } ${i === 0 ? '' : 'opacity-70'}`}>
                        {mode}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Axes interactionnels */}
                {axes.length > 0 && (
                  <div className="bg-card rounded-2xl border border-border p-5">
                    <div className="flex items-center gap-2 mb-5">
                      <Target className="size-4 text-primary" />
                      <span className="text-sm font-semibold">Axes interactionnels</span>
                    </div>
                    <div className="space-y-5">
                      {axes.map(a => <AxisBar key={a.axis} {...a} />)}
                    </div>
                  </div>
                )}

                {/* JTBD */}
                {profile.jtbd_data && Object.keys(profile.jtbd_data).length > 0 && (
                  <div className="bg-card rounded-2xl border border-border p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Target className="size-4 text-primary" />
                      <span className="text-sm font-semibold">Jobs-to-be-Done</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <JTBDCard type="functional" data={profile.jtbd_data.functional_job} />
                      <JTBDCard type="social"     data={profile.jtbd_data.social_job} />
                      <JTBDCard type="emotional"  data={profile.jtbd_data.emotional_job} />
                    </div>
                    {profile.jtbd_data.qualify_question && (
                      <div className="mt-3 p-3 rounded-xl border" style={{ background: 'rgba(110,80,200,0.05)', borderColor: 'rgba(110,80,200,0.2)' }}>
                        <span className="text-xs text-muted-foreground font-semibold">Question de qualification · </span>
                        <span className="text-sm italic text-foreground">"{profile.jtbd_data.qualify_question}"</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Signaux comportementaux */}
                {(profile.behavioral_analysis_data ?? []).length > 0 && (
                  <div className="bg-card rounded-2xl border border-border overflow-hidden">
                    <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                      <Brain className="size-4 text-primary" />
                      <span className="text-sm font-semibold">Signaux comportementaux</span>
                    </div>
                    <div className="divide-y divide-border">
                      {(profile.behavioral_analysis_data ?? []).map((sig: any, i: number) => {
                        const lvl = LEVEL_CONFIG[sig.inference_level as keyof typeof LEVEL_CONFIG] ?? LEVEL_CONFIG.unavailable;
                        return (
                          <div key={i} className="flex gap-3 px-5 py-4">
                            <span className={`mt-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 self-start ${lvl.color}`}>
                              {lvl.label}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{sig.text}</p>
                              {sig.inference && <p className="text-xs text-muted-foreground mt-0.5 italic">{sig.inference}</p>}
                            </div>
                            {sig.confidence > 0 && (
                              <span className="text-[11px] font-mono text-muted-foreground flex-shrink-0">{sig.confidence}%</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Théorie de l'esprit */}
                {profile.theory_of_mind_data && Object.keys(profile.theory_of_mind_data).length > 0 && (
                  <div className="bg-card rounded-2xl border border-border p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Users className="size-4 text-primary" />
                      <span className="text-sm font-semibold">Théorie de l'esprit</span>
                      {profile.theory_of_mind_data.confidence != null && (
                        <span className="ml-auto text-[11px] font-mono text-muted-foreground">
                          Conf. {Math.round((profile.theory_of_mind_data.confidence ?? 0) * 100)}%
                        </span>
                      )}
                    </div>
                    <div className="space-y-4">
                      {[
                        { key: 'perceived_positioning', label: 'Comment il·elle nous perçoit', icon: '👁' },
                        { key: 'likely_skepticism',     label: 'Zone de scepticisme probable', icon: '⚠️' },
                        { key: 'credibility_gaps',      label: 'Lacunes de crédibilité',        icon: '🔍' },
                      ].map(({ key, label, icon }) => profile.theory_of_mind_data?.[key] && (
                        <div key={key} className="p-3 rounded-xl bg-muted/30 border border-border">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1.5">
                            {icon} {label}
                          </p>
                          <p className="text-sm text-foreground leading-relaxed">{profile.theory_of_mind_data[key]}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Web bio Perplexity */}
                {contact.web_bio && (
                  <div className="rounded-2xl border p-5" style={{ background: '#FFFBEB', borderColor: '#FDE68A' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <Globe className="size-4" style={{ color: '#D97706' }} />
                      <span className="text-sm font-semibold" style={{ color: '#92400E' }}>Données web enrichies — Perplexity</span>
                    </div>
                    <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">{contact.web_bio}</p>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB: MÉMOIRE RELATIONNELLE                                          */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'memoire' && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

            {/* ── Score + 3 dimensions + chart ─────────────────────────────── */}
            {profile && score != null && (
              <div className="bg-card rounded-2xl border border-border overflow-hidden">
                {/* Header dark */}
                <div className="p-5 flex items-center gap-6 flex-wrap" style={{ background: '#13111E' }}>
                  <div className="size-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #6E50C8, #9747FF)' }}>
                    <TrendingUp className="size-4 text-white" />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest flex-1"
                    style={{ color: 'rgba(255,255,255,0.35)' }}>Mémoire Relationnelle</p>
                  <div className="flex items-center gap-5">
                    <div className="text-right">
                      <p className="text-[9px] font-bold uppercase tracking-widest mb-1"
                        style={{ color: 'rgba(255,255,255,0.3)' }}>Score engagement</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black leading-none" style={{ color: scoreColor }}>{score}</span>
                        <span className="text-sm font-bold px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>
                          {phaseLabel}
                        </span>
                        {profile.score_delta != null && profile.score_delta !== 0 && (
                          <span className="text-[11px] font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
                            {profile.score_delta > 0 ? '+' : ''}{profile.score_delta} · 30j
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3 dimensions left + chart right */}
                <div className="grid grid-cols-1 md:grid-cols-[280px_1fr]">
                  {/* Left — 3 dims */}
                  <div className="p-5 border-b md:border-b-0 md:border-r border-border space-y-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      3 Dimensions · Granovetter
                    </p>
                    {[
                      { key: 'score_intensite',  label: 'Intensité',   weight: '40%', color: '#6E50C8',
                        note: 'Fréquence et richesse des échanges' },
                      { key: 'score_reciprocite', label: 'Réciprocité', weight: '35%', color: '#F59E0B',
                        note: "Équilibre d'initiation et taux de réponse" },
                      { key: 'score_longevite',   label: 'Longévité',  weight: '25%', color: '#2EA86A',
                        note: 'Ancienneté, régularité et continuité' },
                    ].map(({ key, label, weight, color, note }) => {
                      const val = profile[key as keyof CognitiveProfile] as number ?? 0;
                      return (
                        <div key={key}>
                          <div className="flex items-baseline justify-between mb-1">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
                              <span className="text-[9px] text-muted-foreground ml-1.5 font-mono">{weight}</span>
                            </div>
                            <span className="text-sm font-mono font-bold" style={{ color }}>{val}/100</span>
                          </div>
                          <div className="h-1.5 rounded-full overflow-hidden mb-1" style={{ background: '#E8EBF0' }}>
                            <motion.div
                              initial={{ width: 0 }} animate={{ width: `${val}%` }}
                              transition={{ duration: 0.9, ease: 'easeOut' }}
                              className="h-full rounded-full"
                              style={{ background: color }}
                            />
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">{note}</p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Right — chart */}
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Évolution du score
                      </p>
                      {messages.length > 0 && (
                        <span className="text-[11px] text-muted-foreground font-mono">{messages.length} échanges</span>
                      )}
                    </div>
                    {scoreHistory.length > 1 ? (
                      <ResponsiveContainer width="100%" height={160}>
                        <AreaChart data={scoreHistory} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                          <defs>
                            <linearGradient id="scoreGrad2" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#6E50C8" stopOpacity={0.2} />
                              <stop offset="100%" stopColor="#6E50C8" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9082B8' }} axisLine={false} tickLine={false} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#9082B8' }} axisLine={false} tickLine={false} />
                          <Tooltip content={<ChartTooltip />} />
                          <Area type="monotone" dataKey="score" stroke="#6E50C8" strokeWidth={2.5}
                            fill="url(#scoreGrad2)" dot={{ fill: '#6E50C8', r: 3 }} activeDot={{ r: 5 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-40 flex flex-col items-center justify-center text-muted-foreground gap-2">
                        <TrendingUp className="size-8 opacity-20" />
                        <p className="text-xs">Le graphe s'enrichira après plusieurs enrichissements</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {!profile && !enriching && (
              <div className="bg-card rounded-2xl border border-border p-8 text-center">
                <p className="text-muted-foreground text-sm mb-3">Aucune donnée de mémoire relationnelle disponible.</p>
                <button
                  onClick={() => orgId && triggerEnrichment(id!, orgId)}
                  className="px-5 py-2.5 text-white rounded-xl text-sm font-semibold"
                  style={{ background: '#6E50C8' }}
                >
                  Générer le profil
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB: ÉCHANGES                                                        */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'echanges' && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

            {/* Synthèse IA des échanges */}
            {emailAnalysis ? (
              <div className="bg-card rounded-2xl border border-border overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-4 text-primary" />
                    <span className="text-sm font-semibold">Synthèse IA des échanges</span>
                    {emailAnalysis.emails_analyzed && (
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {emailAnalysis.emails_analyzed} emails analysés
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleAnalyzeEmails}
                    disabled={analyzing || messages.length === 0}
                    className="text-xs text-primary hover:text-accent transition-colors disabled:opacity-40 flex items-center gap-1"
                  >
                    {analyzing ? <><span className="size-3 border border-primary border-t-transparent rounded-full animate-spin inline-block" /> Analyse…</> : '↻ Relancer'}
                  </button>
                </div>
                <div className="p-5 space-y-4">
                  {/* Résumé */}
                  {emailAnalysis.relationship_summary && (
                    <p className="text-sm leading-relaxed italic text-foreground/90 bg-primary/5 rounded-xl px-4 py-3">
                      "{emailAnalysis.relationship_summary}"
                    </p>
                  )}
                  {/* Indicateurs clés */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'Ton', value: emailAnalysis.relationship_tone },
                      { label: 'Engagement', value: emailAnalysis.engagement_level },
                      { label: 'Style', value: emailAnalysis.communication_style },
                      { label: 'Formalité', value: emailAnalysis.formality },
                    ].filter(i => i.value).map(({ label, value }) => (
                      <div key={label} className="bg-muted/30 rounded-xl px-3 py-2.5">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
                        <p className="text-sm font-medium capitalize">{value}</p>
                      </div>
                    ))}
                  </div>
                  {/* Thèmes + Signaux */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(emailAnalysis.key_topics ?? []).length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-2">THÈMES</p>
                        <div className="flex flex-wrap gap-1.5">
                          {emailAnalysis.key_topics.map((t: string, i: number) => (
                            <span key={i} className="px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">{t}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {(emailAnalysis.behavioral_signals ?? []).length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-2">SIGNAUX COMPORTEMENTAUX</p>
                        <div className="flex flex-wrap gap-1.5">
                          {emailAnalysis.behavioral_signals.map((s: string, i: number) => (
                            <span key={i} className="px-2.5 py-1 bg-muted/50 rounded-full text-xs">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Red flags + Opportunités */}
                  {(emailAnalysis.red_flags ?? []).length > 0 && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800">
                      <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1.5">⚠ Signaux d'alerte</p>
                      {emailAnalysis.red_flags.map((f: string, i: number) => (
                        <p key={i} className="text-xs text-amber-800 dark:text-amber-300">• {f}</p>
                      ))}
                    </div>
                  )}
                  {(emailAnalysis.opportunities ?? []).length > 0 && (
                    <div className="p-3 bg-success/5 rounded-xl border border-success/20">
                      <p className="text-xs font-semibold text-success mb-1.5">✦ Opportunités</p>
                      {emailAnalysis.opportunities.map((o: string, i: number) => (
                        <p key={i} className="text-xs text-success/80">• {o}</p>
                      ))}
                    </div>
                  )}
                  {emailAnalysis.analyzed_at && (
                    <p className="text-[10px] text-muted-foreground text-right">
                      Analysé {relDate(emailAnalysis.analyzed_at)} · {emailAnalysis.model ?? 'Gemini'}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-card rounded-2xl border border-border p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Sparkles className="size-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Synthèse IA des échanges</p>
                      <p className="text-xs text-muted-foreground">
                        {messages.length > 0
                          ? `${messages.length} email${messages.length > 1 ? 's' : ''} prêt${messages.length > 1 ? 's' : ''} à analyser`
                          : 'Synchronisez Gmail pour activer l\'analyse'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleAnalyzeEmails}
                    disabled={analyzing || messages.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-accent transition-colors disabled:opacity-40"
                  >
                    {analyzing
                      ? <><span className="size-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Analyse…</>
                      : <><Sparkles className="size-3.5" /> Analyser</>}
                  </button>
                </div>
                {analyzeError && (
                  <p className="mt-3 text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{analyzeError}</p>
                )}
              </div>
            )}

            {/* Stats 4 cartes */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Emails', value: messages.length, icon: Mail, color: '#6E50C8', bg: 'rgba(110,80,200,0.08)' },
                { label: 'Réunions', value: meetings.length, icon: Calendar, color: '#0B8878', bg: 'rgba(11,136,120,0.08)' },
                { label: 'Notes', value: notes.length, icon: MessageSquare, color: '#C47B00', bg: 'rgba(196,123,0,0.08)' },
                { label: 'Dernier contact', value: lastContact ? relDate(lastContact) : '—', icon: Clock, color: '#1D4ED8', bg: 'rgba(29,78,216,0.08)' },
              ].map(({ label, value, icon: Icon, color, bg }) => (
                <div key={label} className="bg-card rounded-2xl border border-border p-4">
                  <div className="size-8 rounded-lg flex items-center justify-center mb-2" style={{ background: bg }}>
                    <Icon className="size-4" style={{ color }} />
                  </div>
                  <p className="text-xl font-black leading-none mb-0.5" style={{ color }}>{value}</p>
                  <p className="text-[11px] text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>

            {/* Notes */}
            {notes.length > 0 && (
              <div className="bg-card rounded-2xl border border-border overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                  <MessageSquare className="size-4" style={{ color: '#0B8878' }} />
                  <span className="text-sm font-semibold">Notes ({notes.length})</span>
                </div>
                <div className="divide-y divide-border">
                  {notes.map(note => (
                    <div key={note.id} className="px-5 py-4">
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{note.body}</p>
                      <p className="text-xs text-muted-foreground mt-2">{relDate(note.created_at)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline emails + réunions */}
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-primary" />
                  <span className="text-sm font-semibold">Historique des échanges</span>
                </div>
                {messages.length === 0 && (
                  <button onClick={() => navigate('/account')} className="text-xs text-primary underline">
                    Synchroniser Gmail →
                  </button>
                )}
              </div>
              <div className="divide-y divide-border">
                {[
                  ...messages.slice(0, 50).map(m => ({ type: 'email' as const, date: m.sent_at, title: m.subject || 'Email', direction: m.direction, id: m.id })),
                  ...meetings.map(m => ({ type: 'meeting' as const, date: m.starts_at, title: m.title || 'Réunion', id: m.id })),
                ]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, 50)
                  .map(item => (
                    <div key={item.id} className="flex items-center gap-4 px-5 py-3 hover:bg-muted/30 transition-colors">
                      <div className="size-8 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{
                          background: item.type === 'email' ? 'rgba(110,80,200,0.08)' : 'rgba(11,136,120,0.08)',
                          color: item.type === 'email' ? '#6E50C8' : '#0B8878',
                        }}>
                        {item.type === 'email' ? <Mail className="size-3.5" /> : <Calendar className="size-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.title}</p>
                        {item.type === 'email' && 'direction' in item && (
                          <p className="text-xs text-muted-foreground">
                            {item.direction === 'outbound' ? '↑ Envoyé' : '↓ Reçu'}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground flex-shrink-0">{relDate(item.date)}</span>
                    </div>
                  ))}
              </div>
              {messages.length === 0 && meetings.length === 0 && (
                <div className="p-8 text-center space-y-3">
                  <Mail className="size-8 text-muted-foreground/30 mx-auto" />
                  <p className="text-sm text-muted-foreground">Aucun échange enregistré.</p>
                  <p className="text-xs text-muted-foreground">
                    <button onClick={() => navigate('/account')} className="text-primary font-medium underline">
                      Paramètres → Connexions → Sync 1 000 emails
                    </button>
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}
