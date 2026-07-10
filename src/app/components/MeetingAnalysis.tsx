import { motion } from 'motion/react';
import { useNavigate, useParams } from 'react-router';
import { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, Mail, Database, MessageSquare, Globe,
  CheckCircle2, AlertTriangle, Target, Sparkles, Loader2,
  Clock, Video, Calendar, ExternalLink, Users,
  Brain, ArrowRight, ChevronRight, Shield, TrendingDown,
  TrendingUp, Minus, Check, ListChecks, FileText, RefreshCw, Zap, X,
} from 'lucide-react';
import KnowrBadge from './knowr/KnowrBadge';
import ACard from './knowr/ACard';
import CollapsibleSection from './knowr/CollapsibleSection';
import SignalRail, { type Signal } from './knowr/SignalRail';
import ViewSwitcher from './knowr/ViewSwitcher';
import SourcesPanel from './knowr/SourcesPanel';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getMeeting, getMeetingParticipants } from '../../lib/api/meetings';
import { getActiveOrganizationId } from '../../lib/api/org';
import { supabase } from '../../lib/supabase';
import type { Meeting } from '../../types/domain';
import { trackEvent } from '../../lib/trackEvent';

// ── Types ─────────────────────────────────────────────────────────────────────
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
  interactionModes: { primary: string[]; secondary: string[] };
  personalAgenda: { motivations: string[]; confidence: number } | null;
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

// ── Helpers ────────────────────────────────────────────────────────────────────
function initials(name: string) {
  return name.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();
}


const SCORE_COLOR = (s: number) => s >= 70 ? '#2EA86A' : s >= 40 ? '#6E50C8' : '#D94F63';

// ── Mode 5 min cell ───────────────────────────────────────────────────────────
interface M5CellProps {
  label: string;
  value: string;
  warn?: boolean;
}

