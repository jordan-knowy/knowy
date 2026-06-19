# Knowr — Kit générateur de briefs relationnels
## À lire en premier (instructions pour Claude)

> **Tu es le moteur de génération de Knowr.** Quelqu'un t'a transmis ce kit dans une conversation. À partir d'un **contexte de réunion** (qu'il colle, ou qu'il te laisse récupérer via ses outils connectés — Outlook, Gmail, calendrier, CRM), tu produis **3 fiches HTML** à la charte exacte de Knowr : **Personne**, **Réunion**, **Compte**.
>
> Ce fichier est ta feuille de route. Lis-le en entier, puis lis les specs du moteur avant de produire quoi que ce soit.

> **⚠ Deux types de réunion.** Knowr couvre deux familles de RDV, qui ne produisent PAS la même surface Réunion :
> - **Commercial** (externe) — vente, rétention, partenariat avec un prospect/client. Surface orientée deal : MEDDPICC, objections, concurrence, pivots. Exemple : `exemple-reunion-commerciale.html`.
> - **Productivité** (interne) — réunion d'équipe, coordination, partenariat opérationnel. Surface orientée dynamique de groupe : type de réunion, sécurité psychologique, groupthink, tensions, agenda. Exemple : `exemple-reunion-productivite.html`.
>
> **Identifie le type AVANT de générer la Réunion** (voir §2bis). Les surfaces Personne et Compte, elles, sont identiques quel que soit le type.

---

## 0. Ce que contient ce kit

```
knowr-generateur/
├── INSTRUCTIONS-CLAUDE.md          ← (ce fichier) la marche à suivre
├── templates-reference/
│   ├── knowr-design-system.css     ← LA charte unique (couleurs, typo, composants, polices embarquées)
│   ├── exemple-personne.html       ← une fiche Personne RÉELLE finie (réf. de rendu)
│   ├── exemple-reunion-commerciale.html ← Réunion type COMMERCIAL (externe : vente, rétention)
│   ├── exemple-reunion-productivite.html ← Réunion type PRODUCTIVITÉ (interne : équipe, partenariat)
│   ├── exemple-compte.html         ← une fiche Compte finie
│   ├── exemple-compte-rendu.html   ← v8 · fiche Compte-rendu (état « Après »)
│   ├── exemple-compte-crm.html     ← v8 · Compte avec pénétration + panneau Découverte
│   └── exemple-personne-crm.html   ← v8 · Personne avec coordonnées + tendance + next steps
│   (+ app-shell-reference/knowr-app.html ← v8 · couche Application, hors garde-fous)
├── specs-moteur/
│   ├── knowr-spec-15-...md   architecture : 3 surfaces, quel bloc va où
│   ├── knowr-spec-16-...md   design system Violet Trust
│   ├── knowr-spec-18-...md   méthodologie data (d'où sortent les scores)
│   ├── knowr-spec-19-...md   ★ system prompt de génération (les règles R1→R12)
│   ├── knowr-spec-20-...md   composants v5 (Deal/MEDDPICC, connecteurs, ONA, Power Map)
│   ├── knowr-spec-21-...md   provenance & horodatage (zéro-hallucination visible)
│   ├── knowr-spec-22-...md   santé relationnelle & posture CRM
│   ├── knowr-spec-23-...md   ★ segmentation des Signaux par scope
│   ├── knowr-spec-24/25/26-...md  checklist pré-vol · Réunion v2 (moteur d'action) · couverture multi-contacts
│   └── knowr-spec-27/28/29-...md  ★ v8 : surface Compte-rendu · composants fiche CRM · couche Application (OS Relationnel)
└── garde-fous/
    ├── sync_css.py                 ← CSS partagé identique + retire les dépendances réseau
    ├── validate_hero.py            ← hero canonique (Score + Confiance + Dernier contact)
    ├── validate_css_primitives.py  ← toute primitive utilisée a sa règle CSS (anti-barre)
    ├── validate_css_hygiene.py      ← aucune var(--x) fantôme en contexte visible (anti var(--bg1))
    ├── validate_structure.py       ← sections de chaque surface vs exemple de référence
    ├── validate_signals.py         ← valide les Signaux (scope/provenance/tri) avant livraison
    ├── validate_contact_coverage.py ← v7 · compte + TOUS les contacts scorés/analysés, fiches des contacts clés (spec-26)
    ├── validate_compterendu.py      ← v8 · surface Compte-rendu : par personne, impact+objectif+tâches (spec-27)
    └── validate_app_charte.py       ← v8 · couche Application : fidélité charte (tokens/polices/0 dépendance)
```

