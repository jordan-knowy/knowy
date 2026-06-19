# Knowr — Manuel d'agent (Claude Code)

> **Tu es un agent de code chargé de CONSTRUIRE la plateforme Knowr à partir de ce repo.**
> Ce repo n'est pas le produit : c'est sa **spécification exécutable** (charte, doctrine, surfaces de référence, garde-fous).
> Ta mission : transformer ces références en application web réelle, **sans dévier de la charte ni de la doctrine**.
> Lis ce fichier en entier AVANT d'écrire la moindre ligne.

## 1. Ce qu'est Knowr
OS Relationnel pour commerciaux. Deux promesses livrées en V1 :
- **Prepare** — générer un brief pré-réunion à partir de signaux dispersés (mails, agenda, CRM, LinkedIn, données publiques).
- **Remember** — mémoire relationnelle + synchronisation CRM.

Le produit se matérialise par des **surfaces de fiche** (Personne · Réunion/Préparation · Compte · Compte-rendu) consultées dans une **application shell** (l'OS : Home · Meetings · Comptes · Personnes · Paramètres · Mon compte). *Coach (assistance live en réunion) = V2, hors périmètre actuel.*

## 2. Règle d'or #0 — La charte est la loi (NON NÉGOCIABLE)
- Le design system « Violet Trust » est **figé**. Source unique : `generateur/templates-reference/knowr-design-system.css` + les `exemple-*.html`.
- Tu **reproduis ce rendu à l'identique**. Tu n'as **aucun droit** de proposer une autre charte / couleurs / police / composant « parce que ce serait mieux ».
- Polices : **Epilogue** (titres/UI) + **JetBrains Mono** (labels/data), embarquées en base64 dans les références. En React : `@fontsource/epilogue` + `@fontsource/jetbrains-mono`, OU réembarque les mêmes base64.
- **Tu n'utilises que les tokens** (`var(--violet)`, `var(--t1)`, `var(--r-lg)`, `var(--sh-md)`…). Aucune valeur en dur hors charte.
- **Nouveau composant = nouvelle spec.** Si un écran a besoin d'un élément absent des références, écris-le d'abord comme `specs-moteur/spec-XX` cohérente avec la charte, puis implémente. Jamais d'UI étrangère bricolée.

## 3. Doctrine produit (les garde-fous l'imposent — ne la contourne JAMAIS)
1. **Zéro-hallucination.** Tout champ sans source vérifiable = `null` côté data, « à confirmer » côté UI. Jamais d'inférence inventée : ni coordonnées, ni téléphone, ni taille d'entreprise, ni titre de poste.
2. **Emploi = double source.** Un poste actuel n'est affirmé que si (1) headline/signature = société X **ET** (2) une source secondaire corrobore (site, presse, RocketReach). Un post « je rejoins X » / « a rejoint le groupe X » ≠ preuve → « à confirmer ».
3. **Comportement > titre.** La valeur différenciante = l'analyse des choix/comportements observés, pas l'intitulé de poste. **Les objections sont obligatoires** dans une Réunion commerciale.
4. **Hero canonique = 3 blocs** : Score relation + Confiance (anneau %) + Dernier contact. Toujours, sans exception.
5. **Signaux (spec-23)** : un signal est un **fait daté**, taggé par surface, trié et plafonné. Pas d'opinion non datée.
6. **Provenance / horodatage (spec-21)** : chaque donnée porte sa source et sa fraîcheur.
7. **Surfaces autonomes** : une surface de fiche est un HTML autonome — **aucun CDN**, **aucun localStorage DANS la surface**, polices embarquées. La persistance vit dans la couche Application, pas dans la surface.

## 4. Architecture — deux couches (à respecter dans le code)
**A. Couche Générateur (gouvernée).** Produit les surfaces de fiche à partir d'un contexte. Régie par `generateur/` :
- `INSTRUCTIONS-CLAUDE.md` — la marche à suivre du moteur (à lire en premier).
- `specs-moteur/` — la doctrine + le moteur (règles d'inférence, system prompt de génération spec-19, méthodo data spec-18, 3 surfaces spec-15, couverture multi-contacts spec-26, compte-rendu spec-27, composants CRM spec-28).
- `garde-fous/` — 9 validateurs Python.
- `templates-reference/` — le rendu cible (charte + exemples canoniques).

**B. Couche Application — l'OS Relationnel (React, à coder).** Le **shell** : nav latérale persistante, dashboards de liste, et **ouverture des fiches DANS le shell** (la nav reste toujours visible à gauche). Référence pixel : `app-shell-reference/knowr-app.html`. Cette couche n'est **pas** une sortie d'IA → non soumise aux 9 garde-fous, **sauf** `validate_app_charte.py` (fidélité de charte).

> Rapport entre les deux : l'Application **affiche** et **persiste** les surfaces que le Générateur **produit**. Le shell de référence ouvre les fiches dans une `iframe` pour ne pas réécrire les surfaces HTML lourdes ; **en React natif, tu rends directement les composants de fiche dans la zone détail (`<Outlet/>`)** — même résultat, nav persistante.

## 5. Stack cible recommandée
- **React + Vite + TypeScript**, **Tailwind** + **shadcn/ui** + **Framer Motion** (stack maison validée).
- **Tailwind config** : mappe les tokens de `knowr-design-system.css` en variables CSS + thème (couleurs `violet/sage/coral/amber/teal/blue` et leurs déclinaisons `-s/-l/-d/-x`, neutres `--t1..t4`/`--border*`/`--bg*`, rayons `--r-*`, ombres `--sh-*`, `--mono`, `--font`). **Extrais la palette du CSS de référence, ne la réinvente pas.**
- **Routing** : `react-router`. Layout = sidebar persistante + `<Outlet/>` (l'équivalent React du shell + zone détail).
- **Vue fiche pleine largeur** : en détail, la fiche occupe toute la largeur dispo (cf. `.content.wide` dans le shell de référence) ; les listes gardent une largeur de lecture (~1120px).
- **Persistance (Tier 0)** : commence simple — IndexedDB/localStorage **côté app** (jamais dans les surfaces) pour « Enregistrer sur Knowr », puis backend/API. La Mémoire relationnelle = entités sauvegardées + historique + sync CRM.
- **Connecteurs** : HubSpot & Salesforce (CRM), sources brief = LinkedIn / RocketReach / site / presse. Côté enrichissement, respecter le modèle de crédits (1 cr = mail, 2 cr = tél) et ne jamais fabriquer une donnée enrichie non vérifiée.

## 6. Structure de repo cible (proposée)
```
src/
  app/                 # shell : AppLayout (sidebar + Outlet), routes
  routes/              # /home /meetings /comptes /personnes /parametres /compte
  features/
    fiche-personne/    # surface Personne (+ coordonnées & enrichissement, tendance + prochain pas)
    fiche-reunion/     # surface Réunion (variantes commerciale | productivité)
    fiche-compte/      # surface Compte (+ pénétration sourcée, timeline, découverte F10-A)
    compte-rendu/      # surface Compte-rendu (impact score par personne, objectifs, tâches)
    signaux/           # composant Signaux (spec-23)
    memoire/           # Mémoire relationnelle (sync CRM)
  design-system/       # tokens.css (extrait), ui/ (primitives shadcn restylées charte)
  data/                # schémas TS (champs nullable = zéro-hallucination), persistance Tier0
  generation/          # client du moteur de brief (voir generateur/specs-moteur)
```

## 7. Mapping références → écrans
- `exemple-personne.html` / `exemple-personne-crm.html` → `features/fiche-personne`.
- `exemple-reunion-commerciale.html` & `exemple-reunion-productivite.html` → `features/fiche-reunion` (2 variantes ; **détecter le type AVANT le rendu** — voir INSTRUCTIONS §2bis).
- `exemple-compte.html` / `exemple-compte-crm.html` → `features/fiche-compte` (mètre de pénétration sourcé, timeline réunions, panneau Découverte account-scoped).
- `exemple-compte-rendu.html` → `features/compte-rendu` (état « Après » : impact score, objectifs 3 paliers, tâches, transcript repliable).
- `app-shell-reference/knowr-app.html` → `app/AppLayout` + routes de liste + ouverture in-shell.
- `exemples-reels/` → **données réelles** (Calomatech, AAEP) montrant la doctrine appliquée : « à confirmer », `null`, double-source, pénétration sourcée.

## 8. Ordre de construction (roadmap)
1. **Tier 0 — Shell + persistance.** AppLayout (sidebar + détail), listes Comptes/Personnes/Meetings, ouverture de fiche in-shell, « Enregistrer sur Knowr » (persistance locale).
2. **Tier 1 — Signaux sur entités sauvegardées.** F11 (changement de poste ★) + F10-C (turnover) → alimentent **F16 Activity Feed** (Home).
3. **Tier 2 — Découverte** (F10-A, account-scoped, sur la fiche Compte).
4. **V2 — Coach** (F13, live) : explicitement reporté. V1 = Brief + Mémoire + OS Relationnel.

## 9. Vérifier la fidélité (obligatoire avant tout commit touchant une surface)
9 garde-fous dans `generateur/garde-fous/`. Pour toute surface HTML produite/refactorée par la couche Générateur :
```
export KNOWR_REF=<repo>/generateur/templates-reference
KNOWR_OUT=<dossier-surfaces> python3 generateur/garde-fous/sync_css.py
KNOWR_OUT=<dossier-surfaces> python3 generateur/garde-fous/validate_hero.py
KNOWR_OUT=<dossier-surfaces> python3 generateur/garde-fous/validate_css_primitives.py
KNOWR_OUT=<dossier-surfaces> python3 generateur/garde-fous/validate_css_hygiene.py
KNOWR_OUT=<dossier-surfaces> python3 generateur/garde-fous/validate_structure.py
KNOWR_OUT=<dossier-surfaces> python3 generateur/garde-fous/validate_signals.py
KNOWR_OUT=<dossier-surfaces> python3 generateur/garde-fous/validate_contact_coverage.py
KNOWR_OUT=<dossier-surfaces> python3 generateur/garde-fous/validate_compterendu.py   # fiches *compte-rendu*
KNOWR_APP=<dossier-app>      python3 generateur/garde-fous/validate_app_charte.py    # couche Application
```
> **Convention de nommage des garde-fous** : ils valident une **trio canonique** nommée exactement `knowr-personne.html`, `knowr-reunion.html`, `knowr-compte.html` (+ `knowr-compte-rendu.html`) dans le dossier ciblé. Les fichiers de `exemples-reels/` portent des noms descriptifs (réf. de rendu) : ils servent de **vérité visuelle**, pas de cible à repasser dans `validate_hero`.

En portant les surfaces vers React, garde ces garde-fous comme **tests de non-régression** : un composant Personne doit produire le **même hero 3 blocs**, les **mêmes tokens**, la **même structure de sections** que la référence.

## 10. Ce qu'il ne faut JAMAIS faire
- Inventer une donnée non sourcée (violation #1 de la doctrine).
- Changer la charte / les polices / la palette « pour faire mieux ».
- Mettre un CDN ou du localStorage **dans une surface** de fiche.
- Affirmer un poste sur une seule source.
- Supprimer un des 3 blocs du hero, ou les objections d'une Réunion commerciale.
- Introduire une UI étrangère sans spec.

## 11. Par où commencer (toi, l'agent)
1. Lis `generateur/INSTRUCTIONS-CLAUDE.md` en entier, puis `specs-moteur/` (spec-15, 16, 18, 19, 23, 26, 27, 28, 29).
2. Ouvre `templates-reference/exemple-*.html` et `app-shell-reference/knowr-app.html` dans un navigateur — c'est le rendu cible.
3. Extrais les tokens de `knowr-design-system.css` → `src/design-system/tokens.css` + config Tailwind.
4. Construis le shell (Tier 0) en reproduisant `knowr-app.html` (sidebar + zone détail + ouverture in-shell).
5. Implémente les surfaces une par une (Personne → Réunion → Compte → Compte-rendu), en validant contre les garde-fous.
6. Branche la persistance, puis les signaux, puis la découverte.
