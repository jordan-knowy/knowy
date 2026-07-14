import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Sparkles, Loader2, Zap, TrendingUp, Users,
  ArrowRight, Building2, RefreshCcw, Check, X,
  TrendingDown, Target, Plug,
} from 'lucide-react';
import KnowrCard from './knowr/KnowrCard';
import { supabase } from '../../lib/supabase';
import { getActiveOrganizationId } from '../../lib/api/org';
import { computeVerdict, type VerdictData } from '../../lib/scoring';
import { resolveAccountType } from '../../lib/accountType';

// Posture → chip (spec-30/31)
const POSTURE_CHIP: Record<string, { label: string; color: string; bg: string }> = {
  defend:      { label: 'à défendre',  color: '#D94F63', bg: 'rgba(217,79,99,0.10)' },
  capitaliser: { label: 'capitaliser', color: '#6E50C8', bg: 'rgba(110,80,200,0.10)' },
  derisquer:   { label: 'dé-risquer',  color: '#C97A20', bg: 'rgba(201,122,32,0.10)' },
};

interface PortfolioItem {
  id: string;
  name: string;
  subtitle: string | null;     // secteur / domaine
  lastDays: number | null;
  contactsCount: number;
  npsScore: number | null;     // score relationnel 0-100 (moyenne contacts)
  trend: number;               // delta moyen (tendance)
  verdict: VerdictData | null;
}

interface NpsData {
  avgScore: number;     // capital relationnel 0-100 (moyenne)
  value: number;        // NPS %promoteurs − %détracteurs (−100..100)
  promoters: number;
  passives: number;
  detractors: number;
  count: number;
}

// Bande NPS d'un score 0-100 (spec-22)
function npsBand(score: number | null): { label: string; color: string; bg: string } {
  if (score == null) return { label: '—', color: '#9082B8', bg: 'rgba(144,130,184,0.10)' };
  if (score >= 70) return { label: 'Promoteur', color: '#2EA86A', bg: 'rgba(46,168,106,0.12)' };
  if (score <= 50) return { label: 'Détracteur', color: '#D94F63', bg: 'rgba(217,79,99,0.12)' };
  return { label: 'Passif', color: '#C97A20', bg: 'rgba(201,122,32,0.12)' };
}

// Compteurs de signaux calculés sur l'ensemble des lignes, pas sur l'échantillon affiché
interface SignalStats {
  total: number;
  risque: number;
  levier: number;
  marche: number;
}

// Feed Signaux (spec-29 §Home) — faits datés taggés par famille
interface SignalFeedItem {
  id: string;
  kind: 'company' | 'person';   // actualité entreprise OU signal comportemental personne
  entityId: string | null;      // company_id ou contact_id
  entityName: string;           // société ou personne
  title: string;                // company: titre actu ; person: ''
  tag: string;                  // famille (libellé court)
  color: string;
  bg: string;
  text: string;                 // résumé / texte du signal
  source: string | null;
  sourceUrl: string | null;
  when: string;
  tsMs: number;                 // pour le tri chronologique
}

function relWhen(iso: string | null): string {
  if (!iso) return '';
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d <= 0) return "Auj.";
  if (d === 1) return 'Hier';
  if (d < 7) return `Il y a ${d}j`;
  if (d < 30) return `Il y a ${Math.floor(d / 7)} sem.`;
  return `Il y a ${Math.floor(d / 30)} mois`;
}

// Mappe signal_type → tag/couleur du Feed Signaux
function signalFeedTag(signalType: string): { tag: string; color: string; bg: string } {
  const s = signalType.toLowerCase();
  if (/churn|resign|cancel|annul/.test(s))            return { tag: 'Churn',      color: '#D94F63', bg: 'rgba(217,79,99,0.10)' };
  if (/risk|risque|objection|payment|paiement/.test(s)) return { tag: 'Risque',     color: '#C97A20', bg: 'rgba(201,122,32,0.10)' };
  if (/levier|lever|opportunit|recovery|reengage/.test(s)) return { tag: 'Levier', color: '#6E50C8', bg: 'rgba(110,80,200,0.10)' };
  if (/mobil|job.change|new.decision|arrivant|promo/.test(s)) return { tag: 'Mobilité', color: '#2EA86A', bg: 'rgba(46,168,106,0.10)' };
  if (/march|market|m&a|rachat|control/.test(s))      return { tag: 'Marché',     color: '#3D6FCC', bg: 'rgba(61,111,204,0.10)' };
  if (/growth|croissance|fund|levee/.test(s))         return { tag: 'Croissance', color: '#2896A8', bg: 'rgba(40,150,168,0.10)' };
  return { tag: 'Présence', color: '#9082B8', bg: 'rgba(144,130,184,0.10)' };
}

// Providers de synchronisation supportés (dénominateur « Sources connectées x/N »)
const SUPPORTED_PROVIDERS = ['google', 'microsoft'];