function M5Cell({ label, value, warn = false }: M5CellProps) {
  return (
    <div className={`flex-1 min-w-0 px-4 py-3 ${warn ? 'bg-amber/10 border-l-2 border-amber' : ''}`}>
      <p className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${warn ? 'text-amber' : 'text-muted-foreground'}`}>
        {label}
      </p>
      <p className={`text-sm leading-snug ${warn ? 'text-amber font-medium' : 'text-foreground'}`}>
        {value || '—'}
      </p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function MeetingAnalysis() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [realMeeting, setRealMeeting] = useState<Meeting | null>(null);
  const [loadedParticipants, setLoadedParticipants] = useState<Participant[]>([]);
  const [loadedSources, setLoadedSources] = useState<{ name: string; icon: any; connected: boolean; gain?: number }[]>([]);
  const [postSummary, setPostSummary] = useState<any>(null);
  const [fullProfiles, setFullProfiles] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  // Bascule Préparation ◀▶ Compte-rendu (spec-27)
  const [viewMode, setViewMode] = useState<'prep' | 'recap'>('prep');
  const [checkedTasks, setCheckedTasks] = useState<Record<string, boolean>>({});
  // Cible « Compte » du commutateur de vue (spec-25 §B)
  const [companyId, setCompanyId] = useState<string | null>(null);
  // Saisie / upload du compte-rendu pour analyse IA (spec-27)
  const [recapText, setRecapText] = useState('');
  const [analyzingRecap, setAnalyzingRecap] = useState(false);
  const [recapErr, setRecapErr] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  // Enrichissement IA des participants + compte de la réunion (spec enrichissement)
  const [enriching, setEnriching] = useState(false);
  const [enrichMsg, setEnrichMsg] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  // Brief IA complet (généré par generate-brief, stocké dans briefs.content)
  const [brief, setBrief] = useState<any | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  // Courbe d'évolution du score relationnel (participant principal)
  const [relHistory, setRelHistory] = useState<{ date: string; score: number }[]>([]);
  // Modale mail pré-RDV (action recommandée)
  const [showMail, setShowMail] = useState(false);
  const [mailConfirm, setMailConfirm] = useState(false);
  const [mailTo, setMailTo] = useState('');
  const [mailSubject, setMailSubject] = useState('');
  const [mailBody, setMailBody] = useState('');

  const openMail = () => {
    const rec = brief?.recommended_action ?? {};
    setMailTo(rec.email_recipient ?? '');
    setMailSubject(rec.email_subject ?? '');
    setMailBody(rec.email_body ?? '');
    setMailConfirm(false);
    setShowMail(true);
  };

  async function readFile(file: File) {
    setRecapErr(null);
    const okExt = /\.(txt|md|vtt|srt|csv|json|rtf|text)$/i.test(file.name);
    if (!okExt && !file.type.startsWith('text')) {
      setRecapErr('Formats texte uniquement (.txt, .md, .vtt, .srt). Pour un PDF/Word, copiez-collez le contenu.');
      return;
    }
    try {
      const text = await file.text();
      setRecapText(prev => (prev ? prev + '\n\n' : '') + text);
    } catch {
      setRecapErr('Impossible de lire le fichier.');
    }
  }

  // Enrichit (IA) les participants de la réunion + le compte lié, puis régénère le brief.
  async function enrichMeeting() {
    if (!supabase || enriching) return;
    const contactIds = loadedParticipants.map(p => p.id).filter(Boolean);
    if (contactIds.length === 0 && !companyId) {
      setEnrichMsg('Aucun participant à enrichir.');
      setTimeout(() => setEnrichMsg(null), 4000);
      return;
    }
    setEnriching(true); setEnrichMsg(null);
    try {
      const orgId = await getActiveOrganizationId();
      // Participants (contacts) — recherche IA approfondie, forcée
      await Promise.allSettled(
        contactIds.map(cid =>
          supabase!.functions.invoke('enrich-agent', {
            body: { contactId: cid, organizationId: orgId, forceRefresh: true },
          })),
      );
      // Compte lié
      if (companyId) {
        await supabase.functions.invoke('enrich-agent', {
          body: { companyId, organizationId: orgId, forceRefresh: true },
        }).catch(() => {});
      }
      // Régénère le brief avec les nouvelles données
      if (id) {
        await supabase.functions.invoke('generate-brief', {
          body: { organizationId: orgId, meetingId: id, forceRefresh: true },
        }).catch(() => {});
      }
      setEnrichMsg('✓ Réunion enrichie');
      setReloadKey(k => k + 1); // recharge profils + brief
    } catch {
      setEnrichMsg('Échec — vérifie le workflow n8n.');
    } finally {
      setEnriching(false);
      setTimeout(() => setEnrichMsg(null), 6000);
    }
  }

  async function analyzeRecap() {
    if (!supabase || !id || recapText.trim().length < 20) {
      setRecapErr('Collez ou chargez au moins quelques phrases du compte-rendu.');
      return;
    }
    setAnalyzingRecap(true);
    setRecapErr(null);
    try {
      const orgId = await getActiveOrganizationId();
      const { data, error } = await supabase.functions.invoke('analyze-meeting-recap', {
        body: { meetingId: id, organizationId: orgId, transcript: recapText },
      });
      if (error) {
        let msg = error.message ?? 'Erreur d\'analyse.';
        try { const b = await (error as any)?.context?.json?.(); if (b?.error) msg = b.error; } catch { /* ignore */ }
        setRecapErr(msg);
      } else if (data?.summary) {
        setPostSummary(data.summary);
        setRecapText('');
      } else if (data?.error) {
        setRecapErr(data.error);
      }
    } catch (e: any) {
      setRecapErr(e?.message ?? 'Erreur inconnue.');
    } finally {
      setAnalyzingRecap(false);
    }
  }

  // ── Load data ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    let mounted = true;

    async function load() {
      setLoading(true);

      const mtg = await getMeeting(id!);
      if (mounted && mtg) setRealMeeting(mtg);

      const parts = await getMeetingParticipants(id!);
      if (mounted && parts.length > 0) {
        const snapshots: Record<string, any> = {};
        if (supabase) {
          const { data: snaps } = await supabase
            .from('relationship_snapshots')
            .select('*')
            .in('contact_id', parts.map(p => p.contact.id));
          (snaps ?? []).forEach((s: any) => { snapshots[s.contact_id] = s; });
        }

        const mapped: Participant[] = parts.map(p => {
          const prof = p.profile;
          const snap = snapshots[p.contact.id];
          const getAxisValue = (axis: string) => prof?.axes.find((a: any) => a.axis === axis)?.value ?? 50;
          const getModes = (primary: boolean) => {
            if (!prof) return [];
            const sorted = [...prof.interactionModes].sort((a: any, b: any) => b.score - a.score);
            const top = sorted.filter((m: any) => m.score >= 60);
            if (primary) return top.slice(0, 2).map((m: any) => m.mode);
            return sorted.filter((m: any) => m.score >= 40 && m.score < 60).slice(0, 1).map((m: any) => m.mode);
          };
          return {
            id: p.contact.id,
            name: p.contact.name,
            role: p.contact.title,
            company: p.contact.company,
            badge: null,
            influenceDots: Math.max(1, Math.min(5, Math.round((prof?.globalConfidence ?? 0) / 20))),
            behavioralSignals: prof?.signals.slice(0, 3).map((s: any) => s.text) ?? [],
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

        if (supabase && parts.length > 0) {
          const contactIds = parts.map(p => p.contact.id).filter(Boolean);
          if (contactIds.length > 0) {
            const { data: cps } = await supabase
              .from('cognitive_profiles')
              .select('contact_id, executive_summary, cognitive_mode, cognitive_mode_confidence, interaction_modes_data, jtbd_data, theory_of_mind_data, behavioral_analysis_data, engagement_score, score_phase, score_delta')
              .in('contact_id', contactIds)
              .order('profile_version', { ascending: false });
            const profileMap: Record<string, any> = {};
            (cps ?? []).forEach((cp: any) => {
              if (!profileMap[cp.contact_id]) profileMap[cp.contact_id] = cp;
            });
            if (mounted) setFullProfiles(profileMap);

            // Résout le compte lié (commutateur de vue spec-25) via le company_id d'un participant
            const { data: ctRows } = await supabase
              .from('contacts')
              .select('company_id')
              .in('id', contactIds)
              .not('company_id', 'is', null)
              .limit(1);
            if (mounted && ctRows?.[0]?.company_id) setCompanyId(ctRows[0].company_id);
          }
        }
      }

      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: connectors } = await supabase
            .from('connectors').select('provider, status').eq('user_id', user.id);
          const map: Record<string, boolean> = {};
          (connectors ?? []).forEach((c: any) => { map[c.provider] = c.status === 'connected'; });
          setLoadedSources([
            { name: 'Gmail',    icon: Mail,        connected: map['google']   ?? false },
            { name: 'Slack',    icon: MessageSquare, connected: map['slack']  ?? false, gain: 20 },
            { name: 'LinkedIn', icon: Globe,       connected: map['linkedin'] ?? false },
            { name: 'HubSpot',  icon: Database,    connected: map['hubspot']  ?? false, gain: 12 },
          ]);
        }
      }

      if (supabase) {
        const { data: psum } = await supabase
          .from('meeting_post_summaries').select('*').eq('meeting_id', id!).maybeSingle();
        if (mounted) setPostSummary(psum ?? null);
      }

      // Brief IA complet (le + récent) — pilote les sections de préparation
      if (supabase) {
        const oid = await getActiveOrganizationId();
        if (mounted) setOrgId(oid);
        const { data: briefRow } = await supabase
          .from('briefs')
          .select('content')
          .eq('meeting_id', id!)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (mounted) setBrief((briefRow as any)?.content ?? null);

        // Courbe relationnelle du participant principal
        const primaryId = parts[0]?.contact.id;
        if (primaryId && oid) {
          const { data: hist } = await supabase
            .from('contact_score_history')
            .select('score, snapshot_date')
            .eq('organization_id', oid)
            .eq('contact_id', primaryId)
            .order('snapshot_date', { ascending: true })
            .limit(30);
          if (mounted) setRelHistory((hist ?? []).map((h: any) => ({
            date: new Date(h.snapshot_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
            score: h.score,
          })));
        }
      }

      if (mounted) setLoading(false);
    }

    load();
    return () => { mounted = false; };
  }, [id, reloadKey]);

  // ── Behavioral tracking ────────────────────────────────────────────────────
  const openedAt = useRef<number>(Date.now());
  useEffect(() => {
    if (!id || loading) return;
    trackEvent({ event_type: 'brief_open', entity_id: id, entity_type: 'meeting' });
    openedAt.current = Date.now();
    return () => {
      trackEvent({ event_type: 'brief_close', entity_id: id, entity_type: 'meeting',
        duration_ms: Date.now() - openedAt.current });
    };
  }, [id, loading]);

  // ── Send brief email ───────────────────────────────────────────────────────
  async function handleSendBriefEmail() {
    if (!supabase || !id || sendingEmail) return;
    setSendingEmail(true); setEmailError(null);
    try {
      const orgId = await getActiveOrganizationId();
      const { data, error } = await supabase.functions.invoke('send-brief-email', {
        body: { meetingId: id, organizationId: orgId },
      });
      if (error) {
        const body = await (error as any)?.context?.json?.().catch(() => null);
        if (body?.already_sent) { setEmailSent(true); return; }
        setEmailError(body?.error ?? (error as any)?.message ?? 'Erreur envoi');
      } else if (data?.success) {
        setEmailSent(true);
        setTimeout(() => setEmailSent(false), 5000);
      }
    } catch (e: any) {
      setEmailError(e?.message ?? 'Erreur inconnue');
    } finally {
      setSendingEmail(false);
    }
  }

  // ── Derived values ─────────────────────────────────────────────────────────
  const isPast = realMeeting ? new Date(realMeeting.startsAt) < new Date() : false;

  const durationMin = realMeeting && (realMeeting as any).endsAt
    ? Math.round((new Date((realMeeting as any).endsAt).getTime() - new Date(realMeeting.startsAt).getTime()) / 60000)
    : null;

  const meeting = realMeeting ? {
    title:    realMeeting.title,
    company:  realMeeting.company || '—',
    type:     realMeeting.briefStatus === 'ready' || realMeeting.briefStatus === 'consulted' ? 'Brief prêt' : 'Brief en attente',
    date:     new Date(realMeeting.startsAt).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    time:     new Date(realMeeting.startsAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    timeEnd:  (realMeeting as any).endsAt
      ? new Date((realMeeting as any).endsAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      : null,
    location: (realMeeting as any).location ?? null,
    platform: (realMeeting as any).format === 'physical' ? 'Présentiel' : 'Google Meet',
    isExternal: (realMeeting as any).isExternal ?? true,
  } : null;

  const participants = loadedParticipants;
  const sources = loadedSources.length > 0 ? loadedSources : [
    { name: 'Gmail',    icon: Mail,          connected: false },
    { name: 'Slack',    icon: MessageSquare, connected: false, gain: 20 },
    { name: 'LinkedIn', icon: Globe,         connected: false },
    { name: 'HubSpot',  icon: Database,      connected: false, gain: 12 },
  ];

  const participantScores = participants
    .map(p => fullProfiles[p.id]?.engagement_score ?? p.relationContext?.engagementScore ?? 0)
    .filter(s => s > 0);
  const relationScore = participantScores.length > 0
    ? Math.round(participantScores.reduce((a, b) => a + b, 0) / participantScores.length)
    : (realMeeting?.importanceScore ?? 0);

  const enrichedCount = participants.filter(p => fullProfiles[p.id]).length;
  const confidenceScore = participants.length > 0
    ? Math.round((enrichedCount / participants.length) * 100)
    : 0;

  const atRiskParticipants = participants.filter(p => {
    const fp = fullProfiles[p.id];
    return fp?.score_phase === 'decline' ||
      (p.relationContext && p.relationContext.lastContactDays > (p.relationContext.avgFrequencyDays || 30) * 1.5);
  });

  const openingQuestions = participants
    .map(p => ({ participant: p, question: fullProfiles[p.id]?.jtbd_data?.qualify_question ?? null }))
    .filter(q => q.question);

  const commAdaptations = participants.map(p => {
    const fp = fullProfiles[p.id];
    const mode = fp?.cognitive_mode;
    let tip = '';
    if (mode === 's1_dominant') tip = 'Direct et concis. Décisions simples. Éviter les longues présentations.';
    else if (mode === 's2_dominant') tip = 'Données précises. Temps de réflexion. Structure claire.';
    else tip = 'Adapter selon le contexte. Sonder l\'état d\'esprit en ouverture.';
    return { participant: p, mode, modes: fp?.interaction_modes_data ?? [], tip, fp };
  });

  // Theory of Mind — premier participant enrichi
  const tomData = (() => {
    for (const p of participants) {
      const fp = fullProfiles[p.id];
      if (fp?.theory_of_mind_data && Object.keys(fp.theory_of_mind_data).length > 0) {
        return { participant: p, data: fp.theory_of_mind_data };
      }
    }
    return null;
  })();

  // Mode 5 min cells
  const firstJTBD = (() => {
    for (const p of participants) {
      const fp = fullProfiles[p.id];
      if (fp?.jtbd_data?.functional_job?.text) return fp.jtbd_data.functional_job;
    }
    return null;
  })();

  const firstOpeningQ = openingQuestions[0]?.question ?? null;
  const mainAtRisk = atRiskParticipants[0];
  const firstExecSummary = (() => {
    for (const p of participants) {
      const fp = fullProfiles[p.id];
      if (fp?.executive_summary) return fp.executive_summary;
    }
    return postSummary?.summary_text ?? null;
  })();

  // Signaux rail
  const signals: Signal[] = [];
  atRiskParticipants.forEach(p => {
    const fp = fullProfiles[p.id];
    signals.push({
      tag: fp?.score_phase === 'decline' ? 'Churn' : 'Risque',
      text: `${p.name} — ${fp?.score_phase === 'decline' ? 'Relation en déclin' : `Dernier contact il y a ${p.relationContext?.lastContactDays}j`}`,
      source: 'Mémoire Tohu',
      provenance: 'observable',
    });
  });
  participants.forEach(p => {
    const fp = fullProfiles[p.id];
    if (fp?.jtbd_data?.functional_job?.pitch_angle) {
      signals.push({
        tag: 'Levier',
        text: fp.jtbd_data.functional_job.pitch_angle,
        source: 'Analyse Tohu',
        provenance: 'inferred',
      });
    }
  });

  // ── Vue Compte-rendu (spec-27) ──────────────────────────────────────────────
  function renderCompteRendu() {
    const decisions: any[] = Array.isArray(postSummary?.key_decisions) ? postSummary.key_decisions : [];
    const tasks: any[]     = Array.isArray(postSummary?.action_items)  ? postSummary.action_items  : [];
    const objections: any[] = Array.isArray(postSummary?.objections)   ? postSummary.objections    : [];
    const hasRecapData = Boolean(postSummary) && (decisions.length || tasks.length || objections.length || postSummary?.summary_text);
    const isProjected = !postSummary; // valeurs projetées si pas de CR réel

    // Objectifs atteints — projeté faute de transcript (marqué « exemple maquette »)
    const objAchieved = decisions.length > 0 ? Math.min(3, decisions.length) : 0;

    const txt = (v: any) => typeof v === 'string' ? v : (v?.text ?? v?.title ?? v?.label ?? JSON.stringify(v));

    return (
      <div className="space-y-4">
        {/* Hero recap */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl overflow-hidden p-5 flex items-center gap-6 flex-wrap"
          style={{ background: '#13111E' }}
        >
          <div className="text-center">
            <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--mono)' }}>Objectifs atteints</p>
            <p className="text-4xl font-black leading-none" style={{ color: objAchieved >= 2 ? '#2EA86A' : objAchieved === 1 ? '#C97A20' : '#D94F63' }}>
              {objAchieved}<span className="text-lg" style={{ color: 'rgba(255,255,255,0.3)' }}>/3</span>
            </p>
          </div>
          <div className="w-px h-10" style={{ background: 'rgba(255,255,255,0.08)' }} />
          <div className="text-center">
            <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--mono)' }}>Décisions</p>
            <p className="text-4xl font-black leading-none" style={{ color: '#B39DDB' }}>{decisions.length}</p>
          </div>
          <div className="w-px h-10" style={{ background: 'rgba(255,255,255,0.08)' }} />
          <div className="text-center">
            <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--mono)' }}>Tâches</p>
            <p className="text-4xl font-black leading-none" style={{ color: '#B39DDB' }}>{tasks.length}</p>
          </div>
          {isProjected && (
            <span className="ml-auto text-[10px] font-bold px-2 py-1 rounded-full"
              style={{ background: 'rgba(201,122,32,0.2)', color: '#F0C07A', fontFamily: 'var(--mono)' }}>
              EXEMPLE MAQUETTE
            </span>
          )}
        </motion.div>

        {!hasRecapData && (
          <div className="bg-card rounded-2xl border border-border p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="size-5 text-primary" />
              <p className="text-sm font-bold">Générer le compte-rendu avec l'IA</p>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Collez vos notes de séance ou le transcript (Read.ai / Fathom / Meet), ou glissez un fichier texte.
              L'IA analyse l'échange selon la doctrine Tohu (décisions, engagements, objections, lecture relationnelle).
            </p>

            {/* Zone d'édition + glisser-déposer */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault(); setDragOver(false);
                const f = e.dataTransfer.files?.[0];
                if (f) readFile(f);
              }}
              className="rounded-xl border-2 border-dashed transition-colors"
              style={{ borderColor: dragOver ? '#6E50C8' : 'var(--border)', background: dragOver ? 'var(--violet-s)' : 'transparent' }}
            >
              <textarea
                value={recapText}
                onChange={(e) => setRecapText(e.target.value)}
                placeholder="Collez ici le compte-rendu / transcript… ou glissez-déposez un fichier .txt / .vtt / .md"
                rows={10}
                className="w-full bg-transparent p-4 text-sm resize-y focus:outline-none rounded-xl"
              />
            </div>

            {recapErr && <p className="text-xs text-destructive mt-2">{recapErr}</p>}

            <div className="flex flex-wrap items-center gap-3 mt-4">
              <label className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-border rounded-xl cursor-pointer hover:bg-muted/40 transition-colors">
                <FileText className="size-3.5" /> Charger un fichier
                <input
                  type="file"
                  accept=".txt,.md,.vtt,.srt,.csv,.json,.rtf,.text,text/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) readFile(f); e.currentTarget.value = ''; }}
                />
              </label>
              {recapText.trim().length > 0 && (
                <span className="text-[11px] text-muted-foreground font-mono">{recapText.trim().length} caractères</span>
              )}
              <button
                onClick={analyzeRecap}
                disabled={analyzingRecap || recapText.trim().length < 20}
                className="ml-auto flex items-center gap-2 px-4 py-2 text-sm font-bold text-white rounded-xl disabled:opacity-40"
                style={{ background: '#6E50C8' }}
              >
                {analyzingRecap ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                {analyzingRecap ? 'Analyse en cours…' : 'Analyser avec l\'IA'}
              </button>
            </div>
          </div>
        )}

        {/* Synthèse + Analyse relationnelle Tohu (IA) */}
        {postSummary?.summary_text && (
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2" style={{ fontFamily: 'var(--mono)' }}>Synthèse</p>
            <p className="text-sm text-foreground leading-relaxed mb-3">{postSummary.summary_text}</p>
            {postSummary?.sources?.analysis && (
              <div className="rounded-xl p-4" style={{ background: 'var(--violet-s)', border: '1px solid var(--violet-x)' }}>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--violet-d)', fontFamily: 'var(--mono)' }}>Analyse Tohu</p>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--t1)' }}>{postSummary.sources.analysis}</p>
              </div>
            )}
          </div>
        )}

        {/* Par personne présente (.pcard) */}
        {participants.length > 0 && (
          <CollapsibleSection title="Par personne présente" icon={<Users className="size-4" />} badge={String(participants.length)} defaultOpen>
            <div className="space-y-3">
              {participants.map(p => {
                const fp = fullProfiles[p.id];
                const score = fp?.engagement_score ?? p.relationContext?.engagementScore ?? null;
                const delta = fp?.score_delta ?? null;
                const phase = fp?.score_phase as string | undefined;
                const TrendIco = phase === 'growth' ? TrendingUp : phase === 'decline' ? TrendingDown : Minus;
                const trendColor = phase === 'growth' ? '#2EA86A' : phase === 'decline' ? '#D94F63' : '#9082B8';
                return (
                  <div key={p.id} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="size-9 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg,#6E50C8,#9747FF)' }}>
                        {initials(p.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <button onClick={() => navigate(`/contact/${p.id}`)} className="text-sm font-semibold hover:text-primary transition-colors truncate block">
                          {p.name}
                        </button>
                        <p className="text-xs text-muted-foreground truncate">{p.role || '—'}</p>
                      </div>
                      {/* Impact sur le score */}
                      {score !== null && (
                        <div className="text-right flex items-center gap-2">
                          <div>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground" style={{ fontFamily: 'var(--mono)' }}>Impact score</p>
                            <div className="flex items-center justify-end gap-1.5">
                              <TrendIco className="size-3.5" style={{ color: trendColor }} />
                              <span className="text-lg font-black font-mono" style={{ color: trendColor }}>{score}</span>
                              {delta != null && delta !== 0 && (
                                <span className="text-[11px] font-mono text-muted-foreground">{delta > 0 ? '+' : ''}{delta}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CollapsibleSection>
        )}

        {/* Décisions & points clés */}
        {decisions.length > 0 && (
          <CollapsibleSection title="Décisions & points clés" icon={<CheckCircle2 className="size-4" />} badge={String(decisions.length)} defaultOpen>
            <ul className="space-y-2">
              {decisions.map((d, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm">
                  <CheckCircle2 className="size-4 text-success flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">{txt(d)}</span>
                </li>
              ))}
            </ul>
          </CollapsibleSection>
        )}

        {/* Tâches à réaliser (cochables) */}
        {tasks.length > 0 && (
          <CollapsibleSection title="Tâches à réaliser" icon={<ListChecks className="size-4" />} badge={String(tasks.length)} defaultOpen>
            <div className="space-y-2">
              {tasks.map((t, i) => {
                const key = `task-${i}`;
                const done = checkedTasks[key];
                const owner = typeof t === 'object' ? (t.owner ?? t.assignee) : null;
                const due = typeof t === 'object' ? (t.due ?? t.due_date ?? t.echeance) : null;
                return (
                  <button
                    key={key}
                    onClick={() => setCheckedTasks(prev => ({ ...prev, [key]: !prev[key] }))}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/20 transition-colors text-left"
                  >
                    <span className={`size-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${done ? 'bg-primary border-primary' : 'border-border'}`}>
                      {done && <Check className="size-3.5 text-white" />}
                    </span>
                    <span className={`flex-1 text-sm ${done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{txt(t)}</span>
                    {owner && <span className="text-[10px] font-mono text-muted-foreground">{owner}</span>}
                    {due && <span className="text-[10px] font-mono text-primary">{due}</span>}
                  </button>
                );
              })}
            </div>
          </CollapsibleSection>
        )}

        {/* Objections */}
        {objections.length > 0 && (
          <CollapsibleSection title="Objections" icon={<AlertTriangle className="size-4" />} badge={String(objections.length)} defaultOpen={false}>
            <ul className="space-y-2">
              {objections.map((o, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm">
                  <AlertTriangle className="size-4 text-warning flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">{txt(o)}</span>
                </li>
              ))}
            </ul>
          </CollapsibleSection>
        )}

        {/* Sync CRM — double validation (jamais automatique) */}
        {hasRecapData && (
          <div className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3 flex-wrap">
            <Database className="size-5 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">Synchroniser vers le CRM</p>
              <p className="text-xs text-muted-foreground">Validation manuelle requise — jamais automatique.</p>
            </div>
            <button
              onClick={() => alert('Sync CRM : 2ᵉ validation manuelle requise (à brancher sur le connecteur HubSpot/Salesforce).')}
              className="px-3 py-2 text-xs font-semibold text-white rounded-xl flex items-center gap-1.5"
              style={{ background: '#6E50C8' }}
            >
              <RefreshCw className="size-3.5" /> Valider la sync
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Loading states ─────────────────────────────────────────────────────────
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

  if (!realMeeting || !meeting) {
    return (
      <div className="size-full flex items-center justify-center bg-background">
        <div className="text-center">
          <Calendar className="size-12 text-muted-foreground mx-auto mb-4 opacity-40" />
          <h2 className="text-xl font-bold mb-2">Réunion introuvable</h2>
          <p className="text-muted-foreground mb-6">Cette réunion n'existe pas ou a été supprimée.</p>
          <button onClick={() => navigate('/meetings')} className="px-4 py-2 bg-primary text-white rounded-xl text-sm">
            Retour aux réunions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="size-full overflow-auto" style={{ background: 'var(--color-background)' }}>
      <div className="max-w-6xl mx-auto px-4 py-6 md:px-8">

        {/* Back */}
        <button
          onClick={() => navigate('/meetings')}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-5"
        >
          <ArrowLeft className="size-4" /> Retour aux réunions
        </button>

        {/* Commutateur de vue Réunion · Personne · Compte (spec-25 §B) — au-dessus du hero */}
        <div className="flex justify-center mb-4">
          <ViewSwitcher
            active="reunion"
            meetingId={id}
            contacts={participants.map(p => ({ id: p.id, name: p.name, role: p.role }))}
            companyId={companyId}
          />
        </div>

        {/* ── BASCULE PRÉPARATION · Avant ◀▶ COMPTE-RENDU (spec-27) — au-dessus du hero ── */}
        <div className="flex items-center rounded-full border border-border bg-card overflow-hidden w-fit mb-4 p-1">
          <button
            onClick={() => setViewMode('prep')}
            className={`px-4 py-1.5 text-xs font-bold rounded-full transition-colors ${
              viewMode === 'prep' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Préparation · Avant
          </button>
          <button
            onClick={() => setViewMode('recap')}
            className={`px-4 py-1.5 text-xs font-bold rounded-full transition-colors ${
              viewMode === 'recap' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Compte-rendu ▶
          </button>
        </div>

        {/* ══ HERO HEADER DARK ══════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl overflow-hidden mb-4"
          style={{ background: '#13111E' }}
        >
          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap mb-2">
                  <KnowrBadge variant={isPast ? 'muted' : meeting.isExternal ? 'violet' : 'blue'} size="sm">
                    {isPast ? 'Terminée' : meeting.isExternal ? 'Commercial' : 'Productivité'}
                  </KnowrBadge>
                  {confidenceScore > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: `rgba(${confidenceScore >= 60 ? '46,168,106' : '201,122,32'},0.15)`,
                               color: confidenceScore >= 60 ? '#2EA86A' : '#C97A20',
                               border: `1px solid rgba(${confidenceScore >= 60 ? '46,168,106' : '201,122,32'},0.3)` }}>
                      Conf. {confidenceScore}%
                    </span>
                  )}
                </div>
                <h1 className="text-2xl font-black leading-tight" style={{ color: '#fff' }}>
                  {meeting.title}
                </h1>
                {meeting.company !== '—' && (
                  <p className="text-base mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    {meeting.company}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Enrichir (IA) — recherche approfondie participants + compte, régénère le brief */}
                <button
                  onClick={enrichMeeting}
                  disabled={enriching}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-60"
                  style={{ background: '#6E50C8', color: '#fff' }}
                  title="Recherche IA approfondie sur les participants et le compte, puis régénère le brief"
                >
                  {enriching
                    ? <><Loader2 className="size-3.5 animate-spin" /> Enrichissement…</>
                    : <><Sparkles className="size-3.5" /> Enrichir (IA)</>}
                </button>
                {enrichMsg && (
                  <span className="text-[10px] max-w-[150px]"
                    style={{ color: enrichMsg.startsWith('✓') ? '#96DDB8' : '#F0A0AD' }}>
                    {enrichMsg}
                  </span>
                )}
                {!isPast && realMeeting?.briefStatus !== 'to_generate' && (
                  <button
                    onClick={handleSendBriefEmail}
                    disabled={sendingEmail || emailSent}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                      emailSent
                        ? 'bg-success/10 text-success border border-success/20'
                        : 'bg-white/10 hover:bg-white/15 text-white'
                    } disabled:opacity-60`}
                  >
                    {sendingEmail
                      ? <><span className="size-3.5 border-2 border-white/60 border-t-transparent rounded-full animate-spin" /> Envoi…</>
                      : emailSent
                      ? <><CheckCircle2 className="size-3.5" /> Brief envoyé !</>
                      : <><Mail className="size-3.5" /> Envoyer le brief</>}
                  </button>
                )}
                {emailError && <p className="text-[10px] text-coral max-w-[160px]">{emailError}</p>}
              </div>
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-4 mt-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
              <span className="flex items-center gap-1.5 text-xs">
                <Calendar className="size-3" /> {meeting.date}
              </span>
              <span className="flex items-center gap-1.5 text-xs">
                <Clock className="size-3" />
                {meeting.time}{meeting.timeEnd ? ` → ${meeting.timeEnd}` : ''}{durationMin ? ` (${durationMin}min)` : ''}
              </span>
              {meeting.location ? (
                <a href={meeting.location} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs hover:text-white transition-colors">
                  <Video className="size-3" /> {meeting.platform} <ExternalLink className="size-2.5" />
                </a>
              ) : (
                <span className="flex items-center gap-1.5 text-xs">
                  <Video className="size-3" /> {meeting.platform}
                </span>
              )}
              {participants.length > 0 && (
                <span className="flex items-center gap-1.5 text-xs">
                  <Users className="size-3" /> {participants.length} participant{participants.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          {/* Score relationnel bar */}
          {relationScore > 0 && (
            <div className="px-6 pb-4 flex items-center gap-4 flex-wrap border-t" style={{ borderColor: 'rgba(255,255,255,0.05)', paddingTop: 12 }}>
              <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Score relationnel moyen</p>
              <span className="text-2xl font-black leading-none" style={{ color: SCORE_COLOR(relationScore) }}>{relationScore}</span>
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)', maxWidth: 160 }}>
                <div className="h-full rounded-full" style={{ width: `${relationScore}%`, background: SCORE_COLOR(relationScore) }} />
              </div>
              {sources.map((s, i) => s.connected && (
                <span key={i} className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(46,168,106,0.15)', color: '#2EA86A', border: '1px solid rgba(46,168,106,0.3)' }}>
                  {s.name} ✓
                </span>
              ))}
            </div>
          )}
        </motion.div>

        {/* ══ ACARDS PARTICIPANTS + COMPTE ═════════════════════════════════════ */}
        {participants.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4"
          >
            {participants.slice(0, 4).map(p => {
              const fp = fullProfiles[p.id];
              const score = fp?.engagement_score ?? p.relationContext?.engagementScore ?? null;
              return (
                <ACard
                  key={p.id}
                  eyebrow={p.role || 'Participant'}
                  name={p.name}
                  subtitle={p.company || undefined}
                  score={score}
                  initials={initials(p.name)}
                  onClick={() => navigate(`/contact/${p.id}`)}
                />
              );
            })}
            {meeting.company && meeting.company !== '—' && (
              <ACard
                eyebrow="Compte"
                name={meeting.company}
                onClick={() => navigate('/contacts')}
              />
            )}
          </motion.div>
        )}

        {/* ══ PAGE LAYOUT: MAIN + ASIDE ══════════════════════════════════════ */}
        <div className="flex flex-col lg:flex-row gap-5">

          {/* ── MAIN COL ─────────────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-4">

            {/* ══ VUE COMPTE-RENDU (état « Après ») ══════════════════════════ */}
            {viewMode === 'recap' && renderCompteRendu()}

            {/* ══ VUE PRÉPARATION (état « Avant ») ═══════════════════════════ */}
            {viewMode === 'prep' && (<>

            {/* ── SOURCES CONNECTÉES ──────────────────────────────────────────── */}
            <SourcesPanel
              organizationId={orgId}
              hasPublicData={Boolean(brief?.context?.company_context?.sector || Object.keys(fullProfiles).length > 0)}
              provenanceNote="Brief construit depuis la messagerie (échanges réels) + profils cognitifs. Enrichir (IA) complète via sources publiques."
            />

            {/* ── MODE 5 MIN ──────────────────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="rounded-2xl overflow-hidden border border-border bg-card"
            >
              <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
                <Clock className="size-4 text-muted-foreground" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Mode 5 min · Scan 30s</span>
              </div>
              <div className="flex divide-x divide-border overflow-x-auto">
                <M5Cell
                  label="Ce qu'il·elle attend"
                  value={brief?.express?.expectation ?? firstExecSummary ?? (meeting.company !== '—' ? `${meeting.company} — ${participants.length} participant${participants.length > 1 ? 's' : ''}` : 'À qualifier')}
                />
                <M5Cell
                  label="1ʳᵉ phrase à dire"
                  value={brief?.express?.opening_question ?? firstOpeningQ ?? 'Poser en ouverture : «Quels sont vos critères de succès ?»'}
                />
                <M5Cell
                  label="À obtenir"
                  value={brief?.express?.to_obtain ?? firstJTBD?.text ?? 'À qualifier en ouverture de réunion'}
                />
                <M5Cell
                  label="Anti-pattern"
                  value={brief?.express?.anti_pattern ?? (tomData?.data.likely_skepticism ? `Éviter : ${tomData.data.likely_skepticism}` : 'Laisser le RDV dériver hors objectif')}
                  warn
                />
                <M5Cell
                  label="Signal de succès"
                  value={brief?.express?.success_signal ?? (mainAtRisk ? `⚠️ Réactiver ${mainAtRisk.name}` : 'Accord sur une prochaine étape concrète')}
                  warn={!brief && !!mainAtRisk}
                />
              </div>
            </motion.div>

            {/* ══ SECTIONS BRIEF IA (maquette réunion) ══════════════════════════ */}
            {brief && (() => {
              const ex = brief.express ?? {};
              const obj = brief.objectives ?? {};
              const spin: any[] = Array.isArray(brief.spin_questions) ? brief.spin_questions : [];
              const tom = brief.people?.primary_profile?.theory_of_mind ?? {};
              const md = brief.deal?.meddpicc ?? {};
              const objections: any[] = Array.isArray(brief.action?.objections) ? brief.action.objections : [];
              const pivots: any[] = Array.isArray(brief.pivots) ? brief.pivots : [];
              const why = brief.why_now ?? {};
              const rec = brief.recommended_action ?? {};
              const dotsFor = (lvl?: string) => lvl === 'observable' ? 3 : lvl === 'inferred' ? 2 : lvl === 'hypothetical' ? 1 : 0;
              const SPIN_LABEL: Record<string, string> = { situation: 'Situation', problem: 'Problème', implication: 'Implication', need_payoff: 'Need-payoff' };
              const MEDDPICC: { k: string; key: string; label: string }[] = [
                { k: 'M', key: 'metrics', label: 'Metrics' },
                { k: 'E', key: 'economic_buyer', label: 'Economic Buyer' },
                { k: 'D', key: 'decision_criteria', label: 'Decision Criteria' },
                { k: 'D', key: 'decision_process', label: 'Decision Process' },
                { k: 'P', key: 'paper_process', label: 'Paper Process' },
                { k: 'I', key: 'identify_pain', label: 'Identify Pain' },
                { k: 'C', key: 'champion', label: 'Champion' },
                { k: 'C', key: 'competition', label: 'Competition' },
              ];
              return (
                <div className="space-y-4">

                  {/* POURQUOI MAINTENANT */}
                  {(why.interpretation || why.signal_verbatim) && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl p-5 border" style={{ background: 'rgba(110,80,200,0.06)', borderColor: 'rgba(110,80,200,0.2)' }}>
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="size-4 text-primary" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Pourquoi maintenant</span>
                      </div>
                      {why.signal_verbatim && (
                        <p className="text-sm italic text-foreground mb-1.5">« {why.signal_verbatim} »</p>
                      )}
                      {why.interpretation && <p className="text-sm text-muted-foreground">{why.interpretation}</p>}
                      {(why.date || why.source) && (
                        <p className="text-[10px] text-muted-foreground mt-2" style={{ fontFamily: 'var(--mono)' }}>
                          {[why.source, why.date].filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </motion.div>
                  )}

                  {/* ACTION RECOMMANDÉE */}
                  {(rec.label || rec.rationale) && (
                    <div className="rounded-2xl overflow-hidden border border-primary/30 bg-card">
                      <div className="flex items-center gap-2 px-5 py-3 border-b border-border" style={{ background: 'rgba(110,80,200,0.05)' }}>
                        <Target className="size-4 text-primary" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Action recommandée · le moteur a tranché</span>
                      </div>
                      <div className="p-5 flex flex-wrap items-center gap-4">
                        <div className="flex-1 min-w-[200px]">
                          <p className="text-base font-bold text-foreground">{rec.label ?? 'Prochaine action'}</p>
                          {rec.rationale && <p className="text-sm text-muted-foreground mt-0.5">{rec.rationale}</p>}
                        </div>
                        {rec.type === 'send_email' && rec.email_body && (
                          <button
                            onClick={openMail}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
                            style={{ background: '#6E50C8' }}
                          >
                            <Mail className="size-4" /> Ouvrir le mail
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* OBJECTIF · 3 TIERS */}
                  {(obj.minimal || obj.nominal || obj.stretch) && (
                    <CollapsibleSection title="Objectif · 3 tiers" icon={<Target className="size-4" />} defaultOpen>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                          { lbl: 'Succès minimal', val: obj.minimal, c: '#C97A20' },
                          { lbl: 'Objectif nominal', val: obj.nominal, c: '#6E50C8' },
                          { lbl: 'Stretch goal', val: obj.stretch, c: '#2EA86A' },
                        ].filter(t => t.val).map(t => (
                          <div key={t.lbl} className="rounded-xl border border-border bg-muted/20 p-3">
                            <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: t.c, fontFamily: 'var(--mono)' }}>{t.lbl}</p>
                            <p className="text-sm text-foreground leading-snug">{t.val}</p>
                          </div>
                        ))}
                      </div>
                    </CollapsibleSection>
                  )}

                  {/* QUESTIONS DE DÉCOUVERTE · SPIN */}
                  {spin.length > 0 && (
                    <CollapsibleSection title="Questions de découverte · SPIN" icon={<MessageSquare className="size-4" />} defaultOpen>
                      <div className="space-y-3">
                        {spin.map((q, i) => (
                          <div key={i} className="rounded-xl border border-border p-3">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1.5">{SPIN_LABEL[q.type] ?? q.type}</p>
                            <p className="text-sm text-foreground font-medium">« {q.question} »</p>
                            {q.rationale && <p className="text-[11px] text-muted-foreground mt-1">→ {q.rationale}</p>}
                          </div>
                        ))}
                      </div>
                    </CollapsibleSection>
                  )}

                  {/* THEORY OF MIND (enrichie depuis le brief) */}
                  {(Array.isArray(tom.knows) && tom.knows.length > 0) || (Array.isArray(tom.believes) && tom.believes.length > 0) || tom.mood || tom.risk ? (
                    <CollapsibleSection title="Theory of Mind — ce qu'il·elle pense du RDV" icon={<Brain className="size-4" />}
                      defaultOpen={false}>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                        {[
                          { t: '✅ Ce qu\'il·elle sait', arr: tom.knows, c: '#2EA86A' },
                          { t: '❓ Ce qu\'il·elle ignore', arr: tom.doesnt_know, c: '#C97A20' },
                          { t: '⚠️ Ce qu\'il·elle croit', arr: tom.believes, c: '#D94F63' },
                        ].filter(b => Array.isArray(b.arr) && b.arr.length).map(b => (
                          <div key={b.t} className="rounded-xl border border-border bg-muted/20 p-3">
                            <p className="text-[11px] font-bold mb-1.5" style={{ color: b.c }}>{b.t}</p>
                            <ul className="space-y-1">
                              {b.arr.map((x: string, i: number) => <li key={i} className="text-[12px] text-foreground leading-snug">• {x}</li>)}
                            </ul>
                          </div>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {tom.mood && <p className="text-xs text-muted-foreground flex-1 min-w-[200px]">💡 <span className="font-semibold text-foreground">Humeur :</span> {tom.mood}</p>}
                        {tom.risk && <p className="text-xs text-muted-foreground flex-1 min-w-[200px]">🎯 <span className="font-semibold text-foreground">Risque :</span> {tom.risk}</p>}
                      </div>
                    </CollapsibleSection>
                  ) : null}

                  {/* DEAL · MEDDPICC */}
                  {MEDDPICC.some(m => md[m.key]?.value) && (
                    <CollapsibleSection title="Deal · MEDDPICC" icon={<Target className="size-4" />}
                      badge={md.health_score != null ? `${md.health_score}/8` : undefined} defaultOpen={false}>
                      <div className="space-y-2">
                        {MEDDPICC.map(m => {
                          const cell = md[m.key] ?? {};
                          const n = dotsFor(cell.level);
                          return (
                            <div key={m.key} className="flex items-start gap-3 rounded-xl border border-border p-3">
                              <span className="size-6 flex-shrink-0 rounded-md flex items-center justify-center text-[11px] font-black"
                                style={{ background: 'rgba(110,80,200,0.12)', color: '#6E50C8' }}>{m.k}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-0.5">
                                  <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{m.label}</span>
                                  <span className="flex gap-0.5 flex-shrink-0">
                                    {[0,1,2].map(d => (
                                      <span key={d} className="size-1.5 rounded-full" style={{ background: d < n ? '#6E50C8' : '#E0DAF0' }} />
                                    ))}
                                  </span>
                                </div>
                                <p className="text-[13px] text-foreground leading-snug">{cell.value ?? <span className="text-muted-foreground italic">Trou à lever — à confirmer</span>}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CollapsibleSection>
                  )}

                  {/* OBJECTIONS */}
                  {objections.length > 0 && (
                    <CollapsibleSection title="Objections · réponse · anti-pattern" icon={<AlertTriangle className="size-4" />}
                      badge={String(objections.length)} defaultOpen={false}>
                      <div className="space-y-3">
                        {objections.map((o, i) => (
                          <div key={i} className="rounded-xl border border-border p-3">
                            <p className="text-sm font-semibold text-foreground mb-1.5">« {o.verbatim} »</p>
                            {o.prepared_response && (
                              <p className="text-[13px] text-foreground mb-1.5">
                                <span className="text-[10px] font-bold uppercase text-success mr-1">Réponse</span>{o.prepared_response}
                              </p>
                            )}
                            {o.anti_pattern && (
                              <p className="text-[12px] text-muted-foreground">
                                <span className="text-[10px] font-bold uppercase text-destructive mr-1">Anti-pattern</span>{o.anti_pattern}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </CollapsibleSection>
                  )}

                  {/* PIVOTS EN RÉUNION */}
                  {pivots.length > 0 && (
                    <CollapsibleSection title="Pivots en réunion" icon={<RefreshCw className="size-4" />} defaultOpen={false}>
                      <div className="space-y-3">
                        {pivots.map((p, i) => (
                          <div key={i} className="rounded-xl border border-border p-3">
                            <p className="text-[12px] text-muted-foreground mb-1">Signal · « {p.signal} »</p>
                            <p className="text-sm text-foreground font-medium">{p.script}</p>
                            {p.goal && <p className="text-[11px] text-muted-foreground mt-1">→ {p.goal}</p>}
                          </div>
                        ))}
                      </div>
                    </CollapsibleSection>
                  )}

                </div>
              );
            })()}

            {/* ── RELATION AVEC LE COMPTE · HISTORIQUE (courbe) ───────────────── */}
            {relHistory.length > 1 && (
              <CollapsibleSection title="Relation avec le compte · historique" icon={<TrendingUp className="size-4" />} defaultOpen>
                <div className="flex items-center gap-4 mb-3 flex-wrap">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Score relation</p>
                    <span className="text-3xl font-black" style={{ color: SCORE_COLOR(relHistory[relHistory.length - 1].score) }}>
                      {relHistory[relHistory.length - 1].score}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 ml-auto">
                    <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span className="size-2 rounded-full" style={{ background: '#2EA86A' }} /> Étape positive
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span className="size-2 rounded-full" style={{ background: '#D94F63' }} /> Friction
                    </span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={150}>
                  <AreaChart data={relHistory} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id="relScoreGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6E50C8" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#6E50C8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9082B8' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#9082B8' }} axisLine={false} tickLine={false} width={32} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E8E3F5', fontSize: 12 }} formatter={(v: any) => [`${v}/100`, 'Score']} />
                    <Area type="monotone" dataKey="score" stroke="#6E50C8" strokeWidth={2.5} fill="url(#relScoreGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
                <p className="text-[10px] text-muted-foreground mt-2" style={{ fontFamily: 'var(--mono)' }}>
                  Messagerie · Observable — recalculé à chaque synchro
                </p>
              </CollapsibleSection>
            )}

            {/* ── RÉSUMÉ POST-RÉUNION (si passée) ─────────────────────────────── */}
            {isPast && postSummary && (
              <CollapsibleSection
                title="Compte-rendu IA"
                icon={<CheckCircle2 className="size-4" />}
                action={true}
                defaultOpen={true}
              >
                {postSummary.summary_text && (
                  <div className="p-4 bg-primary/5 rounded-xl mb-4">
                    <p className="text-base leading-relaxed italic">{postSummary.summary_text}</p>
                  </div>
                )}
                {(postSummary.key_decisions ?? []).length > 0 && (
                  <div className="mb-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Décisions</p>
                    <div className="space-y-2">
                      {postSummary.key_decisions.map((d: any, i: number) => (
                        <div key={i} className="p-3 bg-success/10 border border-success/20 rounded-xl text-sm">
                          {typeof d === 'string' ? d : d.text}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {(postSummary.action_items ?? []).length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Actions</p>
                    <div className="space-y-2">
                      {postSummary.action_items.map((a: any, i: number) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-muted/30 rounded-xl">
                          <div className="size-4 rounded border border-border mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium">{typeof a === 'string' ? a : a.task}</p>
                            {typeof a !== 'string' && (a.owner || a.due) && (
                              <p className="text-xs text-muted-foreground">{a.owner}{a.due ? ` · ${a.due}` : ''}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CollapsibleSection>
            )}

            {/* ── THEORY OF MIND ──────────────────────────────────────────────── */}
            <CollapsibleSection
              title="Theory of Mind"
              icon={<Brain className="size-4" />}
              action={true}
              defaultOpen={true}
            >
              {tomData ? (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground mb-1">
                    État mental de <span className="font-semibold text-foreground">{tomData.participant.name}</span> pour cette réunion
                    {tomData.data.confidence != null && (
                      <span className="ml-2 font-mono">· conf. {Math.round((tomData.data.confidence ?? 0) * 100)}%</span>
                    )}
                  </p>
                  {[
                    { key: 'perceived_positioning', label: 'Comment il·elle nous perçoit', icon: '👁' },
                    { key: 'likely_skepticism',      label: 'Zone de scepticisme probable', icon: '⚠️' },
                    { key: 'credibility_gaps',        label: 'Lacunes de crédibilité',       icon: '🔍' },
                  ].map(({ key, label, icon }) => tomData.data[key] ? (
                    <div key={key} className="p-3 rounded-xl bg-muted/30 border border-border">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1.5">
                        {icon} {label}
                      </p>
                      <p className="text-sm text-foreground leading-relaxed">{tomData.data[key]}</p>
                    </div>
                  ) : null)}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Brain className="size-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">
                    Enrichissez les contacts pour activer la Theory of Mind.
                  </p>
                  {participants.length > 0 && (
                    <button
                      onClick={() => navigate(`/contact/${participants[0].id}`)}
                      className="text-xs text-primary font-medium underline"
                    >
                      Enrichir {participants[0].name} →
                    </button>
                  )}
                </div>
              )}
            </CollapsibleSection>

            {/* ── ALERTES RELATIONNELLES ──────────────────────────────────────── */}
            {atRiskParticipants.length > 0 && (
              <CollapsibleSection
                title="Alertes relationnelles"
                icon={<AlertTriangle className="size-4" />}
                badge={String(atRiskParticipants.length)}
                action={true}
                defaultOpen={true}
              >
                <div className="space-y-3">
                  {atRiskParticipants.map(p => {
                    const fp = fullProfiles[p.id];
                    const ctx = p.relationContext;
                    return (
                      <div key={p.id} className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                        <div className="flex items-start gap-3">
                          <div className="size-9 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {initials(p.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-amber-900">{p.name}</p>
                            <p className="text-xs text-amber-700 mt-0.5">
                              {fp?.score_phase === 'decline' && '📉 Relation en déclin. '}
                              {ctx && ctx.lastContactDays > (ctx.avgFrequencyDays || 30) * 1.5 &&
                                `⏰ Dernier contact il y a ${ctx.lastContactDays}j (habituel : ${ctx.avgFrequencyDays}j). `}
                            </p>
                            {fp?.executive_summary && (
                              <p className="text-xs text-amber-800 italic mt-1.5 border-t border-amber-200 pt-1.5">
                                "{fp.executive_summary}"
                              </p>
                            )}
                          </div>
                          <KnowrBadge variant="amber" size="sm">
                            {fp?.engagement_score ?? ctx?.engagementScore ?? '?'}/100
                          </KnowrBadge>
                        </div>
                        <button
                          onClick={() => navigate(`/contact/${p.id}`)}
                          className="mt-3 w-full text-xs text-amber-700 font-medium hover:underline flex items-center justify-center gap-1"
                        >
                          Voir la fiche Personne <ChevronRight className="size-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </CollapsibleSection>
            )}

            {/* ── ADAPTER SA COMMUNICATION ─────────────────────────────────── */}
            {commAdaptations.length > 0 && (
              <CollapsibleSection
                title="Adapter sa communication"
                icon={<Sparkles className="size-4" />}
                action={true}
                defaultOpen={true}
              >
                <div className="space-y-3">
                  {commAdaptations.map(({ participant, mode, modes, tip }) => (
                    <div key={participant.id} className="p-4 bg-muted/30 rounded-xl border border-border">
                      <div className="flex items-start gap-3">
                        <div className="size-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {initials(participant.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-semibold text-sm">{participant.name}</span>
                            {mode && mode !== 'unavailable' && (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                {mode === 's1_dominant' ? 'S1 · Décide vite' : mode === 's2_dominant' ? 'S2 · Analyse d\'abord' : 'Contextuel'}
                              </span>
                            )}
                            {modes.slice(0, 2).map((m: string) => (
                              <span key={m} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">{m}</span>
                            ))}
                          </div>
                          <p className="text-xs text-foreground">→ {tip}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/contact/${participant.id}`)}
                        className="mt-2 flex items-center gap-1 text-[11px] text-primary hover:underline"
                      >
                        Voir fiche complète <ArrowRight className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {/* ── QUESTIONS D'OUVERTURE JTBD ──────────────────────────────────── */}
            {openingQuestions.length > 0 && (
              <CollapsibleSection
                title="Questions d'ouverture · JTBD"
                icon={<Target className="size-4" />}
                action={true}
                defaultOpen={true}
              >
                <div className="space-y-4">
                  {openingQuestions.map(({ participant, question }) => {
                    const fp = fullProfiles[participant.id];
                    return (
                      <div key={participant.id} className="flex gap-4">
                        <div className="size-8 rounded-xl bg-primary/15 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                          {initials(participant.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-muted-foreground mb-1">
                            Pour {participant.name}
                            {fp?.interaction_modes_data?.[0] && (
                              <span className="ml-2 text-primary">· {fp.interaction_modes_data[0]}</span>
                            )}
                          </p>
                          <p className="text-sm font-medium italic">❓ "{question}"</p>
                          {fp?.jtbd_data?.functional_job?.pitch_angle && (
                            <p className="text-xs text-muted-foreground mt-1">💡 {fp.jtbd_data.functional_job.pitch_angle}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CollapsibleSection>
            )}

            {/* ── PROCHAINES ÉTAPES ────────────────────────────────────────────── */}
            <CollapsibleSection
              title="Prochaines étapes"
              icon={<CheckCircle2 className="size-4" />}
              action={true}
              defaultOpen={true}
            >
              {participants.length > 0 ? (
                <div className="space-y-2">
                  {participants.map((p, i) => {
                    const fp = fullProfiles[p.id];
                    const q = fp?.jtbd_data?.qualify_question;
                    const isAtRisk = atRiskParticipants.some(r => r.id === p.id);
                    return (
                      <div key={p.id} className="flex items-start gap-3 p-3 bg-muted/30 rounded-xl border border-border">
                        <div className="size-5 rounded border-2 border-primary/40 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">
                            {q ? `Poser à ${p.name} : "${q}"` : `Suivre la relation avec ${p.name}`}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {isAtRisk ? '⚠️ Priorité haute — relation à réactiver' :
                             fp?.score_phase === 'growth' ? '✓ Relation en croissance — maintenir le rythme' :
                             'Relation stable — consolider'}
                          </p>
                        </div>
                        <KnowrBadge variant={i === 0 ? 'violet' : 'muted'} size="sm">P{i + 1}</KnowrBadge>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucun participant enrichi pour cette réunion.
                </p>
              )}
            </CollapsibleSection>

            {/* ── PARTICIPANTS DÉTAILLÉS (repliable) ──────────────────────────── */}
            <CollapsibleSection
              title="Profils participants"
              icon={<Users className="size-4" />}
              badge={participants.length > 0 ? String(participants.length) : undefined}
              defaultOpen={false}
            >
              {participants.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Aucun participant.</p>
              ) : (
                <div className="space-y-4">
                  {participants.map(p => {
                    const fp = fullProfiles[p.id];
                    const signals = (fp?.behavioral_analysis_data ?? p.behavioralSignals ?? []).slice(0, 3);
                    return (
                      <div key={p.id} className="p-4 border border-border rounded-xl">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="size-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {initials(p.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                              <h3 className="font-bold text-sm">{p.name}</h3>
                              {fp?.cognitive_mode && fp.cognitive_mode !== 'unavailable' && (
                                <KnowrBadge variant="violet" size="sm">
                                  {fp.cognitive_mode === 's1_dominant' ? 'S1' : 'S2'}
                                </KnowrBadge>
                              )}
                              {p.badge && (
                                <KnowrBadge variant={p.badge === 'champion' ? 'sage' : p.badge === 'decider' ? 'violet' : p.badge === 'gatekeeper' ? 'amber' : 'coral'} size="sm">
                                  {p.badge}
                                </KnowrBadge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{p.role}{p.company ? ` · ${p.company}` : ''}</p>
                          </div>
                          {p.relationContext && (
                            <KnowrBadge variant={p.relationContext.engagementScore > 65 ? 'sage' : p.relationContext.engagementScore >= 35 ? 'amber' : 'coral'} size="sm">
                              {p.relationContext.engagementScore}/100
                            </KnowrBadge>
                          )}
                        </div>
                        {fp?.executive_summary && (
                          <p className="text-xs text-foreground italic bg-primary/5 px-3 py-2 rounded-lg mb-3">
                            "{fp.executive_summary}"
                          </p>
                        )}
                        {signals.length > 0 && (
                          <div className="space-y-1 mb-3">
                            {signals.map((s: any, i: number) => (
                              <p key={i} className="text-xs text-muted-foreground">
                                · {typeof s === 'string' ? s : s?.text}
                              </p>
                            ))}
                          </div>
                        )}
                        <button
                          onClick={() => navigate(`/contact/${p.id}`)}
                          className="flex items-center gap-1 text-xs text-primary font-medium hover:underline"
                        >
                          Voir la fiche Personne <ChevronRight className="size-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CollapsibleSection>

            {/* ── SUIVI POST-RÉUNION ──────────────────────────────────────────── */}
            {isPast && participants.length > 0 && (
              <CollapsibleSection
                title="Suivi post-réunion"
                icon={<TrendingDown className="size-4" />}
                defaultOpen={false}
              >
                <div className="space-y-2">
                  {participants.map(p => {
                    const fp = fullProfiles[p.id];
                    const isAtRisk = fp?.score_phase === 'decline' ||
                      (p.relationContext && p.relationContext.lastContactDays > (p.relationContext.avgFrequencyDays ?? 30) * 1.5);
                    return (
                      <button
                        key={p.id}
                        onClick={() => navigate(`/contact/${p.id}`)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors border border-border text-left"
                      >
                        <div className="size-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {initials(p.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm">{p.name}</p>
                            {isAtRisk && <AlertTriangle className="size-3.5 text-amber flex-shrink-0" />}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {isAtRisk ? `Relancer — dernier contact il y a ${p.relationContext?.lastContactDays ?? '?'}j`
                              : fp?.score_phase === 'growth' ? 'Relation en croissance — maintenir le rythme'
                              : 'Relation stable — consolider'}
                          </p>
                        </div>
                        <KnowrBadge variant={isAtRisk ? 'amber' : fp?.score_phase === 'growth' ? 'sage' : 'muted'} size="sm">
                          {isAtRisk ? 'Relancer' : fp?.score_phase === 'growth' ? 'Croissance' : 'Stable'}
                        </KnowrBadge>
                      </button>
                    );
                  })}
                </div>
              </CollapsibleSection>
            )}

            </>)}

            {/* ── Empty state ──────────────────────────────────────────────────── */}
            {participants.length === 0 && !loading && (
              <div className="bg-card rounded-2xl border border-border p-8 text-center space-y-3">
                <Shield className="size-10 text-muted-foreground/30 mx-auto" />
                <p className="text-muted-foreground text-sm">
                  Aucun participant enrichi pour cette réunion.
                </p>
                <p className="text-xs text-muted-foreground">
                  Les profils s'enrichissent automatiquement depuis vos contacts.
                </p>
                <button
                  onClick={() => navigate('/contacts')}
                  className="text-xs text-primary font-medium underline"
                >
                  Gérer les contacts →
                </button>
              </div>
            )}

          </div>

          {/* ── SIGNAL RAIL ──────────────────────────────────────────────────── */}
          <aside className="lg:w-64 xl:w-72 flex-shrink-0">
            <div className="lg:sticky lg:top-6 space-y-4">
              <SignalRail signals={signals} title="Signaux · Réunion" />

              {/* Sources connectées */}
              <div className="rounded-2xl border border-border bg-card p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Sources</p>
                <div className="space-y-2">
                  {sources.map((s, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <s.icon className={`size-3.5 ${s.connected ? 'text-sage' : 'text-muted-foreground'}`} />
                        <span className={s.connected ? 'text-foreground' : 'text-muted-foreground'}>{s.name}</span>
                      </div>
                      {s.connected ? (
                        <CheckCircle2 className="size-3 text-sage" />
                      ) : (
                        <span className="text-amber font-mono">+{s.gain ?? '?'}%</span>
                      )}
                    </div>
                  ))}
                </div>
                {sources.find(s => !s.connected && s.gain) && (
                  <button
                    onClick={() => navigate('/account')}
                    className="mt-3 w-full text-[11px] text-primary font-medium hover:underline text-center"
                  >
                    Connecter les sources →
                  </button>
                )}
              </div>

              {/* Confiance */}
              {participants.length > 0 && (
                <div className="rounded-2xl border border-border bg-card p-4 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Confiance brief</p>
                  <p className={`text-4xl font-black ${confidenceScore >= 60 ? 'text-sage' : 'text-amber'}`}>
                    {confidenceScore}%
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {enrichedCount}/{participants.length} profils enrichis
                  </p>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-2">
                    <div
                      className={`h-full rounded-full ${confidenceScore >= 60 ? 'bg-sage' : 'bg-amber'}`}
                      style={{ width: `${confidenceScore}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </aside>

        </div>
      </div>

      {/* ══ MODALE MAIL PRÉ-RDV (action recommandée) ══════════════════════════ */}
      {showMail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(19,17,30,0.6)' }}
          onClick={() => setShowMail(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl bg-card border border-border shadow-xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
              <div className="flex items-center gap-2">
                <Mail className="size-4 text-primary" />
                <span className="text-sm font-bold">Mail pré-RDV</span>
              </div>
              <button onClick={() => setShowMail(false)} className="text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Destinataire</label>
                <input value={mailTo} onChange={e => setMailTo(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Objet</label>
                <input value={mailSubject} onChange={e => setMailSubject(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Message</label>
                <textarea value={mailBody} onChange={e => setMailBody(e.target.value)} rows={8}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm resize-y" />
              </div>
              {!mailConfirm ? (
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button onClick={() => setShowMail(false)} className="px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted">Annuler</button>
                  <button onClick={() => setMailConfirm(true)}
                    className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: '#6E50C8' }}>
                    Envoyer →
                  </button>
                </div>
              ) : (
                <div className="rounded-xl border border-amber/30 bg-amber/10 p-3">
                  <p className="text-xs text-foreground mb-2">
                    ⚠ Le mail s'ouvrira dans ta messagerie, pré-rempli, vers <span className="font-semibold">{mailTo || '—'}</span>. Tu valides l'envoi depuis ta boîte.
                  </p>
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => setMailConfirm(false)} className="px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted">Annuler</button>
                    <a
                      href={`mailto:${encodeURIComponent(mailTo)}?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(mailBody)}`}
                      onClick={() => setShowMail(false)}
                      className="px-4 py-2 rounded-lg text-sm font-semibold text-white inline-flex items-center gap-1.5" style={{ background: '#2EA86A' }}
                    >
                      <Check className="size-3.5" /> Ouvrir & envoyer
                    </a>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
