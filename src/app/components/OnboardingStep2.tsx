import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { AlertCircle, Calendar, CheckCircle2, Lock, Mail, RefreshCw, Sparkles } from 'lucide-react';
import KnowrButton from './knowr/KnowrButton';
import { supabase } from '../../lib/supabase';
import {
  getConnectedIdentityProviders,
  linkIdentityProvider,
  markConnectorConnected,
  requireOnboardingContext,
  updateOnboardingContext,
} from '../../lib/onboarding';

type ProviderCard = {
  id: 'google' | 'microsoft';
  authProvider: 'google' | 'microsoft';
  name: string;
  description: string;
  recommended?: boolean;
};

const providers: ProviderCard[] = [
  {
    id: 'google',
    authProvider: 'google',
    name: 'Gmail + Google Calendar',
    description: 'Métadonnées mails, réunions, participants et signaux relationnels Google.',
    recommended: true,
  },
  {
    id: 'microsoft',
    authProvider: 'microsoft',
    name: 'Outlook + Microsoft Calendar',
    description: 'Emails Outlook, calendrier Microsoft et contexte des échanges professionnels.',
  },
];

export default function OnboardingStep2() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [connectedProviders, setConnectedProviders] = useState<string[]>([]);
  const [pending, setPending] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    requireOnboardingContext()
      .then(({ user, organizationId }) => {
        if (!mounted) return;
        setUserId(user.id);
        setOrganizationId(organizationId);
        setConnectedProviders(getConnectedIdentityProviders(user));
      })
      .catch(() => navigate('/signin', { replace: true }))
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [navigate]);

  async function refreshConnections() {
    if (!supabase) return connectedProviders;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const providers = getConnectedIdentityProviders(user);
    setConnectedProviders(providers);

    if (userId && organizationId) {
      if (providers.includes('google')) {
        await markConnectorConnected(organizationId, userId, 'google');
      }
      if (providers.includes('microsoft') || providers.includes('azure')) {
        await markConnectorConnected(organizationId, userId, 'microsoft');
      }
    }

    return providers;
  }

  async function handleConnect(provider: ProviderCard) {
    setError(null);
    setPending(provider.id);
    try {
      await linkIdentityProvider(provider.authProvider, '/onboarding/step2');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connexion impossible.');
      setPending(null);
    }
  }

  async function handleContinue() {
    setError(null);
    try {
      const refreshedProviders = await refreshConnections();
      await updateOnboardingContext(organizationId, userId, {
        current_step: 3,
        step2: true,
        connected_providers: refreshedProviders,
      });
      navigate('/onboarding/step3');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sauvegarde des connecteurs impossible.');
    }
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Chargement des connecteurs...</div>;
  }

  return (
    <div className="size-full bg-background overflow-auto">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-12">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Étape 2 sur 5</span>
            <span className="text-sm font-medium text-primary">40%</span>
          </div>
          <div className="w-full bg-border rounded-full h-2">
            <motion.div initial={{ width: '20%' }} animate={{ width: '40%' }} className="bg-primary rounded-full h-2" />
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center justify-center size-16 bg-primary/10 rounded-2xl mb-6">
            <Calendar className="size-8 text-primary" />
          </div>
          <h1 className="mb-4">Connectez vos échanges</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Les emails, calendriers et participants sont la matière première du score comportemental Knowr.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {[
            { icon: Calendar, label: 'Réunions', desc: 'Détection des rooms importantes' },
            { icon: Mail, label: 'Échanges', desc: 'Patterns de ton, fréquence, objections' },
            { icon: Sparkles, label: 'Mémoire', desc: 'Amélioration continue du profil' },
          ].map((item) => (
            <div key={item.label} className="bg-card rounded-2xl p-6 border border-border text-center">
              <item.icon className="size-8 text-primary mx-auto mb-3" />
              <h3 className="mb-1">{item.label}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="space-y-4 mb-8">
          {providers.map((provider) => {
            const connected = connectedProviders.includes(provider.id) || (provider.id === 'microsoft' && connectedProviders.includes('azure'));
            return (
              <section key={provider.id} className={`relative bg-card rounded-2xl border-2 p-6 ${connected ? 'border-success bg-success/5' : 'border-border'}`}>
                {provider.recommended && (
                  <span className="absolute right-4 top-4 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">Recommandé</span>
                )}
                <div className="flex items-start gap-4">
                  <div className="size-14 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Mail className="size-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-1">{provider.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{provider.description}</p>
                    {connected ? (
                      <div className="flex items-center gap-3 bg-success/10 border border-success/20 rounded-xl p-3">
                        <CheckCircle2 className="size-5 text-success" />
                        <p className="text-sm font-medium text-success">Connecté</p>
                      </div>
                    ) : (
                      <KnowrButton variant="primary" size="md" onClick={() => handleConnect(provider)} loading={pending === provider.id}>
                        Connecter
                      </KnowrButton>
                    )}
                  </div>
                </div>
              </section>
            );
          })}
        </div>

        <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-3">
            <Lock className="size-5 text-primary mt-0.5" />
            <p className="text-sm text-muted-foreground leading-relaxed">
              Knowr utilise ces accès pour extraire des signaux de contexte. La lecture complète et l'ingestion des messages seront contrôlées par vos préférences de confidentialité à l'étape suivante.
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive mb-6">
            <AlertCircle className="size-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <button onClick={() => navigate('/onboarding/step1')} className="text-sm text-muted-foreground hover:text-foreground">
            Retour
          </button>
          <div className="flex items-center gap-3">
            <KnowrButton variant="secondary" size="md" onClick={refreshConnections}>
              <RefreshCw className="size-4" />
              Rafraîchir
            </KnowrButton>
            <KnowrButton variant="primary" size="lg" onClick={handleContinue}>
              Continuer
            </KnowrButton>
          </div>
        </div>
      </div>
    </div>
  );
}
