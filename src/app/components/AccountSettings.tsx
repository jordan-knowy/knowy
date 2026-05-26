import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { useEffect, useState } from 'react';
import { useCurrentProfile } from '../../hooks/useCurrentProfile';
import { supabase } from '../../lib/supabase';
import {
  User,
  Building2,
  Mail,
  Linkedin,
  Settings,
  Calendar,
  Network,
  CheckCircle2,
  ExternalLink,
  Plus,
  Shield,
  Globe,
  LogOut
} from 'lucide-react';

export default function AccountSettings() {
  const navigate = useNavigate();
  const { profile } = useCurrentProfile();
  const [activeTab, setActiveTab] = useState<'profile' | 'connections'>('profile');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    if (!supabase) return;
    setLoggingOut(true);
    await supabase.auth.signOut();
    navigate('/signin');
  }
  const [connectedAccounts, setConnectedAccounts] = useState<{ type: string; email: string; status: string; synced: string }[]>([]);
  const [crmConnections, setCrmConnections] = useState([
    { name: 'HubSpot',    logo: '🟠', status: 'not_connected', description: 'Sync contacts, deals et activités' },
    { name: 'Salesforce', logo: '☁️', status: 'not_connected', description: 'Sync accounts, opportunities et réunions' },
    { name: 'Pipedrive',  logo: '🔵', status: 'not_connected', description: 'Sync pipeline et données contacts' },
    { name: 'Attio',      logo: '🔷', status: 'not_connected', description: 'CRM nouvelle génération' },
  ]);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !mounted) return;

      // Load connectors
      const { data: connectors } = await supabase
        .from('connectors')
        .select('provider, status, updated_at, metadata')
        .eq('user_id', user.id);

      if (mounted && connectors) {
        const accounts = connectors
          .filter((c: any) => ['google', 'linkedin'].includes(c.provider) && c.status === 'connected')
          .map((c: any) => ({
            type: c.provider === 'google' ? 'gmail' : 'linkedin',
            email: (c.metadata as any)?.email ?? user.email ?? '',
            status: 'active',
            synced: c.updated_at
              ? new Date(c.updated_at).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
              : '—',
          }));
        setConnectedAccounts(accounts);

        // Update CRM statuses
        setCrmConnections(prev => prev.map(crm => {
          const match = connectors.find((c: any) =>
            c.provider === crm.name.toLowerCase() && c.status === 'connected'
          );
          return match ? { ...crm, status: 'connected' } : crm;
        }));
      }

      // Check admin role
      const { data: membership } = await supabase
        .from('memberships')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();
      if (mounted) setIsAdmin((membership as any)?.role === 'admin');
    }
    loadData();
    return () => { mounted = false; };
  }, []);

  const tabs = [
    { id: 'profile', label: 'Mon profil', icon: User },
    { id: 'connections', label: 'Connexions', icon: Settings }
  ];

  return (
    <div className="size-full bg-background overflow-auto">
      <div className="max-w-7xl mx-auto px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-semibold mb-2">Paramètres</h1>
              <p className="text-muted-foreground">
                Gérez votre profil et vos connexions.
              </p>
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

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            <div className="bg-card rounded-2xl p-8 border border-border">
              <h2 className="text-xl font-semibold mb-6">Profil utilisateur</h2>

              <div className="flex items-start gap-8 mb-8">
                {profile?.avatarUrl ? (
                  <img src={profile.avatarUrl} alt={profile.fullName} className="size-24 rounded-2xl object-cover" />
                ) : (
                  <div className="size-24 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center text-white text-4xl font-medium">
                    {profile?.initials ?? '?'}
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold mb-1">{profile?.fullName ?? '—'}</h3>
                  <p className="text-lg text-muted-foreground mb-4">
                    {profile?.roleTitle ?? ''}{profile?.companyName ? ` chez ${profile.companyName}` : ''}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {profile?.email && (
                      <a href={`mailto:${profile.email}`} className="flex items-center gap-2 hover:text-primary transition-colors">
                        <Mail className="size-4" />
                        <span>{profile.email}</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">Entreprise</label>
                  <p className="font-medium">{profile?.companyName ?? '—'}</p>
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">Rôle</label>
                  <p className="font-medium">{profile?.roleTitle ?? '—'}</p>
                </div>
              </div>
            </div>

            {/* Organization Section - Now in Profile Tab */}
            {isAdmin && (
              <>
                <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl p-6 border border-primary/10">
                  <div className="flex items-center gap-3">
                    <Shield className="size-6 text-primary" />
                    <div>
                      <h3 className="font-semibold">Paramètres administrateur</h3>
                      <p className="text-sm text-muted-foreground">
                        Ces paramètres ne sont accessibles qu'aux administrateurs de l'organisation.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-2xl p-8 border border-border">
                  <h2 className="text-xl font-semibold mb-6">Informations de l'organisation</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm text-muted-foreground mb-2">Nom de l'organisation</label>
                      <input
                        type="text"
                        defaultValue="Knowy"
                        className="w-full px-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-muted-foreground mb-2">Site web</label>
                      <input
                        type="text"
                        defaultValue="knowy.ai"
                        className="w-full px-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-muted-foreground mb-2">Secteur</label>
                      <input
                        type="text"
                        defaultValue="SaaS / Enterprise Software"
                        className="w-full px-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-muted-foreground mb-2">Taille</label>
                      <select className="w-full px-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20">
                        <option>11-50 employés</option>
                        <option>51-200 employés</option>
                        <option>201-500 employés</option>
                        <option>500+ employés</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-2xl p-8 border border-border">
                  <h2 className="text-xl font-semibold mb-6">Rôles et permissions</h2>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                      <div>
                        <p className="font-medium">Administrateurs</p>
                        <p className="text-sm text-muted-foreground">Accès complet à tous les paramètres</p>
                      </div>
                      <span className="text-2xl font-semibold">3</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                      <div>
                        <p className="font-medium">Utilisateurs standards</p>
                        <p className="text-sm text-muted-foreground">Accès aux fonctionnalités de base</p>
                      </div>
                      <span className="text-2xl font-semibold">12</span>
                    </div>
                  </div>

                  <button className="w-full mt-6 px-4 py-3 bg-primary hover:bg-accent text-white rounded-xl transition-colors">
                    Gérer les rôles
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}


        {/* Connections Tab */}
        {activeTab === 'connections' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            {/* Connected accounts */}
            <div className="bg-card rounded-2xl p-8 border border-border">
              <h3 className="text-lg font-semibold mb-6">Comptes connectés</h3>

              <div className="space-y-4">
                {connectedAccounts.map((account, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="size-12 bg-card rounded-xl flex items-center justify-center">
                        {account.type === 'gmail' ? (
                          <Mail className="size-6 text-primary" />
                        ) : (
                          <Linkedin className="size-6 text-[#0A66C2]" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium capitalize">{account.type}</p>
                        <p className="text-sm text-muted-foreground">{account.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex items-center gap-2 text-success mb-1">
                          <CheckCircle2 className="size-4" />
                          <span className="text-sm font-medium">Connecté</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Synchronisé {account.synced}</p>
                      </div>
                      <button className="px-4 py-2 bg-muted hover:bg-muted/70 rounded-xl text-sm transition-colors">
                        Déconnecter
                      </button>
                    </div>
                  </div>
                ))}

                <button className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border hover:border-primary/50 rounded-xl transition-colors text-muted-foreground hover:text-primary">
                  <Plus className="size-5" />
                  <span>Ajouter une connexion</span>
                </button>
              </div>
            </div>

            {/* CRM Connections */}
            <div className="bg-card rounded-2xl p-8 border border-border">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Globe className="size-5 text-primary" />
                Connexions CRM
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Synchronisez Knowy avec votre CRM pour enrichir automatiquement vos données relationnelles.
              </p>

              <div className="space-y-4">
                {crmConnections.map((crm, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="size-12 bg-card rounded-xl flex items-center justify-center text-2xl">
                        {crm.logo}
                      </div>
                      <div>
                        <p className="font-medium">{crm.name}</p>
                        <p className="text-sm text-muted-foreground">{crm.description}</p>
                      </div>
                    </div>

                    <button className="px-4 py-2 bg-primary hover:bg-accent text-white rounded-xl transition-colors text-sm">
                      Connecter
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Sync settings */}
            <div className="bg-card rounded-2xl p-8 border border-border">
              <h3 className="text-lg font-semibold mb-6">Paramètres de synchronisation</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Calendar className="size-5 text-primary" />
                    <div>
                      <p className="font-medium">Synchronisation calendrier</p>
                      <p className="text-sm text-muted-foreground">Auto-détection des réunions</p>
                    </div>
                  </div>
                  <div className="size-12 bg-primary rounded-xl flex items-center justify-center cursor-pointer">
                    <div className="size-6 bg-white rounded-full" style={{ marginLeft: '10px' }} />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Mail className="size-5 text-primary" />
                    <div>
                      <p className="font-medium">Analyse des emails</p>
                      <p className="text-sm text-muted-foreground">Contexte relationnel</p>
                    </div>
                  </div>
                  <div className="size-12 bg-primary rounded-xl flex items-center justify-center cursor-pointer">
                    <div className="size-6 bg-white rounded-full" style={{ marginLeft: '10px' }} />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Network className="size-5 text-primary" />
                    <div>
                      <p className="font-medium">Enrichissement automatique</p>
                      <p className="text-sm text-muted-foreground">Données publiques LinkedIn, etc.</p>
                    </div>
                  </div>
                  <div className="size-12 bg-primary rounded-xl flex items-center justify-center cursor-pointer">
                    <div className="size-6 bg-white rounded-full" style={{ marginLeft: '10px' }} />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}
