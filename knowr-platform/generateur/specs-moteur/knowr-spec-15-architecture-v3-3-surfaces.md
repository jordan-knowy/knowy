> ⚠️ **MISE À JOUR v6 :** pour la surface **Réunion commerciale**, l'architecture de référence est désormais la **spec 25** (2 colonnes, moteur d'action, sections Concurrence/Coût retirées, Questions SPIN). Cette spec-15 reste valable pour Personne, Compte et la Réunion *productivité*.

# 15 — Architecture v3 · 3 surfaces (Réunion · Personne · Compte)
## Knowy — Spec Jordan v4 · Juin 2026

> **Remplace la spec 14.** Le modèle « brief unique » (qui mélangeait réunion + personne + compte sur une seule page) est abandonné. On passe à **3 surfaces distinctes**, reliées par une grammaire de navigation unifiée.

---

## 1. Le modèle : 3 surfaces

| Surface | Rôle | Contenu |
|---------|------|---------|
| **Réunion** | Layer d'action, lié à une réunion précise | Info réunion + layer de préparation + accès Personne/Compte |
| **Personne** (fiche) | Intelligence durable sur un individu | Identité + rattachement compte + mémoire relationnelle + profil comportemental + position + historique réunions |
| **Compte** | Structure & santé d'un compte B2B | Mémoire relationnelle compte + ONA + Power Map + contacts + signaux |

**Règle de séparation :** ce qui est *lié à une réunion donnée* vit sur Réunion. Ce qui est *durable et propre à la personne* vit sur Personne. Ce qui est *structurel au compte* vit sur Compte. Un bloc n'apparaît qu'une seule fois, sur sa surface canonique.

**La Mémoire Relationnelle n'est PAS une page.** C'est une **section avec graphe**, intégrée deux fois : une fois scopée *personne* (sur la fiche), une fois scopée *compte* (sur le Compte).

---

## 2. Répartition du contenu (canonique)

| Bloc | Surface | Note |
|------|---------|------|
| Hero réunion (objet, date, type, confiance brief) | **Réunion** | header sombre |
| Mode 5 min | **Réunion** | scan 30s |
| Objectif (3 tiers : minimal/nominal/stretch) | **Réunion** | |
| **Theory of Mind** | **Réunion** | état mental *pour cette réunion* (pas un trait durable → ne va PAS sur la fiche) |
| Recommandations · structure | **Réunion** | |
| Objections · Anti-patterns · Next steps | **Réunion** | |
| Pivots en réunion | **Réunion** | replié par défaut |
| Hero personne (score relationnel, confiance, dernier contact, sources) | **Personne** | |
| Carte « Rattachée au compte » | **Personne** | acard cliquable → Compte |
| Levier stratégique | **Personne** | conclusion remontée de Position |
| **Mémoire Relationnelle · personne** (graphe + dimensions) | **Personne** | scope individu, courbe **sage** |
| Profil comportemental · Radar MBTI · JTBD | **Personne** | trait durable |
| Position dans l'organisation (6 métriques email) | **Personne** | |
| Réunions récentes (3 visibles + 10 sur clic) | **Personne** | bas de page |
| **Mémoire Relationnelle · compte** (graphe + dimensions) | **Compte** | scope compte, courbe **violet** |
| ONA (Organizational Network Analysis) | **Compte** | toutes lignes depuis Optee |
| Table contacts (score MR + rôle MM + Voir/Générer) | **Compte** | |
| Power Map Miller Heiman | **Compte** | |
| Signaux comportementaux compte | **Compte** | |

---

## 3. Navigation : grammaire de cartes unifiée

L'accès inter-surfaces passe par une **carte cliquable unique** (`.acard`), identique partout pour que l'affordance « cliquable » soit évidente : avatar + eyebrow + nom + sous-titre + score + flèche.

```
Réunion   ──[acard Participant LS]──▶ Personne
          ──[acard Compte FG]──────▶ Compte
Personne  ──[acard Compte FG]──────▶ Compte   (rattachement, en haut)
          ──[Réunions récentes → Ouvrir]──▶ Réunion
Compte    ──[table contacts → Voir]──▶ Personne
          ──[Générer]── sendPrompt() ──▶ génération nouvelle fiche
Nav (toutes) : liens directs vers les 2 autres surfaces.
```

- **Réunion** est l'entrée : elle donne accès aux 2 autres surfaces via 2 acards en haut (sous le header).
- **Personne** affiche en haut la carte Compte (rattachement immédiat).
- Toute carte Personne/Compte utilise le **même gabarit** `.acard`.

---

## 4. Logique de lecture par surface

### Réunion (ordre)
`Header → [acard Participant · acard Compte] → Mode 5 min → Objectif → Theory of Mind → Recommandations → Objections → Pivots`
- Le layer action est groupé et contigu (cf. spec comportementale : ne pas intercaler de l'analyse entre les blocs d'action).
- Theory of Mind placée juste après Objectif : on charge l'état mental avant de dérouler la structure.

### Personne (ordre)
`Hero → acard Compte → Levier → Mémoire Relationnelle (graphe) → Profil/Radar → Position → Réunions récentes`
- **Mémoire Relationnelle en haut** (juste après le levier) — visible immédiatement, comme sur le Compte.
- Toutes les sections **ouvertes par défaut** (la fiche est courte) et **refermables** (chevron).
- **Réunions récentes** : les 3 dernières **visibles sans déplier**, bouton « Voir les 10 précédentes » qui révèle l'historique inline.

### Compte (ordre)
`Header → Levier compte → Mémoire Relationnelle (graphe) → ONA → Contacts → Power Map → Signaux`
- Mémoire Relationnelle en tête = lentille relationnelle avant la lentille structurelle (ONA/Power Map).

---

## 5. Theory of Mind — pourquoi sur Réunion

La ToM décrit *ce que la personne croit/sait/ignore par rapport à cet engagement précis* et son *risque de perception en réunion*. C'est de l'état mental volatile et contextuel, pas un trait stable. Le trait stable (MBTI/DISC) vit dans le Radar comportemental, sur la fiche. → ToM sur **Réunion**.

---

## 6. Types de réunion (couleur d'accent du header)

| Type | Accent | Contexte |
|------|--------|----------|
| Commercial | violet | vente / reprise |
| Productivité | teal | interne / partenariat |
| Contentieux | coral | litige (encadré légal obligatoire) |
| Reprise compte | violet + badge « Reprise » | compte dormant |

---

## 7. Règles système inchangées

- **Zéro hallucination** : champ sans source vérifiable → `null`, jamais inventé.
- **Emploi actuel** : confirmé uniquement si headline LinkedIn **+** source secondaire ; sinon « à confirmer ».
- **Scoring** historique mensuel dans `relational_score_history` (alimente les graphes Mémoire Relationnelle).
- **Confiance** affichée par section (jamais masquée), 35-45 % si zéro historique.
- **Brief contentieux** : encadré légal obligatoire + « consulter avocat ».
