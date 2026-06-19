# Spec 30 — Moteur de Fusion & Priorisation (V3)

## Knowr — Spec Jordan v1 · Juin 2026

> **Dérivée empiriquement de 6 comptes réels** (Manolys, Carroz, Calomatech, AAEP, Artesia, Emera) — pas d'une taxonomie a priori. S'appuie sur **spec-21** (provenance), **spec-22** (santé relationnelle) et **spec-23** (signaux). Alimente **spec-25** (moteur d'action) et **spec-29** (Home / triage).
>
> Problème résolu : spec-23 gouverne le signal *unitaire*. Mais une liste de signaux n'est pas un moteur de décision. Spec-30 définit ce qu'on **fait** des signaux : comment ils se **combinent** en déclencheurs nommés, comment on les **score** (gravité × urgence) et comment on **classe un portefeuille** de comptes.

---

## 0. Frontières (à respecter avant tout)

- **Spec-30 ne crée AUCUN nouveau tag de signal.** La matrice fermée de spec-23 §R3 (`Churn · Risque · Levier · Mobilité · Réseau · Marché · Croissance · Présence`) tient. Les déclencheurs de la V3 se mappent tous dessus.
- **Spec-30 ne déplace PAS les diagnostics structurels hors de la Santé.** Mono-thread, couverture, surface multi-sites, cicatrice = **spec-22**, jamais le rail Signaux (cf. spec-23 §0, test anti-dérive). La V3 les *consomme*, elle ne les requalifie pas en signaux.
- **Zéro-hallucination (spec-21).** Un pattern ne s'arme **que** sur des signaux réellement sourcés. Pas de source → pas de pattern. Jamais de score plausible fabriqué pour « remplir » une file.

---

## 1. Le scoring d'un signal (3 facteurs + polarité)

```
score(signal, t) = sévérité_base × décroissance(t) × confiance × défensabilité   ∈ [0, 100]
```

- **Polarité `+ / −`** — un signal est soit un **risque** (`−`), soit un **appui** (`+`). Le moteur n'est pas que défensif : un virement débloqué (Artesia, 04/05), un réengagement spontané (Emera, 18/03) sont des appuis **à capitaliser**. Un moteur sans polarité ne voit que ce qui brûle, jamais ce sur quoi s'appuyer. Un pattern sans polarité explicite est **rejeté**.
- **Décroissance concave bornée** *(validée sur 6 comptes — formules gelées)* — chaque facteur est borné dans [0,1], donc `sév ≤ sév_base ≤ 100` **par construction** (plus de multiplicateur > 1 qui crève le plafond ; la défensabilité est *bakée* dans `sév_base`, pas appliquée comme coefficient > 1).
  - Événements qui s'estompent : décroissance exponentielle `m(t) = 0.5^(âge / demi_vie)`.
  - Silence / cooling (la sévérité **croît** avec le temps puis plafonne) : courbe de **Hill** `m(j) = jᵏ / (jᵏ + Kᵏ)` avec **K = 45 j, k = 1.5**. Montée rapide puis étalement qui **garde de l'écart** au-delà de 50 j (54 j → 0,57 ; 90 j → 0,74 ; 180 j → 0,89), là où la version linéaire d'origine pegait toute la famille « cooling » à ~100.
  - Signaux structurels (couverture, surface) : `m = 1` (pas de temps).
- **Défensabilité / provenance** — un fait **first-party** (Outlook/Remember : « il nous a relancés 2× sans réponse de notre côté ») pèse plus qu'un scrape public commoditisé (Crunchbase, que tout concurrent voit). C'est le moat. Coefficient ∈ [1.0 commodité … 1.5 first-party]. Cohérent avec spec-22 §0 : ne jamais dépendre d'une source optionnelle (CRM) pour un score core.

---

## 2. Les patterns de fusion (déclencheurs nommés)

Un **pattern** combine un ou plusieurs signaux en un déclencheur actionnable et nommé. Deux familles :

- **Co-occurrence** — des signaux présents *ensemble* (ex. silence + tension paiement + objection = relation en train de pourrir).
- **Séquence / trajectoire** — un signal qui en *suit* un autre dans le temps. Décisif : un `Levier` (réengagement) **puis** un `Churn` (silence) = **momentum perdu**, ce qui n'est PAS la même chose qu'un froid jamais chaud. La fusion lit la trajectoire, pas seulement l'instantané.

**Colonne vertébrale dérivée des 6 comptes** (mappée sur les tags spec-23) :

| Pattern | Signaux pivots | Tag(s) | Pol. | Action-type |
|---|---|---|---|---|
| ⛔ **Active Churn / Save-the-Deal** | résiliation/annulation de mission + concurrent sollicité [+ engagement manqué] | `Churn` | − | sauver, sous délai court |
| ⚑ **Notre Engagement Manqué** | relance de la cible restée sans réponse **de notre côté** ; échéance promise non tenue | `Churn` | − | rattraper — **moat first-party pur** |
| ⤵ **Slipping Opportunity** | réengagement (`Levier`, +) **puis** silence (`Churn`, séquence) | `Levier`→`Churn` | − | relancer le momentum avant qu'il meure |
| **Cooling Active Relationship** | silence prolongé [+ tension paiement / objection] | `Churn`/`Risque` | − | réchauffer |
| **Open Objection** | objection ouverte non soldée *(Romain : feature à plus forte valeur)* | `Risque` | − | préparer & traiter l'objection |
| **Tension Paiement** | impayé / litige de facturation | `Risque`/`Churn` | − | débloquer le règlement (cloisonner du produit) |
| **Account Control Change** | M&A / rachat de la maison-mère | `Marché` | − | sécuriser le churn **+** cross-sell groupe |
| ✅ **Recovery Momentum** | friction résolue / goodwill récent | `Levier` | + | capitaliser l'appui |
| **Founder Buying Window** | levée de fonds first-party sur compte founder-led | `Croissance` | + | fenêtre d'équipement (variante size-aware) |
| **New Decision-Maker Grace** | arrivée d'un décideur / palier de validation | `Mobilité`/`Marché` | − | entrer (cible) ou sécuriser (client) sous 90 j |

> **Structurels → spec-22, pas ici** : *Coverage Fragility* (mono-thread, pondéré par l'âge/le capital de la relation — Emera 2,5 ans mono-thread ≫ mono-contact de 2 mois) et *Expansion Surface* (empreinte multi-sites, `+`) sont des propriétés de **santé**, consommées par la priorisation mais affichées en Santé.
>
> **Cicatrice** : une friction *résolue mais latente* (Emera : défiance livraison 2024) n'est ni un signal ni un pattern — c'est de la **mémoire relationnelle** (spec-22) qui *conditionne l'action* (« ne pas rejouer l'échec de livraison ») sans scorer.

---

## 3. Les deux axes : Sévérité × Urgence *(correctif V3 majeur)*

Le moteur d'origine confondait gravité et délai. Les séparer :

- **Sévérité** = *à quel point ça fait mal*. = score du pattern pilote (le plus chaud) du compte.
- **Urgence** = *combien de temps avant qu'il soit trop tard*. **Distincte de la décroissance** : un silence est *grave mais lent* (se traite cette semaine) ; une annulation avec RDV lundi 17h est *grave ET minutée* (48h ou la mission est perdue). Urgence dérivée de la **proximité d'une deadline réelle** (RDV calé, échéance d'engagement) et de la **fraîcheur d'un événement actif** — pas d'une demi-vie.
- **Priorité** = Sévérité **pondérée** par l'Urgence : `priorité = sévérité × (0,55 + 0,45 × urgence/100)`.

**Combinaison bornée (formule gelée)** — au lieu d'un *noisy-OR* qui sature, on combine en **top-dominant** : `combine(scores) = top + (100 − top) × β × tail`, où `top` = score du pattern/signal le plus chaud, `tail = 1 − ∏(1 − sᵢ/100)` sur le reste, borné [0,1]. Coefficients : **β = 0,40** (intra-pattern, fusion de signaux) et **β = 0,30** (inter-patterns, sévérité du compte). Garantit : le pilote domine toujours, un 98 bat deux 70, et rien ne plafonne sauf un vrai 100.

**Urgence (v1, paliers)** — dérivée de la proximité de la prochaine action réelle : événement actif / RDV ≤ 2 j → 95-100 ; ≤ 5 j → 75 ; ≤ 14 j → 55 ; aucune action calée → 35. *(Raffinement v2 : passer en continu pour départager le milieu de tableau.)*

> **Preuve sur données réelles** : par sévérité seule, *Calomatech* sortait 4ᵉ. Mais il a un point d'étape **le lendemain** → l'urgence le remonte **3ᵉ**, devant *Carroz* et *Manolys* (graves mais en silence lent, non minutés). *Artesia* (churn actif + RDV lundi) = priorité 100. *AAEP* (fenêtre d'achat, pas un feu) = dernier. Le portefeuille se trie enfin juste.

✅ **Résultat validé (6 comptes réels, 04/06/2026)** : avec la combinaison top-dominant, la sévérité s'étale de 55 à 95 (un seul compte près du plafond — Artesia, churn actif), au lieu de 4 comptes collés ≥ 93 avec le noisy-OR. La référence d'implémentation est `moteur-reference/scoring_priorisation.py`.

---

## 4. Classement de portefeuille (la 4ᵉ surface)

Le moteur classe les comptes gérés par **Priorité** → c'est la **file de triage** d'un account manager / CSM / AE qui gère un book. Chaque ligne :

```
[compte] · [pattern pilote] · [sévérité / urgence] · [action recommandée] · [→ fiche]
```

C'est une **4ᵉ surface**, **transverse** aux 3 surfaces de fiche (Personne / Compte / Réunion). Elle ne vit pas dans une fiche — elle vit sur le **Home** (spec-29 §7). En-tête = la **distribution** (« 12 comptes · 3 en risque · 2 à surveiller »), jamais une moyenne lissée (interdit spec-22 §0 / spec-29).

---

## 5. Propagation inter-comptes

Deux comptes sur la **même chaîne opérationnelle** (ex. *Artesia* exécuté par *AAEP* via RCI Partners) sont liés : un churn sur l'un menace mécaniquement le flux de l'autre. Le moteur **propage** un facteur de risque le long des liens ONA connus entre comptes. Moat : seul Knowr sait que deux comptes du portefeuille sont, en réalité, le même fil opérationnel.

---

## 6. Garde-fous (analogues spec-23 §4, à implémenter)

1. Un pattern ne s'arme que sur des signaux **sourcés** (zéro-hallu) — sinon non-armé, jamais fabriqué.
2. Sévérité **et** urgence portent leur **provenance** (source + date + pastille).
3. Aucun score core sur **source optionnelle absente** (cohérent spec-22 §0 : jamais dépendre du CRM).
4. **Polarité explicite** sur chaque pattern — sinon rejet.
5. Agrégation **bornée et discriminante** (pas de noisy-OR saturant) — voir §3.
6. Décroissance **concave** (pas linéaire) et multiplicateurs plafonnés à 100 — voir §1.

Échec d'une règle = pattern retiré + log, jamais une priorisation silencieusement fausse.

---

## 7. Application — Home / triage (révision spec-29)

Le **classement de portefeuille** est l'**engine du widget « Plan du jour »** du Home : il remplace une priorisation heuristique/manuelle par un tri **systématique gravité × urgence**, sourcé et borné. Il **remplace** le stat « Score relationnel global · moyenne pondérée » (lissage interdit) par la **distribution** + la file priorisée, et **absorbe** « Tâches critiques » (chaque tâche devient l'action recommandée d'un compte classé). Le **Feed Signaux** reste dessous comme couche brute (les faits) ; le classement est la couche **fusionnée** au-dessus (que faire, dans quel ordre). Voir spec-29 §7 (révision Home).

**Surfaces & références d'implémentation :**
- **Home** — layout validé dans le shell : `app-shell-reference/knowr-app.html`, écran `#view-home` (Réunions format initial + « Tout voir » en tête · **Portefeuille priorisé** en tableau minimaliste à scroll interne · **Signaux en rail droit** au format fiche · distribution en en-tête, **pas** de moyenne lissée).
- **Fiche Compte / Personne** — le verdict (pilote + posture + score + popover sév/urg) vit dans un composant **`.v-card`** posé en **tête du rail Signaux**, documenté en **spec-31**. Références : `app-shell-reference/knowr-compte-lexner-avocats.html` (fiche réelle) et `templates-reference/exemple-compte.html` (template canonique, AAEP).
- **Code** — formules gelées exécutables : `moteur-reference/scoring_priorisation.py`.
