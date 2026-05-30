import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ArrowLeft, Mail, Calendar, ExternalLink, RefreshCw,
  TrendingUp, Minus, TrendingDown, Sparkles, Clock,
  Brain, Target, Zap, Users, AlertTriangle, CheckCircle,
  MessageSquare, Building2, Globe,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../../lib/supabase';
import { getActiveOrganizationId } from '../../lib/api/org';

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

    // ── 2. Colonnes enrichissement (optionnelles — migration 202605290004) ───
    let enrichmentData: any = {};
    try {
      const { data: ed } = await supabase.from('contacts')
        .select('enrichment_status, last_enriched_at, web_bio')
        .eq('id', id).maybeSingle();
      if (ed) enrichmentData = ed;
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
    } catch (e) {
      console.error('ContactDetail load error:', e);
      setLoading(false);
    }
  }, [id, orgId]);

  useEffect(() => { loadData(); }, [loadData]);

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

  const tabs = [
    { id: 'profil',   label: 'Profil Cognitif',        icon: Brain },
    { id: 'memoire',  label: 'Mémoire Relationnelle',   icon: TrendingUp },
    { id: 'echanges', label: 'Échanges',                icon: MessageSquare },
  ] as const;

  return (
    <div className="size-full bg-background overflow-auto">
      <div className="max-w-4xl mx-auto px-4 py-6 md:px-8">

        {/* ── Back ──────────────────────────────────────────────────────────── */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft className="size-4" /> Retour aux contacts
        </button>

        {/* ── Hero card ─────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border overflow-hidden mb-6"
        >
          {/* Gradient top bar */}
          <div className="h-1.5 bg-gradient-to-r from-primary via-accent to-primary/40" />

          <div className="p-6 flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-8">
            {/* Avatar */}
            {contact.avatar_url ? (
              <img src={contact.avatar_url} alt={contact.full_name} className="size-20 rounded-2xl object-cover flex-shrink-0 shadow-md" />
            ) : (
              <div className="size-20 flex-shrink-0 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-2xl font-bold shadow-md">
                {initials(contact.full_name)}
              </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h1 className="text-2xl font-bold leading-tight">{contact.full_name}</h1>
                  <p className="text-muted-foreground">
                    {contact.role_title && <span>{contact.role_title}</span>}
                    {contact.role_title && companyName && <span className="mx-1.5 text-border">·</span>}
                    {companyName && (
                      <span className="flex items-center gap-1 inline-flex">
                        <Building2 className="size-3.5 inline" /> {companyName}
                      </span>
                    )}
                  </p>
                </div>
                {score != null && (
                  <ScoreRing score={score} phase={phase ?? 'stagnant'} delta={profile?.score_delta} />
                )}
              </div>

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-muted-foreground">
                {contact.email && (
                  <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 hover:text-primary transition-colors">
                    <Mail className="size-3.5" /> {contact.email}
                  </a>
                )}
                {lastContact && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="size-3.5" /> {relDate(lastContact)}
                  </span>
                )}
                {contact.linkedin_url && (
                  <a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 hover:text-primary transition-colors">
                    <ExternalLink className="size-3.5" /> LinkedIn
                  </a>
                )}
              </div>

              {/* Source pills + enrichment actions */}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {sources.map(s => (
                  <span key={s} className="px-2 py-0.5 text-xs font-semibold bg-success/10 text-success border border-success/20 rounded-full">{s}</span>
                ))}
                {contact.web_bio && (
                  <span className="px-2 py-0.5 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded-full">Perplexity ✓</span>
                )}
                {profile && (
                  <span className="px-2 py-0.5 text-xs font-semibold bg-primary/10 text-primary border border-primary/20 rounded-full">
                    Conf. {profile.global_confidence}%
                  </span>
                )}
                {contact.last_enriched_at && (
                  <span className="text-[11px] text-muted-foreground ml-auto">
                    Enrichi {relDate(contact.last_enriched_at)}
                  </span>
                )}
                <button
                  onClick={() => orgId && triggerEnrichment(id!, orgId, true)}
                  disabled={enriching}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors ml-1 disabled:opacity-40"
                >
                  <RefreshCw className={`size-3.5 ${enriching ? 'animate-spin' : ''}`} />
                  {enriching ? 'Analyse…' : 'Rafraîchir'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Deploy banner ─────────────────────────────────────────────────── */}
        {enrichError === 'deploy' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
            <p className="text-sm font-semibold text-amber-800 mb-1">⚠️ Edge Functions non déployées</p>
            <p className="text-xs text-amber-700 mb-3">
              Les fonctions d'enrichissement IA ne sont pas encore déployées sur Supabase. Lance ces commandes dans ton terminal :
            </p>
            <pre className="bg-amber-100 rounded-xl px-4 py-3 text-xs font-mono text-amber-900 overflow-x-auto whitespace-pre">{`supabase login\nsupabase link --project-ref bgmtzwfafcgjklgygvtx\nsupabase db push\nsupabase functions deploy enrich-contact\nsupabase functions deploy ingest-communication`}</pre>
          </motion.div>
        )}

        {/* ── Enriching overlay ─────────────────────────────────────────────── */}
        <AnimatePresence>
          {enriching && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-card rounded-2xl border border-primary/20 mb-6"
            >
              <EnrichingState name={contact.full_name} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Tabs ──────────────────────────────────────────────────────────── */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all text-sm font-medium ${
                activeTab === tab.id ? 'bg-primary text-white shadow-sm' : 'bg-card border border-border hover:bg-muted/50'
              }`}
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
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

            {!profile && !enriching && (
              <div className="bg-card rounded-2xl border border-border p-8 text-center space-y-3">
                <Sparkles className="size-10 text-primary mx-auto opacity-40" />
                <p className="text-muted-foreground text-sm">
                  Le profil cognitif n'a pas encore été généré.
                </p>
                <button
                  onClick={() => orgId && triggerEnrichment(id!, orgId)}
                  className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-hover transition-colors"
                >
                  Lancer l'analyse IA
                </button>
              </div>
            )}

            {profile && (
              <>
                {/* Executive summary */}
                {profile.executive_summary && (
                  <div className="bg-primary/5 rounded-2xl border border-primary/15 p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="size-4 text-primary" />
                      <span className="text-sm font-semibold text-primary">Synthèse IA</span>
                      <span className="ml-auto text-[11px] text-muted-foreground">Conf. {profile.global_confidence}%</span>
                    </div>
                    <p className="text-sm leading-relaxed text-foreground">{profile.executive_summary}</p>
                  </div>
                )}

                {/* Web bio from Perplexity */}
                {contact.web_bio && (
                  <div className="bg-amber-50 rounded-2xl border border-amber-100 p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Globe className="size-4 text-amber-600" />
                      <span className="text-sm font-semibold text-amber-700">Recherche web — Perplexity</span>
                    </div>
                    <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">{contact.web_bio}</p>
                  </div>
                )}

                {/* Interaction modes + cognitive mode */}
                <div className="bg-card rounded-2xl border border-border p-5">
                  <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                    <Zap className="size-4 text-primary" /> Modes d'interaction
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {(profile.interaction_modes_data ?? []).map((mode, i) => (
                      <span key={mode} className={`px-3 py-1.5 rounded-xl text-sm font-semibold border ${MODE_COLORS[mode] ?? 'bg-muted text-muted-foreground border-border'} ${i === 0 ? 'text-sm' : 'text-xs'}`}>
                        {mode}
                      </span>
                    ))}
                  </div>
                  {profile.cognitive_mode && profile.cognitive_mode !== 'unavailable' && (
                    <div className="flex items-center gap-3 pt-3 border-t border-border">
                      <Brain className="size-4 text-muted-foreground" />
                      <div>
                        <span className="text-xs text-muted-foreground">Mode cognitif détecté · </span>
                        <span className="text-xs font-semibold capitalize">
                          {profile.cognitive_mode === 's1_dominant' ? 'S1 dominant — décision rapide, intuitive'
                            : profile.cognitive_mode === 's2_dominant' ? 'S2 dominant — décision lente, analytique'
                            : 'Contextuel'}
                        </span>
                      </div>
                      {profile.cognitive_mode_confidence != null && (
                        <span className="ml-auto text-[11px] font-mono text-muted-foreground">
                          {Math.round((profile.cognitive_mode_confidence ?? 0) * 100)}%
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Interaction axes */}
                {axes.length > 0 && (
                  <div className="bg-card rounded-2xl border border-border p-5">
                    <h3 className="text-sm font-semibold mb-5 flex items-center gap-2">
                      <Target className="size-4 text-primary" /> Axes interactionnels
                    </h3>
                    <div className="space-y-5">
                      {axes.map(a => <AxisBar key={a.axis} {...a} />)}
                    </div>
                  </div>
                )}

                {/* JTBD */}
                {profile.jtbd_data && Object.keys(profile.jtbd_data).length > 0 && (
                  <div className="bg-card rounded-2xl border border-border p-5">
                    <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                      <Target className="size-4 text-primary" /> Jobs-to-be-Done
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <JTBDCard type="functional" data={profile.jtbd_data.functional_job} />
                      <JTBDCard type="social"     data={profile.jtbd_data.social_job} />
                      <JTBDCard type="emotional"  data={profile.jtbd_data.emotional_job} />
                    </div>
                    {profile.jtbd_data.qualify_question && (
                      <div className="mt-3 p-3 bg-accent/30 rounded-xl border border-border">
                        <span className="text-xs text-muted-foreground font-semibold">Question de qualification · </span>
                        <span className="text-sm italic">"{profile.jtbd_data.qualify_question}"</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Behavioral signals */}
                {(profile.behavioral_analysis_data ?? []).length > 0 && (
                  <div className="bg-card rounded-2xl border border-border p-5">
                    <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                      <Brain className="size-4 text-primary" /> Signaux comportementaux
                    </h3>
                    <div className="space-y-3">
                      {(profile.behavioral_analysis_data ?? []).map((sig: any, i: number) => {
                        const lvl = LEVEL_CONFIG[sig.inference_level as keyof typeof LEVEL_CONFIG] ?? LEVEL_CONFIG.unavailable;
                        return (
                          <div key={i} className="flex gap-3 p-3 bg-muted/30 rounded-xl">
                            <div className="mt-0.5 flex-shrink-0">
                              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${lvl.color}`}>{lvl.label}</span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground">{sig.text}</p>
                              {sig.inference && <p className="text-xs text-muted-foreground mt-0.5 italic">{sig.inference}</p>}
                            </div>
                            {sig.confidence > 0 && (
                              <span className="ml-auto text-[11px] font-mono text-muted-foreground flex-shrink-0">{sig.confidence}%</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Theory of mind */}
                {profile.theory_of_mind_data && Object.keys(profile.theory_of_mind_data).length > 0 && (
                  <div className="bg-card rounded-2xl border border-border p-5">
                    <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                      <Users className="size-4 text-primary" /> Théorie de l'esprit
                    </h3>
                    <div className="space-y-3">
                      {[
                        { key: 'perceived_positioning', label: 'Comment il·elle nous perçoit' },
                        { key: 'likely_skepticism',     label: 'Zone de scepticisme probable' },
                        { key: 'credibility_gaps',      label: 'Lacunes de crédibilité' },
                      ].map(({ key, label }) => profile.theory_of_mind_data?.[key] && (
                        <div key={key}>
                          <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-1">{label}</p>
                          <p className="text-sm text-foreground">{profile.theory_of_mind_data[key]}</p>
                        </div>
                      ))}
                    </div>
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
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

            {/* Score header */}
            {profile && score != null && (
              <div className="bg-card rounded-2xl border border-border overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-primary to-accent" />
                <div className="p-5 flex items-center gap-8 flex-wrap">
                  <div className="text-center">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Score engagement</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-black" style={{ color: score >= 70 ? '#2EA86A' : score >= 45 ? '#6E50C8' : '#D94F63' }}>{score}</span>
                      <span className="text-muted-foreground text-lg">/100</span>
                    </div>
                  </div>
                  <div className="w-px h-12 bg-border" />
                  <div className="flex flex-col gap-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Phase · 30j</p>
                    <div className={`flex items-center gap-1.5 font-semibold ${phase === 'growth' ? 'text-success' : phase === 'decline' ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {phase === 'growth' ? <TrendingUp className="size-5" /> : phase === 'decline' ? <TrendingDown className="size-5" /> : <Minus className="size-5" />}
                      <span className="text-lg capitalize">{phase === 'growth' ? 'Développement' : phase === 'decline' ? 'Déclin' : 'Stable'}</span>
                      {profile.score_delta != null && profile.score_delta !== 0 && (
                        <span className="text-sm">({profile.score_delta > 0 ? '+' : ''}{profile.score_delta} pts)</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Score evolution chart */}
            {scoreHistory.length > 1 && (
              <div className="bg-card rounded-2xl border border-border p-5">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="size-4 text-primary" /> Évolution du score
                </h3>
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={scoreHistory} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6E50C8" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#6E50C8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9082B8' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#9082B8' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="score" stroke="#6E50C8" strokeWidth={2.5}
                      fill="url(#scoreGrad)" dot={{ fill: '#6E50C8', r: 3 }} activeDot={{ r: 5 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* 3 dimensions */}
            {profile && (
              <div className="bg-card rounded-2xl border border-border p-5">
                <h3 className="text-sm font-semibold mb-5 flex items-center gap-2">
                  <Sparkles className="size-4 text-primary" /> 3 Dimensions (doc 08 — Granovetter)
                </h3>
                <div className="space-y-5">
                  {[
                    { key: 'score_intensite',   label: 'Intensité',   weight: '40%', color: '#1D4ED8', sub: 'Fréquence et richesse des échanges' },
                    { key: 'score_reciprocite',  label: 'Réciprocité',  weight: '35%', color: '#6E50C8', sub: "Équilibre d'initiation et taux de réponse" },
                    { key: 'score_longevite',    label: 'Longévité',   weight: '25%', color: '#2EA86A', sub: 'Ancienneté, régularité et continuité' },
                  ].map(({ key, label, weight, color, sub }) => {
                    const val = profile[key as keyof CognitiveProfile] as number ?? 0;
                    return (
                      <div key={key} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-sm font-semibold">{label}</span>
                            <span className="text-xs text-muted-foreground ml-2">· Poids {weight}</span>
                          </div>
                          <span className="text-sm font-mono font-bold" style={{ color }}>{val}/100</span>
                        </div>
                        <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }} animate={{ width: `${val}%` }}
                            transition={{ duration: 0.9, ease: 'easeOut' }}
                            className="h-full rounded-full"
                            style={{ background: `linear-gradient(90deg, ${color}80, ${color})` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">{sub}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {!profile && !enriching && (
              <div className="bg-card rounded-2xl border border-border p-8 text-center">
                <p className="text-muted-foreground text-sm">Aucune donnée de mémoire relationnelle disponible.</p>
              </div>
            )}
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB: ÉCHANGES                                                        */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'echanges' && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

            {/* Stats */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Emails', value: messages.length, icon: Mail, color: 'text-blue-600' },
                { label: 'Réunions', value: meetings.length, icon: Calendar, color: 'text-violet-600' },
                { label: 'Notes', value: notes.length, icon: MessageSquare, color: 'text-teal-600' },
                { label: 'Dernier contact', value: lastContact ? relDate(lastContact) : '—', icon: Clock, color: 'text-primary' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="bg-card rounded-2xl border border-border p-4 text-center">
                  <Icon className={`size-4 ${color} mx-auto mb-2`} />
                  <p className="text-xl font-bold">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>

            {/* Notes */}
            {notes.length > 0 && (
              <div className="bg-card rounded-2xl border border-border overflow-hidden">
                <div className="px-5 py-4 border-b border-border">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <MessageSquare className="size-4 text-teal-600" /> Notes ({notes.length})
                  </h3>
                </div>
                <div className="divide-y divide-border">
                  {notes.map(note => (
                    <div key={note.id} className="px-5 py-4">
                      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{note.body}</p>
                      <p className="text-xs text-muted-foreground mt-2">{relDate(note.created_at)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline — emails + réunions */}
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="size-4 text-primary" /> Historique des échanges
                </h3>
                {messages.length === 0 && (
                  <span className="text-xs text-muted-foreground">
                    Synchronisez Gmail dans{' '}
                    <button onClick={() => navigate('/account')} className="text-primary underline">Paramètres → Connexions</button>
                  </span>
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
                      <div className={`size-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        item.type === 'email' ? 'bg-blue-50 text-blue-600' : 'bg-violet-50 text-violet-600'
                      }`}>
                        {item.type === 'email' ? <Mail className="size-3.5" /> : <Calendar className="size-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.title}</p>
                        {item.type === 'email' && 'direction' in item && (
                          <p className="text-xs text-muted-foreground">{item.direction === 'outbound' ? '↑ Envoyé' : '↓ Reçu'}</p>
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
                    Pour synchroniser vos emails :{' '}
                    <button onClick={() => navigate('/account')} className="text-primary font-medium underline">
                      Paramètres → Connexions → bouton "1 000 emails"
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
