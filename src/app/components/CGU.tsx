import { useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';

export default function CGU() {
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

        <h1 className="text-4xl font-bold mb-2">Conditions Générales d'Utilisation</h1>
        <p className="text-muted-foreground mb-10">Dernière mise à jour : 27 mai 2026</p>

        <div className="prose prose-neutral max-w-none space-y-8 text-sm leading-7">

          <section>
            <h2 className="text-xl font-semibold mb-3">Article 1 — Objet</h2>
            <p>
              Les présentes Conditions Générales d'Utilisation (ci-après «&nbsp;CGU&nbsp;») régissent l'accès et
              l'utilisation de la plateforme <strong>Knowy</strong>, éditée par Knowy SAS, société par actions simplifiée
              dont le siège social est établi à <strong>Paris, France</strong> (ci-après «&nbsp;la Société&nbsp;»).
            </p>
            <p className="mt-3">
              En accédant à la plateforme, l'Utilisateur reconnaît avoir lu, compris et accepté sans réserve les présentes CGU.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Article 2 — Accès au service</h2>
            <p>
              L'accès à Knowy est réservé aux professionnels disposant d'un compte valide créé via les providers
              d'authentification autorisés (Google, Microsoft). L'Utilisateur est responsable de la confidentialité
              de ses identifiants de connexion.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Article 3 — Description du service</h2>
            <p>
              Knowy est une plateforme d'intelligence relationnelle qui analyse les données des échanges
              professionnels autorisés (emails, agenda, LinkedIn) afin de générer des profils comportementaux
              et des recommandations de préparation de réunions.
            </p>
            <p className="mt-3">
              Le service fonctionne exclusivement à partir de données auxquelles l'Utilisateur a expressément
              accordé l'accès via les scopes OAuth sélectionnés. Aucune donnée n'est collectée sans consentement préalable.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Article 4 — Obligations de l'Utilisateur</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Utiliser le service conformément aux présentes CGU et à la législation en vigueur</li>
              <li>Ne pas utiliser Knowy à des fins illicites, frauduleuses ou contraires à l'éthique professionnelle</li>
              <li>S'assurer que les données traitées via Knowy le sont dans le respect du RGPD et du droit applicable</li>
              <li>Ne pas tenter de compromettre la sécurité, l'intégrité ou la disponibilité du service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Article 5 — Données personnelles</h2>
            <p>
              La Société traite des données à caractère personnel dans le cadre du service. L'Utilisateur dispose
              des droits d'accès, de rectification, d'effacement et de portabilité prévus par le RGPD.
              Pour exercer ces droits, contactez : <a href="mailto:privacy@knowy.ai" className="text-primary hover:underline">privacy@knowy.ai</a>
            </p>
            <p className="mt-3">
              Pour plus d'informations, consultez notre <a href="/privacy" className="text-primary hover:underline">Politique de confidentialité</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Article 6 — Propriété intellectuelle</h2>
            <p>
              L'ensemble des éléments constituant la plateforme Knowy (algorithmes, interface, marques, logos, contenus)
              est la propriété exclusive de Knowy SAS et est protégé par le droit de la propriété intellectuelle.
              Toute reproduction, représentation ou exploitation non autorisée est strictement interdite.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Article 7 — Limitation de responsabilité</h2>
            <p>
              Les analyses et recommandations générées par Knowy sont fournies à titre indicatif. La Société
              ne peut être tenue responsable des décisions prises sur la base des informations produites par le service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Article 8 — Résiliation</h2>
            <p>
              L'Utilisateur peut résilier son compte à tout moment depuis les paramètres de la plateforme.
              La Société se réserve le droit de suspendre ou supprimer tout compte ne respectant pas les présentes CGU.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Article 9 — Modifications des CGU</h2>
            <p>
              La Société se réserve le droit de modifier les présentes CGU à tout moment. Les modifications
              entreront en vigueur dès leur publication sur la plateforme. L'utilisation continue du service
              vaut acceptation des nouvelles conditions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Article 10 — Droit applicable et juridiction</h2>
            <p>
              Les présentes CGU sont régies par le droit français. En cas de litige, les parties s'engagent
              à rechercher une solution amiable. À défaut, les tribunaux compétents de <strong>Paris</strong> seront seuls compétents.
            </p>
          </section>

          <section className="pt-6 border-t border-border">
            <p className="text-muted-foreground">
              Pour toute question relative aux CGU : <a href="mailto:legal@knowy.ai" className="text-primary hover:underline">legal@knowy.ai</a>
            </p>
            <p className="text-muted-foreground mt-1">Knowy SAS — Paris, France 🇫🇷</p>
          </section>
        </div>
      </div>
    </main>
  );
}
