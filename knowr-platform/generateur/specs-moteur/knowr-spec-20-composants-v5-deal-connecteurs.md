# Spec 20 — Composants v5 : Deal group, connecteurs, contacts actionnables, mémoire & position enrichies

> Complète les specs 15 (architecture 3 surfaces) et 16 (design system Violet Trust).
> Référence d'implémentation : `ui-references/real-data-emera/` (3 fiches générées sur données réelles Outlook — compte Groupe Emera / Benoit Chevalier).

## 0. Pourquoi cette spec
Les fiches canoniques Laura/Foncia couvraient un cas « reprise de compte » sans deal actif. Le cas Emera (deal actif, historique pluriannuel, friction) a fait émerger les composants manquants. Cette spec les normalise pour les trois surfaces.

## 1. Bloc « Sources connectées » (header — toutes surfaces)
Placé dans le `hero-header` (fond `--night`), en remplacement de l'ancienne ligne `hero-sources`.
- Liste des connecteurs **disponibles dans le workspace** : connecté → pastille `✓` (sage) ; non connecté → gain potentiel `+N%` (ambre).
- Ligne « Recommandé · Connecter X → +N% » + CTA « Gérer les connecteurs → ».
- Reflète la réalité de la donnée : pour Emera, Outlook + LinkedIn connectés (sources réelles), HubSpot/Slack non connectés.
- Classes : `.hsrc / .hsrc-t / .hsrc-list / .hsrc-i / .hsrc-on / .hsrc-off / .hsrc-ok / .hsrc-up / .hsrc-foot / .hsrc-reco / .hsrc-cta` (CSS dans les fiches Emera).
- Le CTA appelle l'ouverture du gestionnaire de connecteurs (no-op en statique).

## 2. Groupe « Deal » (surface RÉUNION) — quand il y a une opportunité active
Trois sections, insérées entre Theory of Mind et Recommandations :
- **MEDDPICC** — 8 lignes (M/E/D/D/P/I/C/C), chacune : badge lettre (violet) · libellé · statut · **3 pastilles de force** (sage ≥3 / ambre 2 / coral ≤1) · source. Les trous (force faible) deviennent les priorités de la réunion.
- **Concurrence & statu quo** — grille de cartes ; le statu quo est traité comme un concurrent à part entière.
- **Coût de l'inaction** — carte coral (perte chiffrée / fenêtre qui se referme / relation qui s'éteint).
> Zéro-hallucination : toute case non sourcée = « à confirmer / à quantifier », jamais inventée.

