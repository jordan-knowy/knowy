import { FormEvent, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { ArrowLeft, BriefcaseBusiness, CheckCircle2, Linkedin, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import logoKnowy from '../../imports/Pre_sentation1.jpg';
import productPreview from '../../imports/Capture_d_e_cran_2026-05-21_a__13.09.57.png';
import { Button } from './design-system/Button';
import { Input } from './design-system/Input';
import { supabase } from '../../lib/supabase';

type OAuthProvider = 'google' | 'azure' | 'linkedin_oidc';

const redirectTo = `${window.location.origin}/onboarding/step1`;

const oauthOptions: Array<{
  id: OAuthProvider;
  label: string;
  helper: string;
  icon: 'google' | 'microsoft' | 'linkedin';
}> = [
  {
    id: 'google',
    label: 'Continuer avec Gmail',
    helper: 'Connecte votre compte Google et prépare la sync Gmail/Calendar.',
    icon: 'google',
  },
  {
    id: 'azure',
    label: 'Continuer avec Microsoft Outlook',
    helper: 'Connecte votre compte Microsoft pour Outlook et Calendar.',
    icon: 'microsoft',
  },
  {
    id: 'linkedin_oidc',
    label: 'Continuer avec LinkedIn',
    helper: 'Importe votre identité professionnelle pour démarrer le profil.',
    icon: 'linkedin',
  },
];

function GoogleIcon() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <span className="grid size-5 grid-cols-2 gap-0.5" aria-hidden="true">
      <span className="bg-[#F25022]" />
      <span className="bg-[#7FBA00]" />
      <span className="bg-[#00A4EF]" />
      <span className="bg-[#FFB900]" />
    </span>
  );
}

function ProviderIcon({ icon }: { icon: 'google' | 'microsoft' | 'linkedin' }) {
  if (icon === 'google') return <GoogleIcon />;
  if (icon === 'microsoft') return <MicrosoftIcon />;
  return <Linkedin className="size-5 text-[#0A66C2]" aria-hidden="true" />;
}

export default function SignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [pendingProvider, setPendingProvider] = useState<OAuthProvider | 'email' | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        navigate('/onboarding/step1', { replace: true });
      }
    });
  }, [navigate]);

  async function handleOAuth(provider: OAuthProvider) {
    setPendingProvider(provider);
    setError(null);
    setMessage(null);

    if (!supabase) {
      setPendingProvider(null);
      setError('La configuration Supabase est absente. Vérifiez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY.');
      return;
    }

    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: provider as any,
      options: {
        redirectTo,
        scopes:
          provider === 'google'
            ? 'email profile https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/gmail.readonly'
            : provider === 'azure'
              ? 'email openid profile offline_access Calendars.Read Mail.Read'
              : 'openid profile email',
      },
    });

    if (authError) {
      setPendingProvider(null);
      setError(`Connexion impossible: ${authError.message}. Vérifiez que ce provider est activé dans Supabase Auth.`);
    }
  }

  async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPendingProvider('email');
    setError(null);
    setMessage(null);

    if (!supabase) {
      setPendingProvider(null);
      setError('La configuration Supabase est absente. Vérifiez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY.');
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setPendingProvider(null);
      setError('Saisissez un email professionnel pour continuer.');
      return;
    }

    const { error: authError } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    setPendingProvider(null);

    if (authError) {
      setError(`Email non envoyé: ${authError.message}`);
      return;
    }

    setMessage('Lien envoyé. Ouvrez votre email pour continuer l’onboarding Knowy.');
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden border-r border-border lg:block">
          <img
            src={productPreview}
            alt="Aperçu de l'analyse relationnelle Knowy"
            className="absolute inset-0 h-full w-full object-cover opacity-18"
          />
          <div className="absolute inset-0 bg-background/86" />
          <div className="relative flex h-full flex-col justify-between p-10">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex w-fit items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <img src={logoKnowy} alt="Knowy" className="h-10" />
            </button>

            <div className="max-w-2xl">
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-sm font-semibold text-primary">
                <Sparkles className="size-4" />
                Onboarding relationnel
              </p>
              <h1 className="text-5xl font-semibold leading-tight">
                Connectez vos sources, Knowy construit la première fiche.
              </h1>
              <p className="mt-5 text-lg leading-8 text-muted-foreground">
                Commencez par email, Gmail, Microsoft Outlook ou LinkedIn. Les connecteurs avancés seront activés
                ensuite avec consentement explicite.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                [BriefcaseBusiness, 'Briefs avant réunion'],
                [ShieldCheck, 'RLS et consentement'],
                [Mail, 'Emails comme signaux'],
              ].map(([Icon, label]) => (
                <div key={String(label)} className="rounded-lg border border-border bg-card p-4">
                  <Icon className="mb-3 size-5 text-primary" />
                  <p className="text-sm font-semibold">{String(label)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-6 py-10">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="w-full max-w-lg"
          >
            <button
              type="button"
              onClick={() => navigate('/')}
              className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              Retour
            </button>

            <div className="mb-8 lg:hidden">
              <img src={logoKnowy} alt="Knowy" className="h-10" />
            </div>

            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <h2 className="text-3xl font-semibold">Essayez Knowy</h2>
              <p className="mt-3 leading-7 text-muted-foreground">
                Créez votre espace, puis connectez les sources qui permettront d’analyser les personnes et les
                relations autour de vos réunions.
              </p>

              <div className="mt-6 space-y-3">
                {oauthOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleOAuth(option.id)}
                    disabled={Boolean(pendingProvider)}
                    className="flex w-full items-center gap-4 rounded-lg border border-border bg-background p-4 text-left transition hover:border-primary/40 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="flex size-10 items-center justify-center rounded-lg border border-border bg-card">
                      <ProviderIcon icon={option.icon} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{option.label}</span>
                      <span className="mt-1 block text-sm text-muted-foreground">{option.helper}</span>
                    </span>
                    {pendingProvider === option.id && <span className="text-sm font-semibold text-primary">Ouverture...</span>}
                  </button>
                ))}
              </div>

              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-sm text-muted-foreground">ou avec email</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <form className="space-y-4" onSubmit={handleEmailSubmit}>
                <Input
                  label="Email professionnel"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="vous@entreprise.com"
                  icon={<Mail className="size-4" />}
                  autoComplete="email"
                />
                <Button type="submit" className="w-full" loading={pendingProvider === 'email'}>
                  Recevoir mon lien de connexion
                </Button>
              </form>

              {message && (
                <div className="mt-5 flex gap-3 rounded-lg border border-success/20 bg-success/10 p-4 text-sm text-success">
                  <CheckCircle2 className="mt-0.5 size-4 flex-shrink-0" />
                  <span>{message}</span>
                </div>
              )}

              {error && (
                <div className="mt-5 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
                  {error}
                </div>
              )}
            </div>

            <p className="mt-6 text-center text-sm leading-6 text-muted-foreground">
              En continuant, vous autorisez uniquement la création de votre session. L’analyse des emails,
              calendriers ou transcripts se configure ensuite source par source.
            </p>
          </motion.div>
        </section>
      </div>
    </main>
  );
}
