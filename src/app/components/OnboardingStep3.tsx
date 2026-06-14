import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Building2, CheckCircle2, Database, Lock, RefreshCw, Sparkles } from 'lucide-react';
import KnowrButton from './knowr/KnowrButton';
import { requireOnboardingContext, updateOnboardingContext } from '../../lib/onboarding';

const crmProviders = [
  { id: 'hubspot', name: 'HubSpot', description: 'Deals, contacts, notes et MEDDPICC enrichi.' },
  { id: 'salesforce', name: 'Salesforce', description: 'Opportunities, accounts, leads et activités.' },
  { id: 'pipedrive', name: 'Pipedrive', description: 'Deals, organisations, people et activités.' },
  { id: 'attio', name: 'Attio', description: 'Records, listes et workspace relationnel.' },
];

export default function OnboardingStep3() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState('');
  const [organizationId, setOrganizationId] = useState('');

  useEffect(() => {
    requireOnboardingContext()
      .then(({ user, organizationId }) => {
        setUserId(user.id);
        setOrganizationId(organizationId);
      })
      .catch(() => navigate('/signin', { replace: true }));
  }, [navigate]);

  async function handleContinue() {
    if (organizationId && userId) {
      await updateOnboardingContext(organizationId, userId, {
        current_step: 4,
        step3: true,
        crm_status: 'planned_v2',
      });
    }
    navigate('/onboarding/step4');
  }

  return (
    <div className="size-full bg-background overflow-auto">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-12">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Étape 3 sur 5</span>
            <span className="text-sm font-medium text-primary">60%</span>
          </div>
          <div className="w-full bg-border rounded-full h-2">
            <motion.div initial={{ width: '40%' }} animate={{ width: '60%' }} className="bg-primary rounded-full h-2" />
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center justify-center size-16 bg-primary/10 rounded-2xl mb-6">
            <Database className="size-8 text-primary" />
          </div>
          <h1 className="mb-4">CRM prévu en v2</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            La connexion CRM est préparée dans l'architecture, mais elle ne bloque pas la v1. L'onboarding réel se concentre d'abord sur identité, échanges, contexte et préférences.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {[
            { icon: RefreshCw, label: 'Roadmap', desc: 'OAuth CRM et sync bidirectionnelle en v2' },
            { icon: Building2, label: 'Données', desc: 'Deals, comptes, stakeholders et notes' },
            { icon: Sparkles, label: 'Insights', desc: 'MEDDPICC, risques, objections et next steps' },
          ].map((item) => (
            <div key={item.label} className="bg-card rounded-2xl p-6 border border-border text-center">
              <item.icon className="size-8 text-primary mx-auto mb-3" />
              <h3 className="mb-1">{item.label}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="space-y-4 mb-8">
          {crmProviders.map((crm) => (
            <section key={crm.id} className="relative bg-card rounded-2xl border border-border p-6 opacity-80">
              <span className="absolute right-4 top-4 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">v2</span>
              <div className="flex items-start gap-4">
                <div className="size-14 rounded-xl bg-muted flex items-center justify-center">
                  <Database className="size-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="mb-1">{crm.name}</h3>
                  <p className="text-sm text-muted-foreground">{crm.description}</p>
                </div>
              </div>
            </section>
          ))}
        </div>

        <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-3">
            <Lock className="size-5 text-primary mt-0.5" />
            <p className="text-sm text-muted-foreground leading-relaxed">
              Aucun accès CRM n'est demandé en v1. Le produit reste testable avec Gmail, Outlook, LinkedIn, le site web et les textes d'échanges importés.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button onClick={() => navigate('/onboarding/step2')} className="text-sm text-muted-foreground hover:text-foreground">
            Retour
          </button>
          <KnowrButton variant="primary" size="lg" onClick={handleContinue}>
            <CheckCircle2 className="size-4" />
            Compris, continuer
          </KnowrButton>
        </div>
      </div>
    </div>
  );
}
