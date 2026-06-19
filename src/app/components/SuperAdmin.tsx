import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  Users, Building2, Calendar, Mail, Brain, TrendingUp, TrendingDown,
  Minus, AlertCircle, Shield, Activity, Zap, Database, BarChart3,
  RefreshCw, Eye, Clock, Network, CheckCircle2, XCircle, Globe,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import KnowrCard from './knowr/KnowrCard';
import KnowrBadge from './knowr/KnowrBadge';

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
  planId: string;
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

interface UserEngagement {
  userId: string;
  userName: string | null;
  orgName: string | null;
  briefOpens: number;
  briefAvgDurationMs: number;
  briefTabDurations: Record<string, number>; // tab → total ms
  profileOpens: number;
  profileAvgDurationMs: number;
  profilesViewed: string[];   // entity_ids uniques
  lastActivityAt: string | null;
}

interface EngagementStats {
  totalUsers: number;
  usersWithBrief: number;
  usersWithProfile: number;
  totalBriefOpens: number;
  avgBriefDurationMs: number;
  totalProfileOpens: number;
  avgProfileDurationMs: number;
  tabDistribution: Record<string, number>;
  perUser: UserEngagement[];
}

// ── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({
  label, value, sub, icon: Icon, color = 'text-primary', trend,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color?: string; trend?: 'up' | 'down' | 'flat';
}) {
  return (
    <KnowrCard className="p-5">
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
    </KnowrCard>
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
        {/* Central node — Knowr platform */}
        <circle cx={300} cy={160} r={28} fill="hsl(var(--primary))" opacity={0.9} />
        <text x={300} y={164} textAnchor="middle" fill="white" fontSize={10} fontWeight="bold">Knowr</text>

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
  const [activeTab, setActiveTab] = useState<'overview' | 'orgs' | 'users' | 'network' | 'engagement'>('overview');
  const [engagement, setEngagement] = useState<EngagementStats | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [savingPlanOrg, setSavingPlanOrg] = useState<string | null>(null);

  // Assigner manuellement un plan à une org (super admin uniquement — RLS subscriptions_super_admin_update)
  const assignPlan = async (organizationId: string, planId: string) => {
    if (!supabase) return;
    setSavingPlanOrg(organizationId);
    setOrgs(prev => prev.map(o => o.id === organizationId ? { ...o, planId } : o)); // optimiste
    try {
      const { error } = await supabase.from('subscriptions')
        .update({ plan_id: planId, status: 'active', updated_at: new Date().toISOString() })
        .eq('organization_id', organizationId);
      if (error) {
        // Pas d'abonnement existant → on en crée un
        await supabase.from('subscriptions').insert({
          organization_id: organizationId, plan_id: planId, status: 'active',
          billing_cycle: 'monthly', amount_per_period: 0,
          started_at: new Date().toISOString(), current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
        });
      }
    } finally {
      setSavingPlanOrg(null);
    }
  };

  const PLAN_OPTIONS = ['free', 'pro', 'business', 'enterprise', 'super_admin'];

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
      const { data: sub } = await supabase.from('subscriptions').select('plan_id').eq('organization_id', org.id).eq('status', 'active').maybeSingle();
      return {
        ...org,
        memberCount: memberCount ?? 0,
        meetingCount: meetingCount ?? 0,
        contactCount: contactCount ?? 0,
        briefCount: briefCount ?? 0,
        hasGoogle: connectors?.some(c => c.provider === 'google') ?? false,
        hasMicrosoft: connectors?.some(c => c.provider === 'microsoft') ?? false,
        planId: (sub as any)?.plan_id ?? 'free',
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

    // ── Engagement analytics ─────────────────────────────────────────────
    const { data: behaviorEvents } = await supabase
      .from('user_behavior_events')
      .select('user_id, event_type, entity_id, entity_type, tab, duration_ms, created_at')
      .order('created_at', { ascending: false })
      .limit(5000);

    if (behaviorEvents?.length) {
      // Agréger par user_id
      const userMap: Record<string, { opens: any[]; closes: any[]; tabs: any[]; profileOpens: any[]; profileCloses: any[] }> = {};
      for (const e of behaviorEvents) {
        if (!userMap[e.user_id]) userMap[e.user_id] = { opens: [], closes: [], tabs: [], profileOpens: [], profileCloses: [] };
        if (e.event_type === 'brief_open')    userMap[e.user_id].opens.push(e);
        if (e.event_type === 'brief_close')   userMap[e.user_id].closes.push(e);
        if (e.event_type === 'brief_tab')     userMap[e.user_id].tabs.push(e);
        if (e.event_type === 'profile_open')  userMap[e.user_id].profileOpens.push(e);
        if (e.event_type === 'profile_close') userMap[e.user_id].profileCloses.push(e);
      }

      // Distribution globale des onglets
      const tabDist: Record<string, number> = {};
      for (const e of behaviorEvents) {
        if ((e.event_type === 'brief_tab' || e.event_type === 'brief_close') && e.tab && e.duration_ms) {
          tabDist[e.tab] = (tabDist[e.tab] ?? 0) + e.duration_ms;
        }
      }

      const perUser: UserEngagement[] = await Promise.all(
        Object.entries(userMap).map(async ([uid, ev]) => {
          const profileRow = userRows?.find(u => u.id === uid);
          const memb = userDetails.find(u => u.id === uid);
          const avgBrief = ev.closes.length > 0
            ? Math.round(ev.closes.reduce((s, e) => s + (e.duration_ms ?? 0), 0) / ev.closes.length)
            : 0;
          const avgProfile = ev.profileCloses.length > 0
            ? Math.round(ev.profileCloses.reduce((s, e) => s + (e.duration_ms ?? 0), 0) / ev.profileCloses.length)
            : 0;
          const tabDurations: Record<string, number> = {};
          for (const e of [...ev.tabs, ...ev.closes]) {
            if (e.tab && e.duration_ms) tabDurations[e.tab] = (tabDurations[e.tab] ?? 0) + e.duration_ms;
          }
          const profilesViewed = [...new Set(ev.profileOpens.map((e: any) => e.entity_id).filter(Boolean))];
          const lastEvent = [...ev.opens, ...ev.profileOpens].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
          return {
            userId: uid,
            userName: profileRow?.full_name ?? null,
            orgName: memb?.orgName ?? null,
            briefOpens: ev.opens.length,
            briefAvgDurationMs: avgBrief,
            briefTabDurations: tabDurations,
            profileOpens: ev.profileOpens.length,
            profileAvgDurationMs: avgProfile,
            profilesViewed,
            lastActivityAt: lastEvent?.created_at ?? null,
          };
        })
      );

      const usersWithBrief = perUser.filter(u => u.briefOpens > 0).length;
      const usersWithProfile = perUser.filter(u => u.profileOpens > 0).length;
      const totalBriefOpens = perUser.reduce((s, u) => s + u.briefOpens, 0);
      const totalProfileOpens = perUser.reduce((s, u) => s + u.profileOpens, 0);
      const allBriefDurations = behaviorEvents.filter(e => e.event_type === 'brief_close' && e.duration_ms);
      const avgBriefMs = allBriefDurations.length > 0
        ? Math.round(allBriefDurations.reduce((s, e) => s + (e.duration_ms ?? 0), 0) / allBriefDurations.length)
        : 0;
      const allProfileDurations = behaviorEvents.filter(e => e.event_type === 'profile_close' && e.duration_ms);
      const avgProfileMs = allProfileDurations.length > 0
        ? Math.round(allProfileDurations.reduce((s, e) => s + (e.duration_ms ?? 0), 0) / allProfileDurations.length)
        : 0;

      setEngagement({
        totalUsers: (totalUsers ?? 0),
        usersWithBrief,
        usersWithProfile,
        totalBriefOpens,
        avgBriefDurationMs: avgBriefMs,
        totalProfileOpens,
        avgProfileDurationMs: avgProfileMs,
        tabDistribution: tabDist,
        perUser: perUser.sort((a, b) => b.briefOpens - a.briefOpens),
      });
    } else {
      setEngagement({
        totalUsers: totalUsers ?? 0,
        usersWithBrief: 0, usersWithProfile: 0,
        totalBriefOpens: 0, avgBriefDurationMs: 0,
        totalProfileOpens: 0, avgProfileDurationMs: 0,
        tabDistribution: {}, perUser: [],
      });
    }

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
        <h2 className="text-xl font-bold">Accès refusé</h2>
        <p className="text-muted-foreground">Cette page est réservée aux super admins Knowr.</p>
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
                <p className="text-sm text-muted-foreground">Vision 360° · Knowr Platform</p>
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
            { id: 'engagement', label: 'Engagement', icon: Eye },
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
              <KnowrCard className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="size-4 text-primary" />
                  <h3 className="font-bold">Inscriptions — 14 derniers jours</h3>
                </div>
                <MiniBarChart data={signupSeries} color="hsl(var(--primary))" />
                <div className="flex justify-between mt-2">
                  {signupSeries.filter((_, i) => i % 4 === 0).map(d => (
                    <span key={d.date} className="text-xs text-muted-foreground">{d.date}</span>
                  ))}
                </div>
              </KnowrCard>

              <KnowrCard className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="size-4 text-accent" />
                  <h3 className="font-bold">Réunions créées — 14 derniers jours</h3>
                </div>
                <MiniBarChart data={meetingSeries} color="hsl(var(--accent))" />
                <div className="flex justify-between mt-2">
                  {meetingSeries.filter((_, i) => i % 4 === 0).map(d => (
                    <span key={d.date} className="text-xs text-muted-foreground">{d.date}</span>
                  ))}
                </div>
              </KnowrCard>
            </div>

            {/* Health indicators */}
            <KnowrCard className="p-5">
              <h3 className="font-bold mb-4 flex items-center gap-2">
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
            </KnowrCard>
          </motion.div>
        )}

        {/* ── TAB: ORGS ─────────────────────────────────────────────────────── */}
        {activeTab === 'orgs' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <KnowrCard className="overflow-hidden">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-bold">{orgs.length} organisations</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      {['Organisation', 'Plan', 'Membres', 'Réunions', 'Contacts', 'Briefs', 'Connecteurs', 'Créée le'].map(h => (
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
                          <select
                            value={org.planId}
                            disabled={savingPlanOrg === org.id}
                            onChange={(e) => assignPlan(org.id, e.target.value)}
                            className="text-xs font-semibold rounded-lg border border-border bg-card px-2 py-1.5 capitalize focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                            title="Assigner un plan à cette organisation"
                          >
                            {PLAN_OPTIONS.map(p => (
                              <option key={p} value={p}>{p.replace('_', ' ')}</option>
                            ))}
                          </select>
                          {savingPlanOrg === org.id && <span className="ml-1 text-[10px] text-muted-foreground">…</span>}
                        </td>
                        <td className="px-4 py-3">
                          <KnowrBadge variant="default" size="sm">{org.memberCount}</KnowrBadge>
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
            </KnowrCard>
          </motion.div>
        )}

        {/* ── TAB: USERS ────────────────────────────────────────────────────── */}
        {activeTab === 'users' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <KnowrCard className="overflow-hidden">
              <div className="p-4 border-b border-border">
                <h3 className="font-bold">{users.length} utilisateurs</h3>
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
                            ? <KnowrBadge variant="default" size="sm">{u.orgName}</KnowrBadge>
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
            </KnowrCard>
          </motion.div>
        )}

        {/* ── TAB: NETWORK ──────────────────────────────────────────────────── */}
        {activeTab === 'network' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <KnowrCard className="p-5">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Network className="size-4 text-primary" />
                Carte des organisations
              </h3>
              <NetworkGraph orgs={orgs} />
            </KnowrCard>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <KnowrCard className="p-5">
                <div className="text-2xl font-black text-primary mb-1">
                  {orgs.filter(o => o.hasGoogle).length}
                </div>
                <div className="text-sm font-medium">Orgs avec Google</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {stats ? `${Math.round(orgs.filter(o => o.hasGoogle).length / Math.max(orgs.length, 1) * 100)}% du total` : '—'}
                </div>
              </KnowrCard>
              <KnowrCard className="p-5">
                <div className="text-2xl font-black text-primary mb-1">
                  {orgs.reduce((a, o) => a + o.memberCount, 0)}
                </div>
                <div className="text-sm font-medium">Total membres</div>
                <div className="text-xs text-muted-foreground mt-1">
                  moy. {orgs.length > 0 ? (orgs.reduce((a, o) => a + o.memberCount, 0) / orgs.length).toFixed(1) : '—'} / org
                </div>
              </KnowrCard>
              <KnowrCard className="p-5">
                <div className="text-2xl font-black text-primary mb-1">
                  {orgs.reduce((a, o) => a + o.briefCount, 0)}
                </div>
                <div className="text-sm font-medium">Total briefs</div>
                <div className="text-xs text-muted-foreground mt-1">
                  moy. {orgs.length > 0 ? (orgs.reduce((a, o) => a + o.briefCount, 0) / orgs.length).toFixed(1) : '—'} / org
                </div>
              </KnowrCard>
            </div>
          </motion.div>
        )}

        {/* ── TAB: ENGAGEMENT ───────────────────────────────────────────────── */}
        {activeTab === 'engagement' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

            {!engagement || engagement.totalBriefOpens === 0 ? (
              <KnowrCard className="p-12 text-center">
                <Eye className="size-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-lg font-semibold mb-2">Aucune donnée d'engagement</p>
                <p className="text-sm text-muted-foreground">
                  Les métriques apparaîtront dès que des utilisateurs ouvriront des briefs ou des profils.
                </p>
              </KnowrCard>
            ) : (<>

              {/* KPIs globaux */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  {
                    label: 'Utilisateurs actifs briefs',
                    value: engagement.usersWithBrief,
                    pct: Math.round(engagement.usersWithBrief / Math.max(engagement.totalUsers, 1) * 100),
                    icon: Brain, color: 'text-primary',
                    sub: `sur ${engagement.totalUsers} utilisateurs · ${engagement.totalBriefOpens} ouvertures`,
                  },
                  {
                    label: 'Temps moyen sur brief',
                    value: engagement.avgBriefDurationMs >= 60000
                      ? `${Math.round(engagement.avgBriefDurationMs / 60000)}min`
                      : `${Math.round(engagement.avgBriefDurationMs / 1000)}s`,
                    pct: Math.min(100, Math.round(engagement.avgBriefDurationMs / 300000 * 100)),
                    icon: Clock, color: 'text-accent',
                    sub: 'par session brief',
                  },
                  {
                    label: 'Utilisateurs mémoire',
                    value: engagement.usersWithProfile,
                    pct: Math.round(engagement.usersWithProfile / Math.max(engagement.totalUsers, 1) * 100),
                    icon: Activity, color: 'text-success',
                    sub: `sur ${engagement.totalUsers} · ${engagement.totalProfileOpens} vues profils`,
                  },
                  {
                    label: 'Temps moyen sur profil',
                    value: engagement.avgProfileDurationMs >= 60000
                      ? `${Math.round(engagement.avgProfileDurationMs / 60000)}min`
                      : `${Math.round(engagement.avgProfileDurationMs / 1000)}s`,
                    pct: Math.min(100, Math.round(engagement.avgProfileDurationMs / 180000 * 100)),
                    icon: Clock, color: 'text-primary',
                    sub: 'par session fiche',
                  },
                ].map(kpi => (
                  <KnowrCard key={kpi.label} className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center">
                        <kpi.icon className={`size-4 ${kpi.color}`} />
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 ${kpi.color}`}>
                        {kpi.pct}%
                      </span>
                    </div>
                    <div className="text-2xl font-black mb-0.5">{kpi.value}</div>
                    <div className="text-sm font-medium">{kpi.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{kpi.sub}</div>
                    <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${kpi.pct}%` }} />
                    </div>
                  </KnowrCard>
                ))}
              </div>

              {/* Distribution onglets brief — global */}
              {Object.keys(engagement.tabDistribution).length > 0 && (
                <KnowrCard className="p-5">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <BarChart3 className="size-4 text-primary" />
                    Temps passé par onglet (brief) — global
                  </h3>
                  <div className="space-y-3">
                    {(() => {
                      const totalMs = Object.values(engagement.tabDistribution).reduce((a, b) => a + b, 0);
                      const labels: Record<string, string> = { prep: 'Préparation', summary: 'Résumé', participants: 'Participants' };
                      return Object.entries(engagement.tabDistribution)
                        .sort((a, b) => b[1] - a[1])
                        .map(([tab, ms]) => {
                          const pct = Math.round(ms / Math.max(totalMs, 1) * 100);
                          const dur = ms >= 60000 ? `${Math.round(ms / 60000)}min` : `${Math.round(ms / 1000)}s`;
                          return (
                            <div key={tab}>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-sm font-medium">{labels[tab] ?? tab}</span>
                                <div className="flex items-center gap-3 text-sm">
                                  <span className="font-mono text-muted-foreground">{dur}</span>
                                  <span className="font-bold text-primary w-10 text-right">{pct}%</span>
                                </div>
                              </div>
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          );
                        });
                    })()}
                  </div>
                </KnowrCard>
              )}

              {/* Tableau par utilisateur */}
              <KnowrCard className="overflow-hidden">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <h3 className="font-bold flex items-center gap-2">
                    <Users className="size-4 text-primary" />
                    Engagement par utilisateur
                  </h3>
                  <span className="text-xs text-muted-foreground">{engagement.perUser.length} utilisateurs trackés</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        <th className="px-4 py-3 text-left">Utilisateur</th>
                        <th className="px-4 py-3 text-center">Briefs<br/>ouverts</th>
                        <th className="px-4 py-3 text-center">Tps moy.<br/>brief</th>
                        <th className="px-4 py-3 text-center">Profils<br/>uniques vus</th>
                        <th className="px-4 py-3 text-center">Tps moy.<br/>profil</th>
                        <th className="px-4 py-3 text-center">Email brief<br/><span className="normal-case font-normal">envoyé/ouvert</span></th>
                        <th className="px-4 py-3 text-left">Dernière<br/>activité</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {engagement.perUser.map(u => {
                        const expanded = expandedUser === u.userId;
                        const totalTabMs = Object.values(u.briefTabDurations).reduce((a, b) => a + b, 0);
                        return (
                          <React.Fragment key={u.userId}>
                            <tr
                              className="hover:bg-muted/20 cursor-pointer transition-colors"
                              onClick={() => setExpandedUser(expanded ? null : u.userId)}
                            >
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="size-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                    {(u.userName ?? '?')[0]?.toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-medium truncate">{u.userName ?? <span className="text-muted-foreground italic text-xs">Sans nom</span>}</p>
                                    {u.orgName && <p className="text-xs text-muted-foreground truncate">{u.orgName}</p>}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="font-bold text-primary text-base">{u.briefOpens}</span>
                              </td>
                              <td className="px-4 py-3 text-center font-mono text-sm">
                                {u.briefAvgDurationMs > 0
                                  ? u.briefAvgDurationMs >= 60000
                                    ? `${Math.round(u.briefAvgDurationMs / 60000)}min`
                                    : `${Math.round(u.briefAvgDurationMs / 1000)}s`
                                  : <span className="text-muted-foreground">—</span>}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="font-bold text-success text-base">{u.profilesViewed.length}</span>
                                {u.profileOpens > u.profilesViewed.length && (
                                  <span className="text-xs text-muted-foreground block">({u.profileOpens} vues)</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-center font-mono text-sm">
                                {u.profileAvgDurationMs > 0
                                  ? u.profileAvgDurationMs >= 60000
                                    ? `${Math.round(u.profileAvgDurationMs / 60000)}min`
                                    : `${Math.round(u.profileAvgDurationMs / 1000)}s`
                                  : <span className="text-muted-foreground">—</span>}
                              </td>
                              <td className="px-4 py-3 text-center text-xs text-muted-foreground">
                                — / —
                              </td>
                              <td className="px-4 py-3 text-xs text-muted-foreground">
                                {u.lastActivityAt
                                  ? new Date(u.lastActivityAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                                  : '—'}
                              </td>
                            </tr>
                            {expanded && totalTabMs > 0 && (
                              <tr className="bg-primary/5">
                                <td colSpan={7} className="px-6 py-4">
                                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">
                                    Répartition onglets brief · {u.userName}
                                  </p>
                                  <div className="grid grid-cols-3 gap-3">
                                    {Object.entries(u.briefTabDurations).sort((a, b) => b[1] - a[1]).map(([tab, ms]) => {
                                      const pct = Math.round(ms / totalTabMs * 100);
                                      const labels: Record<string, string> = { prep: 'Préparation', summary: 'Résumé', participants: 'Participants' };
                                      return (
                                        <div key={tab} className="bg-card rounded-xl p-4 border border-border">
                                          <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-semibold">{labels[tab] ?? tab}</span>
                                            <span className="text-sm font-black text-primary">{pct}%</span>
                                          </div>
                                          <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-2">
                                            <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                                          </div>
                                          <span className="text-xs font-mono text-muted-foreground">
                                            {ms >= 60000 ? `${Math.round(ms / 60000)}min` : `${Math.round(ms / 1000)}s`}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </KnowrCard>

              {/* Email tracking — placeholder */}
              <KnowrCard className="p-5 opacity-60">
                <div className="flex items-center gap-3 mb-4">
                  <Mail className="size-5 text-muted-foreground" />
                  <h3 className="font-bold">Tracking email brief</h3>
                  <KnowrBadge variant="muted">Disponible avec système d'envoi</KnowrBadge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  {['Briefs envoyés / mail', 'Emails ouverts', 'Taux d\'ouverture', 'Consultés via mail'].map(label => (
                    <div key={label} className="p-4 bg-muted/30 rounded-xl">
                      <p className="text-2xl font-black text-muted-foreground">—</p>
                      <p className="text-xs text-muted-foreground mt-1">{label}</p>
                    </div>
                  ))}
                </div>
              </KnowrCard>

            </>)}
          </motion.div>
        )}

      </div>
    </div>
  );
}
