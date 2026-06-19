# Knowr — Handoff plateforme (pour Jordan)

**But :** te donner *tout* pour construire la plateforme Knowr sur **Codex** ou **Claude Code**, sans rien réinventer ni casser la charte.

## Démarrage (2 minutes)
1. Décompresse ce dossier à la racine d'un repo git.
2. Ouvre-le dans **Codex** (lit `AGENTS.md`) ou **Claude Code** (lit `CLAUDE.md`). L'agent a alors *toute* sa feuille de route.
3. Dis-lui : *« Lis AGENTS.md/CLAUDE.md puis commence le Tier 0 : scaffold React+Vite+TS+Tailwind+shadcn, extrais les tokens de la charte, et reproduis le shell `app-shell-reference/knowr-app.html` (sidebar + ouverture de fiche in-shell). »*

## Ce qu'il y a dedans
- **`AGENTS.md` / `CLAUDE.md`** — le manuel d'agent : mission, charte-loi, doctrine, stack cible, structure de repo, mapping références→écrans, ordre de build, vérif garde-fous. **C'est le fichier central.**
- **`generateur/`** — la spécification exécutable du moteur : `INSTRUCTIONS-CLAUDE.md`, `specs-moteur/` (doctrine + moteur), `garde-fous/` (9 validateurs Python), `templates-reference/` (charte unique + exemples canoniques = rendu cible).
- **`app-shell-reference/`** — la **démo complète et exécutable** de l'OS Relationnel : `knowr-app.html` (shell : Home/Meetings/Comptes/Personnes/Paramètres/Mon compte, ouverture des fiches **dans** le shell, vue **pleine largeur**) **+ les 12 fiches** qu'il ouvre en iframe (Lexner Avocats, Adivisa Techno, Norévia, Margaux Vidal, NovaLab…). Ouvre `knowr-app.html` pour faire tourner la démo en local. Autonome (0 CDN / 0 localStorage), charte identique au maître (style#1 md5 `e36210ce6b`). *NB : ces fiches sont l'ancien jeu démo — les sets clients réels Carroz/Manolys sont dans `exemples-reels/`.*
- **`exemples-reels/`** — fiches générées sur **données réelles** (Calomatech, AAEP) : la doctrine en action (à confirmer / null / double-source / pénétration sourcée).

## Les 3 choses à ne pas négocier
1. **Charte figée** (Violet Trust) — on reproduit, on ne réinvente pas. Nouveau composant = nouvelle spec.
2. **Zéro-hallucination** — pas de source → « à confirmer » / `null`. Jamais inventer (coords, tél, taille, titre).
3. **Emploi = double source** — headline/signature **+** source secondaire, sinon « à confirmer ».

## V1 vs V2
V1 = **Brief (Prepare) + Mémoire relationnelle (Remember) + OS Relationnel (shell)**. Le **Coach live (F13) est reporté en V2**.

> Détail d'implémentation : le shell de référence ouvre les fiches en `iframe` (pour ne pas réécrire les surfaces HTML). En React natif, rends les composants de fiche directement dans la zone détail (`<Outlet/>`) — même résultat, nav persistante.

---

## Mise à jour (04/06/2026) — passation moteur + 2 sets clients réels
- **`generateur/TRANSFERT-MOTEUR.md`** — document de transfert **complet** sur le moteur :
  doctrine, méthode en 4 phases (Phase 0 lecture → corps → assemblage → garde-fous),
  pattern d'assemblage exact, scoring, moteur d'action, et pièges rencontrés. **À lire
  pour générer/maintenir des surfaces.**
- **`generateur/assembler-surface.py`** — assembleur réutilisable (head maître + corps +
  substitution des seules globales canvas) avec audit anti-fuite intégré.
- **`generateur/garde-fous/run_all.py`** — runner des 9 garde-fous sur un set
  (gère le scope `contact_coverage` = Compte uniquement). Testé : sets Carroz + Manolys
  **7/7 applicables au vert**.
- **`exemples-reels/set-carroz/`** (3 surfaces) et **`exemples-reels/set-manolys/`**
  (4 surfaces) — briefs réels validés, à étudier comme implémentations de référence
  (mono-contact + EB à confirmer vs bi-contact + EB inféré).

## Mise à jour (04/06/2026, P0 traité) — moteur auto-protégé
- **Canon Compte dans le template** : `exemple-compte.html` et `exemple-compte-crm.html`
  régénérés au canon **8 sections** (Réunions du compte + Pénétration + F10-A). Plus
  d'override dans le validateur — `validate_structure` lit le canon depuis le template.
- **Nouveau garde-fou `validate_penetration`** (bloc Pénétration + section F10-A, scope Compte).
- **Gate non-contournable** : `generateur/garde-fous/check-reference-sets.sh`, câblé dans
  `.githooks/pre-commit` (`git config core.hooksPath .githooks`) et `.github/workflows/garde-fous.yml`.
  Un commit qui casse un set de référence est **bloqué**. Test négatif validé (compte amputé → rouge).

---

## Mise à jour (04/06/2026) — Moteur de priorisation V3 + composant Verdict + Home v2

Couche **fusion & priorisation** dérivée empiriquement de 6 comptes réels (Manolys, Carroz, Calomatech, AAEP, Artesia, Emera) puis branchée dans le kit. Trois objets distincts : **signal** (fait, spec-23) → **pattern** (déclencheur fusionné) → **priorisation** (classement gravité × urgence).

- **`specs-moteur/knowr-spec-30-moteur-fusion-priorisation.md`** — le moteur : scoring d'un signal (décroissance **concave/Hill K=45 k=1.5**, polarité +/−, défensabilité bakée), fusion en **patterns** nommés, **Sévérité × Urgence**, **combinaison top-dominant bornée** (β 0,40 / 0,30), classement de portefeuille, propagation inter-comptes. **Formules gelées et validées.**
- **`generateur/moteur-reference/scoring_priorisation.py`** — implémentation de référence **exécutable** des formules (lance-la : elle ressort ORSO priorité 36,9). À porter en TS côté plateforme.
- **`specs-moteur/knowr-spec-31-composant-verdict.md`** — composant UI **`.v-card`** (verdict : pilote + posture + score + popover sév/urg) posé en **tête du rail Signaux** sur les fiches. Générique : la posture = **3 variables `--pst`**. CTA générique « Préparer une action → ».
- **Références live** : `app-shell-reference/knowr-compte-lexner-avocats.html` (fiche réelle avec verdict, posture *dé-risquer*) · `templates-reference/exemple-compte.html` (template canonique AAEP, posture *capitaliser*) · écran Home `#view-home` **dans le shell** `app-shell-reference/knowr-app.html` (Réunions + Portefeuille priorisé scrollable + rail Signaux droit ; plus de moyenne lissée).
- **specs 22/23/25/29** : pointeurs ajoutés (structurels → santé ; signaux = faits ; action = pattern pilote ; Home = layout v2).

**Ordre de build suggéré côté plateforme** : (1) porter `scoring_priorisation.py` en service TS ; (2) composant React `<VerdictCard>` (spec-31) en tête du rail ; (3) widget Home « Portefeuille priorisé » (tableau scrollable) alimenté par le service ; (4) retirer le stat « score global · moyenne pondérée » (interdit spec-22 §0).
