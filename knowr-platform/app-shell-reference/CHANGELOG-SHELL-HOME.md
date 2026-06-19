# MAJ Shell — Home + Onboarding (session CTPO)

Seul fichier modifié : `app-shell-reference/knowr-app.html`. Fiches, générateur, CI inchangés.

## Home (view-home)
- Carte **NPS déplacée en tête à gauche** du hero (4 colonnes NPS-led, scopé `@media(min-width:1001px)`).
- Table **Comptes · par NPS** : colonne **Action** ajoutée → `Ouvrir` (fiche, violet plein) sur ORSO / AAEP / Calomatech via `openFiche()`, `⚡ Générer` (blanc) sur les autres via `analyser()`. Footer "voir les 40" + bandeau légende (Promoteur ≥70 / Passif / Détracteur ≤50 + Ouvrir vs Générer).
- **Comptes · par priorité** : badge "pourquoi" (`pbadge` pd/pc/pdr) sur chaque ligne ; lignes avec fiche routées vers `openFiche()`.
- **Feed signaux** : action fiche par item (`Ouvrir le compte` / `⚡ Analyser` / `Brancher les sources`) à côté du feedback Pertinent.
- **Layout** : feed déplacé dans la colonne gauche (`.hcol-l`) ; colonne droite (`.hcol-r`) **sticky** sous la topbar (`top:90px`, la topbar fait 76px) + `max-height:calc(100vh - 104px)` (anti-rognage) ; rail droit compacté pour tenir à l'écran.

## Onboarding (sidebar + modale)
- Carte sidebar `.onb` (anneau conic-gradient) : **5 étapes** — 1 Analyser un compte, 2 Analyser une personne, 3 Générer un brief, 4 Activer la veille (`go('set')`), 5 Inviter ton équipe (`go('me')` + `openInvite()` = création de sièges).
- Modale d'accueil `#onb-ovl` (auto-open ~450ms) listant les 5 gestes.
- État 5/5 → carte `.done` : "✓ Prise en main terminée". JS exposé : `window.onbDo/onbStart/onbClose`.

## Logo
- Wordmark "Know r" embarqué en **base64** (transparent) dans `.sb-logo`, remplace le texte. Classe `.sb-logo-img`.

## Vérifs (Playwright, headless)
- Ouvrir → `view-detail` + iframe `knowr-compte-*.html` OK ; Générer → bascule en Ouvrir ; onboarding 5/5 → ✓ ; étape 5 → Mon compte + modale sièges ; mobile : hero replié, stack vertical, pas de scroll horizontal ; **0 erreur console**.

## À noter
- Pour que `Ouvrir` fonctionne, les fiches `knowr-compte-*.html` doivent rester **à côté** de `knowr-app.html` (iframe relatif) — c'est le cas dans `app-shell-reference/`.
- Garde-fou connu non bloqué ici : `validate_css_hygiene` flag `--pst/--pst-d/--pst-s` comme phantom (fix one-liner : whitelist/exempt fallback). Non relancé cette session.

