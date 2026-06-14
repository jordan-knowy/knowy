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
│   └── exemple-compte.html         ← une fiche Compte finie
├── specs-moteur/
│   ├── knowr-spec-15-...md   architecture : 3 surfaces, quel bloc va où
│   ├── knowr-spec-16-...md   design system Violet Trust
│   ├── knowr-spec-18-...md   méthodologie data (d'où sortent les scores)
│   ├── knowr-spec-19-...md   ★ system prompt de génération (les règles R1→R12)
│   ├── knowr-spec-20-...md   composants v5 (Deal/MEDDPICC, connecteurs, ONA, Power Map)
│   ├── knowr-spec-21-...md   provenance & horodatage (zéro-hallucination visible)
│   ├── knowr-spec-22-...md   santé relationnelle & posture CRM
│   └── knowr-spec-23-...md   ★ segmentation des Signaux par scope
└── garde-fous/
    ├── sync_css.py                 ← rend les 3 pages strictement identiques en CSS + retire les dépendances réseau
    └── validate_signals.py         ← valide les Signaux (scope/provenance/tri) avant livraison
```

Les deux specs ★ (19 et 23) + le design system sont le minimum vital. Les autres approfondissent.

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

**Étape 7 — Garde-fous.** Voir §6. Ne livre pas une fiche qui ne passe pas les deux contrôles.

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

Place tes 3 fiches finies dans un dossier, puis (si un environnement de code est dispo) lance :

```bash
python3 garde-fous/sync_css.py        # 1 seule charte recopiée à l'identique dans les 3 + 0 dépendance réseau
python3 garde-fous/validate_signals.py # Signaux conformes spec-23 (scope, provenance, vocabulaire fermé, tri)
```

- `sync_css.py` : impose un CSS strictement identique (même MD5) sur les 3 pages, supprime tout lien Google Fonts, et **refuse** qu'une primitive partagée (`.page/.rail/.nav/.hero-header/.col-main`) soit redéfinie ailleurs. (Édite la liste `PAGES` en tête du script pour pointer tes noms de fichiers.)
- `validate_signals.py` : vérifie la matrice surface×tag, la provenance, la cardinalité 3–6 et le tri. (Édite le dico `SURF` pour tes fichiers.)

Si tu n'as pas d'environnement de code, applique les mêmes règles à la main : un seul `<style>` identique recopié dans les 3, zéro `<link>` de police, et les Signaux conformes au §3.

---

## 7. Ce que tu rends à l'utilisateur

3 fichiers HTML autonomes (`knowr-personne-*.html`, `knowr-reunion-*.html`, `knowr-compte-*.html`), interconnectés, à la charte Knowr, chacun ouvrable seul même hors-ligne. Plus, idéalement, un récapitulatif des champs passés en « à confirmer » (ce sont les CTA : Connecter LinkedIn, identifier l'Economic Buyer, etc.).

**Rappel final :** en cas de doute sur une donnée, « à confirmer » est toujours la bonne réponse. La crédibilité de Knowr tient à ça.
