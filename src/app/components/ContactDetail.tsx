import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ArrowLeft, Mail, Calendar, ExternalLink, RefreshCw,
  TrendingUp, Minus, TrendingDown, Sparkles, Clock,
  Brain, Target, Users, AlertTriangle, CheckCircle,
  MessageSquare, Globe, Loader2, ChevronRight,
  Plus, FileText, Mic,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../../lib/supabase';
import { getActiveOrganizationId } from '../../lib/api/org';
import { findMergeCandidates, mergeContacts, type MergeCandidate } from '../../lib/api/contacts';
import { trackEvent } from '../../lib/trackEvent';
import CollapsibleSection from './knowr/CollapsibleSection';
import SourcesPanel from './knowr/SourcesPanel';
import ACard from './knowr/ACard';
import SignalRail, { type Signal } from './knowr/SignalRail';
import VerdictCard from './knowr/VerdictCard';
import ConfidenceRing from './knowr/ConfidenceRing';
import ViewSwitcher from './knowr/ViewSwitcher';
import Coachmark from './knowr/Coachmark';
import { computeVerdict } from '../../lib/scoring';

// ── Suggestions de fusion ignorées (persistées localement, paire non ordonnée) ──
const MERGE_DISMISSED_KEY = 'knowr.merge.dismissed';
function mergePairKey(a: string, b: string) { return [a, b].sort().join(':'); }
function getDismissedMerges(): string[] {
  try { return JSON.parse(localStorage.getItem(MERGE_DISMISSED_KEY) ?? '[]'); } catch { return []; }
}
function isMergeDismissed(a: string, b: string): boolean {
  return getDismissedMerges().includes(mergePairKey(a, b));
}
function dismissMergePair(a: string, b: string) {
  const next = Array.from(new Set([...getDismissedMerges(), mergePairKey(a, b)]));
  try { localStorage.setItem(MERGE_DISMISSED_KEY, JSON.stringify(next)); } catch { /* ignore */ }
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface ContactRow {
  id: string; full_name: string; email?: string; role_title?: string;
  company_name?: string; avatar_url?: string; linkedin_url?: string;
  enrichment_status: 'pending' | 'running' | 'done' | 'failed';
  last_enriched_at?: string; web_bio?: string;
  companies?: { id?: string; name: string; domain?: string };
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

function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }

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

// ── Sub-components ─────────────────────────────────────────────────────────────

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
        <div className="absolute inset-y-0 left-0 w-0.5 bg-border/60" style={{ left: '50%' }} />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ background: 'linear-gradient(90deg, #D4C5F5, #6E50C8)' }}
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

