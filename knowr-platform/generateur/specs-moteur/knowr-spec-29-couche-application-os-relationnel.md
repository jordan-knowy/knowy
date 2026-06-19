# Spec-29 — Couche Application / OS Relationnel (v8)

## Architecture en deux couches (à ne jamais confondre)
- **Couche Générateur** = les **fiches** (Réunion/Préparation · Personne · Compte · Compte-rendu).
  Produite par l'IA, gouvernée par la doctrine + les **9 garde-fous**. C'est le cœur du kit.
- **Couche Application** = le **shell produit** qui contient et navigue les fiches.
  **NON généré par l'IA**, **NON soumis aux garde-fous de brief**. Implémenté en React (Vite/Tailwind).
Réf : `app-shell-reference/knowr-app.html`.

## Le shell (side-nav, un job par écran)
Navigation latérale persistante : **Home · Meetings · Comptes · Personnes** — séparateur — **Paramètres · Mon compte**.
Le contenu bascule, la nav ne bouge jamais. Sous 880px → rail d'icônes.

- **Home (dashboard = triage)** : Réunions à venir (→ Préparation) · **Santé du portefeuille** (une **distribution** sain/sous-tension, PAS une moyenne lissée) · Tâches prioritaires · **Feed relationnel** (signaux). Lanceur, pas destination : chaque widget pointe vers la page profonde.
  - **› Révision V3 (spec-30).** Le **classement de portefeuille gravité × urgence** (spec-30 §4) devient l'**engine du « Plan du jour »** — tri systématique sourcé, pas heuristique. Il **remplace** tout stat de **moyenne lissée** (« Score relationnel global · moyenne pondérée » → à retirer, interdit ici et en spec-22 §0) par la **distribution** + la **file priorisée**, et **absorbe « Tâches prioritaires »** (chaque tâche = l'action recommandée d'un compte classé). Le **Feed Signaux** reste dessous = couche brute (les faits) ; le classement est la couche **fusionnée** au-dessus (quoi faire, dans quel ordre).
  - **› Layout validé (réf. `app-shell-reference/knowr-app.html`, écran `#view-home`).** Home en 2 colonnes : (gauche) **Réunions** au format initial avec « Tout voir » en tête + **Portefeuille priorisé** en **tableau minimaliste à scroll interne** (tient 40+ comptes, distribution en en-tête) ; (droite) **Signaux en rail** au format fiche. Sur les fiches Compte/Personne, le verdict du compte est rendu par le composant **`.v-card`** en tête du rail Signaux (**spec-31**).
- **Meetings** (colonne temporelle) : À venir → Préparation ; Passées → Compte-rendu. Ancre du brief auto 30 min avant (F15).
- **Comptes / Personnes** : listes filtrables (note, tendance, couverture, prochain pas, mail/tél) → ouvrent les fiches.
- **Paramètres** : connecteurs (Outlook, HubSpot, LinkedIn, Read.ai) · doctrine produit (**zéro-hallucination verrouillé**, couverture multi-contacts, double-source) · notifications.
- **Mon compte** : profil · plan Pro 59 € · équipe · espace · **crédits d'enrichissement**.

## Crédits d'enrichissement
Compteur dans la side-nav, décrémenté à chaque enrichissement (depuis une fiche ou une liste).
Modèle de coût à définir (ex. 1 cr = mail, 2 cr = tél direct).

## Le feed Signaux vit sur Home
Pas d'onglet « Signaux » dédié dans le MVP : le feed est sur Home (là où on le voit). Types : promotion→upsell,
mouvement de poste→nouveau compte (F11), turnover (F10-C), nouvel arrivant (F10-B), objection, M&A/risque.

## Découverte = action sur le Compte, pas page froide
La recherche de nouveaux profils est **account-scoped** (déclenchée depuis la fiche Compte, spec-28 §5),
pas un onglet de nav permanent. Action épisodique → en contexte.

## Ouverture des fiches DANS le shell (nav toujours visible)
Quand on ouvre une fiche (Réunion/Préparation · Personne · Compte · Compte-rendu) depuis une liste, le Home ou une timeline, elle s'affiche **dans une zone détail du shell** — la side-nav reste **toujours visible à gauche**. Bouton « ← Retour » + fil d'Ariane ramènent à la liste d'origine. Les liens *internes* d'une fiche (compte → contact, timeline → prépa/CR) naviguent **dans la même zone** : la nav ne disparaît jamais.
- Réf. d'implémentation (`app-shell-reference/knowr-app.html`) : la fiche est chargée dans une `iframe` pour ne pas réécrire les surfaces HTML autonomes.
- **En React natif** : rendre directement le composant de fiche dans la zone détail (`<Outlet/>`) — même résultat, nav persistante. Ne pas reproduire l'iframe.

## Vue fiche pleine largeur
En vue détail (fiche ouverte), le contenu passe en **pleine largeur** et la fiche s'étire pour remplir l'espace (pas de vide à droite). Les écrans de **liste** (Comptes/Personnes/Meetings) gardent une **largeur de lecture** (~1120px). Réf. : classe `.content.wide` (plafond de largeur retiré en détail uniquement).

## Owner + périmètre (Mes / Organisation)
Les listes Comptes/Personnes affichent un **avatar Owner** par ligne (à qui appartient la relation) et un **filtre Mes / Organisation** :
- « Mes » = uniquement les entités de l'utilisateur ; « Organisation » = + celles des autres membres.
- Choix minimaliste : **colonne + filtre sur les listes existantes**, PAS de page Admin séparée (à créer seulement quand des actions admin réelles seront nécessaires).
- Doctrine inchangée : les coordonnées d'une entité d'un autre membre restent « Enrichir » si non sourcées (jamais fabriquées).
