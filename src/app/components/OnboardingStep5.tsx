import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router';
import { useState, useEffect } from 'react';
import { Network, Users, Building2, Calendar, Mail, CheckCircle2, Sparkles, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { requireOnboardingContext, updateOnboardingContext } from '../../lib/onboarding';
import { getActiveOrganizationId } from '../../lib/api/org';

interface InitStep {
  id: string;
  label: string;
  icon: any;
  status: 'pending' | 'loading' | 'complete';
  stats?: string;
}

export default function OnboardingStep5() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [steps, setSteps] = useState<InitStep[]>([
    { id: 'calendar', label: 'Validation des accès calendrier', icon: Calendar, status: 'loading', stats: 'Connecteurs vérifiés' },
    { id: 'emails', label: 'Préparation de la couche signaux emails', icon: Mail, status: 'pending', stats: 'Ingestion prête' },
    { id: 'graph', label: 'Initialisation du graphe relationnel', icon: Network, status: 'pending', stats: 'Workspace prêt' },
    { id: 'org', label: 'Création du contexte entreprise', icon: Building2, status: 'pending', stats: 'Mémoire LLM enregistrée' },
    { id: 'people', label: 'Activation des profils comportementaux', icon: Users, status: 'pending', stats: 'Scoring prêt' },
    { id: 'brief', label: 'Préparation du premier brief', icon: FileText, status: 'pending', stats: 'Moteur de brief disponible' }
  ]);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    requireOnboardingContext()
      .then(({ user, organizationId }) => {
        setUserId(user.id);
        setOrganizationId(organizationId);
      })
      .catch(() => navigate('/signin', { replace: true }));
  }, [navigate]);

  async function completeOnboarding() {
    if (!userId || !organizationId || !supabase) return;

    // 1. Mark onboarding complete
    await updateOnboardingContext(organizationId, userId, {
      current_step: 5,
      step5: true,
      completed_at: new Date().toISOString(),
    });

    // 2. Launch real syncs with the Google token (best-effort)
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const providerToken = session?.provider_token;
      const accessToken = session?.access_token;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      if (providerToken && accessToken && supabaseUrl) {
        const headers = { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

        // Fire both syncs in parallel — don't wait (non-blocking)
        Promise.allSettled([
          fetch(`${supabaseUrl}/functions/v1/sync-google-calendar`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ organizationId, providerToken }),
          }),
          fetch(`${supabaseUrl}/functions/v1/ingest-communication`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ organizationId, providerToken, lookbackDays: 90 }),
          }),
        ]);
      }
    } catch {
      // Sync is best-effort — onboarding completes regardless
    }
  }

  useEffect(() => {
    if (!userId || !organizationId) return;

    const timer = setInterval(() => {
      setSteps((prevSteps) => {
        const newSteps = [...prevSteps];
        const currentStep = newSteps[currentStepIndex];

        if (currentStep && currentStep.status === 'loading') {
          // Mark current as complete
          currentStep.status = 'complete';

          // Start next step if exists
          if (currentStepIndex < newSteps.length - 1) {
            newSteps[currentStepIndex + 1].status = 'loading';
            setCurrentStepIndex(currentStepIndex + 1);
          } else {
            // All steps complete
            setTimeout(() => {
              completeOnboarding().finally(() => {
                setIsComplete(true);
                setTimeout(() => navigate('/dashboard'), 2000);
              });
            }, 1000);
          }
        }

        return newSteps;
      });
    }, 2000);

    return () => clearInterval(timer);
  }, [currentStepIndex, navigate, userId, organizationId]);

  return (
    <div className="size-full bg-background overflow-auto">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Progress bar */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Étape 5 sur 5</span>
            <span className="text-sm font-medium text-primary">100%</span>
          </div>
          <div className="w-full bg-border rounded-full h-2">
            <motion.div
              initial={{ width: '80%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="bg-primary rounded-full h-2"
            />
          </div>
        </div>

        {!isComplete ? (
          <div className="space-y-8">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <div className="relative inline-flex mb-6">
                <div className="size-20 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Sparkles className="size-10 text-primary" />
                </div>
                <motion.div
                  className="absolute inset-0"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0, 0.5]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="size-full bg-primary/20 rounded-2xl" />
                </motion.div>
              </div>
              <h1 className="mb-4">Knowy construit votre intelligence relationnelle</h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Nous analysons vos données pour générer votre premier brief. Quelques instants...
              </p>
            </motion.div>

            {/* Animated background */}
            <div className="relative bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5 rounded-3xl p-8 md:p-12 border border-primary/10 overflow-hidden">
                {/* Animated ambient layer */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                  className="absolute top-20 left-20 size-32 bg-primary/20 rounded-full blur-3xl"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.3, 0.6, 0.3],
                    x: [0, 30, 0],
                    y: [0, -20, 0]
                  }}
                  transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                  className="absolute bottom-20 right-20 size-40 bg-accent/20 rounded-full blur-3xl"
                  animate={{
                    scale: [1.2, 1, 1.2],
                    opacity: [0.4, 0.2, 0.4],
                    x: [0, -30, 0],
                    y: [0, 20, 0]
                  }}
                  transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>

              {/* Steps list */}
              <div className="relative space-y-4">
                {steps.map((step, index) => (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className={`bg-card/80 backdrop-blur-sm rounded-2xl p-6 border transition-all duration-500 ${
                      step.status === 'complete'
                        ? 'border-success/20 bg-success/5'
                        : step.status === 'loading'
                        ? 'border-primary/30 bg-primary/5'
                        : 'border-border'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Icon */}
                      <div className={`flex-shrink-0 size-12 rounded-xl flex items-center justify-center transition-all duration-500 ${
                        step.status === 'complete'
                          ? 'bg-success/20'
                          : step.status === 'loading'
                          ? 'bg-primary/20'
                          : 'bg-muted/50'
                      }`}>
                        <AnimatePresence mode="wait">
                          {step.status === 'complete' ? (
                            <motion.div
                              key="check"
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              exit={{ scale: 0, rotate: 180 }}
                              transition={{ duration: 0.4, type: "spring" }}
                            >
                              <CheckCircle2 className="size-6 text-success" />
                            </motion.div>
                          ) : step.status === 'loading' ? (
                            <motion.div
                              key="loading"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                            >
                              <step.icon className="size-6 text-primary" />
                            </motion.div>
                          ) : (
                            <motion.div
                              key="pending"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                            >
                              <step.icon className="size-6 text-muted-foreground" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className={`transition-colors ${
                            step.status === 'complete'
                              ? 'text-success'
                              : step.status === 'loading'
                              ? 'text-primary'
                              : 'text-muted-foreground'
                          }`}>
                            {step.label}
                          </h3>
                          {step.status === 'loading' && (
                            <div className="flex items-center gap-2 text-sm text-primary">
                              <div className="size-1.5 bg-primary rounded-full animate-pulse" />
                              <span>En cours...</span>
                            </div>
                          )}
                          {step.status === 'complete' && step.stats && (
                            <motion.span
                              initial={{ opacity: 0, x: 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="text-sm text-muted-foreground"
                            >
                              {step.stats}
                            </motion.span>
                          )}
                        </div>

                        {/* Loading bar */}
                        {step.status === 'loading' && (
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '100%' }}
                            transition={{ duration: 2, ease: "easeInOut" }}
                            className="h-1 bg-primary/20 rounded-full overflow-hidden"
                          >
                            <motion.div
                              className="h-full bg-primary rounded-full"
                              animate={{ x: ['-100%', '100%'] }}
                              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                            />
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Stats preview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              {[
                { label: 'Connecteurs', value: 'Prêts' },
                { label: 'Mémoire LLM', value: 'OK' },
                { label: 'Sync initiale', value: 'Queued' },
                { label: 'Briefs', value: 'Actifs' }
              ].map((stat, i) => (
                <div key={i} className="bg-card rounded-xl p-4 border border-border text-center">
                  <p className="text-2xl font-semibold mb-1">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, type: "spring" }}
            className="text-center py-20"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2, type: "spring" }}
              className="inline-flex size-24 bg-success/20 rounded-full items-center justify-center mb-6"
            >
              <CheckCircle2 className="size-12 text-success" />
            </motion.div>
            <h2 className="mb-4">Votre Relational OS est prêt !</h2>
            <p className="text-xl text-muted-foreground mb-4">
              Votre premier brief de réunion vous attend.
            </p>
            <p className="text-sm text-muted-foreground mb-8">
              Redirection vers votre dashboard...
            </p>
            <div className="flex justify-center">
              <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
