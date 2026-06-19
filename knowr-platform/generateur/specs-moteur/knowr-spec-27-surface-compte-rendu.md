# Spec-27 — Surface Compte-rendu (état « Après ») · v8

## Pourquoi une 4ᵉ surface
La préparation est **prospective** (objectif, questions, objections, next-best-action).
Le compte-rendu est **rétrospectif** (ce qui a été décidé, ce qui a changé, engagements, delta de score, sync CRM).
Intentions inverses → **type de fiche distinct**. On NE surcharge PAS la préparation.

## Même famille, même surface Réunion
Le compte-rendu est l'**état « Après »** de la surface Réunion, accessible via un bascule
**Préparation ◀▶ Compte-rendu** (le « Avant / Après »). Une réunion = une surface, deux états dans le temps.
Même charte Violet Trust, même `<head>` superset.

## Structure (canonique — voir templates-reference/exemple-compte-rendu.html)
1. **Bascule Préparation/Compte-rendu** en tête de `.col-main` (`.cr-toggle`).
2. **Hero** : Impact net relation · Objectifs atteints (X/3, anneau) · Date de réunion. (variante du hero 3-blocs)
3. **Objectifs de la réunion · atteinte** : les 3 tiers de la prépa (min/nominal/stretch), chacun avec une **pastille de statut cliquable** (`.objchip` : Manqué → Partiel → Atteint).
4. **Par personne présente** (le cœur — `.pcard` par participant) : pour CHAQUE personne présente,
   - **Impact sur le score** : avant → après, delta, **pas +/− en séance** (recalcule delta + barre + impact net) ;
   - **Atteinte de l'objectif** individuel : pastille de statut cliquable ;
   - **Tâches à réaliser** : liste cochable (owner + échéance) + note de séance.
5. **Décisions & points clés** (niveau réunion).
6. **Sync CRM** : Valider / Ignorer (double validation, jamais automatique).

## Ce que le CR alimente (le pont vers la mémoire)
- Le **delta de score** par personne devient la **« Tendance · depuis la dernière réunion »** de sa fiche Personne (spec-28).
- Les **engagements** deviennent ses **« Prochain pas »**.
Le CR n'est donc pas une archive morte : c'est la **source de fraîcheur** de la mémoire relationnelle.

## Alimentation & doctrine
- Alimenté par : **saisie en séance** + **ingestion transcript** (F18 : Read.ai / Fathom / Meet).
- Si les valeurs sont projetées (réunion non encore tenue) → marquer **« exemple maquette »**.
- Un CR réel ne contient que du sourcé (transcript / saisie) — zéro-hallucination maintenu.
- Correspond à la feature **F14** (« résumé post-réunion + sync CRM », le moment magique).

## Garde-fou
`garde-fous/validate_compterendu.py` : exige le bascule + au moins un bloc personne présente,
et que **chaque** bloc personne porte impact-score + atteinte-objectif + tâches.
