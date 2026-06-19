# Spec 21 — Provenance, horodatage & état « à confirmer »

> Couche transverse de confiance. Référence d'implémentation : `ui-references/real-data-emera/knowy-compte-emera.html` et `knowy-personne-benoit-chevalier.html`.

## 0. Principe
Tout chiffre affiché porte **sa source + deux dates + sa méthode**, et tout ce qui n'est pas calculable affiche **« à confirmer »** au lieu d'un nombre plausible. C'est la matérialisation visible de la doctrine zéro-hallucination.

## 1. Les deux dates (à ne pas confondre)
- **Synchro** : fraîcheur de la *source* (« Outlook · synchro 01/06/2026 14:32 »). Répond à « est-ce à jour ? ».
- **Fenêtre de calcul** : sur quoi le chiffre est *calculé* (« 67 échanges · juil. 2023 → avr. 2026 »). Répond à « calculé sur quoi ? ».

## 2. Composants
- **Ligne de provenance `.prov`** (sous chaque métrique) : chip source (`Outlook · Observable` vert / `Inféré` violet / `Sources publiques` bleu) + synchro + fenêtre.
- **Hover `.ic` (i)** : tooltip « Comment c'est calculé » = méthode/formule en une phrase + note de bas (`tip-f`). CSS-only (`:hover`).
- **État `.tbc` « à confirmer »** : remplace le chiffre quand aucune source dure ; le hover explique pourquoi + l'action pour sourcer.
- **Fix clipping** : `.csec.open>.csec-body{overflow:visible}` pour que les tooltips débordent des sections en accordéon.

## 3. Règles de classement (par élément)
| Cas | Affichage |
|---|---|
| Comptage direct (échanges, dernier contact, dates) | chiffre + `Outlook · Observable` |
| Calculé depuis l'observable (score, Intensité/Réciprocité/Longévité, initiative, délai médian, longueur, centralité) | chiffre + source + **méthode au hover** |
| Inféré (radar comportemental, JTBD) | chiffre **conservé**, chip `Inféré` + Conf. % + méthode au hover (« pas un test psychométrique ») |
| Public (effectifs, CA, établissements) | chiffre + `Sources publiques` + origine |
| Non observable (autorité budgétaire, Economic Buyer, score d'un contact à 0 échange) | **« à confirmer »** + raison + action |

## 4. Effet mesuré sur le compte Emera
~30 % des éléments chiffrés basculent en « à confirmer », concentrés sur 3 poches : (a) uplift connecteurs (estimation), (b) contacts sans historique email (4/5 sur le Compte), (c) champs d'autorité/processus non observables. Une fiche Personne à fort historique tient à ~90 % ; un Compte large à interlocuteurs non contactés ~55 %. Chaque « à confirmer » devient un CTA (Générer / Connecter / confirmer en réunion).

## 5. Radar (décision produit)
Le radar est **conservé** sur la fiche Personne (jamais sur la Réunion), avec **hover méthode par axe** expliquant le signal email derrière chaque pôle. Choix assumé : *inféré transparent* plutôt que blanchi.

## 6. Couverture (4 surfaces)
La couche provenance est câblée sur les **4 surfaces** Emera :
- **Personne** : Mémoire (score + 3 dims), Position (6 métriques, dont « Périmètre de décision » en « à confirmer »), Radar (hover méthode par axe).
- **Compte** : Mémoire, Contexte (sources publiques), Contacts (4/5 en « à confirmer »), Power Map (Economic Buyer « à confirmer »).
- **Réunion Commercial** : snapshot compte sourcé + MEDDPICC avec source/hover par lettre et **E (Economic Buyer) + M (Metrics)** non sécurisés → priorités de réunion. Uplift connecteurs = « est. ».
- **Réunion Productivité** : snapshot compte sourcé + uplift connecteurs « est. ».
Références : les 4 fichiers de `ui-references/real-data-emera/`.
