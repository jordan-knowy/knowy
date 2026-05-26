import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { Building2, Clock, Database, Lock, Sparkles } from 'lucide-react';
import KnowyButton from './knowy/KnowyButton';

export default function OnboardingStep3() {
  const navigate = useNavigate();

  return (
    <div className="size-full overflow-auto bg-background">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="mb-12">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Étape 3 sur 4</span>
            <span className="text-sm font-medium text-primary">75%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-border">
            <motion.div initial={{ width: '50%' }} animate={{ width: '75%' }} transition={{ duration: 0.6 }} className="h-2 rounded-full bg-primary" />
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 text-center">
          <div className="mb-6 inline-flex size-16 items-center justify-center rounded-lg bg-primary/10">
            <Database className="size-8 text-primary" />
          </div>
          <h1 className="mb-4 text-4xl font-semibold">CRM: prévu en v2</h1>
          <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
            HubSpot, Salesforce et Pipedrive demandent une intégration OAuth plus lourde. On garde le parcours simple maintenant.
          </p>
        </motion.div>

        <div className="mb-10 grid gap-4 md:grid-cols-3">
          {[
            [Building2, 'HubSpot', 'Contacts, companies, deals et notes.'],
            [Sparkles, 'Salesforce', 'Opportunités, comptes et activités.'],
            [Clock, 'Pipedrive', 'Pipeline, personnes et organisations.'],
          ].map(([Icon, label, desc]) => (
            <div key={String(label)} className="rounded-lg border border-border bg-card p-5">
              <Icon className="mb-3 size-6 text-primary" />
              <h2 className="font-semibold">{String(label)}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{String(desc)}</p>
              <span className="mt-4 inline-flex rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">v2</span>
            </div>
          ))}
        </div>

        <div className="mb-8 rounded-lg border border-primary/10 bg-primary/5 p-5">
          <div className="flex gap-3">
            <Lock className="mt-0.5 size-5 text-primary" />
            <p className="text-sm leading-6 text-muted-foreground">
              La v1 se concentre sur identité, emails, calendrier, site web et contexte IA. Les CRM seront ajoutés quand le moteur de briefs sera stable.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button onClick={() => navigate('/onboarding/step2')} className="text-sm text-muted-foreground hover:text-foreground">
            Retour
          </button>
          <KnowyButton variant="primary" size="lg" onClick={() => navigate('/onboarding/step4')}>
            Continuer
          </KnowyButton>
        </div>
      </div>
    </div>
  );
}
