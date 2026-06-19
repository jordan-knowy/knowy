# TRANSFERT MOTEUR — Knowr (générateur de surfaces relationnelles)

> **Pour : Jordan (CTPO).** Document de passation **complet et autoportant** sur le
> *moteur de génération* des surfaces Knowr. Il consolide la méthode telle qu'elle a
> été **prouvée** sur deux clients réels (Carroz, Manolys) : doctrine, méthode en 4
> phases, pattern d'assemblage exact, garde-fous, et deux sets de référence livrés.
>
> Il complète — sans le remplacer — `README-HANDOFF.md`, `AGENTS.md`/`CLAUDE.md` et
> `generateur/specs-moteur/`. En cas de doute sur un composant, **les specs font foi**.

---

## 0. Ce que tu as entre les mains

```
knowr-platform/
├── README-HANDOFF.md            ← démarrage repo / build app (lis-le en 1er)
├── AGENTS.md / CLAUDE.md        ← manuel d'agent (Codex / Claude Code)
├── app-shell-reference/         ← l'OS Relationnel (shell), rendu cible
├── generateur/
│   ├── TRANSFERT-MOTEUR.md      ← CE FICHIER (le moteur, méthode prouvée)
│   ├── INSTRUCTIONS-CLAUDE.md   ← méthode détaillée du générateur
│   ├── assembler-surface.py     ← ⟵ NOUVEAU : assembleur réutilisable
│   ├── README.md
│   ├── specs-moteur/            ← spec-15 … spec-29 (doctrine + moteur), font foi
│   ├── garde-fous/              ← 9 validateurs Python + run_all.py (NOUVEAU)
│   └── templates-reference/     ← charte unique + exemples canoniques (rendu cible)
└── exemples-reels/
    ├── (AAEP, Calomatech…)      ← exemples antérieurs
    ├── set-carroz/              ← ⟵ NOUVEAU : triade validée (3 surfaces)
    └── set-manolys/             ← ⟵ NOUVEAU : set validé (4 surfaces)
```

Une **surface** = un fichier HTML autonome (polices en base64, zéro CDN, zéro
localStorage), dans la charte « Violet Trust ». Un **brief** = un **ensemble** de
surfaces croisées (voir §2).

---

## 1. Doctrine — non négociable

Ces règles priment sur l'esthétique et sur toute envie de « remplir ».

1. **Zéro-hallucination.** Un champ sans source vérifiable = `null` / « à confirmer ».
   On n'invente **jamais** un téléphone, un titre, une coordonnée, un effectif, un
   chiffre. *Un champ vide vaut mieux qu'un champ plausible.*
2. **Emploi = double source.** Un poste n'est « confirmé » que si **(1)** headline /
   signature **ET (2)** une source secondaire concordent. Un « je rejoins X » ou un
   « a rejoint le groupe X » LinkedIn ≠ emploi → « à confirmer ». *(Sur les deux sets,
   les titres venaient de la **signature email** = source primaire fiable ; quand une
   2e source manque, on le signale.)*
3. **Provenance par champ** (spec-21) : chaque donnée porte `Observable` / `Inféré` /
   `Public` / `Non-observable`. Un **score** est **toujours `Inféré`** (autorisé si
   tagué Inféré **et** calculé sur des événements réels).
4. **Comportement > titre.** Le radar et la posture se déduisent du **style email
   observable**, pas du titre. Confiance basse si peu d'échanges → l'écrire.
5. **Objections obligatoires** sur une réunion commerciale, et **ancrées sur du réel**
   (pas génériques).
6. **CA / pipeline ≠ score relationnel.** Ne jamais mélanger valeur business et chaleur
   de la relation.
7. **CSS = charte uniquement.** Seules les `var(--x)` et les classes de la charte.
   Nouveau besoin visuel = **nouvelle spec**, jamais de CSS improvisé.
8. **Autonomie inter-client.** Une surface d'un client ne mentionne **jamais** un autre
   client. (Piège vécu : une comparaison « vs Carroz » glissée dans le Compte Manolys →
   retirée. Toujours auditer.)