function EnrichingState({ name }: { name: string }) {
  const steps = ['Analyse des échanges…', 'Calcul du scoring relationnel…', 'Génération du profil cognitif…', 'Sauvegarde en mémoire…'];
  const [step, setStep] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setStep(s => (s + 1) % steps.length), 2000);
    return () => clearInterval(i);
  }, []);
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-6">
      <div className="size-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
        <Sparkles className="size-8 text-white animate-pulse" />
      </div>
      <div className="text-center space-y-2">
        <h3 className="text-xl font-bold">Tohu analyse {name}</h3>
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
  const [loading, setLoading] = useState(true);
  const [showAllMeetings, setShowAllMeetings] = useState(false);

  // ── Behavioral tracking ─────────────────────────────────────────────────────
  const openedAt = useRef<number>(Date.now());

  useEffect(() => {
    if (!id || loading) return;
    trackEvent({ event_type: 'profile_open', entity_id: id, entity_type: 'contact' });
    openedAt.current = Date.now();
    return () => {
      trackEvent({
        event_type: 'profile_close',
        entity_id: id,
        entity_type: 'contact',
        duration_ms: Date.now() - openedAt.current,
      });
    };
  }, [id, loading]);

  const [enriching, setEnriching] = useState(false);
  const [enrichError, setEnrichError] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [mergeCandidates, setMergeCandidates] = useState<MergeCandidate[]>([]);
  const [merging, setMerging] = useState(false);
  const [emailAnalysis, setEmailAnalysis] = useState<any | null>(null);
  const [enrichDetail, setEnrichDetail] = useState<any | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<Array<{ id: string; name: string }>>([]);
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferTo, setTransferTo] = useState('');
  const [genBrief, setGenBrief] = useState(false);
  const [genErr, setGenErr] = useState<string | null>(null);
  const [keepCopy, setKeepCopy] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [transferMsg, setTransferMsg] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [syncingContactEmails, setSyncingContactEmails] = useState(false);
  const [syncEmailsMsg, setSyncEmailsMsg] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [noteFile, setNoteFile] = useState<File | null>(null);

  // ── Load all data ────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!supabase || !id) { setLoading(false); return; }
    try {
      const oid = orgId ?? await getActiveOrganizationId();
      if (!oid) { setLoading(false); return; }
      if (!orgId) setOrgId(oid);

      const { data: c, error: contactError } = await supabase.from('contacts')
        .select('id, full_name, email, role_title, avatar_url, linkedin_url, companies(id, name, domain)')
        .eq('id', id).eq('organization_id', oid).maybeSingle();

      if (contactError || !c) { setLoading(false); return; }

      let enrichmentData: any = {};
      try {
        const { data: ed } = await supabase.from('contacts')
          .select('enrichment_status, last_enriched_at, web_bio, email_analysis, enrichment_data')
          .eq('id', id).maybeSingle();
        if (ed) {
          enrichmentData = ed;
          if ((ed as any).email_analysis) setEmailAnalysis((ed as any).email_analysis);
          if ((ed as any).enrichment_data) setEnrichDetail((ed as any).enrichment_data);
        }
      } catch { /* migration pas encore appliquée */ }

      const fullContact: ContactRow = {
        ...(c as any),
        enrichment_status: enrichmentData.enrichment_status ?? 'pending',
        last_enriched_at:  enrichmentData.last_enriched_at  ?? null,
        web_bio:           enrichmentData.web_bio           ?? null,
      };

      const { data: prof } = await supabase.from('cognitive_profiles')
        .select('id, global_confidence, executive_summary, cognitive_mode, cognitive_mode_confidence, interaction_modes_data, jtbd_data, theory_of_mind_data, behavioral_analysis_data, engagement_score, score_phase, score_intensite, score_reciprocite, score_longevite, score_delta')
        .eq('contact_id', id).eq('organization_id', oid)
        .order('profile_version', { ascending: false }).limit(1).maybeSingle();

      let ax: any[] = [];
      if (prof?.id) {
        const { data: axData } = await supabase.from('interaction_axis_scores')
          .select('axis, value, confidence, inference_level')
          .eq('profile_id', prof.id);
        ax = axData ?? [];
      }

      const [{ data: msgs }, { data: meetParts }, { data: notesData }, { data: hist }] =
        await Promise.all([
          supabase.from('communication_messages')
            .select('id, direction, sent_at, subject, provider')
            .eq('contact_id', id).eq('organization_id', oid)
            .order('sent_at', { ascending: false }).limit(100),
          supabase.from('meeting_participants')
            .select('meetings(id, title, starts_at, actual_duration_minutes)')
            .eq('contact_id', id).eq('organization_id', oid),
          supabase.from('notes')
            .select('id, body, created_at, meeting_id')
            .eq('contact_id', id).eq('organization_id', oid)
            .order('created_at', { ascending: false }).limit(30),
          supabase.from('contact_score_history')
            .select('score, phase, snapshot_date, score_intensite, score_reciprocite, score_longevite')
            .eq('contact_id', id).eq('organization_id', oid)
            .order('snapshot_date', { ascending: true }).limit(30)
            .then(r => r, () => ({ data: null as any })),
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

      if (fullContact.enrichment_status === 'pending' || fullContact.enrichment_status === 'failed') {
        triggerEnrichment(id, oid);
      }

      findMergeCandidates(id).then(c => setMergeCandidates(c.filter(mc => !isMergeDismissed(id, mc.id)))).catch(() => {});
    } catch (e) {
      console.error('ContactDetail load error:', e);
      setLoading(false);
    }
  }, [id, orgId]);

  useEffect(() => { loadData(); }, [loadData]);

  // Membres de l'équipe (pour la passation) — mode entreprise si ≥ 2 membres
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (mounted) setCurrentUserId(user?.id ?? null);
      const oid = orgId ?? await getActiveOrganizationId();
      if (!oid) return;
      const { data: mems } = await supabase.from('memberships').select('user_id').eq('organization_id', oid);
      const ids = (mems ?? []).map((m: any) => m.user_id).filter((uid: string) => uid !== user?.id);
      if (!ids.length) { if (mounted) setTeamMembers([]); return; }
      const { data: profs } = await supabase.from('profiles').select('id, full_name').in('id', ids);
      if (mounted) setTeamMembers((profs ?? []).map((p: any) => ({ id: p.id, name: p.full_name || 'Membre' })));
    })();
    return () => { mounted = false; };
  }, [orgId]);

  const handleTransfer = async () => {
    if (!supabase || !id || !transferTo || transferring) return;
    setTransferring(true); setTransferMsg(null);
    try {
      const { error } = await supabase.functions.invoke('transfer-contact', {
        body: { contactId: id, toUserId: transferTo, keepCopy },
      });
      if (error) {
        let msg: string | null = null;
        try { const b = await (error as any)?.context?.json?.(); msg = b?.error ?? null; } catch { /* ignore */ }
        setTransferMsg(msg ?? 'Échec du transfert');
      } else {
        setShowTransfer(false);
        navigate('/contacts');
      }
    } catch (e: any) { setTransferMsg(e?.message ?? 'Erreur'); }
    finally { setTransferring(false); }
  };

  const addNote = async () => {
    if (!supabase || !id || !orgId || savingNote) return;
    if (!noteDraft.trim() && !noteFile) return;
    setSavingNote(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let body = noteDraft.trim();

      if (noteFile) {
        const filePath = `contacts/${id}/${Date.now()}_${noteFile.name}`;
        const { error: uploadError } = await supabase.storage.from('tohu-documents').upload(filePath, noteFile);
        if (!uploadError) body = (body ? body + '\n\n' : '') + `📎 ${noteFile.name}`;
      }
      if (!body) return;

      const { data: inserted, error } = await supabase.from('notes').insert({
        organization_id: orgId, contact_id: id, author_user_id: user?.id ?? null, body,
      }).select('id, body, created_at').single();

      if (!error && inserted) {
        setNotes(prev => [inserted as Note, ...prev]);
        setNoteDraft('');
        setNoteFile(null);
      }
    } finally {
      setSavingNote(false);
    }
  };

  const handleMerge = async (secondaryId: string) => {
    if (!id || merging) return;
    setMerging(true);
    try {
      const ok = await mergeContacts(id, secondaryId);
      if (ok) {
        setMergeCandidates(prev => prev.filter(c => c.id !== secondaryId));
        await loadData();
        if (orgId) triggerEnrichment(id, orgId, true);
      }
    } finally {
      setMerging(false);
    }
  };

  // Rejette une suggestion de fusion : disparaît immédiatement + ne réapparaît plus (persisté)
  const dismissMerge = (secondaryId: string) => {
    if (id) dismissMergePair(id, secondaryId);
    setMergeCandidates(prev => prev.filter(c => c.id !== secondaryId));
  };

  const handleAnalyzeEmails = async () => {
    if (!supabase || !id || !orgId || analyzing) return;
    setAnalyzing(true);
    setAnalyzeError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const sessionAuthProvider = (session?.user?.app_metadata as any)?.provider ?? '';
      const isMsSession = sessionAuthProvider === 'azure' || sessionAuthProvider === 'microsoft';
      const providerToken = isMsSession ? null : (session?.provider_token ?? null);
      const microsoftToken = isMsSession ? (session?.provider_token ?? null) : null;
      const { data, error } = await supabase.functions.invoke('analyze-email-exchanges', {
        body: { contactId: id, organizationId: orgId, providerToken, microsoftToken },
      });
      if (error) {
        let realMsg: string | null = null;
        try {
          const body = await (error as any)?.context?.json?.();
          realMsg = body?.error ?? null;
          if (body?.code === 'NO_MESSAGES') realMsg = 'Aucun email synchronisé pour ce contact.';
          else if (body?.code === 'TOKEN_MISSING') realMsg = 'Token expiré. Relancez une synchronisation dans Paramètres → Connexions.';
        } catch { /* ignore */ }
        setAnalyzeError(realMsg ?? (error as any)?.message ?? 'Erreur inconnue');
      } else if (data?.analysis) {
        setEmailAnalysis(data.analysis);
        if (data?.name_updated) await loadData();
      }
    } catch (e: any) {
      setAnalyzeError(e?.message ?? 'Erreur inconnue');
    } finally {
      setAnalyzing(false);
    }
  };

  const syncContactEmails = async () => {
    if (!supabase || !id || syncingContactEmails || !contact?.email) return;
    setSyncingContactEmails(true);
    setSyncEmailsMsg(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setSyncEmailsMsg('Session expirée — reconnectez-vous.'); return; }
      const oid = orgId ?? await getActiveOrganizationId();
      if (!oid) { setSyncEmailsMsg('Aucun workspace actif.'); return; }
      const providerToken = session.provider_token ?? null;

      const { data: conns } = await supabase.from('connectors').select('provider, status, metadata')
        .eq('organization_id', oid).eq('status', 'connected');
      const connected = new Map((conns ?? []).map((c: any) => [c.provider as string, c]));
      const sessionAuthProvider = (session.user?.app_metadata as any)?.provider ?? '';
      const isMsSession = sessionAuthProvider === 'azure' || sessionAuthProvider === 'microsoft';

      // Sème le connecteur AVANT de calculer la disponibilité — indispensable pour les
      // sessions fraîches sans record en base (sinon sync jamais déclenchée, en silence).
      if (session.user && providerToken) {
        if (isMsSession) {
          await (supabase.from('connectors') as any).upsert({
            organization_id: oid, user_id: session.user.id, provider: 'microsoft', status: 'connected',
            metadata: { access_token: providerToken, refresh_token: (session as any).provider_refresh_token ?? (connected.get('microsoft')?.metadata as any)?.refresh_token ?? null, email: session.user.email, token_stored_at: new Date().toISOString() },
            updated_at: new Date().toISOString(),
          }, { onConflict: 'organization_id,user_id,provider' });
        } else {
          await (supabase.from('connectors') as any).upsert({
            organization_id: oid, user_id: session.user.id, provider: 'google', status: 'connected',
            metadata: { access_token: providerToken, refresh_token: (session as any).provider_refresh_token ?? (connected.get('google')?.metadata as any)?.refresh_token ?? null, email: session.user.email, token_stored_at: new Date().toISOString() },
            updated_at: new Date().toISOString(),
          }, { onConflict: 'organization_id,user_id,provider' });
        }
      }
      const hasGoogle = connected.has('google') || (!isMsSession && !!providerToken);
      const hasMicrosoft = connected.has('microsoft') || (isMsSession && !!providerToken);

      if (!hasGoogle && !hasMicrosoft) {
        setSyncEmailsMsg('Aucune source mail connectée. Connectez Gmail ou Outlook dans Paramètres → Connexions.');
        return;
      }

      // Tokens : session fraîche prioritaire, jamais le token MS vers Gmail.
      const googleToken = hasGoogle
        ? ((connected.get('google')?.metadata as any)?.access_token ?? (isMsSession ? null : providerToken) ?? null)
        : null;
      const msToken = hasMicrosoft
        ? ((isMsSession && providerToken) ? providerToken : ((connected.get('microsoft')?.metadata as any)?.access_token ?? null))
        : null;

      let totalSynced = 0;
      let anyCall = false;
      let tokenIssue = false;

      const runIngest = async (token: string, provider: 'google' | 'microsoft') => {
        anyCall = true;
        try {
          // invoke = JWT frais auto-attaché (évite les 401 dus à un access_token périmé)
          const { data: d, error } = await supabase.functions.invoke('ingest-communication', {
            body: { organizationId: oid, providerToken: token, provider, contactEmails: [contact.email], lookbackDays: 3650, maxMessagesPerContact: 1000 },
          });
          if (error) { tokenIssue = true; return; }
          totalSynced += (d as any)?.stats?.messages ?? 0;
        } catch { tokenIssue = true; }
      };

      if (googleToken) await runIngest(googleToken, 'google');
      if (msToken) await runIngest(msToken, 'microsoft');

      if (!anyCall) {
        setSyncEmailsMsg('Token expiré. Relancez une synchronisation dans Paramètres → Connexions.');
        return;
      }

      await loadData();

      if (totalSynced > 0) setSyncEmailsMsg(`✓ ${totalSynced} email${totalSynced > 1 ? 's' : ''} synchronisé${totalSynced > 1 ? 's' : ''}`);
      else if (tokenIssue) setSyncEmailsMsg('Token expiré. Reconnectez la source dans Paramètres → Connexions.');
      else setSyncEmailsMsg('Aucun nouvel email trouvé pour ce contact.');
    } catch (e: any) {
      console.error('Sync emails error:', e);
      setSyncEmailsMsg(`Erreur : ${e?.message ?? 'inconnue'}`);
    } finally {
      setSyncingContactEmails(false);
      setTimeout(() => setSyncEmailsMsg(null), 6000);
    }
  };

  const triggerEnrichment = async (contactId: string, oid: string, force = false) => {
    if (!supabase) return;
    setEnriching(true);
    setEnrichError(null);
    try {
      const { error } = await supabase.functions.invoke('enrich-agent', {
        body: { contactId, organizationId: oid, forceRefresh: force },
      });
      if (error) {
        const msg = (error as any)?.message ?? String(error);
        if (msg.includes('404')) {
          setEnrichError('deploy');
        } else {
          let realMsg: string | null = null;
          try {
            const body = await (error as any)?.context?.json?.();
            realMsg = body?.error ?? null;
          } catch { /* ignore */ }
          setEnrichError(realMsg ?? msg);
        }
      } else {
        await loadData();
      }
    } catch {
      setEnrichError('deploy');
    } finally {
      setEnriching(false);
    }
  };

  // ── Générer une fiche « Recommandations » sans réunion planifiée ──────────────
  // Crée une réunion ad-hoc (préparation d'un prochain échange), génère le brief
  // puis ouvre la fiche /meeting/:id. Réutilise la réunion ad-hoc si déjà créée.
  const generateRecommendations = async () => {
    if (!supabase || !id || genBrief) return;
    setGenBrief(true); setGenErr(null);
    try {
      const oid = orgId ?? await getActiveOrganizationId();
      if (!oid) { setGenErr('Organisation introuvable'); return; }

      // 1. Réutiliser une réunion ad-hoc déjà générée pour ce contact
      const { data: existing } = await supabase
        .from('meetings')
        .select('id')
        .eq('organization_id', oid)
        .eq('raw_payload->>adhoc_contact', id)
        .limit(1)
        .maybeSingle();

      let meetingId = (existing as any)?.id as string | undefined;

      if (!meetingId) {
        // 2. Créer la réunion ad-hoc (prochain échange à préparer)
        const startsAt = new Date(Date.now() + 3600_000).toISOString();
        const { data: created, error: cErr } = await supabase
          .from('meetings')
          .insert({
            organization_id: oid,
            title: `Préparation — ${contact?.full_name ?? 'échange'}`,
            company_id: companyId,
            owner_user_id: currentUserId,
            meeting_type: 'commercial',
            starts_at: startsAt,
            is_external: true,
            raw_payload: { adhoc: true, adhoc_contact: id, source: 'recommendation' },
          })
          .select('id')
          .single();
        if (cErr || !created) { setGenErr("Impossible de créer la fiche."); return; }
        meetingId = created.id;

        // Lier le contact comme participant
        await supabase.from('meeting_participants').insert({
          meeting_id: meetingId,
          organization_id: oid,
          contact_id: id,
          name: contact?.full_name ?? null,
          email: contact?.email ?? null,
        });
      }

      // 3. Générer le brief IA (best-effort — la fiche s'affiche depuis les profils cognitifs)
      try {
        await supabase.functions.invoke('generate-brief', { body: { organizationId: oid, meetingId } });
      } catch { /* la fiche reste consultable sans le brief IA */ }

      // 4. Ouvrir la fiche recommandations
      navigate(`/meeting/${meetingId}`);
    } catch {
      setGenErr('Erreur lors de la génération.');
    } finally {
      setGenBrief(false);
    }
  };

  // ── Loading & error states ────────────────────────────────────────────────────
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

  // ── Derived values ────────────────────────────────────────────────────────────
  const companyName = (contact.companies as any)?.name ?? '';
  const companyId   = (contact.companies as any)?.id ?? null;
  const score       = profile?.engagement_score ?? null;
  const phase       = profile?.score_phase as 'growth' | 'stagnant' | 'decline' | undefined;
  const allDates    = [...messages.map(m => m.sent_at), ...meetings.map(m => m.starts_at)].filter(Boolean).sort().reverse();
  const lastContact = allDates[0];
  const hasOutlookMsgs = messages.some((m: any) => m.provider === 'microsoft');
  const hasGmailMsgs   = messages.some((m: any) => !m.provider || m.provider === 'google');
  const sources = [
    ...(hasGmailMsgs ? ['Gmail'] : []),
    ...(hasOutlookMsgs ? ['Outlook'] : []),
    ...(!hasGmailMsgs && !hasOutlookMsgs && messages.length > 0 ? ['Emails'] : []),
    ...(meetings.length > 0 ? ['Calendar'] : []),
  ];

  const scoreColor  = score == null ? '#9082B8' : score >= 70 ? '#2EA86A' : score >= 40 ? '#6E50C8' : '#D94F63';
  const phaseLabel  = phase === 'growth' ? 'Développement' : phase === 'decline' ? 'Déclin' : 'Stable';
  const phaseColor  = phase === 'growth' ? '#2EA86A' : phase === 'decline' ? '#D94F63' : 'rgba(255,255,255,0.4)';
  const PhaseIcon   = phase === 'growth' ? TrendingUp : phase === 'decline' ? TrendingDown : Minus;

  // Levier = executive summary ou pitch angle du JTBD fonctionnel
  const levier = profile?.executive_summary
    ?? profile?.jtbd_data?.functional_job?.pitch_angle
    ?? null;

  // Signaux comportementaux → signal rail (faits observables)
  const signals: Signal[] = (profile?.behavioral_analysis_data ?? [])
    .filter((s: any) => s.inference_level === 'observable' || s.inference_level === 'inferred')
    .slice(0, 6)
    .map((s: any, i: number) => ({
      tag: i === 0 ? 'Levier' : i === 1 ? 'Risque' : 'Présence',
      text: s.text,
      source: 'Analyse Tohu',
      provenance: s.inference_level === 'observable' ? 'observable' : 'inferred',
    }));

  const lastContactDays = lastContact
    ? Math.floor((Date.now() - new Date(lastContact).getTime()) / 86400000)
    : null;
  const verdict = computeVerdict(score, lastContactDays, signals, profile?.score_delta ?? null);

  const recentMeetings = [...meetings].sort((a, b) =>
    new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime()
  );
  const visibleMeetings = showAllMeetings ? recentMeetings : recentMeetings.slice(0, 3);

  return (
    <div className="size-full overflow-auto" style={{ background: 'var(--color-background)' }}>
      <div className="max-w-6xl mx-auto px-4 py-6 md:px-8">

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-5"
        >
          <ArrowLeft className="size-4" /> Retour
        </button>

        {/* Commutateur de vue Réunion · Personne · Compte (spec-25 §B) */}
        <div className="flex flex-col items-center gap-2 mb-4">
          <ViewSwitcher
            active="personne"
            meetingId={recentMeetings[0]?.id ?? null}
            contactId={id}
            companyId={companyId}
          />
          {/* Générer une fiche Recommandations sans réunion planifiée */}
          {recentMeetings.length === 0 && (
            <button
              onClick={generateRecommendations}
              disabled={genBrief}
              className="flex items-center gap-1.5 text-xs font-semibold rounded-full px-3.5 py-1.5 transition-all disabled:opacity-60"
              style={{ background: '#6E50C8', color: '#fff', boxShadow: '0 2px 10px rgba(110,80,200,0.3)' }}
              title="Générer des recommandations sans réunion planifiée"
            >
              {genBrief ? <Loader2 className="size-3.5 animate-spin" /> : <Target className="size-3.5" />}
              {genBrief ? 'Génération…' : 'Générer des recommandations'}
            </button>
          )}
          {genErr && <span className="text-[11px] text-destructive">{genErr}</span>}
        </div>

        {/* ══ HERO HEADER DARK ══════════════════════════════════════════════════ */}
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
                className="size-16 rounded-xl object-cover flex-shrink-0" />
            ) : (
              <div className="size-16 flex-shrink-0 rounded-xl flex items-center justify-center text-white text-xl font-bold"
                style={{ background: 'linear-gradient(135deg, #6E50C8, #9747FF)' }}>
                {initials(contact.full_name)}
              </div>
            )}

            {/* Name + meta */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-black leading-tight" style={{ color: '#fff' }}>
                {contact.full_name}
              </h1>
              <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
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

            {/* Hero canonique = 3 blocs : Score · Confiance · Dernier contact (doctrine #4) */}
            {score != null && (
              <div className="flex items-center gap-5 flex-shrink-0">
                {/* Bloc 1 — Score */}
                <div className="text-center">
                  <p className="text-[9px] font-bold uppercase tracking-widest mb-1"
                    style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--mono)' }}>Score</p>
                  <p className="text-5xl font-black leading-none" style={{ color: scoreColor }}>{score}</p>
                  <p className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--mono)' }}>/100</p>
                </div>
                <div className="w-px h-12" style={{ background: 'rgba(255,255,255,0.08)' }} />

                {/* Bloc 2 — Confiance (anneau %) */}
                {profile?.global_confidence != null && (
                  <>
                    <ConfidenceRing value={profile.global_confidence} size={52} dark />
                    <div className="w-px h-12" style={{ background: 'rgba(255,255,255,0.08)' }} />
                  </>
                )}

                {/* Bloc 3 — Dernier contact + tendance */}
                <div className="text-center">
                  <p className="text-[9px] font-bold uppercase tracking-widest mb-1"
                    style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--mono)' }}>Dernier contact</p>
                  <p className="text-sm font-semibold" style={{ color: '#fff' }}>
                    {lastContact ? relDate(lastContact) : '—'}
                  </p>
                  <div className="flex items-center justify-center gap-1.5 mt-1">
                    <PhaseIcon className="size-3.5" style={{ color: phaseColor }} />
                    <span className="text-[11px] font-semibold" style={{ color: phaseColor }}>{phaseLabel}</span>
                    {profile?.score_delta != null && profile.score_delta !== 0 && (
                      <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--mono)' }}>
                        {profile.score_delta > 0 ? '+' : ''}{profile.score_delta}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sources bar */}
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
            {teamMembers.length > 0 && (
              <button
                onClick={() => { setTransferTo(teamMembers[0]?.id ?? ''); setKeepCopy(false); setTransferMsg(null); setShowTransfer(true); }}
                className="flex items-center gap-1.5 text-[11px] transition-colors"
                style={{ color: 'rgba(255,255,255,0.3)' }}
                title="Transférer ce contact à un membre de l'équipe"
              >
                <Users className="size-3.5" /> Transférer
              </button>
            )}
          </div>
        </motion.div>

        {/* ══ MODALE PASSATION ══════════════════════════════════════════════ */}
        {showTransfer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowTransfer(false)}>
            <div className="w-full max-w-md rounded-2xl bg-card border border-border p-5" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-2 mb-1">
                <Users className="size-5 text-primary" />
                <h3 className="text-base font-bold">Transférer ce contact</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Passe <span className="font-semibold">{contact?.full_name}</span> à un membre de ton équipe. L'historique des échanges suit le contact.
              </p>
              <label className="block text-xs font-semibold mb-1.5">Destinataire</label>
              <select
                value={transferTo} onChange={e => setTransferTo(e.target.value)}
                className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {teamMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <label className="flex items-center gap-2 text-sm mb-4 cursor-pointer">
                <input type="checkbox" checked={keepCopy} onChange={e => setKeepCopy(e.target.checked)} className="size-4 rounded border-border" />
                Garder une copie de ce contact pour moi
              </label>
              {transferMsg && <p className="text-xs text-destructive mb-3">{transferMsg}</p>}
              <div className="flex items-center justify-end gap-2">
                <button onClick={() => setShowTransfer(false)} className="px-3 py-2 text-sm rounded-xl border border-border hover:bg-muted/50">Annuler</button>
                <button
                  onClick={handleTransfer}
                  disabled={transferring || !transferTo}
                  className="px-4 py-2 text-sm font-semibold text-white rounded-xl disabled:opacity-50 flex items-center gap-1.5"
                  style={{ background: '#6E50C8' }}
                >
                  {transferring ? <Loader2 className="size-3.5 animate-spin" /> : null}
                  Transférer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══ TENDANCE + PROCHAIN PAS (spec-28 §4) ══════════════════════════════ */}
        {profile && !enriching && (() => {
          const delta = profile.score_delta ?? 0;
          const lastMeeting = recentMeetings[0];
          const trend =
            delta > 2  ? { label: 'En progression', icon: TrendingUp,   color: '#2EA86A' }
            : delta < -2 ? { label: 'En recul',       icon: TrendingDown, color: '#D94F63' }
            :              { label: 'Stable',          icon: Minus,        color: '#9082B8' };
          const TrendIcon = trend.icon;
          // Prochain pas : dérivé du verdict (action recommandée) sinon entretien.
          const nextStep =
            verdict?.posture === 'defend'      ? 'Reprendre contact pour sécuriser la relation'
            : verdict?.posture === 'capitaliser' ? 'Capitaliser sur le momentum récent'
            : verdict?.posture === 'derisquer'   ? 'Repositionner la relation (changement détecté)'
            : 'Maintenir le rythme d\'échange';
          return (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-border bg-card p-4 mb-4 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              {/* Tendance */}
              <div className="flex items-center gap-3 sm:w-64 flex-shrink-0">
                <div className="size-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${trend.color}1A` }}>
                  <TrendIcon className="size-4" style={{ color: trend.color }} />
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground" style={{ fontFamily: 'var(--mono)' }}>
                    Tendance{lastMeeting ? ' · dern. réunion' : ''}
                  </p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm font-bold" style={{ color: trend.color }}>{trend.label}</span>
                    {delta !== 0 && (
                      <span className="text-[11px] font-mono text-muted-foreground">
                        {delta > 0 ? '+' : ''}{delta} pts
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="hidden sm:block w-px h-10 bg-border flex-shrink-0" />

              {/* Prochain pas */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="size-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(110,80,200,0.10)' }}>
                  <Target className="size-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground" style={{ fontFamily: 'var(--mono)' }}>
                    Prochain pas
                  </p>
                  <p className="text-sm font-semibold text-foreground truncate">{nextStep}</p>
                </div>
              </div>
            </motion.div>
          );
        })()}

        {/* ══ FUSION SUGGESTION ════════════════════════════════════════════════ */}
        {mergeCandidates.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border p-4 mb-4"
            style={{ background: 'rgba(110,80,200,0.06)', borderColor: 'rgba(110,80,200,0.25)' }}
          >
            <div className="flex items-start gap-3">
              <Users className="size-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold mb-1">Même personne, autre adresse ?</p>
                <p className="text-xs text-muted-foreground mb-3">
                  {mergeCandidates.length === 1 ? 'Un contact porte' : `${mergeCandidates.length} contacts portent`} le même nom avec un email différent.
                </p>
                <div className="space-y-2">
                  {mergeCandidates.map(mc => (
                    <div key={mc.id} className="flex items-center gap-3 bg-card rounded-xl border border-border px-3 py-2">
                      <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                        {initials(mc.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{mc.email || mc.name}</p>
                        <p className="text-[11px] text-muted-foreground">{mc.emailCount} email{mc.emailCount > 1 ? 's' : ''} · {mc.meetingCount} réunion{mc.meetingCount > 1 ? 's' : ''}</p>
                      </div>
                      <button
                        onClick={() => handleMerge(mc.id)}
                        disabled={merging}
                        className="px-3 py-1.5 text-xs font-semibold text-white rounded-lg disabled:opacity-50 flex items-center gap-1.5"
                        style={{ background: '#6E50C8' }}
                      >
                        {merging ? <Loader2 className="size-3 animate-spin" /> : null}
                        Fusionner
                      </button>
                      <button
                        onClick={() => dismissMerge(mc.id)}
                        disabled={merging}
                        title="Ce n'est pas un doublon — ignorer la suggestion"
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border text-muted-foreground hover:bg-muted/50 transition-colors disabled:opacity-50"
                      >
                        Ignorer
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ══ ENRICHING STATE ══════════════════════════════════════════════════ */}
        <AnimatePresence>
          {enriching && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="bg-card rounded-2xl border border-primary/20 mb-4">
              <EnrichingState name={contact.full_name} />
            </motion.div>
          )}
        </AnimatePresence>

        {enrichError === 'deploy' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
            <p className="text-sm font-semibold text-amber-800 mb-1">⚠️ Edge Functions non déployées</p>
            <pre className="bg-amber-100 rounded-xl px-4 py-3 text-xs font-mono text-amber-900 overflow-x-auto">{`supabase functions deploy enrich-contact`}</pre>
          </motion.div>
        )}
        {enrichError && enrichError !== 'deploy' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4">
            <p className="text-sm font-semibold text-red-800 mb-1">Erreur d'enrichissement</p>
            <p className="text-xs text-red-700 font-mono">{enrichError}</p>
          </motion.div>
        )}

        {/* ══ PAGE LAYOUT: MAIN + ASIDE ══════════════════════════════════════ */}
        <div className="flex flex-col lg:flex-row gap-5">

          {/* ── MAIN COL ─────────────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-4">

            {/* SOURCES CONNECTÉES (hsrc) */}
            <SourcesPanel
              organizationId={orgId}
              hasPublicData={Boolean(contact?.web_bio || enrichDetail)}
              provenanceNote={
                contact?.web_bio || enrichDetail
                  ? 'Poste & contexte enrichis via sources publiques. Connecter le CRM consoliderait l’historique facturé.'
                  : 'Relation suivie via la messagerie. Enrichir via sources publiques pour compléter le contexte.'
              }
            />

            {/* ACARD COMPTE */}
            {companyName && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                <ACard
                  eyebrow="Rattaché au compte"
                  name={companyName}
                  subtitle={(contact.companies as any)?.domain ?? undefined}
                  onClick={() => companyId ? navigate(`/company/${companyId}`) : navigate('/contacts')}
                  initials={companyName.slice(0, 2).toUpperCase()}
                />
              </motion.div>
            )}

            {/* LEVIER STRATÉGIQUE */}
            {levier && !enriching && (
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="rounded-2xl overflow-hidden"
                style={{ background: '#13111E' }}
              >
                <div className="px-5 pt-4 pb-1">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[9px] font-bold uppercase tracking-widest"
                      style={{ color: 'rgba(255,255,255,0.3)' }}>Levier stratégique</span>
                    <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                    {(profile?.interaction_modes_data ?? []).slice(0, 2).map(m => (
                      <span key={m} className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(110,80,200,0.25)', color: '#B39DDB', border: '1px solid rgba(110,80,200,0.4)' }}>
                        {m}
                      </span>
                    ))}
                  </div>
                  <p className="text-base leading-relaxed pb-4" style={{ color: 'rgba(255,255,255,0.82)', fontStyle: 'italic' }}>
                    "{levier}"
                  </p>
                </div>
              </motion.div>
            )}

            {/* ── MÉMOIRE RELATIONNELLE ──────────────────────────────────────── */}
            {profile && score != null && (
              <CollapsibleSection
                title="Mémoire Relationnelle"
                icon={<TrendingUp className="size-4" />}
                defaultOpen={true}
              >
                {/* Score header */}
                <div className="flex items-center gap-5 mb-5 flex-wrap">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Score engagement</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black" style={{ color: scoreColor }}>{score}</span>
                      <span className="text-sm font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-mono">{phaseLabel}</span>
                      {profile.score_delta != null && profile.score_delta !== 0 && (
                        <span className="text-[11px] font-mono text-muted-foreground">
                          {profile.score_delta > 0 ? '+' : ''}{profile.score_delta} · 30j
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3 Dimensions + chart */}
                <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-5">
                  <div className="space-y-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">3 Dimensions · Granovetter</p>
                    {[
                      { key: 'score_intensite',   label: 'Intensité',    weight: '40%', color: '#6E50C8', note: 'Fréquence et richesse des échanges' },
                      { key: 'score_reciprocite',  label: 'Réciprocité',  weight: '35%', color: '#F59E0B', note: "Équilibre d'initiation et taux de réponse" },
                      { key: 'score_longevite',    label: 'Longévité',    weight: '25%', color: '#2EA86A', note: 'Ancienneté, régularité et continuité' },
                    ].map(({ key, label, weight, color, note }) => {
                      const val = (profile as any)[key] as number ?? 0;
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
                          <p className="text-[11px] text-muted-foreground">{note}</p>
                        </div>
                      );
                    })}
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Évolution du score</p>
                    {scoreHistory.length > 1 ? (
                      <ResponsiveContainer width="100%" height={160}>
                        <AreaChart data={scoreHistory} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                          <defs>
                            <linearGradient id="mrGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#6E50C8" stopOpacity={0.25} />
                              <stop offset="100%" stopColor="#6E50C8" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9082B8' }} axisLine={false} tickLine={false} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#9082B8' }} axisLine={false} tickLine={false} />
                          <Tooltip content={<ChartTooltip />} />
                          <Area type="monotone" dataKey="score" stroke="#6E50C8" strokeWidth={2.5}
                            fill="url(#mrGrad)" dot={{ fill: '#6E50C8', r: 3 }} activeDot={{ r: 5 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-40 flex flex-col items-center justify-center text-muted-foreground gap-2">
                        <TrendingUp className="size-8 opacity-20" />
                        <p className="text-xs">Le graphe s'enrichira après plusieurs enrichissements</p>
                      </div>
                    )}
                    <div className="flex gap-4 mt-2">
                      {messages.length > 0 && (
                        <span className="text-[11px] text-muted-foreground font-mono">{messages.length} échanges</span>
                      )}
                      {meetings.length > 0 && (
                        <span className="text-[11px] text-muted-foreground font-mono">{meetings.length} réunions</span>
                      )}
                    </div>
                  </div>
                </div>
              </CollapsibleSection>
            )}

            {/* ── PROFIL COMPORTEMENTAL ─────────────────────────────────────── */}
            {profile && (
              <CollapsibleSection
                title="Profil comportemental"
                icon={<Brain className="size-4" />}
                defaultOpen={true}
              >
                {/* Modes */}
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Modes d'interaction</span>
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
                  <div className="mb-5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Axes interactionnels</p>
                    <div className="space-y-5">
                      {axes.map(a => <AxisBar key={a.axis} {...a} />)}
                    </div>
                  </div>
                )}

                {/* Signaux comportementaux */}
                {(profile.behavioral_analysis_data ?? []).length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Signaux comportementaux</p>
                    <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
                      {(profile.behavioral_analysis_data ?? []).map((sig: any, i: number) => {
                        const lvl = LEVEL_CONFIG[sig.inference_level as keyof typeof LEVEL_CONFIG] ?? LEVEL_CONFIG.unavailable;
                        return (
                          <div key={i} className="flex gap-3 px-4 py-3">
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

                {/* Web bio */}
                {contact.web_bio && (
                  <div className="mt-5 rounded-xl border p-4" style={{ background: '#FFFBEB', borderColor: '#FDE68A' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="size-4" style={{ color: '#D97706' }} />
                      <span className="text-xs font-semibold" style={{ color: '#92400E' }}>Données web enrichies — Perplexity</span>
                    </div>
                    <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">{contact.web_bio}</p>
                  </div>
                )}

                {/* Recherche IA — agent n8n (OpenRouter + Perplexity) */}
                {enrichDetail && (
                  <div className="mt-5 space-y-4">
                    {enrichDetail.currentRole && (
                      <p className="text-xs" style={{ color: 'var(--t2, #5A4880)' }}>
                        <span className="font-semibold">{enrichDetail.currentRole}</span>
                        {enrichDetail.currentCompany ? ` · ${enrichDetail.currentCompany}` : ''}
                        {enrichDetail.roleConfidence === 'to_confirm' && <span className="ml-1 text-[10px] font-mono" style={{ color: 'var(--amber, #C97A20)' }}>(à confirmer)</span>}
                      </p>
                    )}

                    {Array.isArray(enrichDetail.talkingPoints) && enrichDetail.talkingPoints.length > 0 && (
                      <div>
                        <p className="text-[11px] font-mono uppercase tracking-wide mb-1.5" style={{ color: 'var(--t3, #9082B8)' }}>Angles d'approche</p>
                        <ul className="space-y-1">
                          {enrichDetail.talkingPoints.slice(0, 5).map((t: string, i: number) => (
                            <li key={i} className="text-sm flex gap-2"><span style={{ color: 'var(--violet, #6E50C8)' }}>›</span><span>{t}</span></li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {Array.isArray(enrichDetail.relatedPeople) && enrichDetail.relatedPeople.length > 0 && (
                      <div>
                        <p className="text-[11px] font-mono uppercase tracking-wide mb-1.5" style={{ color: 'var(--t3, #9082B8)' }}>Personnes pertinentes autour</p>
                        <div className="space-y-1.5">
                          {enrichDetail.relatedPeople.slice(0, 6).map((p: any, i: number) => (
                            <div key={i} className="text-sm rounded-lg border border-border px-3 py-2">
                              <span className="font-semibold">{p.name}</span>{p.role ? <span className="text-muted-foreground"> · {p.role}</span> : null}
                              {p.why && <p className="text-xs text-muted-foreground mt-0.5">{p.why}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {Array.isArray(enrichDetail.recentActivity) && enrichDetail.recentActivity.length > 0 && (
                      <div>
                        <p className="text-[11px] font-mono uppercase tracking-wide mb-1.5" style={{ color: 'var(--t3, #9082B8)' }}>Actualité récente</p>
                        <div className="space-y-1.5">
                          {enrichDetail.recentActivity.slice(0, 5).map((a: any, i: number) => (
                            <a key={i} href={a.url || undefined} target="_blank" rel="noreferrer"
                               className="block text-sm rounded-lg border border-border px-3 py-2 hover:bg-muted/30 transition-colors">
                              <span>{a.title}</span>
                              <span className="text-[11px] text-muted-foreground"> {a.date ? `· ${a.date}` : ''}{a.source ? ` · ${a.source}` : ''}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {Array.isArray(enrichDetail.sources) && enrichDetail.sources.length > 0 && (
                      <p className="text-[11px] text-muted-foreground break-all">
                        Sources : {enrichDetail.sources.slice(0, 6).map((s: string, i: number) => (
                          <a key={i} href={s} target="_blank" rel="noreferrer" className="underline mr-2" style={{ color: 'var(--violet, #6E50C8)' }}>[{i + 1}]</a>
                        ))}
                      </p>
                    )}
                  </div>
                )}
              </CollapsibleSection>
            )}

            {/* ── COACHING · COMMENT ABORDER {name} ─────────────────────────── */}
            {profile && profile.cognitive_mode && profile.cognitive_mode !== 'unavailable' && (
              <CollapsibleSection
                title={`Coaching · comment aborder ${contact.full_name.split(' ')[0]}`}
                icon={<Sparkles className="size-4" />}
              >
                <div className="mb-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Socle observé</p>
                  <p className="text-sm">
                    {profile.cognitive_mode === 's1_dominant'
                      ? 'Décide vite, sur intuition — privilégie la clarté et l\'action immédiate.'
                      : profile.cognitive_mode === 's2_dominant'
                      ? 'Analyse avant de décider — a besoin de données et de temps pour se positionner.'
                      : 'Posture contextuelle — adapte son mode de décision selon l\'enjeu.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div className="rounded-xl border p-3" style={{ borderColor: 'var(--sage-l)', background: 'var(--sage-s)' }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--sage)' }}>Adopte</p>
                    <p className="text-sm">
                      {profile.cognitive_mode === 's1_dominant'
                        ? 'Va à l\'essentiel, propose une décision claire dès le début.'
                        : 'Prépare des données concrètes, laisse du temps à la réflexion.'}
                    </p>
                  </div>
                  <div className="rounded-xl border p-3" style={{ borderColor: 'var(--coral-l)', background: 'var(--coral-s)' }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--coral)' }}>Évite</p>
                    <p className="text-sm">
                      {profile.cognitive_mode === 's1_dominant'
                        ? 'Les longs préambules et le luxe de détails avant d\'arriver au point.'
                        : 'Les décisions précipitées demandées sans contexte ni chiffres.'}
                    </p>
                  </div>
                </div>

                {(profile.behavioral_analysis_data ?? []).length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Ce qui a été observé récemment</p>
                    <div className="space-y-1.5">
                      {(profile.behavioral_analysis_data ?? []).slice(0, 2).map((sig: any, i: number) => (
                        <p key={i} className="text-xs text-muted-foreground">· {sig.text}</p>
                      ))}
                    </div>
                  </div>
                )}
              </CollapsibleSection>
            )}

            {/* ── JOBS-TO-BE-DONE ────────────────────────────────────────────── */}
            {profile?.jtbd_data && Object.keys(profile.jtbd_data).length > 0 && (
              <CollapsibleSection
                title="Jobs-to-be-Done"
                icon={<Target className="size-4" />}
                defaultOpen={true}
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  <JTBDCard type="functional" data={profile.jtbd_data.functional_job} />
                  <JTBDCard type="social"     data={profile.jtbd_data.social_job} />
                  <JTBDCard type="emotional"  data={profile.jtbd_data.emotional_job} />
                </div>
                {profile.jtbd_data.qualify_question && (
                  <div className="p-3 rounded-xl border" style={{ background: 'rgba(110,80,200,0.05)', borderColor: 'rgba(110,80,200,0.2)' }}>
                    <span className="text-xs text-muted-foreground font-semibold">Question de qualification · </span>
                    <span className="text-sm italic text-foreground">"{profile.jtbd_data.qualify_question}"</span>
                  </div>
                )}
              </CollapsibleSection>
            )}

            {/* ── RÉUNIONS RÉCENTES ──────────────────────────────────────────── */}
            <CollapsibleSection
              title="Réunions récentes"
              icon={<Calendar className="size-4" />}
              badge={meetings.length > 0 ? String(meetings.length) : undefined}
              defaultOpen={true}
            >
              {recentMeetings.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="size-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">
                    Planifiez une réunion pour générer votre premier brief Tohu.
                  </p>
                  <button onClick={() => navigate('/meetings')}
                    className="text-xs text-primary font-medium underline">
                    Voir les réunions →
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {visibleMeetings.map(m => (
                      <button
                        key={m.id}
                        onClick={() => navigate(`/meeting/${m.id}`)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/30 transition-colors text-left border border-border"
                      >
                        <div className="size-8 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: 'rgba(11,136,120,0.1)', color: '#0B8878' }}>
                          <Calendar className="size-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{m.title || 'Réunion'}</p>
                          <p className="text-xs text-muted-foreground">{relDate(m.starts_at)}</p>
                        </div>
                        <ChevronRight className="size-4 text-muted-foreground flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                  {recentMeetings.length > 3 && (
                    <button
                      onClick={() => setShowAllMeetings(!showAllMeetings)}
                      className="mt-3 w-full text-xs text-primary font-medium hover:underline"
                    >
                      {showAllMeetings
                        ? 'Réduire'
                        : `Voir les ${recentMeetings.length - 3} précédentes`}
                    </button>
                  )}
                </>
              )}
            </CollapsibleSection>

            {/* ── ÉCHANGES ──────────────────────────────────────────────────── */}
            <CollapsibleSection
              title="Échanges"
              icon={<MessageSquare className="size-4" />}
              badge={messages.length > 0 ? String(messages.length) : undefined}
              defaultOpen={true}
            >
              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label: 'Emails',    value: messages.length,  color: '#6E50C8' },
                  { label: 'Réunions',  value: meetings.length,   color: '#0B8878' },
                  { label: 'Notes',     value: notes.length,      color: '#C47B00' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-muted/30 rounded-xl border border-border p-3 text-center">
                    <p className="text-2xl font-black" style={{ color }}>{value}</p>
                    <p className="text-[11px] text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>

              {/* Analyse IA échanges CTA */}
              {!emailAnalysis && (
                <div className="flex items-center justify-between p-4 bg-card rounded-xl border border-border mb-4">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Sparkles className="size-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Synthèse IA des échanges</p>
                      <p className="text-xs text-muted-foreground">
                        {messages.length > 0 ? `${messages.length} email${messages.length > 1 ? 's' : ''} prêt${messages.length > 1 ? 's' : ''}` : 'Synchronisez Gmail'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleAnalyzeEmails}
                    disabled={analyzing || messages.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-accent transition-colors disabled:opacity-40"
                  >
                    {analyzing ? <><span className="size-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Analyse…</> : <><Sparkles className="size-3.5" /> Analyser</>}
                  </button>
                  {analyzeError && <p className="mt-2 text-xs text-destructive">{analyzeError}</p>}
                </div>
              )}

              {/* Timeline */}
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="relative px-4 py-3 border-b border-border flex items-center gap-2">
                  <Clock className="size-4 text-muted-foreground" />
                  <span className="text-xs font-semibold">Historique des échanges</span>
                  <button
                    onClick={syncContactEmails}
                    disabled={syncingContactEmails || !contact?.email}
                    className="ml-auto flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors disabled:opacity-40"
                    title={contact?.email ? 'Synchroniser Gmail & Outlook' : 'Email manquant sur ce contact'}
                  >
                    {syncingContactEmails
                      ? <><Loader2 className="size-3 animate-spin" /> Sync…</>
                      : <><RefreshCw className="size-3" /> Sync emails</>}
                  </button>
                  <Coachmark
                    id="personne-sync-emails"
                    title="Synchronisez vos emails"
                    text="Rapatriez vos échanges Gmail / Outlook avec ce contact. Reconnectez la source dans Paramètres si le token a expiré."
                    className="top-full right-3 mt-2"
                  />
                </div>
                {syncEmailsMsg && (
                  <div
                    className="px-4 py-2 text-[11px] font-medium border-b border-border"
                    style={{
                      color: syncEmailsMsg.startsWith('✓') ? 'var(--sage, #2EA86A)' : 'var(--coral, #D94F63)',
                      background: syncEmailsMsg.startsWith('✓') ? 'var(--sage-s, #E4F5ED)' : 'var(--coral-s, #FDEAED)',
                    }}
                  >
                    {syncEmailsMsg}
                  </div>
                )}
                <div className="divide-y divide-border max-h-80 overflow-y-auto">
                  {[
                    ...messages.slice(0, 30).map(m => ({ type: 'email' as const, date: m.sent_at, title: m.subject || 'Email', direction: m.direction, id: m.id })),
                    ...meetings.map(m => ({ type: 'meeting' as const, date: m.starts_at, title: m.title || 'Réunion', id: m.id })),
                  ]
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 40)
                    .map(item => (
                      <div key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors">
                        <div className="size-7 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{
                            background: item.type === 'email' ? 'rgba(110,80,200,0.08)' : 'rgba(11,136,120,0.08)',
                            color: item.type === 'email' ? '#6E50C8' : '#0B8878',
                          }}>
                          {item.type === 'email' ? <Mail className="size-3" /> : <Calendar className="size-3" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{item.title}</p>
                          {item.type === 'email' && 'direction' in item && (
                            <p className="text-[10px] text-muted-foreground">{item.direction === 'outbound' ? '↑ Envoyé' : '↓ Reçu'}</p>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground flex-shrink-0">{relDate(item.date)}</span>
                      </div>
                    ))}
                  {messages.length === 0 && meetings.length === 0 && (
                    <div className="p-8 text-center">
                      <p className="text-sm text-muted-foreground">Aucun échange enregistré.</p>
                    </div>
                  )}
                </div>
              </div>
            </CollapsibleSection>

            {/* ── NOURRIR LE PROFIL ─────────────────────────────────────────── */}
            <CollapsibleSection
              title="Nourrir le profil"
              icon={<Plus className="size-4" />}
              badge={notes.length > 0 ? String(notes.length) : undefined}
            >
              <div className="space-y-3 mb-4">
                <textarea
                  value={noteDraft}
                  onChange={e => setNoteDraft(e.target.value)}
                  placeholder="Ajoute une observation, un contexte, une note libre…"
                  rows={3}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <div className="flex items-center gap-2 flex-wrap">
                  <label className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-border hover:bg-muted/50 cursor-pointer">
                    <FileText className="size-3.5" />
                    {noteFile ? noteFile.name : 'Fichier'}
                    <input type="file" className="hidden" onChange={e => setNoteFile(e.target.files?.[0] ?? null)} />
                  </label>
                  <button disabled className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-border text-muted-foreground opacity-50 cursor-not-allowed" title="Note vocale — bientôt disponible">
                    <Mic className="size-3.5" />
                    Note vocale
                  </button>
                  <button
                    onClick={addNote}
                    disabled={savingNote || (!noteDraft.trim() && !noteFile)}
                    className="ml-auto flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-xl text-white disabled:opacity-50"
                    style={{ background: '#6E50C8' }}
                  >
                    {savingNote ? <Loader2 className="size-3 animate-spin" /> : null}
                    Ajouter
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground/70">Entre en mémoire après validation — visible par ton équipe.</p>
              </div>

              {notes.length > 0 && (
                <div className="space-y-2 pt-3 border-t border-border">
                  {notes.map(n => (
                    <div key={n.id} className="rounded-xl border border-border p-3">
                      <p className="text-sm whitespace-pre-line">{n.body}</p>
                      <p className="text-[10px] text-muted-foreground mt-1" style={{ fontFamily: 'var(--mono)' }}>{relDate(n.created_at)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CollapsibleSection>

            {/* ── NO PROFILE STATE ───────────────────────────────────────────── */}
            {!profile && !enriching && (
              <div className="bg-card rounded-2xl border border-border p-8 text-center space-y-3">
                <Sparkles className="size-10 text-primary mx-auto opacity-40" />
                <p className="text-muted-foreground text-sm">Le profil cognitif n'a pas encore été généré.</p>
                <button
                  onClick={() => orgId && triggerEnrichment(id!, orgId)}
                  className="px-5 py-2.5 text-white rounded-xl text-sm font-semibold"
                  style={{ background: '#6E50C8' }}
                >
                  Lancer l'analyse IA
                </button>
              </div>
            )}

          </div>

          {/* ── SIGNAL RAIL ──────────────────────────────────────────────────── */}
          <aside className="lg:w-64 xl:w-72 flex-shrink-0">
            <div className="lg:sticky lg:top-6">
              {/* VerdictCard en tête du rail */}
              <AnimatePresence>
                {verdict && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <VerdictCard
                      {...verdict}
                      onAction={() => navigate('/meetings')}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <SignalRail signals={signals} title="Signaux · Personne" />

              {/* Position 6 métriques (placeholder) */}
              {profile && (
                <div className="mt-4 rounded-2xl border border-border bg-card p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Position · Email</p>
                  <div className="space-y-2">
                    {[
                      { label: 'Emails envoyés', value: messages.filter(m => m.direction === 'outbound').length },
                      { label: 'Emails reçus',   value: messages.filter(m => m.direction === 'inbound').length },
                      { label: 'Réunions',        value: meetings.length },
                      { label: 'Notes',           value: notes.length },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-mono font-bold text-foreground">{value}</span>
                      </div>
                    ))}
                    {lastContact && (
                      <div className="flex items-center justify-between text-xs border-t border-border pt-2 mt-2">
                        <span className="text-muted-foreground">Dernier contact</span>
                        <span className="font-mono font-bold text-foreground">{relDate(lastContact)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}
