# Spec 23 — Segmentation des Signaux par scope (moteur)

## Knowr — Spec Jordan v4 · Juin 2026

> **Complète la spec 15** (« un bloc sur sa surface canonique ») et s'appuie sur la **spec 21** (provenance) et la **spec 22** (santé relationnelle, principe « par-compte sur le Compte, simple signal sur la Réunion »).
>
> Problème résolu : jusqu'ici les Signaux étaient placés au jugé (freestyle), avec duplication d'un même fait sur plusieurs surfaces et des tags ad hoc. Cette spec fait des Signaux une **couche gouvernée**, pas un vide-poche.

---

## 0. Définition canonique d'un signal (à respecter avant tout)

> **Un signal est un FAIT observé, daté et récent — touchant la personne ou l'entreprise — qui présente un intérêt pour adapter le discours, la forme, le fond ou la stratégie de la réunion.**

Exemples de vrais signaux : nouveau post LinkedIn, commentaire public pertinent, article de presse, nouveau site web, changement de siège social, levée de fonds, recrutements, actualité économique / légale / juridique touchant la cible, **mais aussi** des faits relationnels observés dans Outlook : une relance restée sans réponse, un silence prolongé, des crédits/licences non utilisés, un changement d'interlocuteur.

### Les 4 critères obligatoires (un signal les remplit TOUS)
1. **C'est un fait, pas un conseil.** « Il a relancé 2× sans réponse » = signal. « Reconnaître la non-réponse » = *recommandation*, donc **pas** un signal.
2. **Il est daté et récent.** Un signal porte une date (ou une fenêtre). S'il n'a pas de moment, c'est un trait, pas un signal.
3. **Il est survenu côté cible ou dans la relation** (la personne/l'entreprise a posté, levé, déménagé, recruté ; ou un fait relationnel daté s'est produit). Ce n'est pas une intention de notre part.
4. **Il a une implication tactique** : on doit pouvoir dire « donc, en réunion, j'adapte X ». Sinon c'est du bruit.

### Le test anti-dérive (CRUCIAL)
Pour chaque ligne candidate, se demander : **« Est-ce que ça s'est *produit* à une date, ou est-ce que c'est quelque chose que *je devrais faire* / *une qualité de la personne* ? »**
- S'est produit à une date → **signal** ✓
- Quelque chose à faire → **recommandation** → va dans Mode 5 min / Recommandations / Pivots, **pas** dans Signaux ✗
- Une qualité durable de la personne → **trait** → va dans Profil comportemental / Position, **pas** dans Signaux ✗
- Un diagnostic structurel (mono-thread, couverture) → va dans **Santé relationnelle**, **pas** dans Signaux ✗

### Ce qu'un signal n'est JAMAIS (erreurs fréquentes à rejeter)
| Faux signal (rejeté) | Pourquoi | Où ça va vraiment |
|----------------------|----------|-------------------|
| « Convaincre par la preuve » | conseil | Mode 5 min / Reco |
| « Cadrer le périmètre de décision » | action | Objectif / Reco |
| « Profil méthodique » | trait durable, non daté | Profil comportemental |
| « Mono-thread critique » | diagnostic structurel | Santé relationnelle |
| « Tenir le format court » | consigne | Reco / Pivots |

### Sourçabilité (condition d'existence)
Un signal externe (post, presse, levée, site, siège…) **exige une source qui l'a capté** : LinkedIn, web/presse, ou base société, en plus d'Outlook pour les faits relationnels. **Sans connecteur capable de fournir l'actualité, le signal externe n'existe pas** — on ne l'invente pas (zéro-hallucination, spec-21). Voir §6 : rail partiellement/non alimenté → CTA « Connecter une source », jamais un signal plausible fabriqué.

---

## 1. Principe directeur

Le rail « Signaux » existe sur **les 3 surfaces**, mais son contenu est **strictement scopé** à la surface. Un signal répond à une question différente selon l'endroit où il vit :