## First-run sync (machine à états — nouveau)
Au chargement, la Home démarre sur un écran de synchronisation (les blocs `#home-data` sont masqués jusqu'à l'analyse). États : `#home-sync` → `sync-s0` (CTA *Synchroniser*, badge Outlook, microcopy RGPD) → `sync-s1` (barre 0→100 + étapes) → `sync-s2` (liste des comptes détectés, cap **5** offre gratuite, top 5 pré-coché, chip "à analyser" + source Outlook, upsell persistant) → `sync-s3` (loader analyse) → `#home-data` révélé.
- Cap dur 5 : `selToggle()` bloque le 6ᵉ et déclenche un **toast upsell** (`go('me')`). Bandeau `#free-banner` persistant en tête de Home.
- À la révélation, `syncReveal(false)` **filtre** la table NPS + Priorité aux comptes sélectionnés (masque les non-sélectionnés). `syncReveal(true)` = bouton "démo déjà synchronisée" (affiche tout, sans bandeau).
- JS isolé en IIFE en fin de body ; expose `window.syncStart/selToggle/analyzeSel/syncReveal`. Données comptes dans le tableau `ACCTS`.
- **Modale de bienvenue retirée** (plus d'auto-open) : les 5 étapes d'onboarding ne vivent plus que dans la carte sidebar.
- Verbes : *Synchroniser* (ingestion) puis *Analyser* (scoring), conformes à la taxonomie.

## Page Connexion self-serve (nouveau fichier `knowr-connexion.html`)
Porte d'entrée freemium, autonome (mêmes fonts Epilogue/JetBrains + variables que le shell, dédoublonnées). Layout split BOLD : panneau violet gauche (promesse « 30 secondes pour mesurer ton actif relationnel », 3 étapes, chips RGPD/sans CB) + formulaire droit.
- Choix provider **Google (Gmail) / Microsoft (Outlook)** (sélection → active le CTA).
- Champ **URL site web** (optionnel) + **description générée par l'IA et modifiable** (bouton « Générer depuis mon site » → mock : remplit un textarea éditable depuis le domaine ; en prod = appel IA réel sur l'URL). Seule la description est IA/éditable.
- CTA **« Accéder à Knowr → »** : `window.location='knowr-app.html'` → arrive sur l'écran de sync (S0). Doit donc rester à côté de `knowr-app.html`.
- Logo blanc embarqué en base64 pour le panneau violet. Responsive : stack vertical < 880px.
- Note : génération IA = mock front (à brancher backend) ; aucun appel réseau.

## Garde d'auth + déconnexion (démo end-to-end)
- `knowr-connexion.html` est désormais la **vraie première page**. Son CTA redirige vers `knowr-app.html?auth=1`.
- Le Shell porte un **garde** en tête de `<head>` : sans `?auth=1` dans l'URL → `location.replace('knowr-connexion.html')`. Ouvrir le Shell directement renvoie donc d'abord sur la connexion (auth-gated, comme en prod).
- **« Se déconnecter »** ajouté dans *Mon compte* (à côté de *Modifier*) → `location.href='knowr-connexion.html'` : permet de rejouer tout le parcours en démo.
- Mécanisme volontairement sans backend (flag URL) : à remplacer par la vraie session/OAuth côté prod. Les deux fichiers doivent rester ensemble.
- (Rappel : `knowr-app.html` contient un 2ᵉ document HTML résiduel en fin de fichier — fiche « Alterna Énergie » — présent dès l'original, sans impact sur le rendu ; à nettoyer un jour.)

## Loaders multi-étapes (style Apple) + connexion affinée
- Les chargements **sync (S1)** et **analyse (S3)** passent d'une barre unique à un **stepper vertical** : étapes validées une à une (pending → spinner actif → ✓ violet), ligne de progression qui se remplit. Fonction réutilisable `runStepper(elId, steps, done)`.
  - S1 : Connexion à Outlook · Lecture des en-têtes · Détection des comptes · Préparation de ton espace.
  - S3 : Lecture des signaux · Calcul du score NPS · Détection risques & leviers · Classement par priorité.
  - Icônes emoji remplacées par des **SVG nets** (éclair / barres).
- **Connexion** : panneau gauche épuré — suppression des 3 étapes numérotées et des chips ; ajout d'un **aperçu produit en verre dépoli** (compte scoré + anneau 72), dégradé plus profond + lueur douce. Panneau droit inchangé.

## Déploiement Netlify — index.html
- La page de connexion devient **`index.html`** (porte d'entrée servie à la racine). `knowr-connexion.html` supprimé (entrée unique).
- Les redirections du shell (garde d'auth + « Se déconnecter ») pointent désormais vers `index.html`.
- **Netlify** : déployer le dossier `app-shell-reference/` comme *publish directory* (pas de build command — site statique). `index.html` est servi à la racine ; `knowr-app.html`, les fiches et les polices restent à côté (liens relatifs).
