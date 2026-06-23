import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { useEffect, useState, useCallback, type ReactNode } from 'react';
import { useCurrentProfile } from '../../hooks/useCurrentProfile';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { getActiveOrganizationId } from '../../lib/api/org';
import PlanSummary from './knowr/PlanSummary';
import {
  linkIdentityProvider,
  getConnectedIdentityProviders,
  type OnboardingProvider,
} from '../../lib/onboarding';
import {
  User,
  Mail,
  Settings,
  Calendar,
  Network,
  CheckCircle2,
  ExternalLink,
  Shield,
  Globe,
  LogOut,
  Lock,
  Eye,
  EyeOff,
  CheckCheck,
  Save,
  RefreshCw,
  Download,
  AlertCircle,
  Link,
  ChevronDown,
  Loader2,
} from 'lucide-react';

// ── Official logos (inline SVG) ────────────────────────────────────────

const GoogleLogo = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const OutlookLogo = () => (
  <svg viewBox="0 0 32 32" width="22" height="22" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="4" fill="#0078D4"/>
    <rect x="14" y="5" width="15" height="20" rx="2" fill="#28A8E8"/>
    <path d="M14 13l7.5 4.5L29 13" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="1" y="5" width="14" height="22" rx="2.5" fill="#0364B8"/>
    <ellipse cx="8" cy="16" rx="3.5" ry="4.5" fill="white"/>
  </svg>
);

const LinkedInLogo = ({ size = 22 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="4" fill="#0A66C2"/>
    <path d="M5 9h2.5v9.5H5V9zm1.25-4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM10 9h2.4v1.3c.4-.7 1.3-1.5 2.8-1.5 2.9 0 3.8 1.9 3.8 4.4v5.3H16.5v-4.7c0-1.1-.4-1.9-1.5-1.9-1 0-1.5.7-1.7 1.4-.1.2-.1.5-.1.8v4.4H10V9z" fill="white"/>
  </svg>
);

const CrmLogoHubSpot  = () => <svg viewBox="0 0 32 32" width="26" height="26"><circle cx="16" cy="16" r="16" fill="#FF7A59"/><text x="16" y="21" textAnchor="middle" fontSize="14" fontWeight="800" fill="white" fontFamily="sans-serif">H</text></svg>;
const CrmLogoSalesforce = () => <svg viewBox="0 0 32 32" width="26" height="26"><rect width="32" height="32" rx="6" fill="#00A1E0"/><text x="16" y="21" textAnchor="middle" fontSize="11" fontWeight="700" fill="white" fontFamily="sans-serif">SF</text></svg>;
const CrmLogoPipedrive  = () => <svg viewBox="0 0 32 32" width="26" height="26"><rect width="32" height="32" rx="6" fill="#25292E"/><text x="16" y="21" textAnchor="middle" fontSize="14" fontWeight="800" fill="#0EAD69" fontFamily="sans-serif">P</text></svg>;
const CrmLogoAttio      = () => <svg viewBox="0 0 32 32" width="26" height="26"><rect width="32" height="32" rx="6" fill="#1C1C1C"/><text x="16" y="21" textAnchor="middle" fontSize="13" fontWeight="700" fill="white" fontFamily="sans-serif">at</text></svg>;

const CRM_LIST = [
  { name: 'HubSpot',    description: 'Sync contacts, deals et activités',        logo: <CrmLogoHubSpot /> },
  { name: 'Salesforce', description: 'Sync accounts, opportunities et réunions', logo: <CrmLogoSalesforce /> },
  { name: 'Pipedrive',  description: 'Sync pipeline et données contacts',         logo: <CrmLogoPipedrive /> },
  { name: 'Attio',      description: 'CRM nouvelle génération',                   logo: <CrmLogoAttio /> },
];

const AVAILABLE_CONNECTIONS = [
  { id: 'google',   name: 'Google',            subtitle: 'Gmail · Google Calendar · Contacts',  logo: <GoogleLogo /> },
  { id: 'outlook',  name: 'Microsoft Outlook', subtitle: 'Email · Calendrier · Contacts',        logo: <OutlookLogo /> },
  { id: 'linkedin', name: 'LinkedIn',          subtitle: 'Réseau · Profils professionnels',      logo: <LinkedInLogo /> },
];

// ── iOS toggle ────────────────────────────────────────────────────────
function IOSToggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className="relative flex-shrink-0 w-[51px] h-[31px] rounded-full border-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      style={{ backgroundColor: checked ? '#6E50C8' : '#C4B8E0', transition: 'background-color 0.22s ease', padding: 0 }}
    >
      <span
        className="absolute top-[2px] w-[27px] h-[27px] rounded-full bg-white"
        style={{ left: checked ? '22px' : '2px', transition: 'left 0.22s ease', boxShadow: '0 3px 8px rgba(0,0,0,0.22), 0 1px 3px rgba(0,0,0,0.12)' }}
      />
    </button>
  );
}