## 3. Mémoire Relationnelle enrichie (PERSONNE + COMPTE)
Structure complète d'un bloc Mémoire :
1. **Bandeau de stats** (`es-stats`) : Score relationnel · Ancienneté · Échanges.
2. **Bandeau « Reprise / état »** (`mem-alert` teinté sage) : `✅ Reprise en cours (+N pts / Xj) — …`.
3. **Graphe** (`drawMR`, voir §6) + légende.
4. **Trois dimensions à barres** (`mem-dims` → `dim-card` + `bar-track`/`bar-fill`) :
   - **Intensité** (volume/fréquence d'échanges) — bleu.
   - **Réciprocité** (équilibre des initiatives/réponses) — ambre/vert.
   - **Longévité** (ancienneté + nb d'opérations) — sage.
   Chaque dimension : score /100 + barre + 1 phrase d'explication sourcée.
5. Note de provenance (synthèse représentative d'événements sourcés).

## 4. Position dans l'organisation · signaux comportementaux email (PERSONNE)
Grille `pos-metrics` de **6 métriques**, chacune `pos-m` = libellé + valeur colorée + **barre** (`bar-track`/`bar-fill`, niveau faible→élevé) + explication :
Score d'initiative · Délai de réponse moyen · Longueur email moyenne · Coordination interne · Centralité réseau ONA · Périmètre décision.
Puis **Profil** (`pos-insight`, qui décide / périmètre) et **Risque** (`pos-warning`, coral).
> Valeurs dérivées du comportement email observé (Conf. indiquée). Niveau ≠ jugement de valeur : un score d'initiative bas peut être un signal de confiance.

## 5. Compte : ONA + contacts actionnables + Power Map
- **ONA** (`drawONA`) : hub fournisseur (coral) → contacts (couleur par rôle) + **white space** (traits pointillés) pour les non-contactés / le parc non adressé.
- **Table contacts** (`ct-tbl`) : Contact · Rôle Miller Heiman · Score MR · Dernier contact · Position · Fiche.
  - Contact **intégré** → `<a class="btn-brief btn-view">👁 Voir le brief</a>` (lien vers la fiche personne).
  - Contact **non intégré** → `<button class="btn-brief btn-gen" onclick="gen(name,email,title)">✦ Générer</button>`.
  - `gen()` → `sendPrompt('Génère un brief commercial pour … - <Compte>')` (création de fiche à la volée).
  - White space signalé en ligne (`ct-pos` coral).
- **Power Map** (`pm-grid`, 4 quadrants `pm-eb/pm-ub/pm-ch/pm-tb`) : Economic Buyer / Influenceur / Champion / Décideur technique, chacun avec `pm-contact` + `pm-signal` (ou `pm-warn` pour un white space).

## 6. Correctif graphe `drawMR` (CRITIQUE)
L'ancienne version dessinait à la largeur canvas par défaut (300 px) et utilisait des béziers qui ondulaient.
Version v5 :
- Lit `parentElement.clientWidth` et rend en **pleine largeur** (`canvas{display:block;width:100%}`), gestion `devicePixelRatio`.
- **Spline cubique monotone** (Hermite + bornage Fritsch-Carlson) → aucun overshoot.
- Grille horizontale légère, paliers de 10, points d'événement nets (sage positif / coral friction), tooltip au survol.
Implémentation de référence : `<script>` des fiches Emera (`function drawMR`).

## 7. RÈGLE responsive (piège à éviter)
Les composants compte (`ct-tbl`, `pm-grid`) ont des règles de collapse mobile **qui doivent rester dans un `@media(max-width:780px)`**. Ne jamais laisser `.ct-tbl td{display:block}` / `.pm-grid{grid-template-columns:1fr}` en CSS global — sinon la table s'empile et la Power Map passe à une colonne sur desktop. CSS corrigé : `ui-references/real-data-emera/compte-components.css`.

## 8. Récap placement par surface
| Composant | Réunion | Personne | Compte |
|---|---|---|---|
| Sources connectées (header) | ✅ | ✅ | ✅ |
| Mode 5 min / Objectif / ToM | ✅ | — | — |
| **MEDDPICC / Concurrence / Coût inaction** | ✅ | — | — |
| Reco / Objections / Pivots | ✅ | — | — |
| Levier · carte croisée | — | ✅ (→compte) | — |
| **Mémoire enrichie** (stats+bandeau+graphe+3 barres) | — | ✅ (sage) | ✅ (violet) |
| Profil radar + axes · JTBD | — | ✅ | — |
| **Position 6 métriques + Profil + Risque** | — | ✅ | — |
| Réunions (récentes + historique) | — | ✅ | — |
| Contexte entreprise | — | — | ✅ |
| **ONA** | — | — | ✅ |
| **Table contacts (Voir/Générer)** | — | — | ✅ |
| **Power Map pm-grid** | — | — | ✅ |
| Sidebar Signaux | — | ✅ | ✅ |

## 9. Type de Réunion → composition des blocs (mapping)
Le **format ne change jamais** (3 surfaces + Violet Trust). Seul le *type* de Réunion change l'accent header + la composition du groupe « métier ». Personne et Compte ne changent jamais.

| | **Commercial** (accent violet) | **Productivité** (accent teal) |
|---|---|---|
| Header | liseré/accents violet | liseré/accents teal + badge « Productivité » |
| Bloc métier | MEDDPICC · Concurrence & statu quo · Coût de l'inaction | Type de réunion (R10, en 1er) · Tensions actives · Sécurité psychologique & qualité de décision (Edmondson/Janis, R11) |
| Sortie | Reco · Objections · Next steps | Ordre du jour time-boxé · Décisions & Actions (artefact) · Anti-patterns & signaux d'alerte |
| Transverses (identiques) | Sources connectées · Mode 5 min · Objectif 3 tiers · Theory of Mind · Pivots | idem |

Notes :
- **Pas de Résumé exécutif séparé** : le Mode 5 min tient ce rôle (éviter la redondance).
- **Pré/Post** : « Avant la réunion » (prep) + « Décisions & Actions » (post). Ne pas dupliquer le post dans les signaux.
- **Objections** : sur un type Productivité, fusionner pushback + anti-patterns + signaux d'alerte en un seul bloc tight (pas de matrice d'objections commerciale).
- **Confiance par section** : badge `Conf. X% · Observable/Inféré` systématique (hérité des briefs legacy).
- Réf. d'implémentation : `ui-references/real-data-emera/knowy-reunion-productivite-laura.html`.

## 10. Snapshot « Relation avec le compte » sur la RÉUNION (courbe ancrée COMPTE)
La courbe d'évolution du score relationnel est **rattachée au Compte**, pas à un profil — car une réunion peut avoir **plusieurs participants** mais **un seul compte**. C'est le signal de température/trajectoire de la relation, lisible quel que soit le nombre de participants.

Sur la **Réunion** (les deux types) :
- **Cartes d'accès participants (N)** : chaque participant = score individuel + tendance + lien vers sa fiche Personne. Scale à N personnes.
- **Bloc `sec-snap` « Relation avec le compte »** (1), placé juste après les cartes d'accès : score **compte** (gros chiffre + tendance) · **courbe d'évolution du score compte** (`#chartSnap` + `drawMR`, points d'événement sage/coral) · descripteur compte (1 ligne, niveau stratégique) · bouton « 🏢 Voir le compte → ».
- **Pas de radar sur la Réunion.** Le radar (profil comportemental) est inhérent à *une* personne ; avec N participants il n'a pas de place unique. Il reste, complet, sur la fiche **Personne** (accessible via la carte d'accès).

> Règle : sur la Réunion, ce qui est **par personne** (score perso, radar) vit dans les cartes d'accès / la fiche Personne ; ce qui est **par compte** (courbe relationnelle, contexte) vit dans le snapshot. Aucune duplication du radar.

- Versions de référence : `knowy-reunion-productivite-laura.html` (compte Foncia, score 68) et `knowy-reunion-optee-emera.html` (compte Groupe Emera, score 47).
