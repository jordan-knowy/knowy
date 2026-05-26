import { useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';

export default function Cookies() {
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

        <h1 className="text-4xl font-bold mb-2">Politique Cookies</h1>
        <p className="text-muted-foreground mb-10">Dernière mise à jour : 27 mai 2026</p>

        <div className="space-y-8 text-sm leading-7">

          <section>
            <h2 className="text-xl font-semibold mb-3">Qu'est-ce qu'un cookie ?</h2>
            <p className="text-muted-foreground">
              Un cookie est un petit fichier texte déposé sur votre appareil lors de la visite d'un site web.
              Il permet de mémoriser des informations relatives à votre navigation afin d'améliorer votre expérience.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Cookies utilisés par Knowy</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 font-semibold">Type</th>
                    <th className="text-left py-2 pr-4 font-semibold">Nom</th>
                    <th className="text-left py-2 pr-4 font-semibold">Finalité</th>
                    <th className="text-left py-2 font-semibold">Durée</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4">Essentiel</td>
                    <td className="py-2 pr-4 font-mono text-xs">sb-auth-token</td>
                    <td className="py-2 pr-4">Session d'authentification Supabase</td>
                    <td className="py-2">Session</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4">Essentiel</td>
                    <td className="py-2 pr-4 font-mono text-xs">knowy_session</td>
                    <td className="py-2 pr-4">Maintien de la connexion</td>
                    <td className="py-2">7 jours</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4">Fonctionnel</td>
                    <td className="py-2 pr-4 font-mono text-xs">knowy_prefs</td>
                    <td className="py-2 pr-4">Préférences utilisateur (thème, langue)</td>
                    <td className="py-2">1 an</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Analytique</td>
                    <td className="py-2 pr-4 font-mono text-xs">knowy_analytics</td>
                    <td className="py-2 pr-4">Mesure d'audience anonymisée</td>
                    <td className="py-2">13 mois</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Cookies tiers</h2>
            <p className="text-muted-foreground mb-3">
              Knowy peut utiliser des cookies provenant de services tiers :
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Google</strong> : authentication OAuth (Google Sign-In)</li>
              <li><strong className="text-foreground">Supabase</strong> : gestion de session et authentification</li>
            </ul>
            <p className="mt-3 text-muted-foreground">
              Ces services ont leurs propres politiques de cookies. Knowy ne dépose <strong className="text-foreground">aucun cookie publicitaire</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Gestion de vos préférences</h2>
            <p className="text-muted-foreground mb-3">
              Les cookies essentiels sont nécessaires au fonctionnement du service et ne peuvent pas être désactivés.
              Pour les autres catégories, vous pouvez gérer vos préférences :
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Via les paramètres de votre navigateur (Chrome, Firefox, Safari, Edge)</li>
              <li>Via notre centre de préférences accessible dans les paramètres du compte</li>
            </ul>
            <p className="mt-3 text-muted-foreground">
              La désactivation de certains cookies peut affecter le fonctionnement de la plateforme.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Consentement</h2>
            <p className="text-muted-foreground">
              Conformément à la réglementation CNIL et au RGPD, votre consentement est requis avant le dépôt
              de cookies non essentiels. Une bannière de consentement vous est présentée lors de votre première
              visite sur la plateforme.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Contact</h2>
            <p className="text-muted-foreground">
              Pour toute question sur notre utilisation des cookies :{' '}
              <a href="mailto:privacy@knowy.ai" className="text-primary hover:underline">privacy@knowy.ai</a>
            </p>
          </section>

          <section className="pt-6 border-t border-border">
            <p className="text-muted-foreground">Knowy SAS — Paris, France 🇫🇷</p>
          </section>
        </div>
      </div>
    </main>
  );
}
