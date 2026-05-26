import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { useState } from 'react';
import { Database, CheckCircle2, Loader2, Lock, Sparkles, RefreshCw, Building2 } from 'lucide-react';
import KnowyButton from './knowy/KnowyButton';

export default function OnboardingStep3() {
  const navigate = useNavigate();

  const [selectedCRM, setSelectedCRM] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connected, setConnected] = useState(false);

  const handleConnect = (crmId: string) => {
    setSelectedCRM(crmId);
    setIsConnecting(true);

    // Simulate OAuth flow
    setTimeout(() => {
      setConnected(true);
      setIsConnecting(false);
    }, 2000);
  };

  const handleContinue = () => {
    navigate('/onboarding/step4');
  };

  const crmProviders = [
    {
      id: 'hubspot',
      name: 'HubSpot',
      description: 'Deals, Contacts, Companies, Notes',
      logo: (
        <svg className="size-7" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" fill="#FF7A59"/>
          <circle cx="12" cy="12" r="4" fill="white"/>
          <rect x="14" y="8" width="2" height="4" fill="white" transform="rotate(45 15 10)"/>
        </svg>
      ),
      bgColor: 'bg-[#FF7A59]/10',
      recommended: true
    },
    {
      id: 'salesforce',
      name: 'Salesforce',
      description: 'Opportunities, Accounts, Leads, Activities',
      logo: (
        <svg className="size-7" viewBox="0 0 24 24">
          <path fill="#00A1E0" d="M10.006 5.412a3.855 3.855 0 0 1 5.75-2.412c.698-.285 1.457-.439 2.244-.439a5.5 5.5 0 0 1 5.5 5.5c0 .396-.045.783-.13 1.152A4.126 4.126 0 0 1 24 12.873a4.127 4.127 0 0 1-4.126 4.127c-.367 0-.721-.05-1.06-.143a4.557 4.557 0 0 1-8.382 1.446A3.856 3.856 0 0 1 4.5 14.967a3.856 3.856 0 0 1 1.248-2.844A4.127 4.127 0 0 1 5.5 9.252a4.126 4.126 0 0 1 4.506-4.126z"/>
        </svg>
      ),
      bgColor: 'bg-[#00A1E0]/10',
      recommended: false
    },
    {
      id: 'pipedrive',
      name: 'Pipedrive',
      description: 'Deals, Organizations, People, Activities',
      logo: (
        <svg className="size-7" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" fill="#1A1A1A"/>
          <path fill="white" d="M8 7h3a4 4 0 0 1 0 8H8V7zm0 10h3a6 6 0 0 0 0-12H8v12z"/>
        </svg>
      ),
      bgColor: 'bg-[#1A1A1A]/10',
      recommended: false
    },
    {
      id: 'attio',
      name: 'Attio',
      description: 'Records, Lists, Workspaces',
      logo: (
        <div className="size-7 bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] rounded-lg flex items-center justify-center text-white font-bold text-sm">
          A
        </div>
      ),
      bgColor: 'bg-[#6366F1]/10',
      recommended: false
    }
  ];

  return (
    <div className="size-full bg-background overflow-auto">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Progress bar */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Étape 3 sur 5</span>
            <span className="text-sm font-medium text-primary">60%</span>
          </div>
          <div className="w-full bg-border rounded-full h-2">
            <motion.div
              initial={{ width: '40%' }}
              animate={{ width: '60%' }}
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
            <Database className="size-8 text-primary" />
          </div>
          <h1 className="mb-4">Connectez votre CRM</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Synchronisez automatiquement vos deals, contacts et notes entre Knowy et votre CRM.
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
              icon: RefreshCw,
              label: 'Sync bidirectionnel',
              desc: 'Mise à jour automatique dans les 2 sens'
            },
            {
              icon: Building2,
              label: 'Enrichissement auto',
              desc: 'Données Knowy ajoutées à vos fiches CRM'
            },
            {
              icon: Sparkles,
              label: 'Intelligence IA',
              desc: 'MEDDPICC, next steps, alertes deals'
            }
          ].map((item, i) => (
            <div key={i} className="bg-card rounded-2xl p-6 border border-border text-center">
              <item.icon className="size-8 text-primary mx-auto mb-3" />
              <h3 className="mb-1">{item.label}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </motion.div>

        {/* CRM Provider Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-4 mb-12"
        >
          {crmProviders.map((crm, i) => (
            <motion.div
              key={crm.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
              className={`relative bg-card rounded-2xl border-2 transition-all overflow-hidden ${
                connected && selectedCRM === crm.id
                  ? 'border-success bg-success/5'
                  : selectedCRM === crm.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-border/60'
              }`}
            >
              {crm.recommended && (
                <div className="absolute top-4 right-4">
                  <div className="bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full font-medium">
                    Recommandé
                  </div>
                </div>
              )}

              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`size-14 ${crm.bgColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    {crm.logo}
                  </div>

                  <div className="flex-1">
                    <h3 className="mb-1">{crm.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {crm.description}
                    </p>

                    {!connected || selectedCRM !== crm.id ? (
                      <KnowyButton
                        variant="primary"
                        size="md"
                        onClick={() => handleConnect(crm.id)}
                        loading={isConnecting && selectedCRM === crm.id}
                        disabled={isConnecting}
                      >
                        {isConnecting && selectedCRM === crm.id ? (
                          <>
                            <Loader2 className="size-4 animate-spin" />
                            Connexion OAuth...
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
                          <p className="text-xs text-muted-foreground">Synchronisation bidirectionnelle active</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Privacy & Security Notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="bg-primary/5 border border-primary/10 rounded-2xl p-6 mb-8"
        >
          <div className="flex items-start gap-3">
            <Lock className="size-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="mb-2">Synchronisation sécurisée</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Knowy synchronise vos deals, contacts, et notes CRM de manière bidirectionnelle.
                Les insights IA (MEDDPICC, alertes, recommandations) sont ajoutés comme champs personnalisés
                dans votre CRM. Connexion OAuth sécurisée, chiffrement end-to-end.
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
            onClick={() => navigate('/onboarding/step2')}
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