9. **Connecteurs = lecture seule** pour bâtir un brief réel. **Aucune action d'écriture**
   (envoi, suppression, création d'événement, mutation CRM, label). L'« envoi » dans la
   fiche Réunion est une **maquette UI** (double validation) — il n'envoie rien.

---

## 2. L'architecture des surfaces (spec-15 + spec-26)

Un brief = **Réunion (entrée)** + **Compte** + **une fiche Personne par contact
*analysé*** (dont on a lu les propres mails). Les contacts mineurs / vus en copie
restent une **ligne « à confirmer »** dans la table du Compte, avec un bouton
**Générer** (stub) — **pas** de fiche.

Les 4 types de surface et leur template de référence :

| Type | Template de référence | Sections (`sec-*`) |
|---|---|---|
| Compte | `exemple-compte.html` (⚠ maigre — voir note) | sec-mem, sec-sante, sec-ctx, sec-ona, **sec-meetings**, sec-contacts (+ bloc **Pénétration**), **sec-discover** (F10-A), sec-power |
| Personne | `exemple-personne.html` | sec-mem, sec-profil, sec-jtbd, sec-pos, sec-reunions |
| Réunion (commerciale) | `exemple-reunion-commerciale.html` | sec-m5, sec-obj, sec-questions, sec-tom, sec-meddpicc, sec-obj2, sec-piv, sec-snap |
| Compte-rendu (4e surface) | `exemple-compte-rendu.html` | voir spec-27 |

> **Note canon Compte (important) :** le Compte « au bon niveau » porte **8 sections**,
> y compris **`sec-meetings`** (Réunions du compte : À venir / Passées → Préparation /
> Compte-rendu) et **`sec-discover`** (F10-A · Étendre la couverture relationnelle :
> identification proactive de profils manquants, sortis en **« à confirmer » / EXEMPLE
> MAQUETTE**), plus le bloc **Pénétration du compte** en tête de `sec-contacts`. La
> référence Calomatech (`exemples-reels/knowr-compte-calomatech.html`) et les
> **spec-26 / 28 / 29** font foi. ✅ **P0 traité (juin 2026)** : `exemple-compte.html`
> **et** `exemple-compte-crm.html` ont été **régénérés au canon 8 sections** (sec-meetings
> + sec-discover inclus, bloc Pénétration en tête de `sec-contacts`). La garantie ne
> dépend donc plus d'un override : `validate_structure` dérive les 8 sections **du
> template** lui-même, et un garde-fou dédié **`validate_penetration`** vérifie le contenu
> du bloc Pénétration + la section F10-A. **Ne génère jamais un Compte sans ces blocs** —
> la batterie le refuse désormais (testé : un compte amputé échoue à structure ET pénétration).

**Type de réunion :** *Commercial* (vente / rétention / expansion → MEDDPICC +
objections) vs *Productivité* (partenaire / interne). Les deux clients livrés sont des
**réunions commerciales de rétention** (clients existants).

---

## 3. La méthode en 4 phases (le cœur)

### Phase 0 — Cartographie & lecture (obligatoire avant tout)
Lire dans la messagerie (lecture seule) **les mails propres de CHAQUE contact** :
- **signature = titre réel** (ex. Bruyères « Directrice d'Agence », Rodrigues
  « Assistante copropriété », Paté « Gestionnaire de Copropriété » — tous *verbatim*) ;
- **posture** (concis/formel, directif, courtois…) → nourrit le radar ;
- **objections réelles** et **dates** (ex. rectification F2026-2023686 le 30/03) ;
- identifier **qui décide** (EB) vs **qui exécute** (relais/admin) ;
- **scorer** chaque contact analysé ; **« à confirmer »** si non lu.

> Règle d'or : si tu n'as pas lu le mail d'une personne, tu ne lui inventes ni titre ni
> score. Tu la mets « à confirmer » + bouton Générer.

### Phase 1 — Rédaction du corps (`<body>`) par surface
Écrire le corps **dans la charte** (classes exactes du template), avec **données
réelles** et tous les flags `à confirmer` / `Inféré` / provenance. Aucune classe hors
charte (sauf inline). C'est la seule partie « manuelle ».

### Phase 2 — Assemblage (mécanique, scriptable)
`HEAD MAÎTRE` (de `exemple-compte.html`) + `CORPS` + `SCRIPT` du template, avec
**substitution des seules globales de données** (cf. §4). Fonctions de dessin
**inchangées**. → `assembler-surface.py` fait exactement ça.

### Phase 3 — Garde-fous + audit anti-fuite → zip → livraison
Lancer la batterie (`run_all.py`), corriger jusqu'au vert, **auditer l'absence de fuite
inter-client**, puis zipper et livrer (entrée par la Réunion).

---

## 4. Le pattern d'assemblage exact

### Head maître & `sync_css`
Le `<head>` de `exemple-compte.html` (~400 Ko : polices base64 + 2 `<style>`) est le
**superset** : il contient les primitives de **toutes** les surfaces (radar, profil,
dim, mem-dims, pos-m, acard, mrow, m5, tom, ct-tbl, pm-grid, sig-card…). En l'utilisant
**verbatim sur toutes les surfaces**, le CSS partagé est **md5-identique** →
`sync_css` passe. (md5 de référence observé : `e36210ce6b`.)

> **Exception connue :** la classe `.angle-tab` (onglets de la modale mail réunion)
> n'est **pas** dans le head maître. Solution retenue : **ne pas utiliser la classe**
> (les styles inline suffisent, rendu identique) → `css_primitives` reste vert. Ne
> **pas** ajouter ce CSS au head, sinon tu casses l'identité md5.

### Globales à substituer, par type

| Type | Globales (et rien d'autre) | Couleur courbe `drawMR` |
|---|---|---|
| compte | `MRC` (timeline), `nodes[]` + `edges[]` de `drawONA` | violet `#6E50C8` |
| personne | `RADAR_AXES` (4 axes), `MRP` (timeline) | sage `#2EA86A` |
| reunion | `ANGLES` (mail moteur d'action), `MRS` (timeline snap) | violet `#6E50C8` |

**Format `RADAR_AXES`** = `[{score},{score},{score},{score}]` pour les axes
`[Résultat↔Relation, Rapidité↔Analyse, Assertivité↔Adaptation, Innovation↔Conformité]`.
`score>50` ⇒ le **1er pôle** domine ; `drawRadar()` calcule les 4 pôles opposés par
`100-score`. (Ex. Paté = `[60,40,62,28]` → gardien de la conformité ; Rodrigues =
`[50,42,45,25]` → administratrice méticuleuse.)

**`MRC`/`MRP`/`MRS`** = `[{d:'label', s:0-100, ev:'événement'|null, type:'pos'|'neg'}]`.
Le `s` est **Inféré** mais chaque `ev` doit être un **événement réel daté**.

### Lancer l'assembleur
```bash
cd generateur
python3 assembler-surface.py --type compte \
  --body corps/manolys-compte.body.html \
  --data data/manolys-compte.json \
  --out ../exemples-reels/set-manolys/knowr-compte-manolys-immobilier.html \
  --ref templates-reference \
  --audit "AAEP,Vanessa,Carroz,Paté,FG Air"
```
`--audit` bloque l'écriture si un terme d'un **autre** client apparaît. La signature
`Optee · Pisteur.io` de Maxime est **légitime** (ne pas la lister comme fuite).

---

## 5. Les 10 garde-fous (et comment les lancer)

| Garde-fou | Vérifie | Scope |
|---|---|---|
| `sync_css` | CSS partagé md5-identique + 0 dépendance réseau | tout le set |
| `validate_hero` | hero canonique (anneau Confiance) | toutes |
| `validate_css_primitives` | chaque classe utilisée est définie dans la fiche | toutes |
| `validate_css_hygiene` | pas de variable CSS fantôme (warnings `--sans` / px = non-bloquants) | toutes |
| `validate_structure` | chaque surface couvre les `sec-*` de son exemple (Compte = **8 sections** : le canon vit dans le template, plus d'override) | toutes |
| `validate_signals` | spec-23 : 1-6 faits datés, scope, provenance, tri Churn→Risque→Levier→reste | toutes |
| `validate_contact_coverage` | table `.ct-tbl` : chaque contact scoré **ou** « à confirmer », rôle jamais affirmé sans source, contacts clés → fiche liée | **Compte uniquement** |
| `validate_penetration` | bloc **Pénétration** (barre + dénominateur + légende) **et** section **F10-A** présents ; profils découverts tagués « à confirmer » | **Compte uniquement** |
| `validate_compterendu` | 4e surface (spec-27) | compte-rendu seulement |
| `validate_app_charte` | shell app | app seulement |

**Point d'attention vécu :** `validate_contact_coverage` **et** `validate_penetration`
sont **scopés Compte**. Les pointer sur Personne/Réunion produit un **faux échec**.
→ `run_all.py` gère ces scopes automatiquement (`validate_penetration` s'auto-filtre).

**Gate non-contournable :** `generateur/garde-fous/check-reference-sets.sh` lance la
batterie sur les sets Carroz + Manolys et **sort en erreur sur rouge**. Il est câblé
dans `.githooks/pre-commit` (active-le : `git config core.hooksPath .githooks`) **et**
dans `.github/workflows/garde-fous.yml` (CI push/PR). La conformité ne dépend plus de
la discipline : un commit qui casse un set de référence est **bloqué**.

```bash
cd generateur/garde-fous
python3 run_all.py --ref ../templates-reference --out-dir ../../exemples-reels/set-manolys \
  compte=knowr-compte-manolys-immobilier.html \
  personne=knowr-personne-brigitte-bruyeres.html \
  personne=knowr-personne-elisabeth-rodrigues.html \
  reunion=knowr-reunion-manolys-immobilier.html
```

---

## 6. Scoring & provenance (résumé opérationnel)

- **Score relationnel** = moyenne **pondérée** de 3 dimensions *Intensité × Réciprocité
  × Récence*, calculée sur l'historique mail réel. Tag **`Inféré`**. La récence (silence
  prolongé) tire le score vers le bas. Ce n'est pas une moyenne arithmétique : un score
  peut différer de la moyenne brute des 3 barres (pondération).
- **Score compte** : santé de la relation au niveau du compte ; peut différer des scores
  individuels (ex. Manolys compte 48 alors que Bruyères 54 / Rodrigues 50 — tension
  paiement au niveau compte).
- **Radar** : `Inféré` du style email, **confiance explicite** (45-58 % quand peu
  d'échanges), chaque axe tagué `Observable`/`Inféré`/`Public`.
- **Power Map** : EB / Coach / exécution. Si l'EB n'est pas lu en direct → **« à
  confirmer »**, jamais affirmé (ex. Carroz : « Président » Louvier à confirmer).

---

## 7. Le moteur d'action (réunion, spec-25)

La fiche Réunion embarque une **modale mail à double validation** (`openMail` →
`askSend` → `confirmSend`) avec 2 angles (`ANGLES.rebond` / `ANGLES.valeur`) et la
**signature du compte Optee** (`Maxime Weinstein / Optee · Pisteur.io / maxime@optee.io`).

> **En l'état c'est une maquette** : `confirmSend()` n'affiche qu'un écran de
> confirmation, **aucun envoi réseau**. En production, le bouton « Confirmer » devra
> appeler le connecteur d'envoi **après** la 2e validation explicite de l'utilisateur —
> **jamais** d'envoi automatique.

---

## 8. Deux sets de référence livrés (étudie-les)

### `exemples-reels/set-carroz/` — triade, mono-contact + 1 à confirmer
Client **CARROZ IMMOBILIER** (syndic/agence, Les Carroz d'Arâches). Optee facture des
**commissions de désembouage** (exécution FG Air / Hamadi Sow).
- **Compte** 54 *Inféré* → tiède ; friction **conformité** (légendes photos Samoëns,
  02/04) ; silence depuis 11/04.
- **Personne Paté** 52 — *Gestionnaire de Copropriété* (verbatim) ; radar gardien de la
  conformité `[60,40,62,28]`.
- **Louvier** « Président » cité sur **un** devis, vu en copie → **à confirmer**, pas de
  fiche, bouton Générer. EB de la Power Map = à confirmer.
- **Réunion** commerciale : objection conformité réelle, moteur d'action vers Paté.
- *Illustre :* mono-contact, EB **à confirmer**, friction qualité documentaire.

### `exemples-reels/set-manolys/` — set 4 surfaces, bi-contact
Client **AGTI Manolys Immobilier** (syndic, Le Plessis-Trévise). Optee facture des
**opérations** (ISO COMB, DTG, audits — via Funt eco / LADES).
- **Compte** 48 *Inféré* ↘ tendu ; **impayés sans réponse** + risque trésorerie (27/04)
  + **litige de rectification** F2026-2023686.
- **Personne Bruyères** 54 — *Directrice d'Agence* (verbatim), décideuse directive
  `[62,55,65,35]` ; **EB inféré** (autorité de paiement à confirmer).
- **Personne Rodrigues** 50 — *Assistante copropriété* (verbatim), administratrice
  méticuleuse `[50,42,45,25]` ; gatekeeper facturation.
- **Réunion** commerciale : objection F2026-2023686 réelle, moteur d'action vers Bruyères.
- *Illustre :* bi-contact (les deux scorés + fiches liées → `contact_coverage` sans
  warning), EB inféré d'un titre confirmé, tension **financière** plutôt que qualité.

**Résultat garde-fous (les deux sets) : 7/7 applicables au vert**, zéro fuite
inter-client. `sync_css` md5 `e36210ce6b` identique partout.

---

## 9. Pièges rencontrés (pour t'épargner les allers-retours)

1. **`angle-tab`** absente du head → la retirer (inline), ne pas l'ajouter au head.
2. **`contact_coverage` scopé Compte** → ne jamais le pointer sur Personne/Réunion.
3. **Fuite inter-client** → auditer chaque sortie (`--audit`). « Pisteur.io » = OK
   (signature Maxime), pas une fuite.
4. **Score = pondéré, pas moyenne** → cohérence hero / es-stats / barres assurée par la
   pondération, pas l'arithmétique.
5. **Contact non lu = à confirmer** → jamais de titre/score inventé, bouton Générer.
6. **HTML long (>~1500 lignes)** → écrire le corps via `heredoc`/fichier puis assembler,
   pas en un seul gros bloc (risque de troncature).

---

## 10. État du P0 (traité) & prochaines étapes

**✅ P0 traité (juin 2026) — le moteur est fonctionnel et auto-protégé :**
- `exemple-compte.html` **et** `exemple-compte-crm.html` régénérés au **canon 8 sections**
  (sec-meetings + sec-discover + bloc Pénétration) — head/charte intacts (md5 `e36210ce6b`).
- Garde-fou dédié **`validate_penetration`** ajouté (bloc Pénétration + section F10-A).
- Override `REQUIRED_EXTRA` **supprimé** : le canon vit dans le template, pas dans le validateur.
- **Gate non-contournable** : `check-reference-sets.sh` + hook `.githooks/pre-commit` + CI
  `.github/workflows/garde-fous.yml` (bloquent sur rouge).
- **Audit Personne/Réunion vs variantes CRM fait** : pas d'écart équivalent — les `-crm`
  sont des *frères*, pas des sur-ensembles (mêmes sections, pas de sous-bloc CRM manquant).
- **Test négatif validé** : un Compte amputé des blocs échoue à `validate_structure` ET
  `validate_penetration` (rc≠0) — la garantie est réelle, pas théorique.
- **Checklist pré-vol (spec-24)** : à passer avant chaque livraison (provenance, à confirmer,
  anti-fuite, garde-fous verts) — désormais l'étape obligatoire de la Phase 3.

**Prochaines étapes (au-delà du P0) :**
- **Industrialiser l'assembleur** : générer le corps depuis un modèle de données
  structuré (le `--data` JSON existe déjà pour les globales ; reste à templatiser le corps).
- **Brancher le scoring réel** (Intensité/Réciprocité/Récence) sur l'historique mail.
- **4e surface Compte-rendu** (spec-27) après réunion, pour boucler Prepare → Remember.
- **Intégration shell** : rendre les surfaces dans l'OS Relationnel
  (`app-shell-reference/`) en composants React (nav persistante, détail pleine largeur).
- **RGPD / LIA** : finaliser l'argumentaire (préparation humaine assistée, pas de
  décision automatisée art. 22) — voir specs.

---

*Généré le 04/06/2026. Données clients issues d'Outlook (lecture seule) + signatures.
Tout champ non vérifié est marqué « à confirmer » — conformément à la doctrine zéro-hallucination.*
