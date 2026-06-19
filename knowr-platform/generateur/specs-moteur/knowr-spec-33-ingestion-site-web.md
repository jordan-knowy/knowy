# Spec-33 — Ingestion du site web comme source de la fiche compte

> Statut : draft v1 · s'applique à la **génération de la fiche compte** (à la création) et au **rafraîchissement**.
> Doctrine : **zéro-hallu**. Chaque insight est cité avec sa page source + date. Site inaccessible → `null` (« à capter »), jamais inventé.

## 1. Objectif

À la **création d'un compte**, capter automatiquement le **site officiel** pour :
1. en générer une **description entreprise** ;
2. en extraire des **insights** (offre, ICP, actualités, ton) ;
3. **nourrir la fiche** en profondeur ;
4. **adapter les briefs de réunion** (aligner la proposition de valeur sur l'offre réelle du compte).

C'est une **source à capter absolument** : un compte sans site capté est marqué « à capter », pas complété au jugé.

## 2. Source & résolution d'URL

Ordre de résolution (premier disponible) :
1. Domaine de l'email professionnel d'un contact connu (`@calomatech.fr` → `calomatech.fr`).
2. Champ « site web » du CRM (HubSpot/Salesforce).
3. Société.info / annuaire (SIREN → site déclaré).
4. Recherche web ciblée (nom + ville) — validée par recoupement (double-source, règle emploi stricte).

Priorité de **capture** : site officiel (P1) → page LinkedIn entreprise (P2) → Société.info (P3).

## 3. Pipeline d'extraction

1. **Fetch** des pages clés : accueil, à propos, offre/services/produits, actualités/blog, carrière, mentions légales (SIREN/effectif).
2. **Extraction LLM** structurée → JSON :
   ```
   { description, secteur, offre[], cible_icp[], actualites[], ton_editorial,
     signaux: {recrutement?, levee?, croissance?, international?},
     insights[], provenance: { url, pages[], date_capture } }
   ```
3. **Provenance obligatoire** : chaque champ porte sa page source + date. Pas de source → champ `null`.

## 4. Impact moteur (spec-30 / spec-32)

Les insights site alimentent :
- **Contexte marché/entreprise** (section dédiée de la fiche).
- **Détection de signaux** : page carrière (recrutement → `croissance`), actualités (`levee_fonds`, expansion), changement d'offre.
- **Typage de compte (spec-32)** : l'offre & l'ICP confirment client vs partenaire/fournisseur.
- **Adaptation des briefs** : la proposition de valeur Pisteur est reformulée en fonction de l'offre réelle et du vocabulaire du compte (ton éditorial capté).

## 5. Impact UX / UI / CSS

Section **« Site web & description entreprise »** sur la fiche compte (`id="sec-web"`, placée avant le contexte marché) :
- URL cliquable (`🔗 domaine`).
- **Description générée** (carte `.card`).
- **Insights captés** (liste).
- Encart d'usage : « ces insights nourrissent la fiche **et adaptent les briefs** ».
- **Provenance** (`.prov` : site, nb de pages, date de capture).
- État vide : badge **« à capter »** si site non résolu / inaccessible (jamais de description inventée).

## 6. Rafraîchissement

Re-capture périodique (ex. mensuelle, ou déclenchée par la Veille) pour détecter nouveautés (actualités, recrutements, changement d'offre) → nouveaux signaux. Diff horodaté, provenance mise à jour.

## 7. Garde-fous

- Zéro-hallu : pas de site = pas de description (statut « à capter »).
- Respect robots.txt / pages publiques uniquement ; pas de contournement d'authentification.
- RGPD : données d'entreprise publiques (cf. argumentaire spec — assistance à la préparation, pas de décision automatisée Art. 22).
