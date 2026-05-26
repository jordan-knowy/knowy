import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { useState } from 'react';
import { Calendar, Mail, CheckCircle2, Loader2, Lock, Sparkles, Clock } from 'lucide-react';
import KnowyButton from './knowy/KnowyButton';

export default function OnboardingStep2() {
  const navigate = useNavigate();

  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connected, setConnected] = useState(false);

  const handleConnect = (providerId: string) => {
    setSelectedProvider(providerId);
    setIsConnecting(true);

    // Simulate OAuth flow (2 seconds)
    setTimeout(() => {
      setConnected(true);
      setIsConnecting(false);
    }, 2000);
  };

  const handleContinue = () => {
    navigate('/onboarding/step3');
  };

  const providers = [
    {
      id: 'gmail',
      name: 'Google Calendar',
      description: 'Gmail + Google Calendar + Contacts',
      icon: (
        <svg className="size-6" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      ),
      bgColor: 'bg-[#4285F4]/10',
      recommended: true
    },
    {
      id: 'outlook',
      name: 'Outlook Calendar',
      description: 'Outlook + Microsoft Calendar + Contacts',
      icon: (
        <svg className="size-6" viewBox="0 0 24 24">
          <path fill="#0078D4" d="M24 7.5v9c0 1.65-1.35 3-3 3h-3.75v-15H21c1.65 0 3 1.35 3 3z"/>
          <path fill="#0078D4" d="M17.25 4.5v15H3c-1.65 0-3-1.35-3-3v-9c0-1.65 1.35-3 3-3h14.25z"/>
          <path fill="#FFF" d="M10.125 8.625c-1.864 0-3.375 1.511-3.375 3.375s1.511 3.375 3.375 3.375S13.5 13.864 13.5 12s-1.511-3.375-3.375-3.375zm0 5.625c-1.242 0-2.25-1.008-2.25-2.25s1.008-2.25 2.25-2.25S12.375 10.758 12.375 12s-1.008 2.25-2.25 2.25z"/>
        </svg>
      ),
      bgColor: 'bg-[#0078D4]/10',
      recommended: false
    }
  ];

  return (
    <div className="size-full bg-background overflow-auto">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Progress bar */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Étape 2 sur 5</span>
            <span className="text-sm font-medium text-primary">40%</span>
          </div>
          <div className="w-full bg-border rounded-full h-2">
            <motion.div
              initial={{ width: '20%' }}
              animate={{ width: '40%' }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="bg-primary rounded-full h-2"
            />
          </div>
        </div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center size-16 bg-primary/10 rounded-2xl mb-6">
            <Calendar className="size-8 text-primary" />
          </div>
          <h1 className="mb-4">Connectez votre agenda</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Knowy détecte automatiquement vos réunions et génère des briefs intelligents.
          </p>
        </motion.div>

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12"
        >
          {[
            {
              icon: Calendar,
              label: 'Détection auto',
              desc: 'Vos réunions sont reconnues automatiquement'
            },
            {
              icon: Sparkles,
              label: 'Briefs IA',
              desc: 'Brief généré 2h avant chaque meeting'
            },
            {
              icon: Clock,
              label: 'Temps réel',
              desc: 'Sync instantanée de votre calendrier'
            }
          ].map((item, i) => (
            <div key={i} className="bg-card rounded-2xl p-6 border border-border text-center">
              <item.icon className="size-8 text-primary mx-auto mb-3" />
              <h3 className="mb-1">{item.label}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </motion.div>

        {/* Provider Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-4 mb-12"
        >
          {providers.map((provider, i) => (
            <motion.div
              key={provider.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
              className={`relative bg-card rounded-2xl border-2 transition-all overflow-hidden ${
                connected && selectedProvider === provider.id
                  ? 'border-success bg-success/5'
                  : selectedProvider === provider.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-border/60'
              }`}
            >
              {provider.recommended && (
                <div className="absolute top-4 right-4">
                  <div className="bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full font-medium">
                    Recommandé
                  </div>
                </div>
              )}

              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`size-14 ${provider.bgColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    {provider.icon}
                  </div>

                  <div className="flex-1">
                    <h3 className="mb-1">{provider.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {provider.description}
                    </p>

                    {!connected || selectedProvider !== provider.id ? (
                      <KnowyButton
                        variant="primary"
                        size="md"
                        onClick={() => handleConnect(provider.id)}
                        loading={isConnecting && selectedProvider === provider.id}
                        disabled={isConnecting}
                      >
                        {isConnecting && selectedProvider === provider.id ? (
                          <>
                            <Loader2 className="size-4 animate-spin" />
                            Connexion en cours...
                          </>
                        ) : (
                          'Connecter'
                        )}
                      </KnowyButton>
                    ) : (
                      <div className="flex items-center gap-3 bg-success/10 border border-success/20 rounded-xl p-3">
                        <CheckCircle2 className="size-5 text-success flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-success">Connecté avec succès</p>
                          <p className="text-xs text-muted-foreground">Votre calendrier est synchronisé</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Privacy Notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="bg-primary/5 border border-primary/10 rounded-2xl p-6 mb-8"
        >
          <div className="flex items-start gap-3">
            <Lock className="size-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="mb-2">Vos données sont protégées</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Knowy accède uniquement aux métadonnées de votre calendrier (participants, titre, date).
                Le contenu de vos emails n'est jamais lu ni stocké. Chiffrement end-to-end, conformité GDPR et SOC2.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex items-center justify-between"
        >
          <button
            onClick={() => navigate('/onboarding/step1')}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Retour
          </button>

          <div className="flex items-center gap-4">
            <button
              onClick={handleContinue}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Passer cette étape
            </button>

            <KnowyButton
              variant="primary"
              size="lg"
              onClick={handleContinue}
              disabled={!connected}
            >
              Continuer
            </KnowyButton>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
