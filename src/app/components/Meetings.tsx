import { motion } from 'motion/react';
import { useMemo, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router';
import { useMeetings } from '../../hooks/useMeetings';
import {
  Search,
  Sparkles,
  CheckCircle2,
  Loader2,
  AlertCircle,
  X,
  Eye,
  Plus,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getActiveOrganizationId } from '../../lib/api/org';

interface Meeting {
  id: string;
  title: string;
  company: string;
  participants: { name: string; role?: string }[];
  date: string;
  time: string;
  durationMin: number | null;
  format: 'video' | 'physical';
  location?: string;
  category: string;
  tags?: string[];
  relationScore: number;
  briefStatus: 'ready' | 'generating' | 'to_generate' | 'insufficient' | 'consulted';
  hasDecisionMaker: boolean;
  isExternal: boolean;
  isPast: boolean;
}

// ── Design helpers ───────────────────────────────────────────────────────────

const AVATAR_COLORS = ['#6E50C8','#2EA86A','#C97A20','#0B8878','#3D6FCC','#9082B8','#D94F63'];
const avatarBg = (name: string) => AVATAR_COLORS[(name.charCodeAt(0) + (name.charCodeAt(1) || 0)) % AVATAR_COLORS.length];
const initials2 = (name: string) =>
  name.split(/[\s\-]+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();

const npsColor = (score: number) =>
  score >= 70 ? '#2EA86A' : score >= 50 ? '#C97A20' : score > 0 ? '#D94F63' : '#C4B8E0';

const mono: CSSProperties = {
  fontFamily: '"JetBrains Mono", monospace',
  fontWeight: 700,
  textTransform: 'uppercase' as const,
  letterSpacing: '.06em',
};

// ── Status badge config ──────────────────────────────────────────────────────

function getStatus(meeting: Meeting) {
  const { briefStatus, relationScore } = meeting;
  if (briefStatus === 'ready' || briefStatus === 'consulted') {
    return { label: 'Brief prêt', color: '#2EA86A', borderColor: 'rgba(46,168,106,0.45)', Icon: CheckCircle2, eye: true };
  }
  if (briefStatus === 'generating') {
    return { label: 'En cours', color: '#C97A20', borderColor: 'rgba(201,122,32,0.40)', Icon: Loader2, eye: false };
  }
  if (briefStatus === 'insufficient' || (relationScore > 0 && relationScore < 50)) {
    return { label: 'Urgent', color: '#D94F63', borderColor: 'rgba(217,79,99,0.45)', Icon: AlertCircle, eye: false };
  }
  return { label: 'À générer', color: '#9082B8', borderColor: 'rgba(144,130,184,0.35)', Icon: Sparkles, eye: false };
}

// ── Row accent color from NPS ────────────────────────────────────────────────

const rowAccent = (score: number) =>
  score >= 70 ? '#2EA86A' : score >= 50 ? '#C97A20' : score > 0 ? '#D94F63' : '#C4B8E0';

// ─────────────────────────────────────────────────────────────────────────────

export default function Meetings() {
  const navigate = useNavigate();
  const { meetings: domainMeetings, reload } = useMeetings();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ stats?: any; error?: string } | null>(null);

  // ── Sync calendars ────────────────────────────────────────────────────────
  async function handleSync() {
    if (!supabase || syncing) return;
    setSyncing(true);
    setSyncResult(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Non authentifié');
      const orgId = await getActiveOrganizationId();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const headers = { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' };
      const providerToken = session.provider_token;

      const { data: connectors } = await supabase
        .from('connectors').select('provider, status')
        .eq('organization_id', orgId).eq('status', 'connected');
      const connected = new Set((connectors ?? []).map((c: any) => c.provider as string));
      const hasGoogle = connected.has('google');
      const hasMicrosoft = connected.has('microsoft');

      if (!hasGoogle && !hasMicrosoft) {
        setSyncResult({ error: 'Aucun compte connecté. Allez dans Paramètres → Connexions.' });
        return;
      }

      let stats = { total_events: 0, meeting_events: 0, created: 0, updated: 0 };

      if (hasGoogle && providerToken) {
        const res = await fetch(`${supabaseUrl}/functions/v1/sync-google-calendar`, {
          method: 'POST', headers, body: JSON.stringify({ organizationId: orgId, providerToken }),
        });
        const d = await res.json();
        if (res.ok && d.stats) {
          stats.total_events += d.stats.total_events ?? 0;
          stats.meeting_events += d.stats.meeting_events ?? 0;
          stats.created += d.stats.created ?? 0;
          stats.updated += d.stats.updated ?? 0;
        }
        fetch(`${supabaseUrl}/functions/v1/ingest-communication`, {
          method: 'POST', headers,
          body: JSON.stringify({ organizationId: orgId, providerToken, provider: 'google', lookbackDays: 3650 }),
        }).catch(() => {});
      }

      if (hasMicrosoft) {
        const { data: msC } = await supabase.from('connectors').select('metadata')
          .eq('organization_id', orgId).eq('provider', 'microsoft').eq('status', 'connected').maybeSingle();
        const msToken = (msC?.metadata as any)?.access_token ?? (!hasGoogle ? providerToken : null);
        if (msToken) {
          const res = await fetch(`${supabaseUrl}/functions/v1/sync-outlook-calendar`, {
            method: 'POST', headers, body: JSON.stringify({ organizationId: orgId, providerToken: msToken }),
          });
          const d = await res.json();
          if (res.ok && d.stats) {
            stats.total_events += d.stats.total_events ?? 0;
            stats.meeting_events += d.stats.meeting_events ?? 0;
            stats.created += d.stats.created ?? 0;
            stats.updated += d.stats.updated ?? 0;
          }
        }
      }

      setSyncResult({ stats });
      reload?.();
    } catch (e: any) {
      setSyncResult({ error: e.message || 'Erreur inattendue' });
    } finally {
      setSyncing(false);
    }
  }

  const today = new Date().toISOString().slice(0, 10);

  // ── Domain → display ──────────────────────────────────────────────────────
  const allMeetings: Meeting[] = useMemo(() =>
    domainMeetings.map(m => {
      const names: string[] = (m as any).participantNames ?? [];
      const durationMin = m.endsAt
        ? Math.round((new Date(m.endsAt).getTime() - new Date(m.startsAt).getTime()) / 60000)
        : null;
      return {
        id: m.id,
        title: m.title,
        company: m.company || '—',
        participants: names.map(n => ({ name: n })),
        date: m.startsAt.slice(0, 10),
        time: new Date(m.startsAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        durationMin,
        format: (m.format === 'physical' ? 'physical' : 'video') as 'video' | 'physical',
        location: m.location ?? undefined,
        category: (m as any).category ?? 'Réunion',
        tags: (m as any).tags ?? [],
        relationScore: m.importanceScore ?? 0,
        briefStatus: ((m.briefStatus as Meeting['briefStatus']) ?? 'to_generate'),
        hasDecisionMaker: (m as any).has_decision_maker ?? false,
        isExternal: (m as any).is_external ?? true,
        isPast: m.startsAt.slice(0, 10) < today,
      };
    }),
  [domainMeetings, today]);

  // ── Filter + sort ─────────────────────────────────────────────────────────
  const displayedMeetings = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return allMeetings
      .filter(m => activeTab === 'upcoming' ? !m.isPast : m.isPast)
      .filter(m => !q || m.title.toLowerCase().includes(q) || m.company.toLowerCase().includes(q) || m.participants.some(p => p.name.toLowerCase().includes(q)))
      .sort((a, b) => {
        const ta = new Date(`${a.date}T${a.time}`).getTime();
        const tb = new Date(`${b.date}T${b.time}`).getTime();
        return activeTab === 'upcoming' ? ta - tb : tb - ta;
      });
  }, [allMeetings, activeTab, searchQuery]);

  // ── Render ────────────────────────────────────────────────────────────────

  const COL = '72px 1fr 150px 148px 104px 130px 52px';

  return (
    <div className="size-full overflow-auto" style={{ background: 'var(--color-background, #F4F2FB)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '36px 40px' }}>

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, gap: 16 }}>
          <div>
            <h1 style={{ fontFamily: 'Epilogue, sans-serif', fontWeight: 900, fontSize: 28, color: 'var(--t1, #1A1040)', margin: 0, lineHeight: 1.1 }}>
              Réunions
            </h1>
            <p style={{ ...mono, fontSize: 10, color: 'var(--t3, #9082B8)', marginTop: 5 }}>
              À venir &amp; passées
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: '#9082B8', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Rechercher un compte, une personne…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  paddingLeft: 38, paddingRight: 16, paddingTop: 10, paddingBottom: 10,
                  background: '#fff', border: '1.5px solid rgba(110,80,200,0.14)',
                  borderRadius: 999, fontSize: 13, color: '#1A1040', outline: 'none', width: 280,
                  fontFamily: 'Epilogue, sans-serif',
                }}
              />
            </div>
            {/* Sync button (kept as subtle icon) */}
            <button
              onClick={handleSync}
              disabled={syncing}
              title="Synchroniser le calendrier"
              style={{
                width: 40, height: 40, borderRadius: '50%', border: '1.5px solid rgba(110,80,200,0.18)',
                background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: syncing ? 'not-allowed' : 'pointer', opacity: syncing ? 0.6 : 1,
              }}
            >
              {syncing
                ? <Loader2 style={{ width: 16, height: 16, color: '#6E50C8' }} className="animate-spin" />
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6E50C8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
              }
            </button>
            {/* Nouveau brief */}
            <button
              onClick={() => navigate('/brief-externe')}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
                background: '#6E50C8', borderRadius: 999, color: '#fff',
                fontFamily: 'Epilogue, sans-serif', fontWeight: 700, fontSize: 14,
                border: 'none', cursor: 'pointer', boxShadow: '0 4px 16px rgba(110,80,200,0.28)',
              }}
            >
              <Plus style={{ width: 18, height: 18 }} />
              Nouveau brief
            </button>
          </div>
        </div>

        {/* ── Sync result banner ───────────────────────────────────────────── */}
        {syncResult && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 20,
            padding: '14px 18px', borderRadius: 16,
            background: syncResult.error ? 'rgba(217,79,99,0.08)' : 'rgba(46,168,106,0.08)',
            border: `1px solid ${syncResult.error ? 'rgba(217,79,99,0.25)' : 'rgba(46,168,106,0.25)'}`,
          }}>
            {syncResult.error
              ? <AlertCircle style={{ width: 18, height: 18, color: '#D94F63', flexShrink: 0, marginTop: 1 }} />
              : <CheckCircle2 style={{ width: 18, height: 18, color: '#2EA86A', flexShrink: 0, marginTop: 1 }} />
            }
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: 'Epilogue, sans-serif', fontWeight: 700, fontSize: 13, color: syncResult.error ? '#D94F63' : '#2EA86A', margin: 0 }}>
                {syncResult.error ?? 'Synchronisation réussie !'}
              </p>
              {!syncResult.error && syncResult.stats && (
                <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: '#9082B8', margin: '3px 0 0' }}>
                  {syncResult.stats.created} nouvelles · {syncResult.stats.updated} mises à jour · {syncResult.stats.meeting_events} réunions / {syncResult.stats.total_events} événements
                </p>
              )}
            </div>
            <button onClick={() => setSyncResult(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5, padding: 0 }}>
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>
        )}

        {/* ── Tabs ─────────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {(['upcoming', 'past'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '9px 22px', borderRadius: 999, cursor: 'pointer',
                fontFamily: 'Epilogue, sans-serif', fontWeight: 700, fontSize: 14,
                background: activeTab === tab ? '#6E50C8' : 'transparent',
                color: activeTab === tab ? '#fff' : '#9082B8',
                border: activeTab === tab ? 'none' : '1.5px solid rgba(110,80,200,0.22)',
                transition: 'all 0.18s',
              }}
            >
              {tab === 'upcoming' ? 'À venir' : 'Passées'}
            </button>
          ))}
        </div>

        {/* ── Table ────────────────────────────────────────────────────────── */}
        <div>
          {/* Column headers */}
          <div style={{
            display: 'grid', gridTemplateColumns: COL,
            padding: '0 0 10px 27px',
            borderBottom: '1.5px solid rgba(110,80,200,0.10)',
          }}>
            {['DATE', 'RÉUNION', 'COMPTE', 'NOTE RELATION · NPS', 'PARTICIPANTS', 'STATUT', ''].map((col, i) => (
              <span key={i} style={{ ...mono, fontSize: 9, color: 'var(--t3, #9082B8)', letterSpacing: '.08em' }}>{col}</span>
            ))}
          </div>

          {/* Rows */}
          {displayedMeetings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#9082B8' }}>
              <svg style={{ width: 40, height: 40, margin: '0 auto 16px', opacity: 0.25 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <p style={{ fontFamily: 'Epilogue, sans-serif', fontWeight: 700, fontSize: 15, color: '#1A1040', margin: '0 0 6px' }}>
                {searchQuery ? `Aucun résultat pour "${searchQuery}"` : `Aucune réunion ${activeTab === 'upcoming' ? 'à venir' : 'passée'}`}
              </p>
              <p style={{ fontFamily: 'Epilogue, sans-serif', fontSize: 13, color: '#9082B8', margin: 0 }}>
                {!searchQuery && activeTab === 'upcoming' ? 'Synchronisez votre calendrier pour voir vos réunions apparaître.' : ''}
              </p>
            </div>
          ) : (
            displayedMeetings.map((meeting, i) => {
              const score = meeting.relationScore;
              const accent = rowAccent(score);
              const scoreColor = npsColor(score);
              const status = getStatus(meeting);
              const StatusIcon = status.Icon;

              return (
                <motion.div
                  key={meeting.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: Math.min(i * 0.04, 0.25) }}
                  onClick={() => navigate(`/meeting/${meeting.id}`)}
                  style={{
                    display: 'grid', gridTemplateColumns: COL,
                    alignItems: 'center',
                    padding: '18px 0 18px 24px',
                    borderLeft: `3px solid ${accent}`,
                    borderBottom: '1px solid rgba(110,80,200,0.07)',
                    cursor: 'pointer',
                    background: '#fff',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(110,80,200,0.025)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#fff'; }}
                >
                  {/* DATE */}
                  <div>
                    <div style={{ fontFamily: 'Epilogue, sans-serif', fontWeight: 900, fontSize: 22, color: '#6E50C8', lineHeight: 1 }}>
                      {new Date(meeting.date + 'T12:00:00').getDate().toString().padStart(2, '0')}
                    </div>
                    <div style={{ ...mono, fontSize: 9, color: '#9082B8', marginTop: 3 }}>
                      {new Date(meeting.date + 'T12:00:00').toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase().replace('.', '')}
                    </div>
                  </div>

                  {/* RÉUNION */}
                  <div style={{ paddingRight: 16 }}>
                    <div style={{ fontFamily: 'Epilogue, sans-serif', fontWeight: 700, fontSize: 14, color: '#1A1040', lineHeight: 1.35, marginBottom: 7 }}>
                      {meeting.title}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {/* Category chip */}
                      <span style={{ ...mono, fontSize: 9, padding: '2px 8px', borderRadius: 999, color: '#7B68C0', background: 'rgba(110,80,200,0.09)' }}>
                        {meeting.category}
                      </span>
                      {/* Risk chip when score < 50 */}
                      {score > 0 && score < 50 && (
                        <span style={{ ...mono, fontSize: 9, padding: '2px 8px', borderRadius: 999, color: '#D94F63', border: '1px solid rgba(217,79,99,0.42)', background: 'transparent' }}>
                          Rétention · Risque
                        </span>
                      )}
                      {/* Extra tags */}
                      {(meeting.tags ?? []).filter(t => t).map((tag, ti) => (
                        <span key={ti} style={{ ...mono, fontSize: 9, padding: '2px 8px', borderRadius: 999, color: '#9082B8', background: 'rgba(144,130,184,0.10)' }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* COMPTE */}
                  <div style={{ fontFamily: 'Epilogue, sans-serif', fontWeight: 600, fontSize: 13, color: meeting.company !== '—' ? '#6E50C8' : '#C4B8E0' }}>
                    {meeting.company !== '—' ? meeting.company : ''}
                  </div>

                  {/* NOTE RELATION · NPS */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    {score > 0 ? (
                      <>
                        <span style={{ fontFamily: 'Epilogue, sans-serif', fontWeight: 800, fontSize: 20, color: scoreColor, lineHeight: 1 }}>
                          {score}
                        </span>
                        <span style={{ fontSize: 13, color: scoreColor, lineHeight: 1 }}>
                          {score >= 70 ? '↗' : score >= 50 ? '→' : '↘'}
                        </span>
                      </>
                    ) : (
                      <span style={{ color: '#C4B8E0', fontSize: 16 }}>—</span>
                    )}
                  </div>

                  {/* PARTICIPANTS */}
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {meeting.participants.length === 0 ? (
                      <span style={{ color: '#C4B8E0', fontSize: 13 }}>—</span>
                    ) : (
                      meeting.participants.slice(0, 4).map((p, idx) => (
                        <div
                          key={idx}
                          title={p.name}
                          style={{
                            width: 28, height: 28, borderRadius: '50%',
                            background: avatarBg(p.name),
                            border: '2px solid #fff',
                            marginLeft: idx === 0 ? 0 : -9,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontFamily: '"JetBrains Mono", monospace',
                            fontSize: 8.5, fontWeight: 700, color: '#fff',
                            zIndex: 10 - idx, position: 'relative',
                            flexShrink: 0,
                          }}
                        >
                          {initials2(p.name)}
                        </div>
                      ))
                    )}
                    {meeting.participants.length > 4 && (
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%', background: '#C4B8E0',
                        border: '2px solid #fff', marginLeft: -9,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: '"JetBrains Mono", monospace', fontSize: 8, fontWeight: 700, color: '#fff',
                        zIndex: 1, position: 'relative', flexShrink: 0,
                      }}>
                        +{meeting.participants.length - 4}
                      </div>
                    )}
                  </div>

                  {/* STATUT */}
                  <div>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '4px 10px', borderRadius: 999,
                      border: `1.5px solid ${status.borderColor}`,
                      color: status.color,
                      ...mono, fontSize: 9,
                    }}>
                      <StatusIcon
                        style={{ width: 10, height: 10, flexShrink: 0 }}
                        className={status.label === 'En cours' ? 'animate-spin' : undefined}
                      />
                      {status.label}
                    </span>
                  </div>

                  {/* ACTION */}
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <button
                      onClick={e => { e.stopPropagation(); navigate(`/meeting/${meeting.id}`); }}
                      style={{
                        width: 36, height: 36, borderRadius: '50%', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: status.eye ? '#6E50C8' : 'transparent',
                        border: status.eye ? 'none' : '1.5px solid rgba(110,80,200,0.30)',
                        transition: 'all 0.15s',
                      }}
                    >
                      {status.eye ? (
                        <Eye style={{ width: 15, height: 15, color: '#fff' }} />
                      ) : (
                        <Sparkles style={{ width: 15, height: 15, color: '#6E50C8' }} />
                      )}
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
