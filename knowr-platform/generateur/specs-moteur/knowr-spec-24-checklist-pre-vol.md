# 24 — Checklist pré-vol & erreurs fréquentes (à relire avant CHAQUE génération)

> Ce fichier capitalise les erreurs déjà commises par le moteur pour qu'elles ne se reproduisent pas.
> Règle de fond : **tout ce qui est vérifiable sur le HTML de sortie doit devenir un garde-fou** (script qui bloque),
> pas une simple consigne qu'on peut oublier. Ce qui ne l'est pas (récupération de données) devient une étape obligatoire ici.

---

## A. Récupération du contexte — AVANT toute analyse

### A0 · Cartographie de TOUS les contacts (v7, spec-26)
**Erreur déjà commise (Calomatech) :** contacts secondaires remplis depuis l'**en-tête** des mails — titre faux (« Stratégie » au lieu de « Chargée de marketing »), rôle inventé (« champion »), et une utilisatrice finale clé (**Lylia**, citée dans un corps de mail) jamais identifiée. La fiche passait tous les garde-fous : forme bonne, **couverture** absente.

**Règle :**
- Recenser **tous** les contacts du compte (To + Cc sur tous les fils) **+ les acteurs cités dans les corps**.
- Pour chaque contact affiché : **lire ses propres messages** (recherche par expéditeur) avant tout titre/rôle/score/lecture comportementale.
- **Scorer chacun** sur son propre historique ; pas de fil propre → `à confirmer`, jamais de chiffre inventé, jamais de rôle de pouvoir.
- Les personnes importantes de la réunion (participants, rôles de pouvoir, ★) ont **chacune leur fiche Personne**, liée depuis le Compte.
- **Self-check :** ai-je ouvert le fil de chaque personne affichée, ou seulement son en-tête ? → vérifié en partie par `validate_contact_coverage.py`.

### A1 · Ancienneté = plus ancien échange, TOUS SUJETS confondus
**Erreur déjà commise :** ancienneté affichée à ~2 mois alors que la relation datait de **~21 mois** — parce que le 1ᵉʳ contact avait été déduit du **fil du dossier en cours** (« sortie fondateur », avr. 2026) au lieu de l'historique complet (1ᵉʳ mail réel : sept. 2024, dossier précédent).

**Règle :**
- L'ancienneté et le point de départ de la courbe Mémoire Relationnelle se calculent sur le **plus ancien message observé, sans filtre de sujet**.
- Concrètement : lancer une requête **triée du plus ancien (`oldest`) sur l'expéditeur/le contact**, pas une recherche full-text sur le dossier courant.
  - Outlook : `outlook_email_search(sender=<email>, order='oldest')`.
  - Gmail : `search_threads(query='from:<email>', order oldest)` puis remonter à la 1ʳᵉ page.
- Récupérer aussi le **volume total** d'échanges (compteur) comme donnée Observable, plutôt que « élevé » au doigt mouillé.
- Un dossier récent n'est qu'**un** dossier : il ne fixe ni l'ancienneté, ni le début de la relation.

**Provenance attendue :** ancienneté → « 1ᵉʳ contact <date> · Outlook · Observable ». Si la boîte ne remonte pas avant une date, le dire (« historique boîte depuis <date> »), ne pas extrapoler.

### A2 · Trancher le type AVANT de générer (rappel spec 19 R10 / §2bis)
Commercial (externe, vendre/retenir) vs Productivité (interne/partenariat, avancer/décider). Un **prestataire** (avocat, expert-comptable, agence) = Productivité, jamais Commercial : pas de MEDDPICC ni Power Map.

---

## B. Rendu — invariants du hero (vérifiés par `validate_hero.py`)

### B1 · Le hero canonique a TOUJOURS 3 blocs
**Erreur déjà commise :** le hero a été réduit à 2 blocs (Score + Dernier contact) sur Personne et Compte → **l'anneau de Confiance a disparu** de 2 fiches sur 3. Le « score de confiance du brief » (spec 19 R12) est un invariant : il ne se supprime jamais.

**Règle (spec 15) :** hero = `hero-score-block` · `hero-conf-block` · `hero-last-block`, séparés par `hero-divider`.
- **Confiance** (`.hero-conf-block` → `.hero-conf-val` + `.hero-conf-label`) → **obligatoire sur les 3 surfaces.**
  - Personne / Compte : label « Confiance ».
  - Réunion : même bloc, label « Brief prêt » (c'est la complétude du brief, R12).
- **Score** (`.hero-score-block`) → obligatoire sur Personne et Compte (score relationnel / score compte).
- **Dernier contact** (`.hero-last-block`) → les 3 surfaces.

### B2 · L'arc de l'anneau doit suivre la valeur
L'anneau `.hero-conf-ring` de la charte a un `conic-gradient` **figé à 75 %**. Si la confiance affichée vaut 68 %, piloter l'arc en inline :
`style="background:conic-gradient(var(--violet) 0 68%, rgba(255,255,255,.12) 68% 100%)"`
(Réunion : remplacer `var(--violet)` par `var(--teal)`.) `validate_hero.py` émet un WARN si l'arc ≠ la valeur.

---

## C. Ordre de passage des garde-fous (avant livraison)

```bash
KNOWR_OUT=<dossier> python3 garde-fous/sync_css.py                  # CSS partagé identique (md5) + 0 dépendance réseau
KNOWR_OUT=<dossier> python3 garde-fous/validate_hero.py             # hero canonique : Score + Confiance + Dernier contact
KNOWR_OUT=<dossier> python3 garde-fous/validate_css_primitives.py   # toute primitive utilisée a sa règle CSS (anti-"barre")
KNOWR_OUT=<dossier> python3 garde-fous/validate_css_hygiene.py      # aucune var(--x) fantôme en contexte visible (anti var(--bg1))
KNOWR_OUT=<dossier> python3 garde-fous/validate_structure.py        # sections de chaque surface vs exemple de référence
KNOWR_OUT=<dossier> python3 garde-fous/validate_signals.py          # Signaux : scope, provenance, vocabulaire, tri
KNOWR_OUT=<dossier> python3 garde-fous/validate_contact_coverage.py # v7 · compte + tous contacts scorés/analysés, fiches des contacts clés (spec-26)
```
Ne pas livrer une fiche qui échoue à l'un d'eux (7 garde-fous). (Penser à adapter les dict `PAGES` / `SURF` en tête de chaque script à tes noms de fichiers.)

---

## D. Rappels doctrine (ne jamais violer — détail dans les specs 19/21/22)
- **Zéro hallucination** : champ sans source = `null` → « à confirmer ». Jamais un fait daté inventé pour « remplir » (vaut aussi pour la courbe MR : un point sans événement réel reste `ev:null`).
- **Emploi = double source** (headline + source secondaire) — spec 19 R3.
- **Comportement > titre** — spec 19 R4.
- **CA / pipeline ≠ score relationnel** — spec 22.
- **Head CSS maître = `exemple-compte.html` (superset, 2 blocs `<style>`)** : recopier le head complet sur les 3 surfaces, sinon les primitives Compte (`.ct-av/.pm-*`) manquent. `validate_css_primitives.py` le vérifie.
