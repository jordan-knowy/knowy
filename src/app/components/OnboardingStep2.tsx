import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { useEffect, useState } from 'react';
import { Calendar, CheckCircle2, Clock, Lock, Mail, Sparkles } from 'lucide-react';
import KnowyButton from './knowy/KnowyButton';
import { supabase } from '../../lib/supabase';

type ProviderId = 'google' | 'azure';

function isConnected(user: any, provider: ProviderId) {
  return Boolean(user?.identities?.some((identity: any) => identity.provider === provider));
}

export default function OnboardingStep2() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [pendingProvider, setPendingProvider] = useState<ProviderId | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase?.auth.getUser().then(({ data }) => setUser(data.user ?? null));
  }, []);

  async function refreshUser() {
    const { data } = await supabase!.auth.getUser();
    setUser(data.user ?? null);
  }

  async function handleConnect(provider: ProviderId) {
    setPendingProvider(provider);
    setError(null);

    if (!supabase) {
      setPendingProvider(null);
      setError('Supabase n’est pas configuré.');
      return;
    }

    const { error: authError } = await supabase.auth.linkIdentity({
      provider,
      options: {
        redirectTo: `${window.location.origin}/onboarding/step2`,
        scopes:
          provider === 'google'
            ? 'email profile https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/gmail.readonly'
            : 'email openid profile offline_access Calendars.Read Mail.Read',
      },
    });

    if (authError) {
      setPendingProvider(null);
      setError(`Connexion impossible: ${authError.message}. Activez le provider dans Supabase Auth.`);
    }
  }

  const googleConnected = isConnected(user, 'google');
  const outlookConnected = isConnected(user, 'azure');
  const hasCalendar = googleConnected || outlookConnected;

  return (
    <div className="size-full overflow-auto bg-background">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="mb-12">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Étape 2 sur 4</span>
            <span className="text-sm font-medium text-primary">50%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-border">
            <motion.div initial={{ width: '25%' }} animate={{ width: '50%' }} transition={{ duration: 0.6 }} className="h-2 rounded-full bg-primary" />
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 text-center">
          <div className="mb-6 inline-flex size-16 items-center justify-center rounded-lg bg-primary/10">
            <Calendar className="size-8 text-primary" />
          </div>
          <h1 className="mb-4 text-4xl font-semibold">Connectez votre agenda</h1>
          <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
            Gmail ou Outlook donnent à Knowy les réunions, participants et échanges nécessaires pour préparer vos briefs.
          </p>
        </motion.div>

        <div className="mb-10 grid gap-4 md:grid-cols-3">
          {[
            [Calendar, 'Détection auto', 'Les réunions importantes sont reconnues automatiquement.'],
            [Sparkles, 'Briefs IA', 'Le moteur prépare le contexte avant le rendez-vous.'],
            [Clock, 'Mémoire active', 'Chaque échange améliore les fiches comportementales.'],
          ].map(([Icon, label, desc]) => (
            <div key={String(label)} className="rounded-lg border border-border bg-card p-5 text-center">
              <Icon className="mx-auto mb-3 size-7 text-primary" />
              <h2 className="font-semibold">{String(label)}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{String(desc)}</p>
            </div>
          ))}
        </div>

        <div className="mb-8 space-y-4">
          {[
            {
              id: 'google' as ProviderId,
              name: 'Gmail + Google Calendar',
              description: 'Emails, participants et réunions Google.',
              connected: googleConnected,
            },
            {
              id: 'azure' as ProviderId,
              name: 'Outlook + Microsoft Calendar',
              description: 'Emails, participants et réunions Microsoft.',
              connected: outlookConnected,
            },
          ].map((provider) => (
            <div key={provider.id} className={`rounded-lg border p-6 ${provider.connected ? 'border-success/30 bg-success/5' : 'border-border bg-card'}`}>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
                    <Mail className="size-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">{provider.name}</h2>
                    <p className="text-sm text-muted-foreground">{provider.description}</p>
                  </div>
                </div>
                {provider.connected ? (
                  <div className="flex items-center gap-2 text-sm font-semibold text-success">
                    <CheckCircle2 className="size-4" />
                    Connecté
                  </div>
                ) : (
                  <KnowyButton variant="primary" size="md" loading={pendingProvider === provider.id} onClick={() => handleConnect(provider.id)}>
                    Connecter
                  </KnowyButton>
                )}
              </div>
            </div>
          ))}
        </div>

        {error && <p className="mb-5 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

        <div className="mb-8 rounded-lg border border-primary/10 bg-primary/5 p-5">
          <div className="flex gap-3">
            <Lock className="mt-0.5 size-5 text-primary" />
            <p className="text-sm leading-6 text-muted-foreground">
              Ces connexions passent par Supabase Auth. Les permissions réelles dépendent des scopes validés dans Google Cloud ou Microsoft Azure.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button onClick={() => navigate('/onboarding/step1')} className="text-sm text-muted-foreground hover:text-foreground">
            Retour
          </button>
          <div className="flex items-center gap-4">
            <button type="button" onClick={refreshUser} className="text-sm font-semibold text-primary hover:underline">
              Rafraîchir
            </button>
            <button onClick={() => navigate('/onboarding/step3')} className="text-sm text-muted-foreground hover:text-foreground">
              Passer
            </button>
            <KnowyButton variant="primary" size="lg" onClick={() => navigate('/onboarding/step3')} disabled={!hasCalendar}>
              Continuer
            </KnowyButton>
          </div>
        </div>
      </div>
    </div>
  );
}
