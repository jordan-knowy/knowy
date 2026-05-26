import { motion } from 'motion/react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Users, Network, Calendar, Shield } from 'lucide-react';
import logoKnowy from '../../imports/Pre_sentation1.jpg';
import { supabase } from '../../lib/supabase';

const redirectTo = `${window.location.origin}/onboarding/step1`;

type OAuthProvider = 'google' | 'azure';

export default function SignIn() {
  const navigate = useNavigate();
  const [pending, setPending] = useState<OAuthProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleOAuth(provider: OAuthProvider) {
    setError(null);
    setPending(provider);

    if (!supabase) {
      setPending(null);
      setError('Configuration Supabase absente. Vérifiez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY.');
      return;
    }

    const scopes =
      provider === 'google'
        ? 'email profile https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/gmail.readonly'
        : 'email openid profile offline_access Calendars.Read Mail.Read';

    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: provider as any,
      options: { redirectTo, scopes },
    });

    if (authError) {
      setPending(null);
      setError(`Connexion impossible : ${authError.message}`);
    }
    // On success, Supabase redirects — no need to navigate()
  }

  return (
    <div className="size-full flex">
      {/* Left side — visual showcase */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 relative overflow-hidden items-center justify-center p-12">
        <div className="relative z-10 max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="inline-flex items-center gap-2 mb-8">
              <img src={logoKnowy} alt="Knowy" className="h-12" />
            </div>

            <h1 className="text-5xl font-semibold mb-6 leading-tight">
              Comprenez chaque réunion avant d'y entrer.
            </h1>

            <p className="text-xl text-muted-foreground mb-12">
              Knowy transforme vos réunions en intelligence relationnelle structurée.
            </p>

            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Users,    label: 'Intelligence Humaine', delay: 0.2 },
                { icon: Network,  label: 'Cartographie Org',     delay: 0.3 },
                { icon: Calendar, label: 'Préparation Auto',     delay: 0.4 },
                { icon: Shield,   label: 'Enterprise Grade',     delay: 0.5 },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: item.delay, ease: [0.22, 1, 0.36, 1] }}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-border"
                >
                  <item.icon className="size-8 text-primary mb-3" />
                  <p className="text-sm font-medium">{item.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Background blobs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              className="absolute top-20 right-20 size-64 bg-primary/10 rounded-full blur-3xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute bottom-20 left-20 size-96 bg-secondary/10 rounded-full blur-3xl"
              animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 0.3, 0.5] }}
              transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        </div>
      </div>

      {/* Right side — sign-in form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden mb-8">
            <img src={logoKnowy} alt="Knowy" className="h-12" />
          </div>

          <div className="bg-card rounded-3xl p-8 border border-border shadow-lg shadow-primary/5">
            <h2 className="text-3xl font-semibold mb-2">Bienvenue</h2>
            <p className="text-muted-foreground mb-8">
              Connectez-vous pour accéder à votre intelligence relationnelle.
            </p>

            <div className="space-y-3">
              {/* Google */}
              <button
                onClick={() => handleOAuth('google')}
                disabled={Boolean(pending)}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-muted/50 text-foreground rounded-2xl px-6 py-4 border border-border transition-all duration-300 hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <svg className="size-5 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span>{pending === 'google' ? 'Ouverture…' : 'Continuer avec Google'}</span>
              </button>

              {/* Microsoft */}
              <button
                onClick={() => handleOAuth('azure')}
                disabled={Boolean(pending)}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-muted/50 text-foreground rounded-2xl px-6 py-4 border border-border transition-all duration-300 hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span className="grid size-5 grid-cols-2 gap-0.5 flex-shrink-0" aria-hidden="true">
                  <span className="bg-[#F25022]" />
                  <span className="bg-[#7FBA00]" />
                  <span className="bg-[#00A4EF]" />
                  <span className="bg-[#FFB900]" />
                </span>
                <span>{pending === 'azure' ? 'Ouverture…' : 'Continuer avec Outlook'}</span>
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-card px-4 text-muted-foreground">ou</span>
                </div>
              </div>

              <button
                onClick={() => navigate('/onboarding/step1')}
                disabled={Boolean(pending)}
                className="w-full bg-primary hover:bg-accent text-primary-foreground rounded-2xl px-6 py-4 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Créer un compte manuellement
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Trust badges */}
            <div className="mt-8 pt-6 border-t border-border grid grid-cols-2 gap-4 text-xs text-muted-foreground">
              {['GDPR Compliant', 'SOC2 Ready', 'Enterprise Ready', 'Privacy First'].map((label) => (
                <div key={label} className="flex items-center gap-2">
                  <Shield className="size-4 text-success" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            En continuant, vous acceptez nos{' '}
            <a href="#" className="text-primary hover:underline">Conditions d'utilisation</a>
            {' '}et notre{' '}
            <a href="#" className="text-primary hover:underline">Politique de confidentialité</a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
