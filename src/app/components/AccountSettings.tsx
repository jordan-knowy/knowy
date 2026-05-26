import { useState } from 'react';
import { Calendar, CheckCircle2, Globe, LogOut, Mail, Network, Plus, Shield, User } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Badge, Button, Card, Input } from './design-system';
import { useCurrentProfile } from '../../hooks/useCurrentProfile';
import { supabase } from '../../lib/supabase';

const crmConnections = [
  { name: 'HubSpot', logo: '🟠', description: 'Contacts, deals et activités.' },
  { name: 'Salesforce', logo: '☁️', description: 'Comptes, opportunités et réunions.' },
  { name: 'Pipedrive', logo: '🔵', description: 'Pipeline et données contacts.' }
];

export default function AccountSettings() {
  const navigate = useNavigate();
  const { profile } = useCurrentProfile();
  const [activeTab, setActiveTab] = useState<'profile' | 'connections'>('profile');

  const handleSignOut = async () => {
    await supabase?.auth.signOut();
    navigate('/signin', { replace: true });
  };

  return (
    <div className="size-full overflow-auto bg-background">
      <main className="mx-auto max-w-7xl px-4 py-6 md:px-8">
        <header className="mb-6">
          <h1 className="mb-2 text-4xl font-black">Paramètres</h1>
          <p className="text-muted-foreground">Profil, connecteurs et transparence des données utilisées par Knowy.</p>
        </header>

        <div className="mb-6 flex flex-wrap gap-2">
          <Button variant={activeTab === 'profile' ? 'primary' : 'secondary'} icon={<User className="size-4" />} onClick={() => setActiveTab('profile')}>
            Mon profil
          </Button>
          <Button variant={activeTab === 'connections' ? 'primary' : 'secondary'} icon={<Network className="size-4" />} onClick={() => setActiveTab('connections')}>
            Connexions
          </Button>
        </div>

        {activeTab === 'profile' ? (
          <div className="space-y-6">
            <Card className="p-6">
              <div className="mb-6 flex flex-col gap-5 md:flex-row md:items-start">
                {profile?.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="" className="size-20 rounded-lg object-cover" />
                ) : (
                  <div className="flex size-20 items-center justify-center rounded-lg bg-primary text-3xl font-black text-white">
                    {profile?.initials ?? 'K'}
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-black">{profile?.fullName ?? 'Compte Knowy'}</h2>
                  <p className="text-muted-foreground">{profile?.roleTitle ?? 'Compte test'} chez {profile?.companyName ?? 'Workspace Knowy'}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="sage"><CheckCircle2 className="size-3" />Connecté</Badge>
                    <Badge variant="blue">{profile?.email ?? 'Email non disponible'}</Badge>
                  </div>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="Entreprise" defaultValue={profile?.companyName ?? ''} />
                <Input label="Email" defaultValue={profile?.email ?? ''} />
                <Input label="Rôle" defaultValue={profile?.roleTitle ?? ''} />
                <Input label="Usage" defaultValue="Compte test Knowy" />
              </div>
              <div className="mt-6">
                <Button variant="secondary" icon={<LogOut className="size-4" />} onClick={handleSignOut}>
                  Se déconnecter de ce compte
                </Button>
              </div>
            </Card>

            <Card className="border-primary/20 bg-primary/5 p-5">
              <div className="flex gap-3">
                <Shield className="size-5 text-primary" aria-hidden="true" />
                <div>
                  <h2 className="font-black">Transparence IA et données</h2>
                  <p className="text-sm text-muted-foreground">
                    Les fiches affichent le niveau de source et les hypothèses à valider. Les données absentes restent non disponibles.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="mb-4 text-xl font-black">Comptes connectés</h2>
              <div className="space-y-3">
                <div className="flex flex-col gap-3 rounded-lg bg-muted/25 p-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-lg bg-card text-primary"><Mail className="size-5" /></div>
                    <div>
                      <p className="font-bold">Session Supabase</p>
                      <p className="text-sm text-muted-foreground">{profile?.email ?? 'Email non disponible'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="sage"><CheckCircle2 className="size-3" />Connecté</Badge>
                    <Button variant="ghost" size="sm" onClick={handleSignOut}>Déconnecter</Button>
                  </div>
                </div>
                <Button variant="secondary" icon={<Plus className="size-4" />}>Ajouter une connexion</Button>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="mb-2 flex items-center gap-2 text-xl font-black"><Globe className="size-5 text-primary" /> Connexions CRM</h2>
              <p className="mb-4 text-sm text-muted-foreground">Mock P0 uniquement : aucun branchement API n’est effectué.</p>
              <div className="grid gap-3 md:grid-cols-3">
                {crmConnections.map((crm) => (
                  <div key={crm.name} className="rounded-lg border border-border bg-muted/20 p-4">
                    <div className="mb-3 text-2xl">{crm.logo}</div>
                    <h3 className="font-black">{crm.name}</h3>
                    <p className="mb-4 text-sm text-muted-foreground">{crm.description}</p>
                    <Button variant="secondary" size="sm">Connecter</Button>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="mb-4 text-xl font-black">Paramètres de synchronisation</h2>
              <div className="space-y-3">
                {[
                  { label: 'Synchronisation calendrier', detail: 'Auto-détection des réunions importantes', icon: Calendar },
                  { label: 'Analyse des emails', detail: 'Signaux relationnels et communication', icon: Mail },
                  { label: 'Enrichissement public', detail: 'Données publiques et signaux carrière', icon: Network }
                ].map((setting) => (
                  <label key={setting.label} className="flex cursor-pointer items-center justify-between gap-4 rounded-lg bg-muted/25 p-4">
                    <span className="flex items-center gap-3">
                      <setting.icon className="size-5 text-primary" aria-hidden="true" />
                      <span>
                        <span className="block font-bold">{setting.label}</span>
                        <span className="block text-sm text-muted-foreground">{setting.detail}</span>
                      </span>
                    </span>
                    <input type="checkbox" defaultChecked className="size-5 accent-primary" aria-label={setting.label} />
                  </label>
                ))}
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
