# Spec 22 — Santé relationnelle du compte & posture CRM

> Complète specs 15 (3 surfaces), 20 (composants) et 21 (provenance). Référence : `ui-references/real-data-emera/knowy-compte-emera.html`.

## 0. Décision de cadrage (importante)
Le **chiffre d'affaires / pipeline n'est PAS un signal relationnel** et ne doit jamais entrer dans le score ni dans un bloc core. Deux raisons :
1. Une relation peut être excellente sur un petit compte et mauvaise sur un gros → mélanger brouille le signal que Knowy est seul à bien mesurer (sinon on ressemble à Gong/Clari).
2. On n'a pas toujours accès au CRM → un signal core ne doit jamais dépendre d'une source optionnelle (sans CRM : case vide = brief troué, ou inventée = mort du zéro-hallu).

**Posture** : le CA/pipeline est un **sidecar optionnel alimenté par le connecteur CRM** — affiché *seulement si* HubSpot/Salesforce connecté, jamais mêlé au score relationnel, jamais requis. Sans CRM → « à confirmer ». Knowy mesure la **relation**, depuis des signaux observables (email, agenda, LinkedIn).

## 1. Bloc « Santé relationnelle du compte » (surface COMPTE uniquement)
La santé relationnelle est une propriété **du compte** (mono-thread et couverture n'existent qu'en croisant plusieurs contacts) → jamais sur la Personne, jamais en bloc complet sur la Réunion.

**Emplacement : juste après la Mémoire Relationnelle, avant le Contexte entreprise.**
Lecture en paire : Mémoire = où on en est (score + trajectoire, rétrospectif) ; Santé = où on est exposé (risque + couverture + prochain pas, prospectif). ONA / Contacts / Power Map dessous = les preuves.

**3 métriques, 100 % sourçables sans CRM :**
1. **Concentration · mono-thread** — % des échanges du compte portés par un seul contact. >80 % = risque élevé (barre coral). Source Outlook. *Emera : 95 % sur Benoit.*
2. **Couverture du réseau de décision** — contacts en relation active / contacts pertinents identifiés. Source Outlook + LinkedIn. *Emera : 1/5.*
3. **Prochain contact à tisser** — celui qui dé-risque le plus le mono-thread, avec bouton « ✦ Générer son brief » (`gen()`). *Emera : Christophe Guyon (technique).*

+ **Encart risque** (`pos-warning`) reliant à la leçon vécue : la relation a failli mourir au départ de Mourad (Optee) ; côté client, tout repose sur un seul contact → multi-threader = priorité de dé-risquage.
+ **Ligne sidecar CRM** : CA/pipeline affiché seulement si CRM connecté, « à confirmer » sinon.

## 2. Écho sur la RÉUNION (chip, pas le bloc)
Dans le snapshot « Relation avec le compte » des 2 types de Réunion : un **chip d'alerte d'une ligne** (`⚠ Mono-thread · …`) quand la concentration est élevée. Pas le bloc entier — à l'entrée d'un RDV, savoir que tout le compte tient à l'interlocuteur en face est critique. Cohérent avec la règle : par-compte sur le Compte, simple signal sur la Réunion.
