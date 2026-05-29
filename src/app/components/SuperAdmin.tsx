import { useEffect, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  Users, Building2, Calendar, Mail, Brain, TrendingUp, TrendingDown,
  Minus, AlertCircle, Shield, Activity, Zap, Database, BarChart3,
  RefreshCw, Eye, Clock, Network, CheckCircle2, XCircle, Globe,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import KnowyCard from './knowy/KnowyCard';
import KnowyBadge from './knowy/KnowyBadge';

// ── Types ────────────────────────────────────────────────────────────────────
interface PlatformStats {
  totalUsers: number;
  totalOrgs: number;
  totalMeetings: number;
  totalContacts: number;
  totalBriefs: number;
  briefsReady: number;
  totalMessages: number;
  activeConnectors: number;
  avgBriefConfidence: number;
}

interface OrgRow {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  memberCount: number;
  meetingCount: number;
  contactCount: number;
  briefCount: number;
  hasGoogle: boolean;
  hasMicrosoft: boolean;
}

interface UserRow {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  orgName: string | null;
  meetingCount: number;
  lastSeen: string | null;
}

interface TimeSeriesPoint { date: string; value: number; }

// ── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({
  label, value, sub, icon: Icon, color = 'text-primary', trend,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color?: string; trend?: 'up' | 'down' | 'flat';
}) {
  return (
    <KnowyCard className="p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`size-10 rounded-xl bg-primary/10 flex items-center justify-center`}>
          <Icon className={`size-5 ${color}`} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${
            trend === 'up' ? 'text-success' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground'
          }`}>
            {trend === 'up' ? <TrendingUp className="size-3" /> :
             trend === 'down' ? <TrendingDown className="size-3" /> :
             <Minus className="size-3" />}
          </div>
        )}
      </div>
      <div className="text-3xl font-black mb-1">{value}</div>
      <div className="text-sm font-medium text-foreground">{label}</div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
    </KnowyCard>
  );
}

// ── Mini bar chart (pure CSS) ─────────────────────────────────────────────────
function MiniBarChart({ data, color = '#6366f1' }: { data: TimeSeriesPoint[]; color?: string }) {
  if (!data.length) return <div className="h-16 flex items-center justify-center text-xs text-muted-foreground">Pas de données</div>;
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-1 h-16">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
          <div
            className="w-full rounded-t transition-all"
            style={{ height: `${(d.value / max) * 56}px`, backgroundColor: color, opacity: 0.8 }}
          />
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-10">
            {d.date}: {d.value}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Network graph placeholder ─────────────────────────────────────────────────
function NetworkGraph({ orgs }: { orgs: OrgRow[] }) {
  return (
    <div className="relative bg-muted/20 rounded-2xl overflow-hidden" style={{ height: 320 }}>
      <svg width="100%" height="100%" viewBox="0 0 600 320">
        {/* Central node — Knowy platform */}
        <circle cx={300} cy={160} r={28} fill="hsl(var(--primary))" opacity={0.9} />
        <text x={300} y={164} textAnchor="middle" fill="white" fontSize={10} fontWeight="bold">Knowy</text>

        {orgs.slice(0, 8).map((org, i) => {
          const angle = (i / Math.min(orgs.length, 8)) * 2 * Math.PI - Math.PI / 2;
          const r = 110;
          const x = 300 + r * Math.cos(angle);
          const y = 160 + r * Math.sin(angle);
          const size = 10 + org.memberCount * 3;
          return (
            <g key={org.id}>
              <line x1={300} y1={160} x2={x} y2={y} stroke="hsl(var(--border))" strokeWidth={1.5} strokeDasharray="4 2" />
              <circle cx={x} cy={y} r={Math.min(size, 22)} fill="hsl(var(--secondary))" stroke="hsl(var(--border))" strokeWidth={1.5} />
              <text x={x} y={y + 3} textAnchor="middle" fontSize={8} fill="hsl(var(--foreground))" fontWeight="500">
                {org.name.slice(0, 6)}
              </text>
              <text x={x} y={y + 30} textAnchor="middle" fontSize={7} fill="hsl(var(--muted-foreground))">
                {org.memberCount}u · {org.meetingCount}m
              </text>
            </g>
          );
        })}
      </svg>
      <div className="absolute bottom-3 left-3 text-xs text-muted-foreground">
        Taille des nœuds = nombre de membres
      </div>
    </div>
  );
}

// ── Main SuperAdmin component ─────────────────────────────────────────────────
export default function SuperAdmin() {
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [orgs, setOrgs] = useState<OrgRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [signupSeries, setSignupSeries] = useState<TimeSeriesPoint[]>([]);
  const [meetingSeries, setMeetingSeries] = useState<TimeSeriesPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'orgs' | 'users' | 'network'>('overview');

  const load = useCallback(async () => {
    if (!supabase) return;

    // Check super admin status
    const { data: saRow } = await supabase.from('super_admins').select('id').maybeSingle();
    if (!saRow) { setIsSuperAdmin(false); setLoading(false); return; }
    setIsSuperAdmin(true);

    // ── Platform-wide stats ──────────────────────────────────────────────
    const [
      { count: totalUsers },
      { count: totalOrgs },
      { count: totalMeetings },
      { count: totalContacts },
      { count: totalBriefs },
      { count: briefsReady },
      { count: totalMessages },
      { count: activeConnectors },
      { data: briefConf },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('organizations').select('*', { count: 'exact', head: true }),
      supabase.from('meetings').select('*', { count: 'exact', head: true }),
      supabase.from('contacts').select('*', { count: 'exact', head: true }),
      supabase.from('briefs').select('*', { count: 'exact', head: true }),
      supabase.from('briefs').select('*', { count: 'exact', head: true }).eq('status', 'ready'),
      supabase.from('communication_messages').select('*', { count: 'exact', head: true }),
      supabase.from('connectors').select('*', { count: 'exact', head: true }).eq('status', 'connected'),
      supabase.from('briefs').select('confidence_score').eq('status', 'ready').limit(100),
    ]);

    const avgConf = briefConf?.length
      ? Math.round(briefConf.reduce((a, b) => a + (b.confidence_score || 0), 0) / briefConf.length)
      : 0;

    setStats({
      totalUsers: totalUsers ?? 0,
      totalOrgs: totalOrgs ?? 0,
      totalMeetings: totalMeetings ?? 0,
      totalContacts: totalContacts ?? 0,
      totalBriefs: totalBriefs ?? 0,
      briefsReady: briefsReady ?? 0,
      totalMessages: totalMessages ?? 0,
      activeConnectors: activeConnectors ?? 0,
      avgBriefConfidence: avgConf,
    });

    // ── Orgs detail ──────────────────────────────────────────────────────
    const { data: orgRows } = await supabase.from('organizations').select('id, name, slug, created_at').order('created_at', { ascending: false }).limit(50);

    const orgDetails: OrgRow[] = await Promise.all((orgRows || []).map(async (org) => {
      const [
        { count: memberCount },
        { count: meetingCount },
        { count: contactCount },
        { count: briefCount },
        { data: connectors },
      ] = await Promise.all([
        supabase.from('memberships').select('*', { count: 'exact', head: true }).eq('organization_id', org.id),
        supabase.from('meetings').select('*', { count: 'exact', head: true }).eq('organization_id', org.id),
        supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('organization_id', org.id),
        supabase.from('briefs').select('*', { count: 'exact', head: true }).eq('organization_id', org.id),
        supabase.from('connectors').select('provider, status').eq('organization_id', org.id).eq('status', 'connected'),
      ]);
      return {
        ...org,
        memberCount: memberCount ?? 0,
        meetingCount: meetingCount ?? 0,
        contactCount: contactCount ?? 0,
        briefCount: briefCount ?? 0,
        hasGoogle: connectors?.some(c => c.provider === 'google') ?? false,
        hasMicrosoft: connectors?.some(c => c.provider === 'microsoft') ?? false,
      };
    }));
    setOrgs(orgDetails);

    // ── Users detail ─────────────────────────────────────────────────────
    const { data: userRows } = await supabase.from('profiles').select('id, full_name, created_at').order('created_at', { ascending: false }).limit(50);

    const userDetails: UserRow[] = await Promise.all((userRows || []).map(async (u) => {
      const { data: membership } = await supabase.from('memberships').select('organizations(name)').eq('user_id', u.id).maybeSingle();
      const { count: meetingCount } = await supabase.from('meetings').select('*', { count: 'exact', head: true }).eq('owner_user_id', u.id);
      return {
        id: u.id,
        email: '',
        full_name: u.full_name,
        created_at: u.created_at,
        orgName: (membership?.organizations as any)?.name ?? null,
        meetingCount: meetingCount ?? 0,
        lastSeen: null,
      };
    }));
    setUsers(userDetails);

    // ── Time series: signups last 14 days ────────────────────────────────
    const { data: allProfiles } = await supabase.from('profiles').select('created_at').order('created_at', { ascending: true });
    const signupMap: Record<string, number> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
      signupMap[d] = 0;
    }
    for (const p of allProfiles || []) {
      const d = (p.created_at || '').split('T')[0];
      if (signupMap[d] !== undefined) signupMap[d]++;
    }
    setSignupSeries(Object.entries(signupMap).map(([date, value]) => ({ date: date.slice(5), value })));

    // ── Time series: meetings last 14 days ───────────────────────────────
    const { data: allMeetings } = await supabase.from('meetings').select('created_at').order('created_at', { ascending: true });
    const meetingMap: Record<string, number> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
      meetingMap[d] = 0;
    }
    for (const m of allMeetings || []) {
      const d = (m.created_at || '').split('T')[0];
      if (meetingMap[d] !== undefined) meetingMap[d]++;
    }
    setMeetingSeries(Object.entries(meetingMap).map(([date, value]) => ({ date: date.slice(5), value })));

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRefresh = () => { setRefreshing(true); load(); };

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center text-muted-foreground">
        Chargement Super Admin…
      </div>
    );
  }

  if (isSuperAdmin === false) {
    return (
      <div className="flex min-h-full items-center justify-center flex-col gap-4">
        <Shield className="size-16 text-destructive opacity-50" />
        <h2 className="text-xl font-semibold">Accès refusé</h2>
        <p className="text-muted-foreground">Cette page est réservée aux super admins Knowy.</p>
      </div>
    );
  }

  return (
    <div className="size-full bg-background overflow-auto">
      <div className="max-w-[1400px] mx-auto px-4 py-6 sm:px-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 bg-primary rounded-xl flex items-center justify-center">
                <Shield className="size-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-black">Super Admin</h1>
                <p className="text-sm text-muted-foreground">Vision 360° · Knowy Platform</p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted transition-colors text-sm font-medium"
            >
              <RefreshCw className={`size-4 ${refreshing ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-border pb-0">
          {[
            { id: 'overview', label: 'Vue globale', icon: BarChart3 },
            { id: 'orgs', label: 'Organisations', icon: Building2 },
            { id: 'users', label: 'Utilisateurs', icon: Users },
            { id: 'network', label: 'Réseau', icon: Network },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="size-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── TAB: OVERVIEW ─────────────────────────────────────────────────── */}
        {activeTab === 'overview' && stats && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

            {/* KPI Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              <KpiCard label="Utilisateurs" value={stats.totalUsers} icon={Users} color="text-primary" sub="comptes actifs" />
              <KpiCard label="Organisations" value={stats.totalOrgs} icon={Building2} color="text-secondary" sub="workspaces" />
              <KpiCard label="Réunions" value={stats.totalMeetings} icon={Calendar} color="text-accent" sub="synchronisées" />
              <KpiCard label="Contacts" value={stats.totalContacts} icon={Users} color="text-success" sub="en mémoire relationnelle" />
              <KpiCard label="Briefs générés" value={stats.totalBriefs} icon={Brain} color="text-primary" sub={`${stats.briefsReady} prêts`} />
              <KpiCard label="Messages ingérés" value={stats.totalMessages} icon={Mail} color="text-muted-foreground" sub="métadonnées Gmail" />
              <KpiCard label="Connecteurs actifs" value={stats.activeConnectors} icon={Zap} color="text-success" sub="Google / Microsoft" />
              <KpiCard label="Confiance brief moy." value={`${stats.avgBriefConfidence}%`} icon={Activity} color="text-primary" sub="sur briefs ready" />
              <KpiCard
                label="Taux briefs prêts"
                value={stats.totalBriefs > 0 ? `${Math.round(stats.briefsReady / stats.totalBriefs * 100)}%` : '—'}
                icon={CheckCircle2}
                color={stats.totalBriefs > 0 && stats.briefsReady / stats.totalBriefs > 0.7 ? 'text-success' : 'text-amber-600'}
                sub={`${stats.briefsReady} / ${stats.totalBriefs}`}
              />
              <KpiCard
                label="Ratio contacts/org"
                value={stats.totalOrgs > 0 ? Math.round(stats.totalContacts / stats.totalOrgs) : '—'}
                icon={Database}
                color="text-primary"
                sub="mémoire par org"
              />
            </div>

            {/* Time series */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <KnowyCard className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="size-4 text-primary" />
                  <h3 className="font-semibold">Inscriptions — 14 derniers jours</h3>
                </div>
                <MiniBarChart data={signupSeries} color="hsl(var(--primary))" />
                <div className="flex justify-between mt-2">
                  {signupSeries.filter((_, i) => i % 4 === 0).map(d => (
                    <span key={d.date} className="text-xs text-muted-foreground">{d.date}</span>
                  ))}
                </div>
              </KnowyCard>

              <KnowyCard className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="size-4 text-accent" />
                  <h3 className="font-semibold">Réunions créées — 14 derniers jours</h3>
                </div>
                <MiniBarChart data={meetingSeries} color="hsl(var(--accent))" />
                <div className="flex justify-between mt-2">
                  {meetingSeries.filter((_, i) => i % 4 === 0).map(d => (
                    <span key={d.date} className="text-xs text-muted-foreground">{d.date}</span>
                  ))}
                </div>
              </KnowyCard>
            </div>

            {/* Health indicators */}
            <KnowyCard className="p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Activity className="size-4 text-primary" />
                Indicateurs de santé plateforme
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    label: 'Activation Google',
                    value: stats.activeConnectors,
                    total: stats.totalUsers,
                    color: 'bg-success',
                    icon: Globe,
                  },
                  {
                    label: 'Briefs ready / total',
                    value: stats.briefsReady,
                    total: Math.max(stats.totalBriefs, 1),
                    color: 'bg-primary',
                    icon: Brain,
                  },
                  {
                    label: 'Messages / contact',
                    value: stats.totalMessages,
                    total: Math.max(stats.totalContacts * 5, 1),
                    color: 'bg-accent',
                    icon: Mail,
                  },
                ].map(item => {
                  const pct = Math.min(100, Math.round(item.value / item.total * 100));
                  return (
                    <div key={item.label}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5 text-sm font-medium">
                          <item.icon className="size-3.5 text-muted-foreground" />
                          {item.label}
                        </div>
                        <span className="text-sm font-bold">{pct}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${item.color}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{item.value} / {item.total}</div>
                    </div>
                  );
                })}
              </div>
            </KnowyCard>
          </motion.div>
        )}

        {/* ── TAB: ORGS ─────────────────────────────────────────────────────── */}
        {activeTab === 'orgs' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <KnowyCard className="overflow-hidden">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold">{orgs.length} organisations</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      {['Organisation', 'Membres', 'Réunions', 'Contacts', 'Briefs', 'Connecteurs', 'Créée le'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orgs.map((org, i) => (
                      <tr key={org.id} className={`border-b border-border/50 hover:bg-muted/20 transition-colors ${i % 2 === 0 ? '' : 'bg-muted/10'}`}>
                        <td className="px-4 py-3">
                          <div className="font-medium">{org.name}</div>
                          <div className="text-xs text-muted-foreground">{org.slug}</div>
                        </td>
                        <td className="px-4 py-3">
                          <KnowyBadge variant="default" size="sm">{org.memberCount}</KnowyBadge>
                        </td>
                        <td className="px-4 py-3 font-mono">{org.meetingCount}</td>
                        <td className="px-4 py-3 font-mono">{org.contactCount}</td>
                        <td className="px-4 py-3 font-mono">{org.briefCount}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {org.hasGoogle && (
                              <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full font-medium">Google</span>
                            )}
                            {org.hasMicrosoft && (
                              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Microsoft</span>
                            )}
                            {!org.hasGoogle && !org.hasMicrosoft && (
                              <span className="text-xs text-muted-foreground">Aucun</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {new Date(org.created_at).toLocaleDateString('fr-FR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </KnowyCard>
          </motion.div>
        )}

        {/* ── TAB: USERS ────────────────────────────────────────────────────── */}
        {activeTab === 'users' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <KnowyCard className="overflow-hidden">
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold">{users.length} utilisateurs</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      {['Utilisateur', 'Organisation', 'Réunions', 'Inscrit le'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, i) => (
                      <tr key={u.id} className={`border-b border-border/50 hover:bg-muted/20 transition-colors ${i % 2 === 0 ? '' : 'bg-muted/10'}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                              {(u.full_name || u.email || '?')[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium">{u.full_name || '—'}</div>
                              <div className="text-xs text-muted-foreground">{u.id.slice(0, 8)}…</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {u.orgName
                            ? <KnowyBadge variant="default" size="sm">{u.orgName}</KnowyBadge>
                            : <span className="text-muted-foreground text-xs">Aucune</span>
                          }
                        </td>
                        <td className="px-4 py-3 font-mono">{u.meetingCount}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {new Date(u.created_at).toLocaleDateString('fr-FR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </KnowyCard>
          </motion.div>
        )}

        {/* ── TAB: NETWORK ──────────────────────────────────────────────────── */}
        {activeTab === 'network' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <KnowyCard className="p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Network className="size-4 text-primary" />
                Carte des organisations
              </h3>
              <NetworkGraph orgs={orgs} />
            </KnowyCard>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <KnowyCard className="p-5">
                <div className="text-2xl font-black text-primary mb-1">
                  {orgs.filter(o => o.hasGoogle).length}
                </div>
                <div className="text-sm font-medium">Orgs avec Google</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {stats ? `${Math.round(orgs.filter(o => o.hasGoogle).length / Math.max(orgs.length, 1) * 100)}% du total` : '—'}
                </div>
              </KnowyCard>
              <KnowyCard className="p-5">
                <div className="text-2xl font-black text-primary mb-1">
                  {orgs.reduce((a, o) => a + o.memberCount, 0)}
                </div>
                <div className="text-sm font-medium">Total membres</div>
                <div className="text-xs text-muted-foreground mt-1">
                  moy. {orgs.length > 0 ? (orgs.reduce((a, o) => a + o.memberCount, 0) / orgs.length).toFixed(1) : '—'} / org
                </div>
              </KnowyCard>
              <KnowyCard className="p-5">
                <div className="text-2xl font-black text-primary mb-1">
                  {orgs.reduce((a, o) => a + o.briefCount, 0)}
                </div>
                <div className="text-sm font-medium">Total briefs</div>
                <div className="text-xs text-muted-foreground mt-1">
                  moy. {orgs.length > 0 ? (orgs.reduce((a, o) => a + o.briefCount, 0) / orgs.length).toFixed(1) : '—'} / org
                </div>
              </KnowyCard>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}