| Surface | Scope | Question | N'accueille jamais |
|---------|-------|----------|--------------------|
| **Personne** | Individu | « Quel fait récent concernant *cette personne* dois-je connaître ? » (post/commentaire LinkedIn, prise de parole, mobilité pro, fait relationnel daté la concernant) | Faits structurels du compte ; traits durables ; conseils |
| **Compte** | Structure | « Quel fait récent concernant *l'entreprise* dois-je connaître ? » (levée, M&A, recrutements, nouveau site, actualité éco/légale, fait relationnel daté au niveau compte) | Traits de personnalité ; conseils ; diagnostics (→ Santé) |
| **Réunion** | Pertinence pour CE rdv | « Parmi les faits récents, lesquels pèsent sur *ce rendez-vous précis* ? » | Toute recommandation/action (→ Mode 5 min, Reco, Pivots) ; tout trait |

**Le rail Réunion ne contient pas d'actions.** Il **remonte les faits** (issus de Personne/Compte) les plus pertinents pour ce RDV, éventuellement avec une phrase d'implication (« donc… »). L'action qui en découle vit dans Mode 5 min / Recommandations / Pivots. Un signal de Réunion reste un *fait daté*, jamais un impératif.

**Test canonique de placement** — pour chaque signal, se demander : *« Ce fait reste-t-il vrai si je change d'interlocuteur dans la même boîte ? »*
- Oui → c'est un signal **Compte**.
- Non, il est attaché à l'individu → **Personne**.
- Le fait est pertinent pour cette réunion précise → il est **remonté** sur la Réunion (toujours en tant que fait, jamais transformé en consigne).

---

## 2. Les 4 règles de gouvernance

### R1 — Anti-duplication (un fait, une surface canonique)
Un même fait brut n'apparaît qu'une fois, sur sa surface canonique. S'il est pertinent ailleurs, il n'est pas copié : il est **reformulé selon le scope de la surface d'accueil**.

*Exemple (rachat Vattenfall) :*
- **Compte** (canonique, structurel) : « Reprise Vattenfall France — +18 000 pro » · tag `Marché`.
- **Réunion** (réécrit en action) : « Levier Vattenfall — angle de réancrage du RDV » · tag `Levier`.
- **Personne** : *absent* (ce n'est pas un fait sur l'individu).

### R2 — Provenance obligatoire (hérite spec 21)
Chaque signal porte **source + date + pastille de confiance**. Aucun signal inventé. Code couleur de la pastille :
- **sage** = Observable (comptage/fait direct Outlook, fait public vérifié)
- **amber** = Inféré ou confiance moyenne (trait déduit du style, corroboration partielle)
- **coral** = Risque actif (churn, friction, exposition)

Un signal non sourçable n'est pas affiché en signal : il devient un « à confirmer » ailleurs (Position, Power Map…), jamais un signal plausible.

### R3 — Tag de catégorie obligatoire (vocabulaire fermé)
Tout signal porte exactement **un** tag issu de cette liste fermée. Fini les tags libres.

| Tag | Sens | Surfaces autorisées |
|-----|------|---------------------|
| `Churn` | Fait relationnel daté de désengagement (silence, relance sans réponse, non-usage) | Personne · Compte · Réunion |
| `Risque` | Fait daté d'exposition / friction non encore churn | Personne · Compte · Réunion |
| `Levier` | Fait daté ouvrant une opportunité (à activer ailleurs) | Personne · Compte · Réunion |
| `Mobilité` | Événement daté de poste/employeur de l'individu (arrivée, départ, promotion annoncée) | **Personne uniquement** |
| `Réseau` | Fait daté de capital social (mise en relation effectuée, intro publique) ou de structure réseau survenue | **Personne** ou **Compte** |
| `Marché` | Actualité datée : M&A, réglementaire, éco/juridique touchant la société | **Compte uniquement** |
| `Croissance` | Fait daté de croissance : levée, recrutements, expansion, nouveau site | **Compte uniquement** |
| `Présence` | Fait daté de présence publique : post/commentaire LinkedIn, article, nouveau site web | Personne · Compte |

Chaque tag désigne un **fait daté**, jamais un trait ni un conseil. Il n'y a volontairement **pas** de tag « Profil » : un trait comportemental n'est pas un signal (il vit dans Profil comportemental). `Mobilité` interdit sur Compte ; `Marché`/`Croissance` interdits sur Personne. Le moteur **rejette** une combinaison surface×tag hors matrice (garde-fou analogue au garde-fou CSS).