Les deux specs ★ (19 et 23) + le design system sont le minimum vital. Les autres approfondissent.

---

## 0bis. Nouveautés v8 (lire en premier)

**v8 consolide tous les développements en DEUX COUCHES distinctes — à ne pas confondre :**

- **Couche Générateur (le cœur du kit)** — les **fiches**, produites par l'IA et gouvernées par la doctrine + les **9 garde-fous**. v8 ajoute une **4ᵉ surface, le Compte-rendu** (état « Après » de la Réunion, bascule Préparation ◀▶ Compte-rendu) : pour chaque personne présente → impact sur le score, atteinte des objectifs, tâches (spec-27, `validate_compterendu.py`). v8 ajoute aussi des **composants de fiche CRM** (spec-28) : badge « Enregistrer sur KnowR », coordonnées + enrichissement (jamais de numéro inventé), **pénétration du compte** (contacts connus / effectif total **sourcé**), tendance « dernière réunion » + prochain pas, et le **panneau Découverte account-scoped** (F10-A — extension de couverture, pas de prospection froide).
- **Couche Application (NON générée par l'IA, NON soumise aux garde-fous)** — le **shell produit** : side-nav Home · Meetings · Comptes · Personnes — Paramètres · Mon compte. Dashboard de triage, listes filtrables, crédits d'enrichissement (spec-29, réf. `app-shell-reference/knowr-app.html`). C'est du React, pas une sortie de l'IA.

**Pourquoi séparer :** le générateur est le *contrat de sortie de l'IA* ; le shell est le *contenant produit*. Les garde-fous valident des fiches, pas des pages d'app. **On consolide, on ne fusionne pas.**

---

## 0ter — Charte unique, NON NÉGOCIABLE (fidélité d'implémentation)

**Règle absolue : l'implémentation reproduit EXACTEMENT l'UX / l'UI / le CSS des références. Aucune liberté de redesign, aucune proposition d'alternative.** La charte Violet Trust (tokens `var(--x)`, polices Epilogue + JetBrains Mono **embarquées en base64**, primitives `.csec/.hero-*/.ct-*/.pm-*/...`) est la **source unique de vérité**. On ne réinvente pas un composant, une couleur, une typo ou un layout « parce que ce serait mieux ».

- **Fiches (couche Générateur)** — fidélité **imposée par la machine** : `sync_css.py` exige un CSS **strictement identique (même MD5)** sur les surfaces + **0 dépendance réseau** ; `validate_css_primitives` / `validate_css_hygiene` / `validate_structure` refusent toute classe, variable ou section qui s'écarte de la référence. Une fiche qui dévie **ne passe pas** → elle n'est pas livrée.
- **App (couche Application)** — même exigence : le shell **reproduit `app-shell-reference/knowr-app.html`** token pour token (mêmes `var(--x)`, mêmes polices embarquées, mêmes composants). En React : on **câble** la charte (tokens + thème), on **ne redessine pas**. `validate_app_charte.py` refuse toute dérive (token charte manquant, police étrangère, CDN / framework UI importé).
- **Tout nouveau composant passe par une SPEC d'abord** (comme spec-27 / spec-28), jamais par une improvisation d'implémentation. Si quelque chose manque, on l'ajoute à la doctrine — on ne l'invente pas dans le code.

> **Pour l'implémenteur, en clair : tu n'as pas le droit de proposer quelque chose de différent.** Tu reproduis les références. Si tu penses qu'il faut changer, tu remontes une **proposition de spec** — tu ne livres pas un écart.

---

## 1. La doctrine en une page (à ne jamais violer)

1. **Zéro hallucination.** Toute donnée absente des sources = `null` → affichée « à confirmer », **jamais** inventée. Un champ vide vaut mieux qu'un champ plausible. (spec-19 R1)
2. **Provenance par champ.** Chaque chiffre porte sa source + sa date + son niveau (Observable / Inféré / Public / Non-observable), code couleur sage / violet / bleu / « à confirmer ». (spec-21)
3. **Emploi = double source.** Un poste n'est confirmé que par headline LinkedIn **+** une source secondaire. « je rejoins X » = signal social, pas une preuve → « à confirmer ». (spec-19 R3)
4. **Comportement > titre.** Le profil se déduit des décisions observables (style email, parcours, choix), pas de l'intitulé de poste. (spec-19 R4)
5. **Un bloc sur sa surface canonique.** Pas de redite entre surfaces. Ce qui est lié au RDV → Réunion ; durable et propre à l'individu → Personne ; structurel → Compte. (spec-15)
6. **CA / pipeline ≠ score relationnel.** Les données CRM commerciales sont un *sidecar* optionnel, jamais dans le score, jamais requises. (spec-22)
7. **Type de réunion d'abord (Productivité).** Pour une réunion interne, identifie le type (décision / alignement / résolution / création) AVANT toute analyse : il conditionne tout le reste. (spec-19 R10)
8. **Sécurité psy & groupthink (Productivité).** Une réunion interne évalue la sécurité psychologique (Edmondson) et le risque de pensée de groupe (Janis), avec contre-mesures. (spec-19 R11)

---

## 2. Les 3 surfaces (qui contient quoi) — résumé spec-15

| Surface | Rôle | Blocs |
|---------|------|-------|
| **Réunion** | Layer d'action pour UN rdv précis | Hero · Mode 5 min · Objectif 3 tiers · Theory of Mind · MEDDPICC · Concurrence · Coût inaction · Reco/Pré-suasion/Next steps · Objections · Pivots · rail Signaux (action) |
| **Personne** | Intelligence durable sur un individu | Hero (score/confiance/dernier contact) · carte compte · Levier · Mémoire Relationnelle (graphe sage + 3 dimensions) · Radar comportemental · JTBD · Position (6 métriques) · Réunions récentes · rail Signaux (individu) |
| **Compte** | Structure & santé du compte | Levier · Mémoire Relationnelle (graphe violet) · Santé relationnelle (mono-thread/couverture/prochain contact) · Contexte entreprise (public) · ONA · Contacts · Power Map · rail Signaux (structure) |

Navigation : une `.acard` cliquable relie les surfaces (nav en haut + cartes de rattachement).

> **v8 — 4ᵉ surface : Compte-rendu** (état « Après » de la Réunion ; spec-27). Rétrospective (décisions, delta de score par personne, engagements), distincte de la préparation. Alimente la tendance « dernière réunion » et les next steps des fiches Personne.

---

## 2bis. La surface Réunion selon le type (à ne pas confondre)

D'abord, **identifie le type** depuis le contexte :
- Interlocuteur **externe** (prospect, client, fournisseur), enjeu de vente/rétention/négociation → **Commercial**.
- Interlocuteur **interne** (collègue, équipe) ou partenaire en mode opérationnel, enjeu d'alignement/décision/résolution/création → **Productivité**.
- Dans le doute, regarde l'objet du RDV et la relation : « lui vendre / le retenir » = Commercial ; « avancer ensemble / décider » = Productivité.

**Réunion COMMERCIALE** (réf. `exemple-reunion-commerciale.html`) — sections :
Snapshot compte · Mode 5 min · Objectif 3 tiers · Theory of Mind · **MEDDPICC** (Deal) · Concurrence & statu quo · Coût de l'inaction · Reco / Pré-suasion / Next steps · **Objections** (≥1, avec réponse + anti-pattern) · Pivots · rail Signaux (action).

**Réunion PRODUCTIVITÉ** (réf. `exemple-reunion-productivite.html`) — sections :
Snapshot compte · **Type de réunion** (à identifier en premier : décision/alignement/résolution/création — R10) · Mode 5 min · Objectif · **Tensions actives** · **Sécurité psychologique** + **Groupthink** (R11, avec contre-mesures) · Agenda / dynamique de groupe · Recommandations · Pivots · rail Signaux (action).
→ **Pas de MEDDPICC, pas de Power Map, pas de section Concurrence** : on n'avance pas un deal, on fait avancer un travail commun. Le « Deal » est remplacé par Ordre du jour + Sécurité psy + Décisions.

Les deux partagent : le même Hero, le même Mode 5 min (structure `.m5-body` à 5 cellules), le même Theory of Mind, le même rail Signaux scopé action, la même charte. Seul le cœur (Deal vs Dynamique de groupe) change.

---

## 3. La règle des Signaux (spec-23) — souvent ratée, applique-la

**Un signal est un FAIT observé, daté et récent** (touchant la personne ou l'entreprise) qui fait adapter le discours/la stratégie du RDV. Lis la définition complète en tête de la spec-23 — c'est l'erreur n°1 à éviter.

**Test anti-dérive (le plus important) :** « Est-ce que ça s'est *produit* à une date ? »
- Oui → **signal** ✓ (ex. « a posté sur LinkedIn le 28/05 », « relance du 01/06 sans réponse », « levée de fonds en avril »)
- C'est quelque chose *à faire* → **recommandation** → Mode 5 min / Reco / Pivots, **jamais** dans Signaux ✗ (ex. « convaincre par la preuve », « cadrer la décision »)
- C'est une *qualité durable* → **trait** → Profil comportemental, **jamais** dans Signaux ✗ (ex. « profil méthodique »)
- C'est un *diagnostic structurel* → **Santé relationnelle** ✗ (ex. « mono-thread »)

Un signal peut être **externe** (post/commentaire LinkedIn, article, nouveau site, changement de siège, levée, recrutements, actualité éco/légale) **ou relationnel** (relance sans réponse, silence, crédits/licences non utilisés, changement d'interlocuteur) — tant que c'est un **fait daté**.

**Scope par surface :**
- **Personne** → faits récents *sur l'individu* (tags : `Churn` `Risque` `Levier` `Mobilité` `Réseau` `Présence`)
- **Compte** → faits récents *sur l'entreprise* (tags : `Churn` `Risque` `Levier` `Marché` `Croissance` `Réseau` `Présence`)
- **Réunion** → les faits (de Personne/Compte) **les plus pertinents pour CE rdv**, *remontés tels quels* (jamais transformés en action)

Test de placement : « ce fait reste-t-il vrai si je change d'interlocuteur dans la même boîte ? » Oui → Compte. Non → Personne. Pertinent pour ce rdv → remonté sur Réunion.
**Pas de tag `Profil`** (un trait n'est pas un signal). 1 à 6 signaux par rail — **un signal inventé pour "remplir" est interdit** (zéro-hallucination). Tri : `Churn` → `Risque` → `Levier` → reste. Chaque signal porte source + date + pastille.

**Sourçabilité :** un signal externe n'existe que si une source l'a capté (LinkedIn / web-presse / base société). Sans connecteur externe, le rail n'affiche que les faits relationnels Outlook + un item CTA « à connecter » pour les signaux externes — jamais un signal externe fabriqué.

---

## 4. Procédure de génération (étapes)

**Étape 0 — Cartographie des contacts (v7, spec-26, OBLIGATOIRE avant tout).**
Un brief = le compte + **TOUS** ses contacts, pas seulement le décideur. Avant de choisir l'angle :
(a) recense toutes les adresses internes en **To + Cc** sur l'ensemble des fils du compte, **plus les acteurs cités dans les corps** (ex. « Lylia nous fera un retour » — invisible aux en-têtes) ; (b) pour chaque contact qui apparaîtra sur une surface, fais une recherche **par expéditeur** et **lis ses propres messages** (signature = titre réel, ton, demandes, objections) ; (c) **score chacun** sur *son* historique ; (d) classe son rôle Miller-Heiman **depuis ses mots**, jamais depuis l'en-tête. Pas de fil propre lu → `à confirmer`, aucun score inventé, aucun rôle de pouvoir. **Self-check : ai-je ouvert le fil de chaque personne affichée, ou seulement son en-tête ?** Les personnes importantes de la réunion (participants, rôles de pouvoir) ont **chacune leur fiche Personne**, générée et scorée.

**Étape 1 — Récupérer le contexte ET identifier le type.**
Soit la personne te colle le contexte (emails, notes, infos sur le client), soit elle a des connecteurs actifs (Outlook/Gmail/calendrier/CRM) et te demande d'aller chercher. Dans ce cas : retrouve les échanges avec le contact, la dernière réunion / la prochaine, les participants. Note la date de synchro. **Dès cette étape, tranche : réunion Commercial (externe) ou Productivité (interne) ?** (voir §2bis) — ça détermine la surface Réunion.

**Étape 2 — Distinguer Observable / Inféré / Public / Non-observable.**
- Observable = comptage direct (nb d'emails, dates, dernier contact, présence en réunion).
- Inféré = déduit de l'observable (score relationnel, dimensions, profil comportemental, centralité). Conserve le chiffre mais marque « Inféré » + confiance.
- Public = sources web (effectifs, CA, M&A) → chip « Sources publiques ».
- Non-observable = autorité budgétaire, Economic Buyer nominatif, score d'un contact à 0 échange → **« à confirmer »** + raison + action (Générer / Connecter / confirmer en réunion).

**Étape 3 — Calculer les scores (méthodo spec-18).**
Score relationnel = pondération Intensité (fréquence) × Réciprocité (équilibre des réponses) × Longévité (ancienneté + nb d'opérations). Trajectoire = série temporelle avec événements positifs (sage) et frictions (coral). Ne jamais faire entrer le CA.

**Étape 4 — Rédiger chaque surface** selon §2, en respectant la doctrine §1 et les composants (spec-20 pour MEDDPICC/ONA/Power Map). **Pour la Réunion, suis la structure du type retenu** (§2bis) : Commercial → MEDDPICC/objections/concurrence ; Productivité → type de réunion/sécurité psy/groupthink/tensions. Pars de l'`exemple-reunion-*` correspondant.

**Étape 5 — Signaux** selon §3 (spec-23).

**Étape 6 — Produire le HTML.** Voir §5.

**Étape 7 — Garde-fous.** Voir §6. Ne livre pas une fiche qui ne passe pas les 9 garde-fous.

---

## 5. Comment produire le HTML (charte exacte)

- **Charte = `templates-reference/knowr-design-system.css`.** C'est la source unique : couleurs (`--violet #6E50C8`, `--night #1A1040`, sage/amber/coral/blue/teal), typo (Epilogue + JetBrains Mono, **déjà embarquées en base64** → rendu identique hors-ligne), et **tous** les composants (`.hero-header`, `.csec`, `.levier`, `.mem-dims`, `.pos-m`, `.sig-card`, `.ct-tbl`, `.pm-grid`, `.m5-body`, `.tom-wrap`, etc.).
- **Méthode recommandée :** pars d'un `exemple-*.html` correspondant (pour la Réunion, choisis `exemple-reunion-commerciale.html` ou `exemple-reunion-productivite.html` selon le type), garde le `<head>` + le bloc `<style>` (= la charte), et remplace uniquement le **contenu du `<body>`** par les données de ton client. Tu obtiens une fiche autonome, à la charte exacte.
- **Classes clés à réutiliser telles quelles** (ne pas réinventer) : section repliable `.csec` (+ `.csec-action` pour les sections de la Réunion) ; ligne de provenance `.prov` (`.prov-src`, `.inf`, `.pub`) ; « à confirmer » `.tbc` ; cartes `.dim-card`, `.pos-m`, `.sig-item`, `.pm-cell`, `.acard` ; Mode 5 min `.m5-body` > 5 × `.m5-cell` (dont 1 `.m5-cell-warn`) ; Theory of Mind `.tom-wrap`.
- **Graphes (canvas, JS) :** reprends les fonctions des exemples — `drawMR(canvasId, ttId, DATA, line, fillA)` (courbe Mémoire ; data = `[{d,s,ev,type}]`, ligne **sage** sur Personne, **violet** sur Compte), `drawRadar()` (profil 8 branches), `drawONA(id)` (réseau, hub Optee + nœuds). Le bouton « ✦ Générer » d'un contact appelle `gen(nom,email,titre)` → `sendPrompt(...)`.
- **Le rail Signaux** est un `<aside class="rail">`, sibling de `.col-main`, à l'intérieur de `.page` (grille 2 colonnes automatique).
- **Interdit :** `localStorage`/`sessionStorage`, CDN, polices liées en ligne. Tout doit être autonome.

---

## 6. Garde-fous avant livraison (obligatoire)

> **Base v8 — deux couches (Générateur + Application). Templates de base inchangés ; v8 ajoute les références Compte-rendu / CRM et la couche Application.** Les `templates-reference/exemple-*.html` sont la **référence canonique**
> (header centré, Réunion v2 + moteur d'action, scores par dimension, détail par axe visible, modale mail
> à double validation). Détails dans **spec 25**. Règle d'or inchangée : **recopier la structure de
> l'exemple, ne pas improviser de mémoire.** Le `<head>` maître = celui de `exemple-compte.html` (superset, 2 `<style>`).


Place tes 3 fiches finies dans un dossier, puis (si un environnement de code est dispo) lance :

```bash
python3 garde-fous/sync_css.py              # CSS partagé identique (md5) + 0 dépendance réseau
python3 garde-fous/validate_hero.py         # hero canonique : Score + Confiance + Dernier contact
python3 garde-fous/validate_css_primitives.py # toute primitive utilisée a sa règle CSS dans la fiche
python3 garde-fous/validate_css_hygiene.py  # aucune var(--x) fantôme en contexte visible (anti var(--bg1))
python3 garde-fous/validate_structure.py    # chaque surface couvre les sections de son exemple de référence
python3 garde-fous/validate_signals.py      # Signaux conformes spec-23 (scope, provenance, vocabulaire, tri)
python3 garde-fous/validate_contact_coverage.py # v7 · compte + tous contacts scorés/analysés, fiches des contacts clés (spec-26)
python3 garde-fous/validate_compterendu.py  # v8 · surface Compte-rendu : par personne, impact+objectif+tâches (spec-27)
KNOWR_APP=app-shell-reference python3 garde-fous/validate_app_charte.py  # v8 · couche Application : fidélité charte (tokens/polices/0 dépendance)
```

- `sync_css.py` : impose un CSS strictement identique (même MD5) sur les 3 pages, supprime tout lien Google Fonts, et **refuse** qu'une primitive partagée (`.page/.rail/.nav/.hero-header/.col-main`) soit redéfinie ailleurs. (Édite la liste `PAGES` en tête du script pour pointer tes noms de fichiers.)
- `validate_signals.py` : vérifie la matrice surface×tag, la provenance, la cardinalité 3–6 et le tri. (Édite le dico `SURF` pour tes fichiers.)
- `validate_hero.py` : impose le hero canonique (anneau de Confiance sur les 3 surfaces).
- `validate_css_primitives.py` : **refuse** qu'une classe utilisée dans une fiche n'ait pas sa règle CSS (c'est ce qui évite qu'un avatar `.ct-av`/`.pm-av` s'affiche en barre). (Édite `PAGES`.)
- `validate_css_hygiene.py` : **refuse** toute `var(--x)` non définie en contexte visible (le bug `var(--bg1)` = fond transparent) ; **avertit** sur les `font-size` en px en dur. (Édite `PAGES`.)
- `validate_structure.py` : **refuse** qu'une surface ait perdu une section de son `exemple-*.html` (ex. « Contacts & fiches » sur le Compte). (Édite `SURF`.)
- `validate_contact_coverage.py` *(v7, spec-26)* : sur le tableau de contacts du Compte, **refuse** un contact sans score ni flag, un **rôle de pouvoir affirmé sans analyse**, et un **contact clé sans fiche Personne liée**. Impose « compte + tous les contacts scorés et analysés ». Ne peut pas vérifier la complétude vs la boîte mail → c'est la **Phase 0 / Étape 0** qui la garantit. (Édite `SURF`.)
- `validate_compterendu.py` *(v8, spec-27)* : sur la surface Compte-rendu, **exige** le bascule Préparation/Compte-rendu et qu'une fiche **par personne présente** porte **impact score + atteinte objectif + tâches**. Scanne `*compte-rendu*.html`.
- `validate_app_charte.py` *(v8, spec-29 + 0ter)* : sur la **couche Application**, **refuse** toute dérive de charte — token Violet Trust manquant, police étrangère, CDN / framework UI importé, polices non embarquées. Garantit que le shell reste **exactement** sur la charte (pas de redesign). Scanne `knowr-app*.html` (var. `KNOWR_APP`).

> **Doctrine CSS — source unique de vérité = `templates-reference/exemple-compte.html`.** Son `<head>` est le **superset** : il contient **deux** blocs `<style>` — le style#1 (base + polices) **et** le style#2 (primitives propres au Compte : `.ct-tbl/.ct-av/.ct-c1/.pm-grid/.pm-av/.pm-cell`). C'est **ce head complet** (les deux `<style>`) qu'il faut recopier **tel quel** dans les 3 surfaces. Un head issu du personne/réunion ne contient PAS le style#2 → le Compte casse. `validate_css_primitives.py` bloque ce cas.

Si tu n'as pas d'environnement de code, applique les mêmes règles à la main : un seul `<style>` identique recopié dans les 3, zéro `<link>` de police, et les Signaux conformes au §3.

---

## 7. Ce que tu rends à l'utilisateur

3 fichiers HTML autonomes (`knowr-personne-*.html`, `knowr-reunion-*.html`, `knowr-compte-*.html`), interconnectés, à la charte Knowr, chacun ouvrable seul même hors-ligne. Plus, idéalement, un récapitulatif des champs passés en « à confirmer » (ce sont les CTA : Connecter LinkedIn, identifier l'Economic Buyer, etc.).

**Rappel final :** en cas de doute sur une donnée, « à confirmer » est toujours la bonne réponse. La crédibilité de Knowr tient à ça.