// ── Mono label ────────────────────────────────────────────────────────
function EyebrowLabel({ children }: { children: ReactNode }) {
  return (
    <span style={{ fontFamily: 'var(--mono, "JetBrains Mono", monospace)', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}
      className="text-primary opacity-60">
      {children}
    </span>
  );
}

// ── Section card ──────────────────────────────────────────────────────
function SectionCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-card rounded-2xl border overflow-hidden ${className}`}
      style={{ borderColor: 'rgba(110,80,200,0.12)', boxShadow: '0 2px 16px rgba(110,80,200,0.06)' }}>
      {children}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function AccountSettings() {
  const navigate = useNavigate();
  const { profile } = useCurrentProfile();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'connections' | 'security'>('profile');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Profile editing
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // Password change
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwDone, setPwDone] = useState(false);
  const [showPwNew, setShowPwNew] = useState(false);
  const [showPwConfirm, setShowPwConfirm] = useState(false);

  // Sync settings
  const [syncSettings, setSyncSettings] = useState({ calendar: true, email: true, enrichment: false });

  // Connections
  const [pending, setPending] = useState<string | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [connectorSyncStatus, setConnectorSyncStatus] = useState<Record<string, string>>({});

  // Gmail sync
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ messages: number; threads: number; contacts: number; contactStats?: Array<{ email: string; messages: number; threads: number }> } | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Outlook sync
  const [syncingOutlook, setSyncingOutlook] = useState(false);
  const [syncOutlookResult, setSyncOutlookResult] = useState<{ messages: number; contacts: number } | null>(null);
  const [syncOutlookError, setSyncOutlookError] = useState<string | null>(null);

  // LinkedIn URL
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [linkedinSaved, setLinkedinSaved] = useState(false);
  const [linkedinSaving, setLinkedinSaving] = useState(false);

  // ── Logo de marque (org) ────────────────────────────────────────────────
  const [logoOrgId, setLogoOrgId] = useState<string | null>(null);
  const [orgLogo, setOrgLogo] = useState<string | null>(null);
  const [logoSaving, setLogoSaving] = useState(false);
  const [logoErr, setLogoErr] = useState<string | null>(null);
  const [logoDrag, setLogoDrag] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!supabase) return;
      const oid = await getActiveOrganizationId();
      if (cancelled || !oid) return;
      setLogoOrgId(oid);
      const { data } = await supabase.from('organizations').select('logo_url').eq('id', oid).maybeSingle();
      if (!cancelled) setOrgLogo((data as any)?.logo_url ?? null);
    })();
    return () => { cancelled = true; };
  }, []);

  // Convertit une image en webp (redimensionnée) → data URL
  async function toWebpDataUrl(file: File, maxSize = 256): Promise<string> {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(bitmap, 0, 0, w, h);
    return await new Promise<string>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) { reject(new Error('webp')); return; }
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.onerror = () => reject(new Error('read'));
        r.readAsDataURL(blob);
      }, 'image/webp', 0.9);
    });
  }

  async function handleLogoFile(file: File | null | undefined) {
    if (!file || !supabase || !logoOrgId) return;
    setLogoErr(null);
    if (!file.type.startsWith('image/')) { setLogoErr('Format image uniquement (PNG, JPG, SVG…).'); return; }
    setLogoSaving(true);
    try {
      const dataUrl = await toWebpDataUrl(file);
      const { error } = await supabase.rpc('set_org_logo', { p_org: logoOrgId, p_logo: dataUrl });
      if (error) { setLogoErr('Échec de l’enregistrement.'); }
      else { setOrgLogo(dataUrl); }
    } catch {
      setLogoErr('Impossible de convertir l’image.');
    } finally {
      setLogoSaving(false);
    }
  }

  async function removeLogo() {
    if (!supabase || !logoOrgId) return;
    setLogoSaving(true); setLogoErr(null);
    try {
      const { error } = await supabase.rpc('set_org_logo', { p_org: logoOrgId, p_logo: null });
      if (!error) setOrgLogo(null);
    } finally { setLogoSaving(false); }
  }

  const connectedProviders = getConnectedIdentityProviders(user);

  const PROVIDER_MAP: Record<string, OnboardingProvider> = {
    google: 'google',
    outlook: 'microsoft',
    linkedin: 'linkedin_oidc',
  };

  function isConnected(connId: string) { return isIdentityLinked(connId); }

  function isIdentityLinked(connId: string): boolean {
    const p = PROVIDER_MAP[connId];
    return connId === 'outlook'
      ? connectedProviders.includes('microsoft') || connectedProviders.includes('azure' as any)
      : connectedProviders.includes(p);
  }

  function isSyncActive(connId: string): boolean {
    const provider = connId === 'outlook' ? 'microsoft' : connId;
    const status = connectorSyncStatus[provider];
    if (status === undefined) return isIdentityLinked(connId);
    return status === 'connected';
  }

  // ── loadData (refreshable) ──────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!supabase) return;
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u) return;

    try {
      const { data: profileRow, error: profileErr } = await supabase
        .from('profiles')
        .select('sync_calendar, sync_email, sync_enrichment, linkedin_profile_data')
        .eq('id', u.id)
        .maybeSingle();
      if (!profileErr && profileRow) {
        setSyncSettings({
          calendar:   (profileRow as any).sync_calendar   ?? true,
          email:      (profileRow as any).sync_email      ?? true,
          enrichment: (profileRow as any).sync_enrichment ?? false,
        });
        const liData = (profileRow as any).linkedin_profile_data;
        if (liData?.url) setLinkedinUrl(liData.url);
      }
    } catch { /* columns not yet present */ }

    try {
      const orgId = await getActiveOrganizationId();
      if (orgId) {
        const { data: connRows } = await supabase
          .from('connectors')
          .select('provider, status')
          .eq('organization_id', orgId)
          .eq('user_id', u.id);
        if (connRows) {
          const map: Record<string, string> = {};
          (connRows as any[]).forEach(c => { map[c.provider] = c.status; });
          setConnectorSyncStatus(map);
        }
      }
    } catch { /* graceful */ }

    const { data: membership } = await supabase
      .from('memberships').select('role').eq('user_id', u.id).maybeSingle();
    setIsAdmin((membership as any)?.role === 'admin');

    // Source de vérité = table super_admins (filtre explicite + RLS user_id = auth.uid())
    const { data: sa } = await supabase.from('super_admins').select('id').eq('user_id', u.id).maybeSingle();
    setIsSuperAdmin(!!sa);
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadData();
    } finally {
      setRefreshing(false);
    }
  }, [loadData]);

  useEffect(() => {
    if (profile?.fullName) {
      const parts = profile.fullName.split(' ');
      setFirstName(parts[0] ?? '');
      setLastName(parts.slice(1).join(' ') ?? '');
    }
  }, [profile?.fullName]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Capture fresh token after OAuth redirect ──
  useEffect(() => {
    if (!supabase) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.provider_token || !supabase) return;
      const sessionProvider = (session.user.app_metadata as any)?.provider ?? '';
      const isMs = sessionProvider === 'azure' || sessionProvider === 'microsoft';
      const isGoogle = sessionProvider === 'google';
      if (!isMs && !isGoogle) return;
      const connectorProvider = isMs ? 'microsoft' : 'google';
      const orgId = await getActiveOrganizationId();
      if (!orgId) return;
      const baseConnector = {
        organization_id: orgId,
        user_id: session.user.id,
        provider: connectorProvider,
        status: 'connected',
        updated_at: new Date().toISOString(),
      };
      const withMeta = {
        ...baseConnector,
        metadata: {
          access_token:  session.provider_token,
          refresh_token: (session as any).provider_refresh_token ?? null,
          email:         session.user.email,
          stored_at:     new Date().toISOString(),
          token_stored_at: new Date().toISOString(),
        },
      };
      const { error: connErr } = await (supabase.from('connectors') as any)
        .upsert(withMeta, { onConflict: 'organization_id,user_id,provider' });
      if (connErr) {
        await (supabase.from('connectors') as any)
          .upsert(baseConnector, { onConflict: 'organization_id,user_id,provider' });
      }
      // Refresh connector statuses after token capture
      await loadData();
    });
    return () => subscription.unsubscribe();
  }, [loadData]);

  async function handleConnect(connId: string) {
    setConnectError(null);
    setPending(connId);
    try {
      await linkIdentityProvider(PROVIDER_MAP[connId], '/account');
    } catch (e: any) {
      const msg: string = e?.message ?? '';
      if (msg.toLowerCase().includes('manual linking') || msg.toLowerCase().includes('not allowed')) {
        setConnectError('La liaison de comptes est temporairement désactivée. Rechargez la page et réessayez.');
      } else if (msg.toLowerCase().includes('already linked')) {
        setConnectError('Ce compte est déjà lié à votre profil.');
      } else {
        setConnectError(msg || 'Erreur de connexion. Réessayez.');
      }
      setPending(null);
    }
  }

  async function handleDisconnect(connId: string) {
    if (!supabase || !user) return;
    setConnectError(null);
    setPending(connId);
    try {
      const orgId = await getActiveOrganizationId();
      if (!orgId) { setPending(null); return; }
      const provider = connId === 'outlook' ? 'microsoft' : connId;
      const { error: updateErr, count } = await (supabase.from('connectors') as any)
        .update({ status: 'disconnected', metadata: null, updated_at: new Date().toISOString() })
        .eq('organization_id', orgId)
        .eq('user_id', user.id)
        .eq('provider', provider)
        .select('id');
      const rowUpdated = !updateErr && (count ?? 0) > 0;
      if (!rowUpdated) {
        const { error: insertErr } = await (supabase.from('connectors') as any).insert({
          organization_id: orgId, user_id: user.id, provider,
          status: 'disconnected', updated_at: new Date().toISOString(),
        });
        if (insertErr) throw new Error(insertErr.message);
      }
      setConnectorSyncStatus(prev => ({ ...prev, [provider]: 'disconnected' }));
    } catch (e: any) {
      setConnectError(e?.message ?? 'Erreur lors de la déconnexion. Réessayez.');
    } finally {
      setPending(null);
    }
  }

  async function handleGmailSync() {
    if (!supabase) return;
    setSyncing(true);
    setSyncResult(null);
    setSyncError(null);
    try {
      const orgId = await getActiveOrganizationId();
      if (!orgId) { setSyncError('Organisation introuvable.'); return; }
      const { data: { session } } = await supabase.auth.getSession();
      const sessionToken = session?.provider_token ?? null;
      if (sessionToken && session?.user) {
        await (supabase.from('connectors') as any).upsert({
          organization_id: orgId, user_id: session.user.id, provider: 'google', status: 'connected',
          metadata: { access_token: sessionToken, refresh_token: (session as any).provider_refresh_token ?? null, email: session.user.email, stored_at: new Date().toISOString() },
          updated_at: new Date().toISOString(),
        }, { onConflict: 'organization_id,user_id,provider' });
      }
      const { data, error } = await supabase.functions.invoke('ingest-communication', {
        body: { organizationId: orgId, providerToken: sessionToken, lookbackDays: 365, maxMessagesPerContact: 1000 },
      });
      if (error) {
        const msg: string = (error as any)?.message ?? String(error);
        setSyncError(msg.includes('NOT_CONNECTED') || msg.includes('TOKEN_MISSING')
          ? 'Connectez d\'abord votre compte Google ci-dessus.'
          : msg);
        return;
      }
      setSyncResult({ messages: data?.stats?.messages ?? 0, threads: data?.stats?.threads ?? 0, contacts: data?.stats?.contacts ?? 0, contactStats: data?.contactStats ?? [] });
    } catch (e: any) {
      setSyncError(e?.message ?? 'Erreur inconnue');
    } finally {
      setSyncing(false);
    }
  }

  async function handleOutlookSync() {
    if (!supabase) return;
    setSyncingOutlook(true);
    setSyncOutlookResult(null);
    setSyncOutlookError(null);
    try {
      const orgId = await getActiveOrganizationId();
      if (!orgId) { setSyncOutlookError('Organisation introuvable.'); return; }
      const { data: { session } } = await supabase.auth.getSession();
      const sessionProvider = (session?.user?.app_metadata as any)?.provider ?? '';
      const isMsSession = sessionProvider === 'azure' || sessionProvider === 'microsoft';
      const msToken = isMsSession ? session?.provider_token : null;
      if (msToken && session?.user) {
        await (supabase.from('connectors') as any).upsert({
          organization_id: orgId, user_id: session.user.id, provider: 'microsoft', status: 'connected',
          metadata: { access_token: msToken, refresh_token: (session as any).provider_refresh_token ?? null, email: session.user.email, token_stored_at: new Date().toISOString() },
          updated_at: new Date().toISOString(),
        }, { onConflict: 'organization_id,user_id,provider' });
      }
      const { data, error } = await supabase.functions.invoke('ingest-communication', {
        body: { organizationId: orgId, microsoftToken: msToken, lookbackDays: 365, maxMessagesPerContact: 1000 },
      });
      if (error) {
        setSyncOutlookError((error as any)?.message ?? String(error));
        return;
      }
      setSyncOutlookResult({ messages: data?.stats?.messages ?? 0, contacts: data?.stats?.contacts ?? 0 });
    } catch (e: any) {
      setSyncOutlookError(e?.message ?? 'Erreur inconnue');
    } finally {
      setSyncingOutlook(false);
    }
  }

  async function toggleSync(key: keyof typeof syncSettings) {
    const next = !syncSettings[key];
    setSyncSettings((s) => ({ ...s, [key]: next }));
    if (!supabase) return;
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u) return;
    const col = { calendar: 'sync_calendar', email: 'sync_email', enrichment: 'sync_enrichment' }[key];
    try {
      await supabase.from('profiles').upsert({ id: u.id, [col]: next } as any, { onConflict: 'id' });
    } catch { /* migration not yet applied */ }
    if (key === 'enrichment' && next) {
      const orgId = await getActiveOrganizationId();
      if (!orgId) return;
      const { data: pendingContacts } = await supabase
        .from('contacts').select('id').eq('organization_id', orgId).in('enrichment_status', ['pending', 'failed']).limit(10);
      if (!pendingContacts?.length) return;
      const sb = supabase;
      Promise.all(pendingContacts.map((c: any) =>
        sb.functions.invoke('enrich-contact', { body: { contactId: c.id, organizationId: orgId } }).catch(() => null)
      ));
    }
  }

  async function handleSaveLinkedin() {
    if (!supabase || linkedinSaving) return;
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u) return;
    setLinkedinSaving(true);
    const url = linkedinUrl.trim();
    await supabase.from('profiles').upsert(
      { id: u.id, linkedin_profile_data: url ? { url } : null } as any,
      { onConflict: 'id' }
    );
    setLinkedinSaving(false);
    setLinkedinSaved(true);
    setTimeout(() => setLinkedinSaved(false), 3000);
  }

  async function handleLogout() {
    setLoggingOut(true);
    // Déconnexion infaillible : on tente signOut, mais on redirige quoi qu'il arrive.
    try {
      await Promise.race([
        supabase?.auth.signOut({ scope: 'local' as any }) ?? Promise.resolve(),
        new Promise((r) => setTimeout(r, 1500)), // ne jamais rester bloqué
      ]);
    } catch { /* ignore */ }
    // Hard redirect → réinitialise complètement l'état de l'app sans session.
    window.location.assign('/signin');
  }

  async function handleSaveProfile() {
    if (!supabase) return;
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u) return;
    setSavingProfile(true);
    await supabase.from('profiles')
      .upsert({ id: u.id, full_name: `${firstName} ${lastName}`.trim() } as any, { onConflict: 'id' });
    setSavingProfile(false);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  }

  async function handleChangePassword() {
    if (!supabase) return;
    setPwError('');
    if (pwNew.length < 8)       { setPwError('Minimum 8 caractères requis.'); return; }
    if (pwNew !== pwConfirm)    { setPwError('Les mots de passe ne correspondent pas.'); return; }
    setPwSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pwNew });
    setPwSaving(false);
    if (error) { setPwError(error.message); return; }
    setPwNew(''); setPwConfirm('');
    setPwDone(true);
    setTimeout(() => setPwDone(false), 3000);
  }

  const authProvider = (user?.app_metadata as any)?.provider ?? 'email';
  const isOAuthUser = authProvider !== 'email';

  const tabs = [
    { id: 'profile',     label: 'Mon profil',  icon: User },
    { id: 'connections', label: 'Connexions',  icon: Settings },
    { id: 'security',    label: 'Sécurité',    icon: Shield },
  ];

  // Build provider badges for hero
  const heroBadges: { label: string; color: string }[] = [];
  if (isIdentityLinked('google'))  heroBadges.push({ label: 'Google ✓', color: 'rgba(66,133,244,0.22)' });
  if (isIdentityLinked('outlook')) heroBadges.push({ label: 'Outlook ✓', color: 'rgba(0,120,212,0.22)' });
  if (isIdentityLinked('linkedin'))heroBadges.push({ label: 'LinkedIn ✓', color: 'rgba(10,102,194,0.22)' });

  return (
    <div className="size-full bg-background overflow-auto">
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '22px 20px 80px' }}>

        {/* ══ HERO HEADER (dark night) ════════════════════════════════════ */}
        <div className="rounded-[28px] overflow-hidden mb-3 relative"
          style={{ background: '#1A1040', boxShadow: '0 16px 56px rgba(110,80,200,0.14)' }}>
          {/* gradient orb */}
          <div style={{ position: 'absolute', top: '-40%', right: '-5%', width: 340, height: '180%',
            background: 'radial-gradient(circle,rgba(110,80,200,.40),transparent 60%)', pointerEvents: 'none' }} />
          <div className="relative" style={{ padding: '24px 28px', display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'center' }}>
            {/* Left: avatar + info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {profile?.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.fullName}
                  style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(110,80,200,.3)', flexShrink: 0 }} />
              ) : (
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,#6E50C8,#5A3EAA)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900,
                  color: '#fff', flexShrink: 0, boxShadow: '0 0 0 3px rgba(110,80,200,.25)' }}>
                  {profile?.initials ?? '?'}
                </div>
              )}
              <div>
                <div style={{ fontFamily: 'var(--font-epilogue, Epilogue, sans-serif)', fontSize: 22, fontWeight: 900,
                  color: '#fff', letterSpacing: '-0.035em', lineHeight: 1.1, marginBottom: 4 }}>
                  {profile?.fullName ?? '—'}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(212,197,245,0.55)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Mail className="size-3" />
                  <span>{profile?.email ?? user?.email ?? '—'}</span>
                </div>
                {heroBadges.length > 0 && (
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {heroBadges.map(b => (
                      <span key={b.label} style={{
                        fontFamily: 'var(--mono, "JetBrains Mono", monospace)', fontSize: 10, fontWeight: 600,
                        padding: '3px 9px', borderRadius: 999, background: b.color,
                        color: 'rgba(212,197,245,.85)', border: '1px solid rgba(212,197,245,.15)',
                      }}>{b.label}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {/* Right: actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10,
                  background: 'rgba(110,80,200,.22)', border: '1px solid rgba(110,80,200,.35)',
                  color: 'rgba(212,197,245,.9)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.18s ease', opacity: refreshing ? 0.6 : 1 }}
              >
                {refreshing ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
                <span className="hidden sm:inline">Actualiser</span>
              </button>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10,
                  background: 'rgba(217,79,99,.18)', border: '1px solid rgba(217,79,99,.3)',
                  color: 'rgba(240,160,173,.9)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.18s ease', opacity: loggingOut ? 0.6 : 1 }}
              >
                <LogOut className="size-3.5" />
                <span className="hidden sm:inline">{loggingOut ? 'Déconnexion…' : 'Déconnecter'}</span>
              </button>
            </div>
          </div>
          {/* Bottom stripe: page badge */}
          <div style={{ padding: '10px 28px', borderTop: '1px solid rgba(255,255,255,.06)',
            display: 'flex', alignItems: 'center', gap: 8 }}>
            <EyebrowLabel>Paramètres</EyebrowLabel>
            <span style={{ fontSize: 10, color: 'rgba(212,197,245,.3)' }}>·</span>
            <span style={{ fontSize: 11, color: 'rgba(212,197,245,.4)', fontFamily: 'var(--mono, monospace)' }}>
              Gérez votre profil et vos connexions
            </span>
          </div>
        </div>

        {/* ══ TABS ═════════════════════════════════════════════════════════ */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 2 }}>
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', borderRadius: 999, whiteSpace: 'nowrap',
                  fontFamily: 'var(--mono, monospace)', fontSize: 11, fontWeight: 700,
                  letterSpacing: '0.05em', textTransform: 'uppercase',
                  transition: 'all 0.18s ease', cursor: 'pointer', border: '1px solid',
                  background: active ? '#6E50C8' : 'rgba(110,80,200,.06)',
                  borderColor: active ? '#6E50C8' : 'rgba(110,80,200,.15)',
                  color: active ? '#fff' : '#5A4880',
                }}
              >
                <tab.icon style={{ width: 13, height: 13 }} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Accès Super Admin — visible uniquement pour les super admins, sur tous les onglets */}
        {isSuperAdmin && (
          <button
            onClick={() => navigate('/super-admin')}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', marginBottom: 16,
              borderRadius: 16, border: '2px solid rgba(110,80,200,.30)',
              background: 'linear-gradient(90deg, rgba(110,80,200,.10), rgba(110,80,200,.04))',
              cursor: 'pointer', textAlign: 'left', transition: 'all 0.18s ease' }}
          >
            <div style={{ width: 38, height: 38, borderRadius: 12, background: '#6E50C8',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Shield style={{ width: 18, height: 18, color: '#fff' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#6E50C8' }}>Mode Super Admin</div>
              <div style={{ fontSize: 11, color: '#9082B8', fontFamily: 'var(--mono, monospace)' }}>
                Vision 360° · Organisations · Plans · Utilisateurs
              </div>
            </div>
            <ExternalLink style={{ width: 15, height: 15, color: '#6E50C8' }} />
          </button>
        )}

        {/* ══ PROFILE TAB ══════════════════════════════════════════════════ */}
        {activeTab === 'profile' && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-4">

            <SectionCard>
              <div style={{ padding: '20px 24px 0', borderBottom: '1px solid rgba(110,80,200,.08)' }}>
                <EyebrowLabel>Identité</EyebrowLabel>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: '#1A1040', margin: '4px 0 16px', letterSpacing: '-0.02em' }}>
                  Profil utilisateur
                </h2>
              </div>

              <div style={{ padding: '20px 24px' }}>
                {/* Avatar + name display */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
                  {profile?.avatarUrl ? (
                    <img src={profile.avatarUrl} alt={profile.fullName}
                      style={{ width: 64, height: 64, borderRadius: 16, objectFit: 'cover', flexShrink: 0,
                        border: '2px solid rgba(110,80,200,.12)' }} />
                  ) : (
                    <div style={{ width: 64, height: 64, flexShrink: 0, borderRadius: 16,
                      background: 'linear-gradient(135deg,#6E50C8,#5A3EAA)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 22, fontWeight: 900, color: '#fff' }}>
                      {profile?.initials ?? '?'}
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#1A1040', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                      {profile?.fullName ?? '—'}
                    </div>
                    <div style={{ fontSize: 12, color: '#9082B8', marginTop: 4 }}>
                      {profile?.roleTitle ?? ''}{profile?.companyName ? ` · ${profile.companyName}` : ''}
                    </div>
                    {profile?.email && (
                      <a href={`mailto:${profile.email}`}
                        style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#9082B8', marginTop: 6, textDecoration: 'none' }}>
                        <Mail style={{ width: 12, height: 12 }} />
                        {profile.email}
                      </a>
                    )}
                  </div>
                </div>

                {/* Edit name */}
                <div style={{ borderTop: '1px solid rgba(110,80,200,.08)', paddingTop: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1040', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <User style={{ width: 13, height: 13, color: '#6E50C8' }} />
                    Modifier le nom
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }} className="sm:grid-cols-2 grid-cols-1">
                    <div>
                      <label style={{ display: 'block', fontSize: 11, color: '#9082B8', marginBottom: 6, fontWeight: 600 }}>Prénom</label>
                      <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Prénom"
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 10,
                          border: '1px solid rgba(110,80,200,.15)', background: '#F9F8FC',
                          fontSize: 13, color: '#1A1040', outline: 'none', boxSizing: 'border-box' }}
                        onFocus={e => { e.target.style.borderColor = '#6E50C8'; e.target.style.boxShadow = '0 0 0 3px rgba(110,80,200,.08)'; }}
                        onBlur={e => { e.target.style.borderColor = 'rgba(110,80,200,.15)'; e.target.style.boxShadow = 'none'; }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, color: '#9082B8', marginBottom: 6, fontWeight: 600 }}>Nom</label>
                      <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)}
                        placeholder="Nom de famille"
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 10,
                          border: '1px solid rgba(110,80,200,.15)', background: '#F9F8FC',
                          fontSize: 13, color: '#1A1040', outline: 'none', boxSizing: 'border-box' }}
                        onFocus={e => { e.target.style.borderColor = '#6E50C8'; e.target.style.boxShadow = '0 0 0 3px rgba(110,80,200,.08)'; }}
                        onBlur={e => { e.target.style.borderColor = 'rgba(110,80,200,.15)'; e.target.style.boxShadow = 'none'; }}
                      />
                    </div>
                  </div>
                  <button onClick={handleSaveProfile} disabled={savingProfile}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px',
                      borderRadius: 10, background: '#6E50C8', color: '#fff', fontSize: 13, fontWeight: 700,
                      border: 'none', cursor: savingProfile ? 'not-allowed' : 'pointer',
                      opacity: savingProfile ? 0.7 : 1, transition: 'all 0.18s ease' }}>
                    {profileSaved
                      ? <><CheckCheck style={{ width: 14, height: 14 }} /> Sauvegardé !</>
                      : savingProfile
                      ? <><Save style={{ width: 14, height: 14 }} /> Sauvegarde…</>
                      : <><Save style={{ width: 14, height: 14 }} /> Sauvegarder</>}
                  </button>
                </div>

                {/* LinkedIn */}
                <div style={{ borderTop: '1px solid rgba(110,80,200,.08)', paddingTop: 20, marginTop: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <LinkedInLogo size={18} />
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1040' }}>Profil LinkedIn</div>
                  </div>
                  <p style={{ fontSize: 11, color: '#9082B8', marginBottom: 12, lineHeight: 1.6 }}>
                    Votre URL LinkedIn permet à Knowr d'enrichir votre réseau et de contextualiser vos échanges professionnels.
                  </p>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <Link style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, color: '#9082B8' }} />
                      <input type="url" value={linkedinUrl}
                        onChange={(e) => { setLinkedinUrl(e.target.value); setLinkedinSaved(false); }}
                        placeholder="https://linkedin.com/in/votre-profil"
                        style={{ width: '100%', padding: '10px 14px 10px 34px', borderRadius: 10,
                          border: linkedinSaved ? '1px solid rgba(110,80,200,.35)' : '1px solid rgba(110,80,200,.15)',
                          background: linkedinSaved ? 'rgba(110,80,200,.04)' : '#F9F8FC',
                          fontSize: 12, color: '#1A1040', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                    <button onClick={handleSaveLinkedin} disabled={!linkedinUrl || linkedinSaving}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 16px',
                        borderRadius: 10, fontSize: 12, fontWeight: 700, border: 'none', cursor: (!linkedinUrl || linkedinSaving) ? 'not-allowed' : 'pointer',
                        background: linkedinSaved ? 'rgba(110,80,200,.1)' : '#6E50C8',
                        color: linkedinSaved ? '#6E50C8' : '#fff', opacity: (!linkedinUrl || linkedinSaving) ? 0.5 : 1,
                        transition: 'all 0.18s ease', whiteSpace: 'nowrap' }}>
                      {linkedinSaving ? <><Loader2 style={{ width: 13, height: 13 }} className="animate-spin" /> Sauvegarde…</>
                        : linkedinSaved ? <><CheckCheck style={{ width: 13, height: 13 }} /> Sauvegardé !</>
                        : <><Save style={{ width: 13, height: 13 }} /> Sauvegarder</>}
                    </button>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Mon abonnement — plan actuel + offres + upgrade */}
            <PlanSummary />

            {isSuperAdmin && (
              <button onClick={() => navigate('/super-admin')}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px',
                  borderRadius: 16, border: '2px solid rgba(110,80,200,.25)', background: 'rgba(110,80,200,.05)',
                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.18s ease' }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: '#6E50C8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Shield style={{ width: 18, height: 18, color: '#fff' }} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#6E50C8' }}>Super Admin — Vision 360°</div>
                  <div style={{ fontSize: 11, color: '#9082B8', fontFamily: 'var(--mono, monospace)' }}>KPIs · Organisations · Utilisateurs · Réseau</div>
                </div>
                <ExternalLink style={{ width: 14, height: 14, color: '#6E50C8', marginLeft: 'auto' }} />
              </button>
            )}

            {isAdmin && (
              <SectionCard>
                <div style={{ padding: '20px 24px 0', borderBottom: '1px solid rgba(110,80,200,.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <Shield style={{ width: 16, height: 16, color: '#6E50C8' }} />
                    <EyebrowLabel>Admin</EyebrowLabel>
                  </div>
                </div>
                <div style={{ padding: '20px 24px' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#1A1040', marginBottom: 16 }}>Informations de l'organisation</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, color: '#9082B8', marginBottom: 6, fontWeight: 600 }}>Nom de l'organisation</label>
                      <input type="text" defaultValue="Knowr"
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(110,80,200,.15)', background: '#F9F8FC', fontSize: 13, color: '#1A1040', outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, color: '#9082B8', marginBottom: 6, fontWeight: 600 }}>Site web</label>
                      <input type="text" defaultValue="knowy.ai"
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(110,80,200,.15)', background: '#F9F8FC', fontSize: 13, color: '#1A1040', outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                  </div>

                  {/* Logo de marque — glisser-déposer → webp → base */}
                  <div style={{ marginTop: 20 }}>
                    <label style={{ display: 'block', fontSize: 11, color: '#9082B8', marginBottom: 6, fontWeight: 600 }}>
                      Logo (affiché dans la barre latérale · converti en WebP)
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center rounded-xl border flex-shrink-0"
                        style={{ width: 88, height: 64, background: '#F9F8FC', borderColor: 'rgba(110,80,200,.15)' }}>
                        {orgLogo
                          ? <img src={orgLogo} alt="Logo" style={{ maxHeight: 48, maxWidth: 76, objectFit: 'contain' }} />
                          : <span style={{ fontFamily: 'Epilogue, sans-serif', fontWeight: 900, fontSize: 18, color: '#1A1040' }}>Know<span style={{ color: '#6E50C8' }}>r</span></span>}
                      </div>
                      <label
                        onDragOver={(e) => { e.preventDefault(); setLogoDrag(true); }}
                        onDragLeave={() => setLogoDrag(false)}
                        onDrop={(e) => { e.preventDefault(); setLogoDrag(false); handleLogoFile(e.dataTransfer.files?.[0]); }}
                        className="flex-1 flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed cursor-pointer transition-colors"
                        style={{
                          padding: '16px', minHeight: 64,
                          borderColor: logoDrag ? '#6E50C8' : 'rgba(110,80,200,.25)',
                          background: logoDrag ? 'rgba(110,80,200,.06)' : 'transparent',
                        }}
                      >
                        <input type="file" accept="image/*" hidden
                          onChange={(e) => handleLogoFile(e.target.files?.[0])} />
                        <span style={{ fontSize: 12.5, color: '#6E50C8', fontWeight: 700 }}>
                          {logoSaving ? 'Conversion…' : 'Glisser-déposer ou cliquer'}
                        </span>
                        <span style={{ fontSize: 11, color: '#9082B8' }}>PNG · JPG · SVG → WebP (max 256px)</span>
                      </label>
                      {orgLogo && (
                        <button onClick={removeLogo} disabled={logoSaving}
                          className="text-xs font-semibold text-destructive hover:underline flex-shrink-0">
                          Retirer
                        </button>
                      )}
                    </div>
                    {logoErr && <p style={{ fontSize: 11, color: '#D94F63', marginTop: 8 }}>{logoErr}</p>}
                    {orgLogo && !logoErr && !logoSaving && (
                      <p style={{ fontSize: 11, color: '#2EA86A', marginTop: 8 }}>✓ Logo enregistré — rechargez la page pour le voir dans la barre latérale.</p>
                    )}
                  </div>
                </div>
              </SectionCard>
            )}
          </motion.div>
        )}

        {/* ══ CONNECTIONS TAB ══════════════════════════════════════════════ */}
        {activeTab === 'connections' && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-4">

            <SectionCard>
              <div style={{ padding: '20px 24px 0', borderBottom: '1px solid rgba(110,80,200,.08)' }}>
                <EyebrowLabel>Sources de données</EyebrowLabel>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1A1040', margin: '4px 0 16px', letterSpacing: '-0.02em' }}>
                  Comptes connectés
                </h3>
              </div>

              <div style={{ padding: '16px 24px 20px' }}>
                <p style={{ fontSize: 12, color: '#9082B8', marginBottom: 16 }}>
                  Connectez vos comptes pour synchroniser vos emails, calendriers et contacts.
                </p>

                {connectError && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10,
                    background: 'rgba(217,79,99,.08)', border: '1px solid rgba(217,79,99,.2)', marginBottom: 12 }}>
                    <AlertCircle style={{ width: 14, height: 14, color: '#D94F63', flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: '#D94F63' }}>{connectError}</span>
                  </div>
                )}

                {syncError && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10,
                    background: 'rgba(217,79,99,.08)', border: '1px solid rgba(217,79,99,.2)', marginBottom: 12 }}>
                    <AlertCircle style={{ width: 14, height: 14, color: '#D94F63', flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: '#D94F63' }}>{syncError}</span>
                  </div>
                )}

                {syncOutlookError && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10,
                    background: 'rgba(217,79,99,.08)', border: '1px solid rgba(217,79,99,.2)', marginBottom: 12 }}>
                    <AlertCircle style={{ width: 14, height: 14, color: '#D94F63', flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: '#D94F63' }}>{syncOutlookError}</span>
                  </div>
                )}

                {syncResult && (
                  <div style={{ borderRadius: 10, border: '1px solid rgba(46,168,106,.25)', background: 'rgba(46,168,106,.07)', overflow: 'hidden', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', fontSize: 12, color: '#2EA86A' }}>
                      <CheckCircle2 style={{ width: 14, height: 14, flexShrink: 0 }} />
                      <span>Gmail — <strong>{syncResult.messages}</strong> emails · <strong>{syncResult.threads}</strong> threads · <strong>{syncResult.contacts}</strong> contacts</span>
                    </div>
                    {syncResult.messages === 0 && (
                      <div style={{ borderTop: '1px solid rgba(46,168,106,.15)', padding: '8px 14px' }}>
                        <p style={{ fontSize: 11, color: 'rgba(46,168,106,.7)' }}>Tous les échanges sont déjà à jour.</p>
                      </div>
                    )}
                  </div>
                )}

                {syncOutlookResult && (
                  <div style={{ borderRadius: 10, border: '1px solid rgba(46,168,106,.25)', background: 'rgba(46,168,106,.07)', overflow: 'hidden', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', fontSize: 12, color: '#2EA86A' }}>
                      <CheckCircle2 style={{ width: 14, height: 14, flexShrink: 0 }} />
                      <span>Outlook — <strong>{syncOutlookResult.messages}</strong> emails · <strong>{syncOutlookResult.contacts}</strong> contacts</span>
                    </div>
                  </div>
                )}

                {/* Connections list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {AVAILABLE_CONNECTIONS.map((conn) => {
                    const linked = isIdentityLinked(conn.id);
                    const syncOn = isSyncActive(conn.id);
                    const loading = pending === conn.id;
                    return (
                      <div key={conn.id}
                        style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
                          padding: '14px 16px', borderRadius: 12,
                          background: syncOn ? 'rgba(46,168,106,.05)' : linked ? 'rgba(201,122,32,.04)' : 'rgba(110,80,200,.04)',
                          border: `1px solid ${syncOn ? 'rgba(46,168,106,.2)' : linked ? 'rgba(201,122,32,.2)' : 'rgba(110,80,200,.1)'}` }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1, minWidth: 0 }}>
                          <div style={{ width: 44, height: 44, flexShrink: 0, borderRadius: 12, background: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: `1px solid ${syncOn ? 'rgba(46,168,106,.3)' : linked ? 'rgba(201,122,32,.3)' : 'rgba(110,80,200,.12)'}` }}>
                            {conn.logo}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: '#1A1040', marginBottom: 2 }}>{conn.name}</p>
                            <p style={{ fontSize: 11, color: '#9082B8', fontFamily: 'var(--mono, monospace)' }}>{conn.subtitle}</p>
                            {linked && !syncOn && (
                              <p style={{ fontSize: 10, color: '#C97A20', marginTop: 4, fontWeight: 600 }}>
                                Compte lié · Sync désactivée — données conservées
                              </p>
                            )}
                            {conn.id === 'linkedin' && syncOn && (
                              <p style={{ fontSize: 10, color: '#6E50C8', marginTop: 4 }}>
                                Profils enrichis via données publiques · messages non accessibles
                              </p>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          {linked && syncOn && (
                            <>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#2EA86A', fontWeight: 600 }}>
                                <CheckCircle2 style={{ width: 13, height: 13 }} />
                                <span className="hidden sm:inline">Connecté</span>
                              </div>
                              {conn.id === 'google' && (
                                <button onClick={handleGmailSync} disabled={syncing}
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px',
                                    borderRadius: 8, background: 'rgba(110,80,200,.1)', border: '1px solid rgba(110,80,200,.2)',
                                    color: '#6E50C8', fontSize: 11, fontWeight: 700, cursor: syncing ? 'not-allowed' : 'pointer',
                                    opacity: syncing ? 0.6 : 1, transition: 'all 0.18s ease' }}>
                                  {syncing ? <Loader2 style={{ width: 12, height: 12 }} className="animate-spin" /> : <Download style={{ width: 12, height: 12 }} />}
                                  {syncing ? 'Sync…' : 'Sync emails'}
                                </button>
                              )}
                              {conn.id === 'outlook' && (
                                <button onClick={handleOutlookSync} disabled={syncingOutlook}
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px',
                                    borderRadius: 8, background: 'rgba(0,120,212,.1)', border: '1px solid rgba(0,120,212,.2)',
                                    color: '#0078D4', fontSize: 11, fontWeight: 700, cursor: syncingOutlook ? 'not-allowed' : 'pointer',
                                    opacity: syncingOutlook ? 0.6 : 1, transition: 'all 0.18s ease' }}>
                                  {syncingOutlook ? <Loader2 style={{ width: 12, height: 12 }} className="animate-spin" /> : <Download style={{ width: 12, height: 12 }} />}
                                  {syncingOutlook ? 'Sync…' : 'Sync emails'}
                                </button>
                              )}
                              <button onClick={() => handleDisconnect(conn.id)} disabled={loading}
                                style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(110,80,200,.06)',
                                  border: '1px solid rgba(110,80,200,.12)', color: '#5A4880', fontSize: 11, fontWeight: 600,
                                  cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1, transition: 'all 0.18s ease' }}>
                                {loading ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Loader2 style={{ width: 11, height: 11 }} className="animate-spin" />…</span> : 'Déconnecter'}
                              </button>
                            </>
                          )}
                          {linked && !syncOn && (
                            <button onClick={() => handleConnect(conn.id)} disabled={loading}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px',
                                borderRadius: 8, background: '#C97A20', border: 'none', color: '#fff', fontSize: 11,
                                fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, transition: 'all 0.18s ease' }}>
                              {loading && <Loader2 style={{ width: 11, height: 11 }} className="animate-spin" />}
                              {loading ? 'Connexion…' : 'Reconnecter la sync'}
                            </button>
                          )}
                          {!linked && (
                            <button onClick={() => handleConnect(conn.id)} disabled={loading}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px',
                                borderRadius: 8, background: '#6E50C8', border: 'none', color: '#fff', fontSize: 11,
                                fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, transition: 'all 0.18s ease' }}>
                              {loading && <Loader2 style={{ width: 11, height: 11 }} className="animate-spin" />}
                              {loading ? 'Connexion…' : 'Se connecter'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {isConnected('linkedin') && (
                  <div style={{ marginTop: 12, padding: '14px 16px', borderRadius: 12,
                    background: 'rgba(10,102,194,.06)', border: '1px solid rgba(10,102,194,.18)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <LinkedInLogo size={18} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: '#1A1040', marginBottom: 4 }}>LinkedIn connecté</p>
                        <p style={{ fontSize: 11, color: '#9082B8', marginBottom: 10, lineHeight: 1.6 }}>
                          Knowr utilise vos données LinkedIn pour enrichir les profils. L'accès aux messages n'est pas disponible via l'API officielle.
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {['✓ Identification des profils', '✓ Postes & formations', '✓ Données publiques', '✗ Messages privés', '✗ Connexions réseau'].map((item, i) => (
                            <span key={i} style={{ fontSize: 10, fontFamily: 'var(--mono, monospace)', padding: '2px 8px', borderRadius: 999,
                              background: item.startsWith('✓') ? 'rgba(46,168,106,.1)' : 'rgba(110,80,200,.06)',
                              color: item.startsWith('✓') ? '#2EA86A' : '#9082B8',
                              border: `1px solid ${item.startsWith('✓') ? 'rgba(46,168,106,.2)' : 'rgba(110,80,200,.1)'}` }}>
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </SectionCard>

            {/* Sync settings */}
            <SectionCard>
              <div style={{ padding: '20px 24px 0', borderBottom: '1px solid rgba(110,80,200,.08)' }}>
                <EyebrowLabel>Préférences</EyebrowLabel>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1A1040', margin: '4px 0 16px', letterSpacing: '-0.02em' }}>
                  Synchronisation
                </h3>
              </div>
              <div style={{ padding: '16px 24px 20px' }}>
                <p style={{ fontSize: 11, color: '#9082B8', marginBottom: 14, fontFamily: 'var(--mono, monospace)' }}>
                  Préférences persistées en base de données.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { key: 'calendar' as const, icon: Calendar, label: 'Synchronisation calendrier', sub: 'Auto-détection des réunions' },
                    { key: 'email'    as const, icon: Mail,     label: 'Analyse des emails',          sub: 'Contexte relationnel' },
                    { key: 'enrichment' as const, icon: Network, label: 'Enrichissement automatique', sub: 'Données publiques LinkedIn, etc.' },
                  ].map(({ key, icon: Icon, label, sub }) => (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 14px', borderRadius: 10, background: 'rgba(110,80,200,.04)', border: '1px solid rgba(110,80,200,.08)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Icon style={{ width: 15, height: 15, color: '#6E50C8', flexShrink: 0 }} />
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 700, color: '#1A1040', marginBottom: 1 }}>{label}</p>
                          <p style={{ fontSize: 11, color: '#9082B8' }}>{sub}</p>
                        </div>
                      </div>
                      <IOSToggle checked={syncSettings[key]} onChange={() => toggleSync(key)} />
                    </div>
                  ))}
                </div>
              </div>
            </SectionCard>

            {/* CRM — V2 (placé sous les préférences) */}
            <SectionCard className="opacity-60">
              <div style={{ padding: '20px 24px 0', borderBottom: '1px solid rgba(110,80,200,.08)' }}>
                <EyebrowLabel>Bientôt disponible</EyebrowLabel>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0 16px' }}>
                  <Globe style={{ width: 15, height: 15, color: '#6E50C8' }} />
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1A1040', letterSpacing: '-0.02em', margin: 0 }}>
                    Connexions CRM
                  </h3>
                  <span style={{ fontSize: 10, fontFamily: 'var(--mono, monospace)', fontWeight: 700, padding: '3px 9px',
                    borderRadius: 999, background: 'rgba(110,80,200,.08)', border: '1px solid rgba(110,80,200,.15)', color: '#9082B8' }}>
                    V2
                  </span>
                </div>
              </div>
              <div style={{ padding: '16px 24px 20px' }}>
                <p style={{ fontSize: 12, color: '#9082B8', marginBottom: 14 }}>L'intégration CRM arrivera dans la prochaine version de Knowr.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {CRM_LIST.map((crm) => (
                    <div key={crm.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 14px', borderRadius: 10, background: 'rgba(110,80,200,.04)', border: '1px solid rgba(110,80,200,.08)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fff', display: 'flex',
                          alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(110,80,200,.1)' }}>
                          {crm.logo}
                        </div>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 700, color: '#1A1040', marginBottom: 2 }}>{crm.name}</p>
                          <p style={{ fontSize: 11, color: '#9082B8' }}>{crm.description}</p>
                        </div>
                      </div>
                      <span style={{ fontSize: 11, padding: '5px 12px', borderRadius: 8, background: 'rgba(110,80,200,.06)',
                        color: '#9082B8', fontFamily: 'var(--mono, monospace)', fontWeight: 600 }}>Bientôt</span>
                    </div>
                  ))}
                </div>
              </div>
            </SectionCard>
          </motion.div>
        )}

        {/* ══ SECURITY TAB ══════════════════════════════════════════════════ */}
        {activeTab === 'security' && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-4">

            <SectionCard>
              <div style={{ padding: '20px 24px 0', borderBottom: '1px solid rgba(110,80,200,.08)' }}>
                <EyebrowLabel>Authentification</EyebrowLabel>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0 16px' }}>
                  <Lock style={{ width: 15, height: 15, color: '#6E50C8' }} />
                  <h2 style={{ fontSize: 16, fontWeight: 800, color: '#1A1040', letterSpacing: '-0.02em', margin: 0 }}>
                    Mot de passe
                  </h2>
                </div>
              </div>

              <div style={{ padding: '20px 24px' }}>
                {isOAuthUser ? (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px',
                    borderRadius: 12, background: 'rgba(110,80,200,.05)', border: '1px solid rgba(110,80,200,.12)' }}>
                    <div style={{ flexShrink: 0 }}>
                      {authProvider === 'google' ? <GoogleLogo /> : authProvider === 'azure' ? <OutlookLogo /> : <LinkedInLogo size={22} />}
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#1A1040', marginBottom: 4 }}>
                        Connexion via {authProvider === 'google' ? 'Google' : authProvider === 'azure' ? 'Microsoft Outlook' : 'LinkedIn'}
                      </p>
                      <p style={{ fontSize: 12, color: '#9082B8', lineHeight: 1.6 }}>
                        Votre mot de passe est géré par {authProvider === 'google' ? 'Google' : authProvider === 'azure' ? 'Microsoft' : 'LinkedIn'}.
                        Pour le modifier, rendez-vous directement sur leur site.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div style={{ maxWidth: 400 }}>
                    <p style={{ fontSize: 12, color: '#9082B8', marginBottom: 20, lineHeight: 1.6 }}>
                      Choisissez un nouveau mot de passe pour votre compte <strong style={{ color: '#1A1040' }}>{user?.email}</strong>.
                    </p>

                    <div style={{ marginBottom: 14 }}>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#9082B8', marginBottom: 6 }}>Nouveau mot de passe</label>
                      <div style={{ position: 'relative' }}>
                        <input type={showPwNew ? 'text' : 'password'} value={pwNew} onChange={(e) => setPwNew(e.target.value)}
                          placeholder="Minimum 8 caractères"
                          style={{ width: '100%', padding: '10px 40px 10px 14px', borderRadius: 10,
                            border: '1px solid rgba(110,80,200,.15)', background: '#F9F8FC',
                            fontSize: 13, color: '#1A1040', outline: 'none', boxSizing: 'border-box' }} />
                        <button type="button" onClick={() => setShowPwNew(!showPwNew)}
                          style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                            background: 'none', border: 'none', cursor: 'pointer', color: '#9082B8', padding: 0 }}>
                          {showPwNew ? <EyeOff style={{ width: 14, height: 14 }} /> : <Eye style={{ width: 14, height: 14 }} />}
                        </button>
                      </div>
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#9082B8', marginBottom: 6 }}>Confirmer le mot de passe</label>
                      <div style={{ position: 'relative' }}>
                        <input type={showPwConfirm ? 'text' : 'password'} value={pwConfirm} onChange={(e) => setPwConfirm(e.target.value)}
                          placeholder="Répétez le mot de passe"
                          style={{ width: '100%', padding: '10px 40px 10px 14px', borderRadius: 10,
                            border: '1px solid rgba(110,80,200,.15)', background: '#F9F8FC',
                            fontSize: 13, color: '#1A1040', outline: 'none', boxSizing: 'border-box' }} />
                        <button type="button" onClick={() => setShowPwConfirm(!showPwConfirm)}
                          style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                            background: 'none', border: 'none', cursor: 'pointer', color: '#9082B8', padding: 0 }}>
                          {showPwConfirm ? <EyeOff style={{ width: 14, height: 14 }} /> : <Eye style={{ width: 14, height: 14 }} />}
                        </button>
                      </div>
                    </div>

                    {pwNew.length > 0 && (
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                          {[1, 2, 3, 4].map((n) => (
                            <div key={n} style={{ height: 3, flex: 1, borderRadius: 999, transition: 'background 0.2s',
                              background: pwNew.length >= n * 3
                                ? n <= 1 ? '#D94F63' : n <= 2 ? '#C97A20' : n <= 3 ? '#E5C040' : '#2EA86A'
                                : 'rgba(110,80,200,.12)' }} />
                          ))}
                        </div>
                        <p style={{ fontSize: 10, color: '#9082B8', fontFamily: 'var(--mono, monospace)' }}>
                          {pwNew.length < 4 ? 'Trop court' : pwNew.length < 7 ? 'Faible' : pwNew.length < 10 ? 'Moyen' : 'Fort'}
                        </p>
                      </div>
                    )}

                    {pwError && (
                      <div style={{ fontSize: 12, color: '#D94F63', marginBottom: 12, padding: '8px 12px',
                        borderRadius: 8, background: 'rgba(217,79,99,.08)', border: '1px solid rgba(217,79,99,.2)' }}>
                        {pwError}
                      </div>
                    )}

                    {pwDone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10,
                        background: 'rgba(46,168,106,.08)', border: '1px solid rgba(46,168,106,.2)', marginBottom: 14, fontSize: 12, color: '#2EA86A', fontWeight: 700 }}>
                        <CheckCheck style={{ width: 14, height: 14 }} />
                        Mot de passe mis à jour !
                      </div>
                    )}

                    <button onClick={handleChangePassword} disabled={!pwNew || !pwConfirm || pwSaving}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px',
                        borderRadius: 10, background: '#6E50C8', color: '#fff', fontSize: 13, fontWeight: 700,
                        border: 'none', cursor: (!pwNew || !pwConfirm || pwSaving) ? 'not-allowed' : 'pointer',
                        opacity: (!pwNew || !pwConfirm || pwSaving) ? 0.5 : 1, transition: 'all 0.18s ease' }}>
                      <Lock style={{ width: 13, height: 13 }} />
                      {pwSaving ? 'Mise à jour…' : 'Changer le mot de passe'}
                    </button>
                  </div>
                )}
              </div>
            </SectionCard>
          </motion.div>
        )}

      </div>
    </div>
  );
}
