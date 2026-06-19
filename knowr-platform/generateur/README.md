# Knowr — Générateur de briefs (base v8)

**Point de départ propre, sans erreur.** Toute génération doit :
1. Recopier la structure des `templates-reference/exemple-*.html` (référence canonique — ne pas improviser).
2. Réutiliser le `<head>` maître de `exemple-compte.html` (superset, 2 blocs `<style>`).
3. Lire `INSTRUCTIONS-CLAUDE.md` (doctrine) + `specs-moteur/` (spec 25 = architecture Réunion v2 & moteur d'action).
4. Passer les **9 garde-fous** (`garde-fous/`) avant livraison — voir §6 d'INSTRUCTIONS.

Les erreurs historiques (barres CSS, var fantôme, sections manquantes, hero incomplet, signaux mal triés, dérive typo) sont **bloquées automatiquement** par les garde-fous. **v7 ajoute la couverture relationnelle** (spec-26) : compte + **tous** les contacts scorés et analysés depuis leurs propres mails, fiche Personne pour chaque contact clé, aucun rôle affirmé sans lecture — `validate_contact_coverage.py`.

**v8 ajoute** : une **4ᵉ surface Compte-rendu** (état « Après », par personne : impact score + objectifs + tâches — spec-27, `validate_compterendu.py`) ; des **composants de fiche CRM** (badge Enregistrer, coordonnées + enrichissement, **pénétration du compte** sourcée, tendance + next steps, panneau Découverte account-scoped — spec-28) ; et une **couche Application** séparée (le shell : Home/Meetings/Comptes/Personnes/Paramètres/Mon compte — spec-29, `app-shell-reference/`), **non soumise aux garde-fous** car ce n'est pas une sortie de l'IA.

---

# Knowr — Kit générateur de briefs

Ce dossier permet de générer **4 surfaces** (Personne · Réunion/Préparation · Compte · **Compte-rendu**) à la charte Knowr, à partir de n'importe quel contexte de réunion.

## Comment l'utiliser (3 étapes)

1. **Décompresse** ce ZIP et **glisse l'intégralité du dossier** dans une conversation avec Claude (Opus de préférence). Si tu as des connecteurs (Outlook, Gmail, calendrier, CRM), active-les.
2. **Donne ton contexte** : soit tu colles les infos (qui tu rencontres, l'historique, le client), soit tu écris par exemple : *« J'ai une réunion la semaine prochaine avec [Nom] de [Société], génère les fiches Knowr — va chercher le contexte dans mon Outlook. »*
3. Claude lit `INSTRUCTIONS-CLAUDE.md`, applique le moteur, et te rend **3 fichiers HTML autonomes** (ils s'ouvrent dans un navigateur, même sans connexion).

## Ce qu'il y a dedans

- `INSTRUCTIONS-CLAUDE.md` — le mode d'emploi que Claude suit (commence par là si tu veux comprendre la logique).
- `templates-reference/` — la charte visuelle unique + 4 exemples réels finis (le rendu attendu) : Personne, Compte, et **deux** types de Réunion (Commerciale et Productivité).
- `specs-moteur/` — la doctrine produit (zéro-hallucination, provenance, 3 surfaces, signaux…).
- `garde-fous/` — 9 scripts Python qui garantissent que les 3 fiches sont cohérentes et autonomes avant livraison.

## Deux types de réunion

Knowr s'adapte au type de RDV :
- **Commercial** (externe) — prospect/client : préparation orientée deal (objections, concurrence, étapes de décision).
- **Productivité** (interne) — équipe/partenaire : préparation orientée dynamique de groupe (type de réunion, sécurité psychologique, tensions, décisions à acter).

Claude détecte le type depuis ton contexte. Tu peux aussi le préciser : *« c'est une réunion interne d'équipe »* ou *« c'est un RDV client de rétention »*.

## Le principe non négociable

Knowr **n'invente jamais**. Toute information non sourçable est affichée « à confirmer » plutôt que devinée. C'est ce qui rend les fiches crédibles en clientèle.

---
*Les 3 exemples fournis (Alterna / Ducourtieux) sont des cas réels servant de référence de rendu. Remplace-les par ton propre contexte.*

---
**Charte unique, non négociable (v8).** L'implémentation reproduit EXACTEMENT l'UX/UI/CSS des références — fiches comme app. Sameness des fiches imposée par la machine (`sync_css` = CSS identique au MD5 + structure/primitives/hygiène) ; fidélité de l'app imposée par `validate_app_charte.py`. Aucun droit de proposer un design différent : un manque se règle par une **spec**, pas par une improvisation de code.
