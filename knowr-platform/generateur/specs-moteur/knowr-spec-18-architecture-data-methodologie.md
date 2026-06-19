# 18 — Architecture Data · Sourcing & Méthodologies comportementales
## Knowy — Spec Jordan v4 · Juin 2026
### Source : page Notion « 02 · ARCHITECTURE DATA » (KNOWY-ALGO) + Kit Jordan — consolidé pour v4

> Ce document répond à : **comment reproduire, identifier et aller chercher l'info**, et **avec quelles méthodologies comportementales**. C'est la moitié « moteur cognitif » du package (l'autre moitié = le system prompt, spec 19).

---

## 1. Ce que le moteur fait

Knowy = **moteur d'intelligence relationnelle ambiante**. Il transforme des signaux dispersés (emails, calendar, CRM, LinkedIn, données publiques) en un brief actionnable. Il répond à 7 questions : (1) qui compte vraiment dans cette réunion, (2) comment l'org décide, (3) quels risques relationnels/politiques, (4) comment adapter la communication, (5) quel niveau de détail/structure, (6) quelles objections/validations anticiper, (7) quelle stratégie conversationnelle.

**Ce que Knowy n'est pas** : un CRM, un assistant générique, un outil de profiling psychologique, un outil de transcription. **Ce qu'il est** : un système probabiliste avec scores de confiance, orienté préparation opérationnelle.

---

## 2. Architecture en 6 couches

| # | Couche | Rôle |
|---|--------|------|
| 1 | Interaction Style Modeling | comment communiquer efficacement avec la personne |
| 2 | Communication Signal Intelligence | analyse des patterns de communication observables |
| 3 | Organizational Network Analysis | dynamiques de pouvoir et d'influence |
| 4 | Decision Dynamics Modeling | comment l'organisation décide |
| 5 | Business Context Intelligence | contexte stratégique de l'entreprise |
| 6 | Adaptive Recommendation Engine | transformer l'analyse en recommandations concrètes |

Pipeline : `Sources → Extraction des signaux → Scoring relationnel → Moteur d'inférence → Validation JSON → Synthèse LLM → Rendu HTML (3 surfaces v4)`.

---

## 3. Où chercher l'info — sources & niveau de confiance

### Sources externes
| Source | Données | Confiance |
|--------|---------|-----------|
| LinkedIn profil (public) | titre, séniorité, parcours | 🟠 Moyen |
| LinkedIn posts | ton, sujets, style | 🟠 Moyen |
| Site entreprise / organigramme | positionnement, hiérarchie | 🟠 Moyen |
| Communiqués / presse | levées, rachats, tensions | 🟢 Élevé |
| Job boards | priorités business, stack | 🟢 Élevé |
| Blog / interviews / podcasts | vision, vocabulaire, leadership | 🟢 Élevé |
| Bases entreprises (Pappers…) | CA, effectifs, secteur | 🟢 Élevé |

### Sources internes
| Source | Données | Confiance |
|--------|---------|-----------|
| Gmail / Outlook | historique, ton, objections, engagements | 🟢 Très élevé |
| Calendar | fréquence, initiative, participants | 🟢 Élevé |
| CRM | stade deal, montant, notes | 🟢 Très élevé |
| Slack / Teams | dynamique équipe, mentions, canaux | 🟢 Élevé |
| LinkedIn connecté | réseau, interactions | 🟢 Élevé |

### Mémoire Knowy
Person memory (préférences interactionnelles) · Relationship memory (objections, validations, momentum) · Org memory (cartographie politique) · Meeting memory (dit/validé/promis).

### Règle d'identification d'emploi (stricte)
Un poste actuel est confirmé **uniquement si** : headline LinkedIn = entreprise X **ET** au moins une source secondaire corrobore (RocketReach courant, site, presse). Un post « je rejoins X » ou « a rejoint le groupe X » = signal social, **pas** une confirmation. Sans double source → « à confirmer », jamais affirmé.

---

## 4. Moteur d'inférence — règles de scoring

### Niveaux d'inférence
| Niveau | Définition | Confiance |
|--------|-----------|-----------|
| OBSERVABLE | fait direct, source primaire | 60–90 % |
| INFÉRÉ | déduit de signaux convergents | 35–65 % |
| HYPOTHÉTIQUE | signal unique/faible, à valider | 15–35 % |
| NON DISPONIBLE | aucun signal → `null`, jamais inventé | 0 % |

### Dégradation temporelle (Halfaker — half-life decay)
< 30 j → 100 % · 30–90 j → 80 % · 3–6 mois → 60 % · 6–12 mois → 40 % · > 12 mois → 20 % · Mémoire comportementale Knowy → 70 % (stable).

### Conflits & seuils
Règles de conflit : **interne > externe**, **récent > ancien**.
Seuils de déclenchement : < 25 % brief minimal (« données insuffisantes ») · 25–40 % partiel (hypothèses marquées) · 40–60 % complet (incertitudes signalées) · 60–75 % complet (recos actives) · > 75 % complet (recos fortes + alertes).

### Scoring relationnel (alimente le graphe Mémoire Relationnelle)
Score 0–100 + phase (+/=/−) + indice de réciprocité, sur 3–4 dimensions : **intensité** des échanges, **réciprocité** (Blau — échange social), **longévité** (Granovetter — force des liens), avec décroissance (Halfaker). Stocké mensuellement dans `relational_score_history`.

---

## 5. Méthodologies comportementales

### Profil interactionnel — 4 axes (bipolaires)
AXE 1 Relation ↔ Résultat · AXE 2 Intuition ↔ Structure · AXE 3 Prudence ↔ Rapidité · AXE 4 Consensus ↔ Contrôle. *(Rendu UI = radar 8 branches, spec 16 §4. Un pôle à 100 % est impossible.)*

### 6 Interaction Modes
Challenger (rapide, direct, décision) · Validator (structuré, analytique, preuve) · Strategist (vision, impact business) · Operator (pragmatique, exécution) · Consensus Builder (alignement, coordination) · Explorer (curiosité, innovation).

### Analyse par choix de vie (≠ titre de poste) — feedback Romain Charvet
> L'analyse part des **décisions observables**, pas du poste. C'est le différenciateur produit confirmé en test terrain.

| Signal | Inférence | Confiance |
|--------|-----------|-----------|
| Expatriation / vie à l'étranger | tolérance à l'incertitude, mobilité | 🟠 Moyen |
| 3+ industries différentes | curiosité transversale, adaptabilité | 🟢 Élevé |
| Secteur dominant du parcours | références culturelles, sujets de connexion | 🟠 Moyen |
| Pivot de carrière volontaire | appétit pour le risque | 🟠 Moyen |
| Création d'entreprise passée | tolérance à l'ambiguïté | 🟢 Élevé |

### 15 fondements académiques (et où ils vivent dans le moteur)
Granovetter 1973 (liens faibles → scoring) · Kahneman 2011 (S1/S2 → profil cognitif + format du pitch) · Cialdini 1984/2016 (7 principes + Pre-Suasion → reco influence + veille de réunion) · Burt 1992 (trous structuraux → ONA/position réseau) · Christensen 2003 (Job-to-be-Done → agenda individuel/org) · Weick 1995 (sensemaking → vente interne) · Johnston & Bonoma 1981 (Buying Center → contexte compte) · Spiro & Weitz 1990 (vente adaptative → Pivots) · Slovic 1987 (perception du risque → coût de l'inaction) · Leach 2009 (types de réunions → Productivité) · Edmondson 1999 (sécurité psychologique → Productivité) · French & Raven 1959 (bases du pouvoir → participants) · Janis 1972 (groupthink → Productivité) · Halfaker 2013 (decay → scoring) · Blau 1964 (échange social → réciprocité).

---

## 6. Détection du type de brief / réunion
| Type | Détection auto | Enjeu |
|------|----------------|-------|
| Commercial | contact externe + deal CRM actif | faire avancer un deal |
| Partenariat | contact externe + tag partenaire | faire avancer une relation |
| Productivité | contact interne / même domaine email | aligner, décider, débloquer |

*(Le type conditionne l'accent couleur du header Réunion — spec 15 §6. Pour Productivité, identifier le type de réunion AVANT toute autre analyse.)*

---

## 7. Règle absolue N°1 — Zéro hallucination
> Toute donnée non présente dans les sources fournies = **`null`**. Jamais inventée. Un MEDDPICC honnête à 3/8 vaut infiniment mieux qu'un 8/8 inventé. Chaque champ porte sa **source** et son **niveau de confiance**.

Origine : test terrain (Romain Charvet, AE Salesforce) — hallucinations corrigées : quota inventé, outils inventés, langue inventée → champ sourcé obligatoire + schéma JSON forçant `null`.
