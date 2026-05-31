import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { useEffect, useState } from 'react';
import { useCurrentProfile } from '../../hooks/useCurrentProfile';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { getActiveOrganizationId } from '../../lib/api/org';
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
} from 'lucide-react';

// ── Official logos (inline SVG) ────────────────────────────────────────

const GoogleLogo = () => (
  <svg viewBox="0 0 24 24" width="26" height="26" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const OutlookLogo = () => (
  <svg viewBox="0 0 32 32" width="26" height="26" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="4" fill="#0078D4"/>
    <rect x="14" y="5" width="15" height="20" rx="2" fill="#28A8E8"/>
    <path d="M14 13l7.5 4.5L29 13" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="1" y="5" width="14" height="22" rx="2.5" fill="#0364B8"/>
    <ellipse cx="8" cy="16" rx="3.5" ry="4.5" fill="white"/>
  </svg>
);

const LinkedInLogo = () => (
  <svg viewBox="0 0 24 24" width="26" height="26" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="4" fill="#0A66C2"/>
    <path d="M5 9h2.5v9.5H5V9zm1.25-4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM10 9h2.4v1.3c.4-.7 1.3-1.5 2.8-1.5 2.9 0 3.8 1.9 3.8 4.4v5.3H16.5v-4.7c0-1.1-.4-1.9-1.5-1.9-1 0-1.5.7-1.7 1.4-.1.2-.1.5-.1.8v4.4H10V9z" fill="white"/>
  </svg>
);

// CRM logos — SVG inline pour éviter les requêtes réseau bloquées en local
const CrmLogoHubSpot  = () => <svg viewBox="0 0 32 32" width="28" height="28"><circle cx="16" cy="16" r="16" fill="#FF7A59"/><text x="16" y="21" textAnchor="middle" fontSize="14" fontWeight="800" fill="white" fontFamily="sans-serif">H</text></svg>;
const CrmLogoSalesforce = () => <svg viewBox="0 0 32 32" width="28" height="28"><rect width="32" height="32" rx="6" fill="#00A1E0"/><text x="16" y="21" textAnchor="middle" fontSize="11" fontWeight="700" fill="white" fontFamily="sans-serif">SF</text></svg>;
const CrmLogoPipedrive  = () => <svg viewBox="0 0 32 32" width="28" height="28"><rect width="32" height="32" rx="6" fill="#25292E"/><text x="16" y="21" textAnchor="middle" fontSize="14" fontWeight="800" fill="#0EAD69" fontFamily="sans-serif">P</text></svg>;
const CrmLogoAttio      = () => <svg viewBox="0 0 32 32" width="28" height="28"><rect width="32" height="32" rx="6" fill="#1C1C1C"/><text x="16" y="21" textAnchor="middle" fontSize="13" fontWeight="700" fill="white" fontFamily="sans-serif">at</text></svg>;

const CRM_LIST = [
  { name: 'HubSpot',    description: 'Sync contacts, deals et activités',        logo: <CrmLogoHubSpot />,    color: '#FF7A59' },
  { name: 'Salesforce', description: 'Sync accounts, opportunities et réunions', logo: <CrmLogoSalesforce />, color: '#00A1E0' },
  { name: 'Pipedrive',  description: 'Sync pipeline et données contacts',         logo: <CrmLogoPipedrive />,  color: '#25292E' },
  { name: 'Attio',      description: 'CRM nouvelle génération',                   logo: <CrmLogoAttio />,      color: '#1C1C1C' },
];

const AVAILABLE_CONNECTIONS = [
  { id: 'google',   name: 'Google',            subtitle: 'Gmail · Google Calendar · Contacts',  logo: <GoogleLogo /> },
  { id: 'outlook',  name: 'Microsoft Outlook', subtitle: 'Email · Calendrier · Contacts',        logo: <OutlookLogo /> },
  { id: 'linkedin', name: 'LinkedIn',          subtitle: 'Réseau · Profils professionnels',      logo: <LinkedInLogo /> },
];

// ── iOS toggle — couleur primaire Knowy #6E50C8 ────────────────────────
function IOSToggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className="relative flex-shrink-0 w-[51px] h-[31px] rounded-full border-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      style={{ backgroundColor: checked ? '#6E50C8' : '#E5E5EA', transition: 'background-color 0.22s ease', padding: 0 }}
    >
      <span
        className="absolute top-[2px] w-[27px] h-[27px] rounded-full bg-white"
        style={{ left: checked ? '22px' : '2px', transition: 'left 0.22s ease', boxShadow: '0 3px 8px rgba(0,0,0,0.22), 0 1px 3px rgba(0,0,0,0.12)' }}
      />
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────────
export default function AccountSettings() {
  const navigate = useNavigate();
  const { profile } = useCurrentProfile();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'connections' | 'security'>('profile');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Profile editing
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // Password change — direct updateUser, pas d'OTP
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwDone, setPwDone] = useState(false);
  const [showPwNew, setShowPwNew] = useState(false);
  const [showPwConfirm, setShowPwConfirm] = useState(false);

  // Sync settings — persistés dans profiles
  const [syncSettings, setSyncSettings] = useState({ calendar: true, email: true, enrichment: false });

  // Connections — identité Supabase (login) + statut sync (data)
  const [pending, setPending] = useState<string | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);
  // connectorSyncStatus : 'connected' | 'disconnected' | 'expired' | null (jamais chargé)
  const [connectorSyncStatus, setConnectorSyncStatus] = useState<Record<string, string>>({});

  // Gmail sync
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ messages: number; threads: number; contacts: number; contactStats?: Array<{ email: string; messages: number; threads: number }> } | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // LinkedIn URL
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [linkedinSaved, setLinkedinSaved] = useState(false);
  const [linkedinSaving, setLinkedinSaving] = useState(false);

  const connectedProviders = getConnectedIdentityProviders(user);

  // provider mapping: conn.id → OnboardingProvider
  const PROVIDER_MAP: Record<string, OnboardingProvider> = {
    google: 'google',
    outlook: 'microsoft',
    linkedin: 'linkedin_oidc',
  };

  // Gardée pour compatibilité legacy — préférer isIdentityLinked + isSyncActive
  function isConnected(connId: string) { return isIdentityLinked(connId); }

  async function handleConnect(connId: string) {
    setConnectError(null);
    setPending(connId);
    try {
      await linkIdentityProvider(PROVIDER_MAP[connId], '/account');
      // page redirects to OAuth — si on arrive ici c'est une erreur
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

  // Soft disconnect — révoque les tokens dans connectors, garde l'identité Supabase intacte.
  // Les données (emails, profils) sont préservées. La sync s'arrête automatiquement (plus de token).
  async function handleDisconnect(connId: string) {
    if (!supabase || !user) return;
    setConnectError(null);
    setPending(connId);
    try {
      const orgId = await getActiveOrganizationId();
      if (!orgId) { setPending(null); return; }

      const provider = connId === 'outlook' ? 'microsoft' : connId;
      await (supabase.from('connectors') as any).upsert({
        organization_id: orgId,
        user_id: user.id,
        provider,
        status: 'disconnected',
        metadata: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'organization_id,user_id,provider' });

      setConnectorSyncStatus(prev => ({ ...prev, [provider]: 'disconnected' }));
    } catch (e: any) {
      setConnectError(e?.message ?? 'Erreur lors de la déconnexion.');
    } finally {
      setPending(null);
    }
  }

  // isSyncActive — le connector a des tokens valides (différent de "l'identité est liée")
  function isSyncActive(connId: string): boolean {
    const provider = connId === 'outlook' ? 'microsoft' : connId;
    const status = connectorSyncStatus[provider];
    // Si jamais chargé mais l'identité est liée, on considère actif par défaut
    if (status === undefined) return isIdentityLinked(connId);
    return status === 'connected';
  }

  function isIdentityLinked(connId: string): boolean {
    const p = PROVIDER_MAP[connId];
    return connId === 'outlook'
      ? connectedProviders.includes('microsoft') || connectedProviders.includes('azure' as any)
      : connectedProviders.includes(p);
  }

  async function handleGmailSync() {
    if (!supabase) return;
    setSyncing(true);
    setSyncResult(null);
    setSyncError(null);
    try {
      const orgId = await getActiveOrganizationId();
      if (!orgId) { setSyncError('Organisation introuvable.'); return; }

      // Récupère le token Google de la session courante (dispo si connecté via Google)
      // et le passe à la fonction + le stocke pour les syncs futures.
      const { data: { session } } = await supabase.auth.getSession();
      const sessionToken = session?.provider_token ?? null;

      // Si on a un token frais, on le persiste dans connectors.metadata pour les prochaines fois
      if (sessionToken && session?.user) {
        await (supabase.from('connectors') as any).upsert({
          organization_id: orgId,
          user_id: session.user.id,
          provider: 'google',
          status: 'connected',
          metadata: {
            access_token: sessionToken,
            refresh_token: (session as any).provider_refresh_token ?? null,
            email: session.user.email,
            stored_at: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        }, { onConflict: 'organization_id,user_id,provider' });
      }

      // L'edge function utilise le token du body s'il est fourni, sinon celui stocké en BDD
      const { data, error } = await supabase.functions.invoke('ingest-communication', {
        body: { organizationId: orgId, providerToken: sessionToken, lookbackDays: 365, maxMessagesPerContact: 1000 },
      });

      if (error) {
        const msg: string = (error as any)?.message ?? String(error);
        if (msg.includes('NOT_CONNECTED') || msg.includes('TOKEN_MISSING')) {
          setSyncError('Connectez d\'abord votre compte Google dans la section ci-dessus.');
        } else {
          setSyncError(msg);
        }
        return;
      }
      setSyncResult({
        messages: data?.stats?.messages ?? 0,
        threads:  data?.stats?.threads  ?? 0,
        contacts: data?.stats?.contacts ?? 0,
        contactStats: data?.contactStats ?? [],
      });
    } catch (e: any) {
      setSyncError(e?.message ?? 'Erreur inconnue');
    } finally {
      setSyncing(false);
    }
  }

  const authProvider = (user?.app_metadata as any)?.provider ?? 'email';
  const isOAuthUser = authProvider !== 'email';

  useEffect(() => {
    if (profile?.fullName) {
      const parts = profile.fullName.split(' ');
      setFirstName(parts[0] ?? '');
      setLastName(parts.slice(1).join(' ') ?? '');
    }
  }, [profile?.fullName]);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      if (!supabase) return;
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u || !mounted) return;

      // Load sync prefs + LinkedIn URL
      try {
        const { data: profileRow, error: profileErr } = await supabase
          .from('profiles')
          .select('sync_calendar, sync_email, sync_enrichment, linkedin_profile_data')
          .eq('id', u.id)
          .maybeSingle();
        if (!profileErr && mounted && profileRow) {
          setSyncSettings({
            calendar:   (profileRow as any).sync_calendar   ?? true,
            email:      (profileRow as any).sync_email      ?? true,
            enrichment: (profileRow as any).sync_enrichment ?? false,
          });
          const liData = (profileRow as any).linkedin_profile_data;
          if (liData?.url && mounted) setLinkedinUrl(liData.url);
        }
      } catch { /* columns not yet present — use defaults */ }

      // Charger les statuts sync depuis la table connectors
      try {
        const orgId = await getActiveOrganizationId();
        if (orgId && mounted) {
          const { data: connRows } = await supabase
            .from('connectors')
            .select('provider, status')
            .eq('organization_id', orgId)
            .eq('user_id', u.id);
          if (connRows && mounted) {
            const map: Record<string, string> = {};
            (connRows as any[]).forEach(c => { map[c.provider] = c.status; });
            setConnectorSyncStatus(map);
          }
        }
      } catch { /* graceful */ }

      const { data: membership } = await supabase
        .from('memberships').select('role').eq('user_id', u.id).maybeSingle();
      if (mounted) setIsAdmin((membership as any)?.role === 'admin');

      const SUPER_ADMINS = ['jordan.knowy@gmail.com', 'jolacrypto1@gmail.com'];
      if (mounted) setIsSuperAdmin(SUPER_ADMINS.includes(u.email ?? ''));
    }
    loadData();
    return () => { mounted = false; };
  }, []);

  // ── Capture Google token after OAuth redirect → stockage persistant en BDD ──
  // Fonctionne quel que soit le mode de connexion (email / LinkedIn / Google)
  useEffect(() => {
    if (!supabase) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.provider_token || !supabase) return;
      const hasGoogleIdentity = session.user.identities?.some(i => i.provider === 'google');
      if (!hasGoogleIdentity) return;

      const orgId = await getActiveOrganizationId();
      if (!orgId) return;

      // Stocke le token Google persistant — tente d'abord avec metadata, fallback sans
      const baseConnector = {
        organization_id: orgId,
        user_id: session.user.id,
        provider: 'google',
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
        },
      };
      const { error: connErr } = await (supabase.from('connectors') as any)
        .upsert(withMeta, { onConflict: 'organization_id,user_id,provider' });
      // Si metadata column absente (migration non appliquée) → upsert sans metadata
      if (connErr) {
        await (supabase.from('connectors') as any)
          .upsert(baseConnector, { onConflict: 'organization_id,user_id,provider' });
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function toggleSync(key: keyof typeof syncSettings) {
    const next = !syncSettings[key];
    setSyncSettings((s) => ({ ...s, [key]: next }));
    if (!supabase) return;
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u) return;
    const col = { calendar: 'sync_calendar', email: 'sync_email', enrichment: 'sync_enrichment' }[key];
    // Silently ignore if migration not yet applied
    try {
      await supabase.from('profiles').upsert({ id: u.id, [col]: next } as any, { onConflict: 'id' });
    } catch { /* migration 202605290002 not yet applied */ }

    // Quand l'enrichissement est activé → déclenche l'enrich sur tous les contacts en attente
    if (key === 'enrichment' && next) {
      const orgId = await getActiveOrganizationId();
      if (!orgId) return;
      const { data: pendingContacts } = await supabase
        .from('contacts')
        .select('id')
        .eq('organization_id', orgId)
        .in('enrichment_status', ['pending', 'failed'])
        .limit(10); // batch de 10 pour ne pas surcharger
      if (!pendingContacts?.length) return;
      const sb = supabase;
      Promise.all(pendingContacts.map((c: any) =>
        sb.functions.invoke('enrich-contact', {
          body: { contactId: c.id, organizationId: orgId },
        }).catch(() => null)
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
    if (!supabase) return;
    setLoggingOut(true);
    await supabase.auth.signOut();
    navigate('/signin');
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
    if (pwNew.length < 8)          { setPwError('Minimum 8 caractères requis.'); return; }
    if (pwNew !== pwConfirm)        { setPwError('Les mots de passe ne correspondent pas.'); return; }
    setPwSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pwNew });
    setPwSaving(false);
    if (error) { setPwError(error.message); return; }
    setPwNew(''); setPwConfirm('');
    setPwDone(true);
    setTimeout(() => setPwDone(false), 3000);
  }

  const tabs = [
    { id: 'profile',     label: 'Mon profil',  icon: User },
    { id: 'connections', label: 'Connexions',  icon: Settings },
    { id: 'security',    label: 'Sécurité',    icon: Shield },
  ];

  return (
    <div className="size-full bg-background overflow-auto">
      <div className="max-w-7xl mx-auto px-4 py-5 md:px-8 md:py-8">

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-4xl font-semibold mb-2">Paramètres</h1>
              <p className="text-muted-foreground">Gérez votre profil et vos connexions.</p>
            </div>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 transition-all text-sm font-medium disabled:opacity-50"
            >
              <LogOut className="size-4" />
              {loggingOut ? 'Déconnexion…' : 'Se déconnecter'}
            </button>
          </div>
        </motion.div>
        <div className="mb-8" />

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-primary text-white'
                  : 'bg-card border border-border hover:bg-muted/50'
              }`}
            >
              <tab.icon className="size-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ── Profile Tab ─────────────────────────────────────────────── */}
        {activeTab === 'profile' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">

            <div className="bg-card rounded-2xl p-5 border border-border md:p-8">
              <h2 className="text-xl font-semibold mb-6">Profil utilisateur</h2>

              <div className="flex flex-col gap-5 mb-8 sm:flex-row sm:items-start sm:gap-8">
                {profile?.avatarUrl ? (
                  <img src={profile.avatarUrl} alt={profile.fullName} className="size-24 rounded-2xl object-cover flex-shrink-0" />
                ) : (
                  <div className="size-24 flex-shrink-0 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center text-white text-4xl font-medium">
                    {profile?.initials ?? '?'}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="text-2xl font-semibold mb-1">{profile?.fullName ?? '—'}</h3>
                  <p className="text-lg text-muted-foreground mb-4">
                    {profile?.roleTitle ?? ''}{profile?.companyName ? ` chez ${profile.companyName}` : ''}
                  </p>
                  {profile?.email && (
                    <a href={`mailto:${profile.email}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                      <Mail className="size-4" /><span>{profile.email}</span>
                    </a>
                  )}
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
                  <User className="size-4 text-primary" />Modifier le nom
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                  <div>
                    <label className="block text-sm text-muted-foreground mb-2">Prénom</label>
                    <input
                      type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Prénom"
                      className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-2">Nom</label>
                    <input
                      type="text" value={lastName} onChange={(e) => setLastName(e.target.value)}
                      placeholder="Nom de famille"
                      className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>
                <button
                  onClick={handleSaveProfile} disabled={savingProfile}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl transition-colors text-sm font-medium disabled:opacity-60"
                >
                  {profileSaved
                    ? <><CheckCheck className="size-4" /> Sauvegardé !</>
                    : savingProfile
                    ? <><Save className="size-4 animate-pulse" /> Sauvegarde…</>
                    : <><Save className="size-4" /> Sauvegarder</>}
                </button>
              </div>

              {/* LinkedIn URL */}
              <div className="border-t border-border pt-6 mt-6">
                <h3 className="text-base font-semibold mb-1 flex items-center gap-2">
                  <LinkedInLogo />
                  Profil LinkedIn
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Votre URL LinkedIn permet à Knowy d'enrichir votre réseau et de contextualiser vos échanges professionnels.
                </p>
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <Link className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <input
                      type="url"
                      value={linkedinUrl}
                      onChange={(e) => { setLinkedinUrl(e.target.value); setLinkedinSaved(false); }}
                      placeholder="https://linkedin.com/in/votre-profil"
                      className={`w-full pl-10 pr-4 py-3 bg-input border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
                        linkedinSaved ? 'border-primary/40 bg-primary/5' : 'border-border'
                      }`}
                    />
                  </div>
                  <button
                    onClick={handleSaveLinkedin}
                    disabled={!linkedinUrl || linkedinSaving}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all text-sm font-medium disabled:opacity-40 ${
                      linkedinSaved
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'bg-primary hover:bg-accent text-white'
                    }`}
                  >
                    {linkedinSaving ? (
                      <><span className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sauvegarde…</>
                    ) : linkedinSaved ? (
                      <><CheckCheck className="size-4" /> Sauvegardé !</>
                    ) : (
                      <><Save className="size-4" /> Sauvegarder</>
                    )}
                  </button>
                </div>

                {/* Banner de confirmation */}
                {linkedinSaved && (
                  <div className="mt-3 flex items-center gap-2.5 px-4 py-2.5 bg-primary/10 border border-primary/20 rounded-xl transition-all">
                    <div className="size-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <CheckCheck className="size-3 text-primary" />
                    </div>
                    <p className="text-sm text-primary font-medium">Profil LinkedIn sauvegardé</p>
                    {linkedinUrl && (
                      <a
                        href={linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto text-xs text-primary/60 hover:text-primary transition-colors flex items-center gap-1"
                      >
                        Voir <ChevronDown className="size-3 -rotate-90" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            {isSuperAdmin && (
              <button
                onClick={() => navigate('/super-admin')}
                className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors text-left"
              >
                <div className="size-10 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
                  <Shield className="size-5 text-primary-foreground" />
                </div>
                <div>
                  <div className="font-semibold text-primary">Super Admin — Vision 360°</div>
                  <div className="text-xs text-muted-foreground">KPIs · Organisations · Utilisateurs · Réseau</div>
                </div>
                <ExternalLink className="size-4 text-primary ml-auto" />
              </button>
            )}

            {isAdmin && (
              <>
                <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl p-6 border border-primary/10">
                  <div className="flex items-center gap-3">
                    <Shield className="size-6 text-primary" />
                    <div>
                      <h3 className="font-semibold">Paramètres administrateur</h3>
                      <p className="text-sm text-muted-foreground">Accessibles aux administrateurs de l'organisation uniquement.</p>
                    </div>
                  </div>
                </div>
                <div className="bg-card rounded-2xl p-8 border border-border">
                  <h2 className="text-xl font-semibold mb-6">Informations de l'organisation</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm text-muted-foreground mb-2">Nom de l'organisation</label>
                      <input type="text" defaultValue="Knowy" className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <div>
                      <label className="block text-sm text-muted-foreground mb-2">Site web</label>
                      <input type="text" defaultValue="knowy.ai" className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* ── Connections Tab ─────────────────────────────────────────── */}
        {activeTab === 'connections' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">

            <div className="bg-card rounded-2xl p-5 border border-border md:p-8">
              <h3 className="text-lg font-semibold mb-2">Comptes connectés</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Connectez vos comptes pour synchroniser vos emails, calendriers et contacts.
              </p>
              {connectError && (
                <p className="mb-4 text-sm text-destructive bg-destructive/10 px-4 py-2 rounded-xl">{connectError}</p>
              )}
              {syncError && (
                <div className="mb-4 flex items-start gap-2 text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-xl">
                  <AlertCircle className="size-4 flex-shrink-0 mt-0.5" />
                  <span>{syncError}</span>
                </div>
              )}
              {/* Résultat sync Gmail avec détail par contact */}
              {syncResult && (
                <div className="mb-4 rounded-xl border border-success/20 bg-success/10 overflow-hidden">
                  <div className="flex items-center gap-3 text-sm text-success px-4 py-3">
                    <RefreshCw className="size-4 flex-shrink-0" />
                    <span>
                      Synchronisation terminée — <strong>{syncResult.messages}</strong> emails · <strong>{syncResult.threads}</strong> threads · <strong>{syncResult.contacts}</strong> contacts traités
                    </span>
                  </div>
                  {(syncResult.contactStats ?? []).length > 0 && (
                    <div className="border-t border-success/20 px-4 py-3 space-y-1.5">
                      <p className="text-xs font-semibold text-success/80 mb-2">Détail par contact</p>
                      {syncResult.contactStats!.map((cs, i) => (
                        <div key={i} className="flex items-center justify-between text-xs text-success/70">
                          <span className="truncate mr-2">{cs.email}</span>
                          <span className="flex-shrink-0 font-mono">{cs.messages} emails · {cs.threads} threads</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {syncResult.messages === 0 && (
                    <div className="border-t border-success/20 px-4 py-3">
                      <p className="text-xs text-success/70">
                        Aucun nouvel email détecté — tous les échanges sont déjà à jour.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-3">
                {AVAILABLE_CONNECTIONS.map((conn) => {
                  const linked = isIdentityLinked(conn.id);
                  const syncOn = isSyncActive(conn.id);
                  const loading = pending === conn.id;
                  return (
                    <div key={conn.id} className="flex items-start justify-between p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors gap-4">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className={`size-12 flex-shrink-0 bg-card rounded-xl flex items-center justify-center border transition-colors ${
                          syncOn ? 'border-success/40' : linked ? 'border-amber-400/40' : 'border-border/50'
                        }`}>
                          {conn.logo}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium">{conn.name}</p>
                          <p className="text-sm text-muted-foreground">{conn.subtitle}</p>
                          {/* Statut sync désactivée */}
                          {linked && !syncOn && (
                            <p className="text-xs text-amber-600 mt-1 font-medium">
                              Compte lié · Sync désactivée — vos données sont conservées
                            </p>
                          )}
                          {/* Note LinkedIn connecté */}
                          {conn.id === 'linkedin' && syncOn && (
                            <p className="text-xs text-primary mt-1">
                              Profils enrichis via données publiques · messages non accessibles via API
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {linked && syncOn && (
                          <>
                            <div className="hidden sm:flex items-center gap-1.5 text-success text-sm">
                              <CheckCircle2 className="size-4" /><span>Connecté</span>
                            </div>
                            {/* Bouton sync Gmail */}
                            {conn.id === 'google' && (
                              <button
                                onClick={handleGmailSync}
                                disabled={syncing}
                                title="Synchroniser jusqu'à 1 000 emails par contact"
                                className="flex items-center gap-1.5 px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-sm transition-colors font-medium disabled:opacity-50"
                              >
                                {syncing
                                  ? <span className="size-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                  : <Download className="size-3.5" />}
                                {syncing ? 'Sync…' : 'Sync emails'}
                              </button>
                            )}
                            <button
                              onClick={() => handleDisconnect(conn.id)}
                              disabled={loading}
                              className="px-4 py-2 bg-muted hover:bg-muted/70 rounded-xl text-sm transition-colors disabled:opacity-50"
                            >
                              {loading
                                ? <span className="flex items-center gap-2"><span className="size-3 border-2 border-current border-t-transparent rounded-full animate-spin" />…</span>
                                : 'Déconnecter'}
                            </button>
                          </>
                        )}
                        {linked && !syncOn && (
                          <button
                            onClick={() => handleConnect(conn.id)}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm transition-colors font-medium disabled:opacity-50"
                          >
                            {loading && <span className="size-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                            {loading ? 'Connexion…' : 'Reconnecter la sync'}
                          </button>
                        )}
                        {!linked && (
                          <button
                            onClick={() => handleConnect(conn.id)}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm transition-colors font-medium disabled:opacity-50"
                          >
                            {loading && <span className="size-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                            {loading ? 'Connexion…' : 'Se connecter'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bloc LinkedIn — enrichissement via données publiques */}
              {isConnected('linkedin') && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-3">
                    <LinkedInLogo />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm mb-1">LinkedIn connecté</p>
                      <p className="text-xs text-muted-foreground mb-3">
                        Knowy utilise vos données LinkedIn pour enrichir les profils de votre réseau à partir des informations publiques.
                        L'accès aux messages LinkedIn n'est pas disponible via l'API officielle.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs mb-3">
                        {[
                          { icon: '✓', text: 'Identification des profils' },
                          { icon: '✓', text: 'Postes & formations' },
                          { icon: '✓', text: 'Données publiques' },
                          { icon: '✗', text: 'Messages privés' },
                          { icon: '✗', text: 'Connexions réseau' },
                          { icon: '✗', text: 'InMail' },
                        ].map((item, i) => (
                          <div key={i} className={`flex items-center gap-1.5 ${item.icon === '✓' ? 'text-success' : 'text-muted-foreground'}`}>
                            <span className="font-bold">{item.icon}</span>
                            <span>{item.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* CRM — V2 */}
            <div className="bg-card rounded-2xl p-5 border border-border md:p-8 opacity-60">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-3">
                <Globe className="size-5 text-primary" />
                Connexions CRM
                <span className="px-2.5 py-0.5 text-xs font-semibold bg-muted border border-border rounded-full text-muted-foreground">Disponible en V2</span>
              </h3>
              <p className="text-sm text-muted-foreground mb-6">L'intégration CRM arrivera dans la prochaine version de Knowy.</p>
              <div className="space-y-3">
                {CRM_LIST.map((crm) => (
                  <div key={crm.name} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="size-12 bg-card rounded-xl flex items-center justify-center border border-border/50 overflow-hidden">
                        {crm.logo}
                      </div>
                      <div>
                        <p className="font-medium">{crm.name}</p>
                        <p className="text-sm text-muted-foreground">{crm.description}</p>
                      </div>
                    </div>
                    <button disabled className="px-4 py-2 bg-muted text-muted-foreground rounded-xl text-sm cursor-not-allowed">Bientôt</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Sync settings */}
            <div className="bg-card rounded-2xl p-5 border border-border md:p-8">
              <h3 className="text-lg font-semibold mb-2">Paramètres de synchronisation</h3>
              <p className="text-xs text-muted-foreground mb-6">Préférences persistées en base de données.</p>
              <div className="space-y-3">
                {[
                  { key: 'calendar'   as const, icon: Calendar, label: 'Synchronisation calendrier', sub: 'Auto-détection des réunions' },
                  { key: 'email'      as const, icon: Mail,     label: 'Analyse des emails',          sub: 'Contexte relationnel' },
                  { key: 'enrichment' as const, icon: Network,  label: 'Enrichissement automatique',  sub: 'Données publiques LinkedIn, etc.' },
                ].map(({ key, icon: Icon, label, sub }) => (
                  <div key={key} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Icon className="size-5 text-primary" />
                      <div>
                        <p className="font-medium">{label}</p>
                        <p className="text-sm text-muted-foreground">{sub}</p>
                      </div>
                    </div>
                    <IOSToggle checked={syncSettings[key]} onChange={() => toggleSync(key)} />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Security Tab ────────────────────────────────────────────── */}
        {activeTab === 'security' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">

            <div className="bg-card rounded-2xl p-5 border border-border md:p-8">
              <h2 className="text-xl font-semibold mb-1 flex items-center gap-2">
                <Lock className="size-5 text-primary" />Mot de passe
              </h2>

              {isOAuthUser ? (
                <div className="mt-5 p-4 bg-muted/40 rounded-xl flex items-start gap-3">
                  <div className="mt-0.5 flex-shrink-0">
                    {authProvider === 'google' ? <GoogleLogo /> : <LinkedInLogo />}
                  </div>
                  <div>
                    <p className="font-medium text-sm">Connexion via {authProvider === 'google' ? 'Google' : 'LinkedIn'}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Votre mot de passe est géré par {authProvider === 'google' ? 'Google' : 'LinkedIn'}.
                      Pour le modifier, rendez-vous directement sur leur site.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-5 space-y-4 max-w-sm">
                  <p className="text-sm text-muted-foreground">
                    Choisissez un nouveau mot de passe pour votre compte <strong>{user?.email}</strong>.
                  </p>

                  <div>
                    <label className="block text-sm text-muted-foreground mb-2">Nouveau mot de passe</label>
                    <div className="relative">
                      <input
                        type={showPwNew ? 'text' : 'password'}
                        value={pwNew}
                        onChange={(e) => setPwNew(e.target.value)}
                        placeholder="Minimum 8 caractères"
                        className="w-full px-4 py-3 pr-11 bg-input border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <button type="button" onClick={() => setShowPwNew(!showPwNew)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                        {showPwNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-muted-foreground mb-2">Confirmer le mot de passe</label>
                    <div className="relative">
                      <input
                        type={showPwConfirm ? 'text' : 'password'}
                        value={pwConfirm}
                        onChange={(e) => setPwConfirm(e.target.value)}
                        placeholder="Répétez le mot de passe"
                        className="w-full px-4 py-3 pr-11 bg-input border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <button type="button" onClick={() => setShowPwConfirm(!showPwConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                        {showPwConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Strength indicator */}
                  {pwNew.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((n) => (
                          <div key={n} className={`h-1 flex-1 rounded-full transition-colors ${
                            pwNew.length >= n * 3
                              ? n <= 1 ? 'bg-destructive' : n <= 2 ? 'bg-warning' : n <= 3 ? 'bg-yellow-400' : 'bg-success'
                              : 'bg-muted'
                          }`} />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {pwNew.length < 4 ? 'Trop court' : pwNew.length < 7 ? 'Faible' : pwNew.length < 10 ? 'Moyen' : 'Fort'}
                      </p>
                    </div>
                  )}

                  {pwError && <p className="text-sm text-destructive">{pwError}</p>}

                  {pwDone && (
                    <div className="flex items-center gap-3 p-3 bg-success/10 border border-success/20 rounded-xl text-success text-sm font-medium">
                      <CheckCheck className="size-4" />Mot de passe mis à jour !
                    </div>
                  )}

                  <button
                    onClick={handleChangePassword}
                    disabled={!pwNew || !pwConfirm || pwSaving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl transition-colors text-sm font-medium disabled:opacity-60"
                  >
                    <Lock className="size-4" />
                    {pwSaving ? 'Mise à jour…' : 'Changer le mot de passe'}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}