// ─── Component ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [newContactsFound, setNewContactsFound] = useState(0);
  const [totalContacts, setTotalContacts] = useState<number>(0);
  const [totalEmails, setTotalEmails] = useState<number>(0);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [nps, setNps] = useState<NpsData | null>(null);
  const [scoreTrend, setScoreTrend] = useState<{ delta: number; label: string } | null>(null);
  const [signalStats, setSignalStats] = useState<SignalStats>({ total: 0, risque: 0, levier: 0, marche: 0 });
  const [npsHistory, setNpsHistory] = useState<Array<{ date: string; value: number; score: number }>>([]);
  const [signalsFeed, setSignalsFeed] = useState<SignalFeedItem[]>([]);
  const [companiesCount, setCompaniesCount] = useState<number>(0);
  const [sources, setSources] = useState<{ connected: number; total: number }>({ connected: 0, total: SUPPORTED_PROVIDERS.length });
  const [signalState, setSignalState] = useState<Record<string, 'ok' | 'no'>>({});
  const [veilleRunning, setVeilleRunning] = useState(false);
  const [veilleMsg, setVeilleMsg] = useState<string | null>(null);
  const [digestDismissed, setDigestDismissed] = useState(false);
  const [lastVisitMs] = useState<number>(() => {
    const stored = localStorage.getItem('tohu_home_last_visit');
    const prev = stored ? parseInt(stored, 10) : 0;
    localStorage.setItem('tohu_home_last_visit', String(Date.now()));
    return prev;
  });

  async function handleCalendarSync() {
    if (!supabase || syncing) return;
    setSyncing(true);
    setSyncMsg(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Non authentifié');
      const orgId = await getActiveOrganizationId();
      const providerToken = session.provider_token;

      // Détecte les providers connectés en base (tout sauf déconnecté — l'edge function rafraîchit le token si needs_reauth/expired)
      const { data: connectors } = await supabase
        .from('connectors')
        .select('provider, status')
        .eq('organization_id', orgId)
        .not('status', 'in', '("disconnected","not_connected")');

      const connected = new Set((connectors ?? []).map((c: any) => c.provider as string));
      // Détecte si la session courante est une session Microsoft OAuth (azure = provider Supabase pour MS)
      const sessionAuthProvider = (session.user?.app_metadata as any)?.provider ?? '';
      const isMsSession = sessionAuthProvider === 'azure' || sessionAuthProvider === 'microsoft';
      // Repli : une session OAuth fraîche fournit un provider_token même sans ligne connecteur
      const hasGoogle    = connected.has('google')    || (!isMsSession && !!providerToken);
      const hasMicrosoft = connected.has('microsoft') || (isMsSession && !!providerToken);

      if (!hasGoogle && !hasMicrosoft) {
        setSyncMsg({ type: 'error', text: 'Aucun compte connecté. Allez dans Paramètres → Connexions.' });
        return;
      }

      let totalCreated = 0;
      let totalEmails = 0;
      const syncedProviders: string[] = [];

      // ── Google : calendrier + emails ──────────────────────────────────────
      if (hasGoogle) {
        // Sème le token frais (+ refresh) si la session en a un, pour le renouvellement serveur
        if (!isMsSession && providerToken && session.user) {
          await (supabase.from('connectors') as any).upsert({
            organization_id: orgId, user_id: session.user.id, provider: 'google', status: 'connected',
            metadata: { access_token: providerToken, refresh_token: (session as any).provider_refresh_token ?? null, email: session.user.email, token_stored_at: new Date().toISOString() },
            updated_at: new Date().toISOString(),
          }, { onConflict: 'organization_id,user_id,provider' });
        }
        // Calendrier — invoke (JWT frais) ; le serveur résout/rafraîchit le token Google
        const { data: calData, error: calErr } = await supabase.functions.invoke('sync-google-calendar', {
          body: { organizationId: orgId, providerToken: providerToken ?? null },
        });
        if (!calErr) {
          totalCreated += (calData as any)?.stats?.created ?? 0;
          syncedProviders.push('Google');
        }
        // Emails Gmail — ingest résout le token depuis connectors.metadata (refresh serveur)
        const { data: emailData, error: emailErr } = await supabase.functions.invoke('ingest-communication', {
          body: { organizationId: orgId, providerToken: providerToken ?? null, provider: 'google', lookbackDays: 3650 },
        });
        if (!emailErr) totalEmails += (emailData as any)?.stats?.messages ?? 0;
      }

      // ── Microsoft : calendrier Outlook/Teams + emails ─────────────────────
      if (hasMicrosoft) {
        const { data: msConnector } = await supabase
          .from('connectors')
          .select('metadata')
          .eq('organization_id', orgId)
          .eq('provider', 'microsoft')
          .eq('status', 'connected')
          .maybeSingle();
        // Token MS : on privilégie le token FRAIS de la session MS, sinon le token stocké
        let msToken: string | null = (isMsSession && providerToken) ? providerToken : ((msConnector?.metadata as any)?.access_token ?? null);
        // Sème le refresh_token MS pour le renouvellement auto côté serveur
        if (isMsSession && providerToken && session.user) {
          await (supabase.from('connectors') as any).upsert({
            organization_id: orgId, user_id: session.user.id, provider: 'microsoft', status: 'connected',
            metadata: { ...(msConnector?.metadata ?? {}), access_token: providerToken, refresh_token: (session as any).provider_refresh_token ?? (msConnector?.metadata as any)?.refresh_token ?? null, email: session.user.email, token_stored_at: new Date().toISOString() },
            updated_at: new Date().toISOString(),
          }, { onConflict: 'organization_id,user_id,provider' });
        }

        // Calendrier Outlook — invoke ; le serveur résout/rafraîchit le token depuis le connecteur
        const { data: calData, error: calErr } = await supabase.functions.invoke('sync-outlook-calendar', {
          body: { organizationId: orgId, providerToken: msToken ?? null },
        });
        if (!calErr) {
          totalCreated += (calData as any)?.stats?.created ?? 0;
          syncedProviders.push('Outlook');
          const { data: msConnFresh } = await supabase
            .from('connectors').select('metadata')
            .eq('organization_id', orgId).eq('provider', 'microsoft').eq('status', 'connected').maybeSingle();
          const freshToken = (msConnFresh?.metadata as any)?.access_token;
          if (freshToken) msToken = freshToken;
        }
        // Emails Outlook
        const { data: emailData, error: emailErr } = await supabase.functions.invoke('ingest-communication', {
          body: { organizationId: orgId, providerToken: msToken ?? null, provider: 'microsoft', lookbackDays: 3650 },
        });
        if (!emailErr) totalEmails += (emailData as any)?.stats?.messages ?? 0;
      }

      // ── Auto-discover nouveaux contacts depuis les emails ─────────────────
      let newSuggestions = 0;
      try {
        // Relit le connector Microsoft (token stocké par sync-outlook-calendar qui vient de s'exécuter)
        const { data: msConnFresh } = hasMicrosoft ? await supabase
          .from('connectors').select('metadata')
          .eq('organization_id', orgId).eq('provider', 'microsoft').eq('status', 'connected').maybeSingle()
          : { data: null };

        const discoverBody: Record<string, any> = { organizationId: orgId, lookbackDays: 90, minExchanges: 1 };
        if (hasGoogle) discoverBody.googleToken = providerToken ?? null;
        if (hasMicrosoft) discoverBody.microsoftToken = (isMsSession && providerToken) ? providerToken : ((msConnFresh?.metadata as any)?.access_token ?? null);

        const { data: discData, error: discErr } = await supabase.functions.invoke('discover-contacts', {
          body: discoverBody,
        });
        if (!discErr) {
          newSuggestions = (discData as any)?.suggestions?.length ?? 0;
          setNewContactsFound(newSuggestions);
        }
      } catch { /* non-bloquant */ }

      const emailPart = totalEmails > 0 ? ` · ${totalEmails} email${totalEmails > 1 ? 's' : ''} ingéré${totalEmails > 1 ? 's' : ''}` : ' · Emails synchronisés';
      const contactPart = newSuggestions > 0 ? ` · ${newSuggestions} contact${newSuggestions > 1 ? 's' : ''} à importer` : '';
      setSyncMsg({
        type: 'success',
        text: `✓ ${totalCreated} nouvelle${totalCreated > 1 ? 's' : ''} réunion${totalCreated > 1 ? 's' : ''}${emailPart}${contactPart}${syncedProviders.length ? ` (${syncedProviders.join(' + ')})` : ''}`,
      });
      // Rafraîchit le compteur KPI "Mails synchronisés" depuis la base
      const { count: refreshedEmailCount } = await supabase
        .from('communication_messages')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId);
      if (refreshedEmailCount !== null) setTotalEmails(refreshedEmailCount);
      // Recalcule le scoring relationnel sur les contacts fraîchement synchronisés
      try { await supabase.functions.invoke('score-batch', { body: { organizationId: orgId } }); } catch { /* non-bloquant */ }
    } catch (e: any) {
      setSyncMsg({ type: 'error', text: e.message });
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMsg(null), 6000);
    }
  }

  // Load portefeuille + NPS + feed signaux + connecteurs from Supabase
  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!supabase) return;
      const orgId = await getActiveOrganizationId();
      if (!orgId || !mounted) return;

      // Contacts total + emails synchronisés + sources connectées
      const [{ count: contactCount }, { count: emailCount }, { data: connRows }] = await Promise.all([
        supabase.from('contacts').select('*', { count: 'exact', head: true })
          .eq('organization_id', orgId).is('merged_into_contact_id', null),
        supabase.from('communication_messages').select('*', { count: 'exact', head: true })
          .eq('organization_id', orgId),
        supabase.from('connectors').select('provider, status')
          .eq('organization_id', orgId)
          .not('status', 'in', '("disconnected","not_connected")'),
      ]);
      if (mounted) {
        setTotalContacts(contactCount ?? 0);
        setTotalEmails(emailCount ?? 0);
        const connectedProviders = new Set(
          (connRows ?? [])
            .map((c: any) => c.provider as string)
            .filter((p: string) => SUPPORTED_PROVIDERS.includes(p)),
        );
        setSources({ connected: connectedProviders.size, total: SUPPORTED_PROVIDERS.length });
      }

      // Portefeuille priorisé (gravité × urgence, spec-30) + NPS (spec-22)
      try {
        const [{ count: companyCount }, { data: companiesRaw }, { data: profs }, { data: sigRows }, { data: msgRows }, { data: meetParts }] = await Promise.all([
          supabase
            .from('companies')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', orgId),
          supabase
            .from('companies')
            .select('id, name, domain, industry, account_type, account_type_confidence, contacts(id, merged_into_contact_id)')
            .eq('organization_id', orgId)
            .limit(200),
          supabase
            .from('cognitive_profiles')
            .select('contact_id, engagement_score, score_delta')
            .eq('organization_id', orgId)
            .order('profile_version', { ascending: false }),
          supabase
            .from('behavioral_signals')
            .select('contact_id, signal_type')
            .eq('organization_id', orgId)
            .limit(500),
          supabase
            .from('communication_messages')
            .select('contact_id, sent_at')
            .eq('organization_id', orgId)
            .order('sent_at', { ascending: false })
            .limit(2000),
          supabase
            .from('meeting_participants')
            .select('contact_id, meetings!inner(starts_at)')
            .eq('organization_id', orgId)
            .not('contact_id', 'is', null),
        ]);

        // Map score + delta par contact (dernière version)
        const scoreByContact: Record<string, { score: number | null; delta: number | null }> = {};
        for (const p of (profs ?? []) as any[]) {
          if (!(p.contact_id in scoreByContact)) {
            scoreByContact[p.contact_id] = { score: p.engagement_score ?? null, delta: p.score_delta ?? null };
          }
        }
        // Signaux par contact
        const sigsByContact: Record<string, { signal_type: string }[]> = {};
        for (const s of (sigRows ?? []) as any[]) {
          (sigsByContact[s.contact_id] ??= []).push({ signal_type: s.signal_type });
        }
        // Dernier échange par contact — emails ET réunions déjà passées (spec-30 : « mail/meeting »)
        const lastByContact: Record<string, string> = {};
        const noteLast = (contactId: string | null, at: string | null) => {
          if (!contactId || !at) return;
          const prev = lastByContact[contactId];
          if (!prev || at > prev) lastByContact[contactId] = at;
        };
        for (const m of (msgRows ?? []) as any[]) noteLast(m.contact_id, m.sent_at);
        const nowIso = new Date().toISOString();
        for (const p of (meetParts ?? []) as any[]) {
          const startsAt = p.meetings?.starts_at ?? null;
          if (startsAt && startsAt <= nowIso) noteLast(p.contact_id, startsAt);
        }

        // NPS portefeuille (Promoteur ≥70, Détracteur ≤50) + capital relationnel moyen
        const allScores = Object.values(scoreByContact).map(v => v.score).filter((s): s is number => s != null);
        if (mounted && allScores.length) {
          const promoters = allScores.filter(s => s >= 70).length;
          const detractors = allScores.filter(s => s <= 50).length;
          const passives = allScores.length - promoters - detractors;
          const avgScore = Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length);
          const npsValue = Math.round((promoters / allScores.length) * 100 - (detractors / allScores.length) * 100);
          setNps({ avgScore, value: npsValue, promoters, passives, detractors, count: allScores.length });

          // Snapshot NPS du jour (idempotent) → la courbe se construit dans le temps
          if (orgId) {
            try {
              await (supabase.from('nps_snapshots') as any).upsert({
                organization_id: orgId, snapshot_date: new Date().toISOString().slice(0, 10),
                nps_value: npsValue, avg_score: avgScore, promoters, detractors, total: allScores.length,
              }, { onConflict: 'organization_id,snapshot_date' });
              // Les 30 snapshots les plus RÉCENTS, puis remis en ordre chronologique pour le tracé
              const { data: hist } = await supabase.from('nps_snapshots')
                .select('snapshot_date, nps_value, avg_score')
                .eq('organization_id', orgId)
                .order('snapshot_date', { ascending: false }).limit(30);
              if (mounted && hist) {
                const chrono = [...(hist as any[])].reverse();
                setNpsHistory(chrono.map(h => ({
                  date: new Date(h.snapshot_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
                  value: h.nps_value ?? 0, score: h.avg_score ?? 0,
                })));
              }

              // Tendance du score relationnel : snapshot le plus ancien dans la fenêtre 180 j
              const sinceTrend = new Date(Date.now() - 180 * 86400000).toISOString().slice(0, 10);
              const { data: trendRef } = await supabase.from('nps_snapshots')
                .select('snapshot_date, avg_score')
                .eq('organization_id', orgId)
                .gte('snapshot_date', sinceTrend)
                .order('snapshot_date', { ascending: true }).limit(1);
              const ref = (trendRef as any[])?.[0];
              if (mounted && ref && ref.avg_score != null) {
                const days = Math.max(1, Math.round((Date.now() - new Date(ref.snapshot_date).getTime()) / 86400000));
                const months = Math.round(days / 30);
                const label = months >= 1 ? `sur ${months} mois` : `sur ${days} j`;
                setScoreTrend({ delta: avgScore - ref.avg_score, label });
              } else if (mounted) {
                setScoreTrend(null);
              }
            } catch { /* table absente / RLS — non bloquant */ }
          }
        }

        if (mounted) setCompaniesCount(companyCount ?? 0);

        if (companiesRaw?.length) {
          const rows: PortfolioItem[] = (companiesRaw as any[]).map((c: any) => {
            const contacts = (c.contacts ?? []).filter((ct: any) => ct.merged_into_contact_id == null);
            let minDays: number | null = null;
            let minScore: number | null = null;
            let scoreSum = 0, scoreCount = 0;
            let deltaSum = 0, deltaCount = 0;
            const companySignals: { signal_type: string }[] = [];
            for (const ct of contacts) {
              const sc = scoreByContact[ct.id];
              if (sc?.score != null) {
                minScore = minScore == null ? sc.score : Math.min(minScore, sc.score);
                scoreSum += sc.score; scoreCount++;
              }
              if (sc?.delta != null) { deltaSum += sc.delta; deltaCount++; }
              const lastAt = lastByContact[ct.id];
              if (lastAt) {
                const d = Math.floor((Date.now() - new Date(lastAt).getTime()) / 86400000);
                if (minDays === null || d < minDays) minDays = d;
              }
              if (sigsByContact[ct.id]) companySignals.push(...sigsByContact[ct.id]);
            }
            const accountType = resolveAccountType(c.account_type, c.account_type_confidence);
            const verdict = computeVerdict(
              minScore, minDays, companySignals,
              deltaCount ? deltaSum / deltaCount : null,
              accountType,
            );
            return {
              id: c.id,
              name: c.name,
              subtitle: c.industry ?? c.domain ?? null,
              lastDays: minDays,
              contactsCount: contacts.length,
              npsScore: scoreCount ? Math.round(scoreSum / scoreCount) : null,
              trend: deltaCount ? Math.round(deltaSum / deltaCount) : 0,
              verdict,
            };
          });
          if (mounted) setPortfolio(rows);
        }
      } catch { /* companies table might not exist yet */ }

      // Feed Signaux — fusion : actualités entreprise (veille) + signaux comportementaux (personnes)
      try {
        const [{ data: compSigs }, { data: behSigs }, { data: allCompFam }, { data: allBehTypes }] = await Promise.all([
          supabase
            .from('company_signals')
            .select('id, company_id, family, title, summary, source, source_url, observed_at, companies(name)')
            .eq('organization_id', orgId)
            .neq('status', 'dismissed')
            .order('observed_at', { ascending: false, nullsFirst: false })
            .limit(20),
          supabase
            .from('behavioral_signals')
            .select('id, contact_id, signal_type, text, source_type, observed_at, contacts(full_name)')
            .eq('organization_id', orgId)
            .order('observed_at', { ascending: false })
            .limit(20),
          // Familles seules, sans limite : le KPI compte tous les signaux, pas l'échantillon affiché
          supabase.from('company_signals').select('family')
            .eq('organization_id', orgId).neq('status', 'dismissed'),
          supabase.from('behavioral_signals').select('signal_type')
            .eq('organization_id', orgId),
        ]);

        if (mounted) {
          const stats: SignalStats = { total: 0, risque: 0, levier: 0, marche: 0 };
          const bump = (raw: string) => {
            stats.total++;
            const { tag } = signalFeedTag(raw);
            if (tag === 'Risque' || tag === 'Churn') stats.risque++;
            else if (tag === 'Levier' || tag === 'Croissance') stats.levier++;
            else if (tag === 'Marché' || tag === 'Mobilité') stats.marche++;
          };
          for (const r of (allCompFam ?? []) as any[]) bump(r.family ?? '');
          for (const r of (allBehTypes ?? []) as any[]) bump(r.signal_type ?? '');
          setSignalStats(stats);
        }

        const merged: SignalFeedItem[] = [];
        for (const s of (compSigs ?? []) as any[]) {
          const cfg = signalFeedTag(s.family ?? '');
          merged.push({
            id: s.id, kind: 'company', entityId: s.company_id, entityName: s.companies?.name ?? 'Compte',
            title: s.title ?? '', tag: cfg.tag, color: cfg.color, bg: cfg.bg, text: s.summary ?? '',
            source: s.source ?? null, sourceUrl: s.source_url ?? null,
            when: relWhen(s.observed_at), tsMs: s.observed_at ? new Date(s.observed_at).getTime() : 0,
          });
        }
        for (const s of (behSigs ?? []) as any[]) {
          const cfg = signalFeedTag(s.signal_type ?? '');
          merged.push({
            id: s.id, kind: 'person', entityId: s.contact_id, entityName: s.contacts?.full_name ?? 'Contact',
            title: '', tag: cfg.tag, color: cfg.color, bg: cfg.bg, text: s.text ?? '',
            source: s.source_type ?? 'Analyse Tohu', sourceUrl: null,
            when: relWhen(s.observed_at), tsMs: s.observed_at ? new Date(s.observed_at).getTime() : 0,
          });
        }
        merged.sort((a, b) => b.tsMs - a.tsMs);
        if (mounted) setSignalsFeed(merged.slice(0, 30));
      } catch { /* signals might be empty */ }
    }
    load();
    return () => { mounted = false; };
  }, []);

  // Lance la veille actualités (LinkedIn / presse / web) sur les comptes
  async function runVeille() {
    if (!supabase || veilleRunning) return;
    setVeilleRunning(true);
    setVeilleMsg(null);
    try {
      const orgId = await getActiveOrganizationId();
      const { data, error } = await supabase.functions.invoke('monitor-company-news', {
        body: { organizationId: orgId },
      });
      if (error) {
        let msg = error.message ?? 'Erreur veille.';
        try { const b = await (error as any)?.context?.json?.(); if (b?.error) msg = b.error; } catch { /* ignore */ }
        setVeilleMsg(msg);
      } else if (data?.error) {
        setVeilleMsg(data.error);
      } else {
        setVeilleMsg(`${data?.inserted ?? 0} actualité(s) ajoutée(s) sur ${data?.scanned ?? 0} compte(s).`);
        // Recharge le feed (actualités entreprise + signaux personnes) et les compteurs
        const [{ data: compSigs }, { data: behSigs }, { data: allCompFam }, { data: allBehTypes }] = await Promise.all([
          supabase.from('company_signals')
            .select('id, company_id, family, title, summary, source, source_url, observed_at, companies(name)')
            .eq('organization_id', orgId).neq('status', 'dismissed')
            .order('observed_at', { ascending: false, nullsFirst: false }).limit(20),
          supabase.from('behavioral_signals')
            .select('id, contact_id, signal_type, text, source_type, observed_at, contacts(full_name)')
            .eq('organization_id', orgId).order('observed_at', { ascending: false }).limit(20),
          supabase.from('company_signals').select('family')
            .eq('organization_id', orgId).neq('status', 'dismissed'),
          supabase.from('behavioral_signals').select('signal_type')
            .eq('organization_id', orgId),
        ]);

        const stats: SignalStats = { total: 0, risque: 0, levier: 0, marche: 0 };
        const bump = (raw: string) => {
          stats.total++;
          const { tag } = signalFeedTag(raw);
          if (tag === 'Risque' || tag === 'Churn') stats.risque++;
          else if (tag === 'Levier' || tag === 'Croissance') stats.levier++;
          else if (tag === 'Marché' || tag === 'Mobilité') stats.marche++;
        };
        for (const r of (allCompFam ?? []) as any[]) bump(r.family ?? '');
        for (const r of (allBehTypes ?? []) as any[]) bump(r.signal_type ?? '');
        setSignalStats(stats);
        const merged: SignalFeedItem[] = [];
        for (const s of (compSigs ?? []) as any[]) {
          const cfg = signalFeedTag(s.family ?? '');
          merged.push({ id: s.id, kind: 'company', entityId: s.company_id, entityName: s.companies?.name ?? 'Compte',
            title: s.title ?? '', tag: cfg.tag, color: cfg.color, bg: cfg.bg, text: s.summary ?? '',
            source: s.source ?? null, sourceUrl: s.source_url ?? null,
            when: relWhen(s.observed_at), tsMs: s.observed_at ? new Date(s.observed_at).getTime() : 0 });
        }
        for (const s of (behSigs ?? []) as any[]) {
          const cfg = signalFeedTag(s.signal_type ?? '');
          merged.push({ id: s.id, kind: 'person', entityId: s.contact_id, entityName: s.contacts?.full_name ?? 'Contact',
            title: '', tag: cfg.tag, color: cfg.color, bg: cfg.bg, text: s.text ?? '',
            source: s.source_type ?? 'Analyse Tohu', sourceUrl: null,
            when: relWhen(s.observed_at), tsMs: s.observed_at ? new Date(s.observed_at).getTime() : 0 });
        }
        merged.sort((a, b) => b.tsMs - a.tsMs);
        setSignalsFeed(merged.slice(0, 30));
      }
    } catch (e: any) {
      setVeilleMsg(e?.message ?? 'Erreur inconnue.');
    } finally {
      setVeilleRunning(false);
    }
  }

  // Valide / écarte un signal. Persistant pour les actualités entreprise (company_signals).
  async function setSignalStatus(signalId: string, status: 'ok' | 'no', kind: 'company' | 'person') {
    setSignalState(p => ({ ...p, [signalId]: status }));
    if (!supabase || kind !== 'company') return;
    try {
      await supabase.from('company_signals')
        .update({ status: status === 'ok' ? 'validated' : 'dismissed', updated_at: new Date().toISOString() })
        .eq('id', signalId);
    } catch { /* best-effort */ }
  }

  // ── Dérivés Home (maquette) ────────────────────────────────────────────────
  const defendList = portfolio.filter(c => c.verdict?.posture === 'defend');
  const defendCount = defendList.length;

  // À faire aujourd'hui — comptes portant un verdict, triés par priorité (spec-30)
  const todoList = portfolio
    .filter(c => c.verdict != null)
    .sort((a, b) => (b.verdict!.score) - (a.verdict!.score))
    .slice(0, 6);

  // Compteurs sur l'ensemble des signaux, moins ceux écartés pendant la session
  const dismissed = signalsFeed.filter(s => signalState[s.id] === 'no');
  const signalCounts = {
    total:  Math.max(0, signalStats.total - dismissed.length),
    risque: Math.max(0, signalStats.risque - dismissed.filter(s => s.tag === 'Risque' || s.tag === 'Churn').length),
    levier: Math.max(0, signalStats.levier - dismissed.filter(s => s.tag === 'Levier' || s.tag === 'Croissance').length),
    marche: Math.max(0, signalStats.marche - dismissed.filter(s => s.tag === 'Marché' || s.tag === 'Mobilité').length),
  };

  // Top 5 NPS — leaderboard Meilleurs / À risque (maquette)
  const npsRanked = portfolio.filter(c => c.npsScore != null).sort((a, b) => (b.npsScore ?? 0) - (a.npsScore ?? 0));
  const top5Best = npsRanked.slice(0, 5);
  // « À risque » = détracteurs réels (≤ 50), du plus bas au plus haut — jamais un compte déjà cité en meilleurs
  const top5Risk = [...npsRanked]
    .reverse()
    .filter(c => (c.npsScore ?? 100) <= 50 && !top5Best.includes(c))
    .slice(0, 5);

  // Digest « depuis ta dernière visite » — nouveaux signaux depuis le dernier passage sur Home
  const newSignalsSinceVisit = signalsFeed.filter(s => s.tsMs > lastVisitMs).length;

  const bandNow = npsBand(nps?.avgScore ?? null);

  return (
    <div className="size-full overflow-auto" style={{ background: 'var(--color-background)' }}>
      <div className="max-w-7xl mx-auto px-4 py-5 md:px-8 md:py-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <h1 className="text-3xl font-black tracking-tight leading-tight">Home</h1>
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mt-1" style={{ fontFamily: 'var(--mono)' }}>
            Mon espace relationnel
          </p>
        </motion.div>

        {/* Bandeau offre + Synchroniser */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-border bg-card px-5 py-3 mb-5">
          <p className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ background: 'var(--violet-s)', color: 'var(--violet-d)', fontFamily: 'var(--mono)' }}>
              Offre gratuite
            </span>
            <b className="text-foreground">{companiesCount} compte{companiesCount > 1 ? 's' : ''}</b> suivis · synchronisation automatique
          </p>
          <button onClick={handleCalendarSync} disabled={syncing}
            className="flex items-center gap-2 text-xs font-semibold text-primary hover:underline disabled:opacity-50 flex-shrink-0">
            {syncing ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCcw className="size-3.5" />}
            {syncing ? 'Synchronisation…' : 'Synchroniser'}
          </button>
        </div>
        {syncMsg && (
          <p className={`text-xs px-3 py-1.5 rounded-full mb-3 w-fit ${
            syncMsg.type === 'success' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
          }`}>
            {syncMsg.text}
          </p>
        )}
        {newContactsFound > 0 && (
          <button
            onClick={() => { setNewContactsFound(0); navigate('/contacts?discover=1'); }}
            className="flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors mb-5 w-fit"
          >
            <Users className="size-3.5" />
            {newContactsFound} nouveau{newContactsFound > 1 ? 'x' : ''} contact{newContactsFound > 1 ? 's' : ''} détecté{newContactsFound > 1 ? 's' : ''} dans vos emails — Importer →
          </button>
        )}

        {/* Digest « Depuis ta dernière visite » */}
        {!digestDismissed && lastVisitMs > 0 && newSignalsSinceVisit > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between gap-3 rounded-2xl px-5 py-3 mb-5"
            style={{ background: 'var(--violet-s)', border: '1px solid var(--border-m)' }}
          >
            <p className="text-sm flex items-center gap-2" style={{ color: 'var(--t1, #1A1040)' }}>
              <Sparkles className="size-4 text-primary flex-shrink-0" />
              Depuis ta dernière visite : <b>{newSignalsSinceVisit} nouveau{newSignalsSinceVisit > 1 ? 'x' : ''} signal{newSignalsSinceVisit > 1 ? 'aux' : ''}</b>
              {defendCount > 0 && <> · <b>{defendCount} compte{defendCount > 1 ? 's' : ''}</b> à défendre</>}
            </p>
            <button onClick={() => setDigestDismissed(true)} className="text-muted-foreground hover:text-foreground flex-shrink-0">
              <X className="size-4" />
            </button>
          </motion.div>
        )}

        {/* ══ Hero — Score relationnel global ═══════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="rounded-2xl mb-4 flex flex-col gap-5 md:flex-row md:items-center"
          style={{ background: '#6E50C8', padding: '22px 26px', boxShadow: '0 6px 28px rgba(110,80,200,0.22)' }}
        >
          {/* Anneau + score */}
          <div className="flex items-center gap-5 flex-shrink-0">
            <div
              className="flex-shrink-0 flex items-center justify-center"
              style={{
                width: 104, height: 104, borderRadius: '50%',
                background: `conic-gradient(rgba(255,255,255,0.88) ${(nps?.avgScore ?? 0) * 3.6}deg, rgba(255,255,255,0.15) 0deg)`,
              }}
            >
              <div className="flex flex-col items-center justify-center" style={{ width: 84, height: 84, borderRadius: '50%', background: '#5A3EAA' }}>
                <span style={{ fontFamily: 'Epilogue, sans-serif', fontWeight: 900, fontSize: 38, color: '#fff', lineHeight: 1 }}>
                  {nps?.avgScore ?? '—'}
                </span>
                <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 9, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>/ 100</span>
              </div>
            </div>
            <div>
              <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.10em', color: 'rgba(255,255,255,0.48)', marginBottom: 6 }}>
                Score relationnel global · NPS
              </p>
              <p style={{ fontFamily: 'Epilogue, sans-serif', fontWeight: 800, fontSize: 22, color: '#fff', lineHeight: 1.15 }}>
                {bandNow.label}
                {nps && (
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.60)', marginLeft: 8 }}>
                    NPS {nps.value > 0 ? '+' : ''}{nps.value}
                  </span>
                )}
              </p>
              {scoreTrend && scoreTrend.delta !== 0 && (
                <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.66)', marginTop: 4 }}>
                  {scoreTrend.delta > 0 ? '↗ +' : '↘ '}{scoreTrend.delta} {scoreTrend.label} · à toi de le faire progresser
                </p>
              )}
            </div>
          </div>

          {/* Distribution + courbe */}
          <div className="flex-1 min-w-0 md:pl-6 md:border-l" style={{ borderColor: 'rgba(255,255,255,0.14)' }}>
            {nps && nps.count > 0 ? (
              <>
                {/* Barre segmentée Promoteurs / Passifs / Détracteurs */}
                <div className="flex h-2.5 rounded-full overflow-hidden mb-2" style={{ background: 'rgba(255,255,255,0.12)' }}>
                  <div style={{ width: `${(nps.promoters / nps.count) * 100}%`, background: '#2EA86A' }} />
                  <div style={{ width: `${(nps.passives / nps.count) * 100}%`, background: '#E7B84B' }} />
                  <div style={{ width: `${(nps.detractors / nps.count) * 100}%`, background: '#D94F63' }} />
                </div>
                <div className="flex items-center gap-4 flex-wrap" style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: 'rgba(255,255,255,0.85)' }}>
                  <span><b style={{ color: '#8FE3B6' }}>{nps.promoters}</b> promoteurs</span>
                  <span><b style={{ color: '#F2D98A' }}>{nps.passives}</b> passifs</span>
                  <span><b style={{ color: '#F0A9B4' }}>{nps.detractors}</b> détracteurs</span>
                  <span style={{ color: 'rgba(255,255,255,0.45)' }}>sur {nps.count} contacts scorés</span>
                </div>
                {/* Courbe de tendance */}
                {npsHistory.length >= 2 && (
                  <svg width="100%" height="34" viewBox="0 0 320 34" preserveAspectRatio="none" style={{ marginTop: 12, display: 'block', overflow: 'visible' }}>
                    {(() => {
                      const vals = npsHistory.map(h => h.score);
                      const min = Math.min(...vals), max = Math.max(...vals);
                      const range = (max - min) || 1;
                      const pts = npsHistory.map((h, i) => {
                        const x = (i / (npsHistory.length - 1)) * 318 + 1;
                        const y = 32 - ((h.score - min) / range) * 28;
                        return `${x.toFixed(1)},${y.toFixed(1)}`;
                      });
                      return (
                        <>
                          <polygon points={`1,33 ${pts.join(' ')} 319,33`} fill="rgba(255,255,255,0.14)" />
                          <polyline points={pts.join(' ')} fill="none" stroke="rgba(255,255,255,0.92)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                        </>
                      );
                    })()}
                  </svg>
                )}
              </>
            ) : (
              <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>
                Synchronise ton portefeuille pour calculer ton score relationnel.
              </p>
            )}
          </div>
        </motion.div>

        {/* ══ Rangée KPI — Sources · Comptes · Contacts ═════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="grid grid-cols-1 gap-3 mb-6 sm:grid-cols-3"
        >
          {/* Sources connectées */}
          <button
            onClick={() => navigate('/account?tab=connections')}
            className="rounded-2xl flex items-center gap-3 text-left hover:shadow-sm transition-all"
            style={{ background: '#fff', border: '1px solid rgba(110,80,200,0.10)', boxShadow: '0 1px 4px rgba(110,80,200,0.07)', padding: '16px 20px' }}
          >
            <div className="size-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--violet-s)', color: '#6E50C8' }}>
              <Plug className="size-5" />
            </div>
            <div className="min-w-0">
              <p style={{ fontFamily: 'Epilogue, sans-serif', fontWeight: 900, fontSize: 26, color: '#1A1040', lineHeight: 1 }}>
                {sources.connected}<span style={{ fontSize: 16, color: '#9082B8' }}> / {sources.total}</span>
              </p>
              <p style={{ fontFamily: 'Epilogue, sans-serif', fontSize: 13, color: '#5A4880' }}>sources connectées</p>
            </div>
          </button>

          {/* Comptes */}
          <button
            onClick={() => navigate('/companies')}
            className="rounded-2xl flex items-center text-left hover:shadow-sm transition-all"
            style={{ background: '#fff', border: '1px solid rgba(110,80,200,0.10)', boxShadow: '0 1px 4px rgba(110,80,200,0.07)', padding: '16px 20px' }}
          >
            <span style={{ fontFamily: 'Epilogue, sans-serif', fontWeight: 900, fontSize: 40, color: '#1A1040', lineHeight: 1, marginRight: 10 }}>
              {companiesCount || '—'}
            </span>
            <span style={{ fontFamily: 'Epilogue, sans-serif', fontSize: 15, color: '#5A4880', lineHeight: 1.4 }}>comptes gérés</span>
          </button>

          {/* Contacts */}
          <button
            onClick={() => navigate('/contacts')}
            className="rounded-2xl flex items-center gap-2 flex-wrap text-left hover:shadow-sm transition-all"
            style={{ background: '#fff', border: '1px solid rgba(110,80,200,0.10)', boxShadow: '0 1px 4px rgba(110,80,200,0.07)', padding: '16px 20px' }}
          >
            <span style={{ fontFamily: 'Epilogue, sans-serif', fontWeight: 900, fontSize: 40, color: '#1A1040', lineHeight: 1, marginRight: 8 }}>
              {totalContacts || '—'}
            </span>
            <span style={{ fontFamily: 'Epilogue, sans-serif', fontSize: 15, color: '#5A4880', lineHeight: 1.4 }}>contacts gérés</span>
            {totalEmails > 0 && (
              <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 8, fontWeight: 700, padding: '2px 7px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '.06em', color: '#5A4880', background: 'rgba(110,80,200,0.10)', marginLeft: 2 }}>
                {totalEmails.toLocaleString('fr-FR')} emails
              </span>
            )}
          </button>
        </motion.div>

        {/* ══ Top 5 · NPS — leaderboard Meilleurs / À risque ════════════════ */}
        {npsRanked.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            <KnowrCard className="p-5 rounded-2xl">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5" style={{ color: 'var(--sage)', fontFamily: 'var(--mono)' }}>
                <TrendingUp className="size-3.5" /> Top 5 · Meilleurs comptes
              </p>
              <div className="space-y-1">
                {top5Best.map((c, i) => (
                  <button key={c.id} onClick={() => navigate(`/company/${c.id}`)}
                    className="w-full flex items-center gap-3 py-1.5 px-1.5 rounded-lg hover:bg-muted/50 transition-colors text-left">
                    <span className="text-xs font-bold text-muted-foreground w-4 flex-shrink-0">{i + 1}</span>
                    <span className="text-sm font-semibold flex-1 truncate">{c.name}</span>
                    <span className="text-sm font-black" style={{ color: 'var(--sage)' }}>{c.npsScore}</span>
                  </button>
                ))}
              </div>
            </KnowrCard>
            <KnowrCard className="p-5 rounded-2xl">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5" style={{ color: 'var(--coral)', fontFamily: 'var(--mono)' }}>
                <TrendingDown className="size-3.5" /> Top 5 · À risque
              </p>
              {top5Risk.length === 0 ? (
                <p className="text-sm text-muted-foreground py-1.5">Aucun compte détracteur.</p>
              ) : (
                <div className="space-y-1">
                  {top5Risk.map((c, i) => (
                    <button key={c.id} onClick={() => navigate(`/company/${c.id}`)}
                      className="w-full flex items-center gap-3 py-1.5 px-1.5 rounded-lg hover:bg-muted/50 transition-colors text-left">
                      <span className="text-xs font-bold text-muted-foreground w-4 flex-shrink-0">{i + 1}</span>
                      <span className="text-sm font-semibold flex-1 truncate">{c.name}</span>
                      <span className="text-sm font-black" style={{ color: 'var(--coral)' }}>{c.npsScore}</span>
                    </button>
                  ))}
                </div>
              )}
            </KnowrCard>
          </div>
        )}

        {/* ══ À faire aujourd'hui  +  Feed signaux (2 colonnes) ═════════════ */}
        <div className="grid grid-cols-1 gap-6 items-start lg:grid-cols-[58%_42%]">

          {/* ── LEFT : À faire aujourd'hui (priorisé) ──────────────────── */}
          <div>
            <div className="flex items-baseline justify-between gap-3 mb-4">
              <h2 className="text-xl font-black flex items-center gap-2">
                <Target className="size-5 text-primary" /> À faire aujourd'hui
              </h2>
              <p className="text-xs text-muted-foreground">priorisé · rattaché à un compte</p>
            </div>

            {todoList.length === 0 ? (
              <KnowrCard className="p-8 text-center rounded-2xl">
                <Building2 className="mx-auto mb-3 size-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Aucune action prioritaire. Synchronisez votre portefeuille pour faire remonter les comptes à traiter.</p>
              </KnowrCard>
            ) : (
              <div className="space-y-3">
                {todoList.map(c => {
                  const chip = c.verdict ? POSTURE_CHIP[c.verdict.posture] : null;
                  const daysText = c.lastDays == null ? '—' : c.lastDays === 0 ? "Auj." : c.lastDays === 1 ? 'Hier' : c.lastDays < 7 ? `${c.lastDays}j` : c.lastDays < 30 ? `${Math.floor(c.lastDays / 7)} sem` : `${c.lastDays} j`;
                  return (
                    <button key={c.id} onClick={() => navigate(`/company/${c.id}`)}
                      className="w-full text-left rounded-2xl border border-border bg-card p-4 hover:border-primary/30 hover:shadow-sm transition-all flex gap-3 group">
                      {/* Bande couleur posture */}
                      <span className="w-1 rounded-full flex-shrink-0" style={{ background: chip?.color ?? 'var(--border)' }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {chip && (
                            <span className="uppercase" style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 8, fontWeight: 700, padding: '2px 7px', borderRadius: 999, letterSpacing: '.06em', color: chip.color, background: chip.bg }}>
                              {chip.label}
                            </span>
                          )}
                          <span className="text-sm font-bold truncate flex-1">{c.verdict?.pilote ?? c.name}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ fontFamily: 'var(--mono)', color: '#6E50C8', background: 'rgba(110,80,200,0.10)' }}>
                            prio {c.verdict?.score}
                          </span>
                        </div>
                        {c.verdict?.reason && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{c.verdict.reason}</p>
                        )}
                        <div className="flex items-center gap-2 flex-wrap text-[11px]">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg font-semibold" style={{ background: 'var(--bg2)', color: 'var(--violet-d)' }}>
                            <Building2 className="size-3" /> {c.name}
                          </span>
                          <span className="text-muted-foreground" style={{ fontFamily: 'var(--mono)' }}>Vu {daysText}</span>
                          <span className="ml-auto text-primary font-semibold inline-flex items-center gap-1 group-hover:underline">
                            Ouvrir <ArrowRight className="size-3" />
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── RIGHT : Feed signaux · veille ──────────────────────────── */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
              <h2 className="text-xl font-black flex items-center gap-2"><Zap className="size-5 text-primary" /> Signaux · veille</h2>
              <button
                onClick={runVeille}
                disabled={veilleRunning}
                className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline disabled:opacity-50"
              >
                {veilleRunning ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCcw className="size-3.5" />}
                {veilleRunning ? 'Veille en cours…' : 'Lancer la veille'}
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-3">Actualités des comptes (LinkedIn · presse · web) — valide ou écarte chaque info.</p>
            {veilleMsg && <p className="text-[11px] text-muted-foreground mb-3" style={{ fontFamily: 'var(--mono)' }}>{veilleMsg}</p>}

            {signalsFeed.filter(s => signalState[s.id] !== 'no').length === 0 ? (
              <KnowrCard className="p-6 text-center rounded-2xl">
                <Zap className="mx-auto mb-3 size-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground mb-3">Aucune actualité encore. Lance la veille pour scanner tes comptes.</p>
                <button onClick={runVeille} disabled={veilleRunning}
                  className="text-xs font-semibold text-white px-3 py-2 rounded-xl disabled:opacity-50" style={{ background: '#6E50C8' }}>
                  {veilleRunning ? 'Veille en cours…' : 'Lancer la veille'}
                </button>
              </KnowrCard>
            ) : (
              <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
                {signalsFeed.filter(s => signalState[s.id] !== 'no').map(s => {
                  const validated = signalState[s.id] === 'ok';
                  return (
                    <KnowrCard key={s.id} className="p-4 rounded-2xl">
                      <div className="flex items-start gap-3">
                        <div className="size-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: s.bg }}>
                          <Zap className="size-4" style={{ color: s.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            {s.kind === 'company' ? (
                              <p className="text-sm font-bold leading-tight">{s.title}</p>
                            ) : (
                              <button onClick={() => s.entityId && navigate(`/contact/${s.entityId}`)}
                                className="text-sm font-bold leading-tight text-left hover:text-primary transition-colors">
                                {s.entityName}
                              </button>
                            )}
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase flex-shrink-0" style={{ color: s.color, background: s.bg, fontFamily: 'var(--mono)' }}>{s.tag}</span>
                          </div>
                          {s.text && <p className="text-xs text-muted-foreground line-clamp-3 mb-2">{s.text}</p>}
                          {/* Source · date · entité */}
                          <div className="flex items-center gap-2 flex-wrap mb-2 text-[10px] text-muted-foreground" style={{ fontFamily: 'var(--mono)' }}>
                            {s.source && (
                              s.sourceUrl
                                ? <a href={s.sourceUrl} target="_blank" rel="noopener noreferrer" className="px-1.5 py-0.5 rounded" style={{ background: 'var(--bg2)', color: 'var(--violet-d)' }}>{s.source} ↗</a>
                                : <span className="px-1.5 py-0.5 rounded" style={{ background: 'var(--bg2)' }}>{s.source}</span>
                            )}
                            {s.when && <span>{s.when}</span>}
                            {s.kind === 'company' && s.entityId && (
                              <button onClick={() => navigate(`/company/${s.entityId}`)} className="hover:text-primary">· {s.entityName}</button>
                            )}
                          </div>
                          {/* Valider / écarter */}
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground" style={{ fontFamily: 'var(--mono)' }}>Pertinent ?</span>
                            <button
                              onClick={() => setSignalStatus(s.id, 'ok', s.kind)}
                              className="size-6 rounded-lg flex items-center justify-center border transition-colors"
                              style={validated ? { background: '#2EA86A', borderColor: '#2EA86A', color: '#fff' } : { borderColor: 'var(--border)', color: 'var(--t3)' }}
                              title="Valider"
                            >
                              <Check className="size-3.5" />
                            </button>
                            <button
                              onClick={() => setSignalStatus(s.id, 'no', s.kind)}
                              className="size-6 rounded-lg flex items-center justify-center border border-border text-muted-foreground hover:border-destructive hover:text-destructive transition-colors"
                              title="Écarter"
                            >
                              <X className="size-3.5" />
                            </button>
                            {validated && <span className="text-[10px] font-semibold text-success ml-1">Validé ✓</span>}
                          </div>
                        </div>
                      </div>
                    </KnowrCard>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