### R4 — Tri par priorité
Ordre d'affichage dans le rail, de haut en bas : **`Churn` → `Risque` → `Levier` → (Mobilité / Réseau / Marché / Croissance / Présence)**. Le risque en premier : c'est ce qu'on doit voir avant tout. Au sein d'un même niveau, le plus récent d'abord.

---

## 3. Cardinalité

Idéalement 3 à 6 signaux par rail. Mais **un signal de plus inventé est pire qu'un rail court** : on n'ajamais de signal plausible pour « remplir ». Si moins de 3 faits réels existent, le rail est court et affiche un CTA « Connecter une source pour capter plus de signaux ». Au-dessus de 6, garder les plus décisifs (tri R4), le reste via « Rafraîchir ». Un rail à 0 signal réel = uniquement le CTA, jamais du remplissage.

---

## 4. Garde-fou moteur (à implémenter)

Le générateur valide chaque signal avant rendu :
1. **C'est un fait, pas une action/trait** (test §0) — une ligne formulée à l'impératif (« faire », « cadrer », « reconnaître », « tenir ») ou décrivant une qualité durable est **rejetée**.
2. **Daté** : une date ou fenêtre est présente — sinon rejet.
3. `surface × tag` ∈ matrice R3 — sinon rejet.
4. provenance présente (source + date + pastille) — sinon rejet.
5. pas de doublon de `fait_id` entre surfaces (R1) — ne garder que la surface canonique ; sur la Réunion, un fait remonté est marqué `surfaced_from: personne|compte`, pas dupliqué.
6. 1 ≤ nombre de signaux ≤ 6 par surface (voir §3 pour le cas 0).
7. tri R4 appliqué.

Échec d'une règle = signal retiré + log, jamais un rendu silencieusement incohérent.

### Sourçabilité & rail non alimenté
Un signal externe ne peut exister que si une source l'a réellement capté (LinkedIn / web-presse / base société). Conséquence opérationnelle :
- Source connectée et **rien trouvé** → ne pas inventer ; le rail peut être plus court (voir §3).
- **Aucune source externe connectée** → le rail n'affiche que les faits relationnels Outlook ; pour les signaux externes, il montre un **état CTA** : « ⓘ Connecter LinkedIn / presse pour capter les signaux externes » — jamais un signal externe fabriqué (zéro-hallucination, spec-21).

---

## 5. Application de référence (Alterna / Ducourtieux)

Tous les items ci-dessous sont des **faits datés**, pas des conseils.

**Personne — Alexandre** (faits le concernant) :
`Churn` 2 relances sans réponse (mai–juin 2026) · `Réseau` a mis Maxime en relation avec Niels/Emelia (déc. 2025) · `Mobilité` poste « Resp. Commercial/Partenaires » à corroborer — headline LinkedIn non vérifié · `Présence` *à alimenter si LinkedIn connecté* (posts/commentaires récents).

**Compte — Alterna** (faits sur l'entreprise) :
`Churn` relance du 01/06 sans réponse · `Risque` crédits Pisteur non consommés depuis ~3 mois · `Marché` reprise des activités Vattenfall France (fév.–avr. 2026) · `Croissance` +18 000 clients pro, +175 000 particuliers repris · `Réseau` 1ʳᵉ démo avec L. Ossedat puis silence (nov. 2025).

**Réunion — 16 juin** (faits remontés, pertinents pour CE rdv) :
`Churn` relance du 01/06 sans réponse [surfaced_from: compte] · `Risque` crédits dormants ~3 mois [compte] · `Croissance` base pro triplée post-Vattenfall [compte] · `Réseau` Ossedat présent puis muet [compte]. Aucune ligne impérative : « démo en volume », « convaincre par la preuve », « embarquer Ossedat » sont des **recommandations** → elles vivent dans Mode 5 min / Reco / Pivots, pas ici.

Même fait Vattenfall : `Marché`+`Croissance` sur Compte (canonique), **remonté** (pas reformulé en action) sur Réunion, **absent** sur Personne (ce n'est pas un fait sur l'individu). Conforme R1 + définition §0.
