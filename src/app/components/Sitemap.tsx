import { useNavigate } from 'react-router';
import { ArrowLeft, ExternalLink } from 'lucide-react';

const sections = [
  {
    title: 'Pages publiques',
    links: [
      { label: 'Accueil', path: '/' },
      { label: 'Se connecter', path: '/signin' },
      { label: 'Créer un compte', path: '/signin' },
    ],
  },
  {
    title: 'Application',
    links: [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Réunions', path: '/meetings' },
      { label: 'Coaching', path: '/coaching' },
      { label: 'Relations', path: '/relations' },
      { label: 'Paramètres', path: '/account' },
      { label: 'Abonnement', path: '/subscription' },
    ],
  },
  {
    title: 'Onboarding',
    links: [
      { label: 'Étape 1 — Profil', path: '/onboarding/step1' },
      { label: 'Étape 2 — Organisation', path: '/onboarding/step2' },
      { label: 'Étape 3 — Connecteurs', path: '/onboarding/step3' },
      { label: 'Étape 4 — Équipe', path: '/onboarding/step4' },
      { label: 'Étape 5 — Finalisation', path: '/onboarding/step5' },
    ],
  },
  {
    title: 'Légal',
    links: [
      { label: 'Conditions Générales d\'Utilisation (CGU)', path: '/cgu' },
      { label: 'Politique de confidentialité', path: '/privacy' },
      { label: 'Politique cookies', path: '/cookies' },
      { label: 'Plan du site', path: '/sitemap' },
    ],
  },
];

export default function Sitemap() {
  const navigate = useNavigate();
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="size-4" />
          Retour à l'accueil
        </button>

        <h1 className="text-4xl font-bold mb-2">Plan du site</h1>
        <p className="text-muted-foreground mb-10">Navigation complète de la plateforme Knowr</p>

        <div className="grid gap-8 sm:grid-cols-2">
          {sections.map((section) => (
            <div key={section.title}>
              <h2 className="text-lg font-bold mb-4 pb-2 border-b border-border">{section.title}</h2>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={() => navigate(link.path)}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover:bg-primary transition-colors flex-shrink-0" />
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Knowr SAS — Paris, France 🇫🇷 · <a href="mailto:contact@knowy.ai" className="text-primary hover:underline">contact@knowy.ai</a>
          </p>
        </div>
      </div>
    </main>
  );
}
