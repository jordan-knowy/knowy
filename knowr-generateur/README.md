# Knowr — Kit générateur de briefs

Ce dossier permet de générer **3 fiches de préparation de réunion** (Personne · Réunion · Compte) à la charte Knowr, à partir de n'importe quel contexte de réunion.

## Comment l'utiliser (3 étapes)

1. **Décompresse** ce ZIP et **glisse l'intégralité du dossier** dans une conversation avec Claude (Opus de préférence). Si tu as des connecteurs (Outlook, Gmail, calendrier, CRM), active-les.
2. **Donne ton contexte** : soit tu colles les infos (qui tu rencontres, l'historique, le client), soit tu écris par exemple : *« J'ai une réunion la semaine prochaine avec [Nom] de [Société], génère les fiches Knowr — va chercher le contexte dans mon Outlook. »*
3. Claude lit `INSTRUCTIONS-CLAUDE.md`, applique le moteur, et te rend **3 fichiers HTML autonomes** (ils s'ouvrent dans un navigateur, même sans connexion).

## Ce qu'il y a dedans

- `INSTRUCTIONS-CLAUDE.md` — le mode d'emploi que Claude suit (commence par là si tu veux comprendre la logique).
- `templates-reference/` — la charte visuelle unique + 4 exemples réels finis (le rendu attendu) : Personne, Compte, et **deux** types de Réunion (Commerciale et Productivité).
- `specs-moteur/` — la doctrine produit (zéro-hallucination, provenance, 3 surfaces, signaux…).
- `garde-fous/` — 2 scripts Python qui garantissent que les 3 fiches sont cohérentes et autonomes avant livraison.

## Deux types de réunion

Knowr s'adapte au type de RDV :
- **Commercial** (externe) — prospect/client : préparation orientée deal (objections, concurrence, étapes de décision).
- **Productivité** (interne) — équipe/partenaire : préparation orientée dynamique de groupe (type de réunion, sécurité psychologique, tensions, décisions à acter).

Claude détecte le type depuis ton contexte. Tu peux aussi le préciser : *« c'est une réunion interne d'équipe »* ou *« c'est un RDV client de rétention »*.

## Le principe non négociable

Knowr **n'invente jamais**. Toute information non sourçable est affichée « à confirmer » plutôt que devinée. C'est ce qui rend les fiches crédibles en clientèle.

---
*Les 3 exemples fournis (Alterna / Ducourtieux) sont des cas réels servant de référence de rendu. Remplace-les par ton propre contexte.*
