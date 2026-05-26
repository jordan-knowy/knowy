import { useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';

export default function Privacy() {
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

        <h1 className="text-4xl font-bold mb-2">Politique de confidentialité</h1>
        <p className="text-muted-foreground mb-10">Dernière mise à jour : 27 mai 2026</p>

        <div className="space-y-8 text-sm leading-7">

          <section>
            <h2 className="text-xl font-semibold mb-3">1. Responsable du traitement</h2>
            <p>
              <strong>Knowy SAS</strong><br />
              Siège social : Paris, France 🇫🇷<br />
              Email DPO : <a href="mailto:privacy@knowy.ai" className="text-primary hover:underline">privacy@knowy.ai</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Données collectées</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 font-semibold">Catégorie</th>
                    <th className="text-left py-2 pr-4 font-semibold">Données</th>
                    <th className="text-left py-2 font-semibold">Finalité</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4">Compte</td>
                    <td className="py-2 pr-4">Email, nom, photo de profil</td>
                    <td className="py-2">Authentification</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4">Calendrier</td>
                    <td className="py-2 pr-4">Événements, participants, durées</td>
                    <td className="py-2">Préparation de réunions</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4">Emails</td>
                    <td className="py-2 pr-4">Métadonnées, tonalité, fréquence</td>
                    <td className="py-2">Analyse relationnelle</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4">LinkedIn</td>
                    <td className="py-2 pr-4">Profil public, parcours</td>
                    <td className="py-2">Enrichissement de profil</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Usage</td>
                    <td className="py-2 pr-4">Logs de navigation, actions</td>
                    <td className="py-2">Amélioration du service</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Base légale des traitements</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Exécution du contrat</strong> : traitement nécessaire à la fourniture du service</li>
              <li><strong className="text-foreground">Consentement</strong> : collecte de données OAuth (calendrier, emails, LinkedIn)</li>
              <li><strong className="text-foreground">Intérêt légitime</strong> : amélioration du service, sécurité</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Durée de conservation</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Données de compte : durée de vie du compte + 3 ans</li>
              <li>Données d'analyse : 12 mois glissants</li>
              <li>Logs techniques : 90 jours</li>
              <li>Données supprimées à la demande dans un délai de 30 jours</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Partage des données</h2>
            <p className="text-muted-foreground mb-3">
              Knowy ne vend jamais vos données. Nous travaillons avec des sous-traitants sélectionnés :
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Supabase</strong> (hébergement base de données — UE)</li>
              <li><strong className="text-foreground">Anthropic</strong> (traitement IA pour génération de profils)</li>
              <li><strong className="text-foreground">Google</strong> (OAuth, Calendar, Gmail — avec vos autorisations)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Vos droits (RGPD)</h2>
            <p className="text-muted-foreground mb-3">Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Droit d'accès</strong> : obtenir une copie de vos données</li>
              <li><strong className="text-foreground">Droit de rectification</strong> : corriger des données inexactes</li>
              <li><strong className="text-foreground">Droit à l'effacement</strong> : demander la suppression de vos données</li>
              <li><strong className="text-foreground">Droit à la portabilité</strong> : recevoir vos données dans un format structuré</li>
              <li><strong className="text-foreground">Droit d'opposition</strong> : vous opposer à certains traitements</li>
              <li><strong className="text-foreground">Droit de limitation</strong> : limiter le traitement de vos données</li>
            </ul>
            <p className="mt-4 text-muted-foreground">
              Pour exercer vos droits : <a href="mailto:privacy@knowy.ai" className="text-primary hover:underline">privacy@knowy.ai</a>.
              Délai de réponse : 30 jours. Vous pouvez également saisir la <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">CNIL</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Cookies</h2>
            <p className="text-muted-foreground">
              Pour plus d'informations sur notre utilisation des cookies, consultez notre{' '}
              <a href="/cookies" className="text-primary hover:underline">Politique cookies</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Sécurité</h2>
            <p className="text-muted-foreground">
              Knowy met en œuvre des mesures techniques et organisationnelles adaptées pour protéger vos données :
              chiffrement en transit (TLS), chiffrement au repos, contrôle d'accès basé sur les rôles (RBAC),
              journalisation des accès, et Row Level Security (RLS) au niveau de la base de données.
            </p>
          </section>

          <section className="pt-6 border-t border-border">
            <p className="text-muted-foreground">Knowy SAS — Paris, France 🇫🇷</p>
            <p className="text-muted-foreground">Contact DPO : <a href="mailto:privacy@knowy.ai" className="text-primary hover:underline">privacy@knowy.ai</a></p>
          </section>
        </div>
      </div>
    </main>
  );
}
