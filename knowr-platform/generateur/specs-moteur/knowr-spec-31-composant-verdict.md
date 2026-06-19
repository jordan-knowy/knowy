# Spec 31 — Composant Verdict (`.v-card`) · tête du rail Signaux

## Knowr — Spec Jordan v1 · Juin 2026

> Composant d'UI qui matérialise le **verdict de priorité** (spec-30) sur les fiches **Compte** et **Personne**. S'appuie sur spec-23 (signaux), spec-29 (shell), spec-30 (moteur). Références live : `app-shell-reference/knowr-compte-lexner-avocats.html` (réelle, posture *dé-risquer*) et `templates-reference/exemple-compte.html` (canonique AAEP, posture *capitaliser*).

---

## 0. Rôle & placement

Le verdict est le **« so what » daté et scoré** d'un compte/contact : le pattern pilote (spec-30 §2), sa posture, son score de priorité, et le détail du calcul à la demande. Il ne se range **pas** dans le rail Signaux (qui liste des *faits* atomiques) — il le **coiffe** : il est le **premier enfant** de `<aside class="rail">`, **avant** la `.sig-card`. Conclusion en haut, prémisses (faits) en dessous. Anti-duplication respectée (spec-23 §R1) : le verdict *référence* les faits, il ne les recopie pas.

---

## 1. Anatomie

```
.v-card  (bordure haute = couleur de posture --pst)
 ├─ .v-head   : ⚡ « Priorité du compte »      + .v-info (ⓘ → popover)
 ├─ .v-body   : .v-score (NN/100)              + .v-pil (.v-badge pilote · .v-pst posture)
 ├─ .v-reason : 1–2 phrases — pourquoi ce rang, quelle action
 └─ .v-foot   : CTA générique « Préparer une action → »
 (.v-pop, enfant de .v-info) : popover « détail du calcul » — Sévérité + Urgence + formule
```

## 2. Posture = 3 variables (le composant est générique)

Le générateur ne change **que** trois variables inline + deux libellés. Tout le reste est identique d'une fiche à l'autre.

| Posture | `--pst` | `--pst-d` | `--pst-s` | quand |
|---|---|---|---|---|
| **defend** (risque/feu) | `--coral` | `--coral` | `--coral-s` | Active Churn, Cooling, Objection, Slipping, Paiement, Control Change |
| **capitaliser** (opportunité) | `--violet` | `--violet-d` | `--violet-s` | Founder Buying Window, Recovery, Re-Engagement |
| **dé-risquer** (structurel) | `--amber` | `--amber` | `--amber-s` | Coverage Fragility, Expansion Surface |

`style="--pst:var(--coral);--pst-d:var(--coral);--pst-s:var(--coral-s)"` → la bordure haute, le badge pilote, la puce de posture et le CTA prennent la couleur sans toucher au CSS.

## 3. Popover « détail du calcul »

Apparaît **au-dessus** de la carte, au **survol du ⓘ** *ou* au **clic** (toggle `.open` via `onclick="this.closest('.v-card').classList.toggle('open')"`). Contenu :
- **Sévérité NN/100** + barre (dégradé amber→coral) + 1 ligne : le pattern pilote et ce qui le module.
- **Urgence NN/100** + barre (dégradé blue→violet) + 1 ligne : la deadline / fraîcheur.
- La **formule** : `priorité = sévérité × (0,55 + 0,45 × urgence)`.

Même UI que les barres du Portefeuille priorisé sur le Home (cohérence des deux surfaces du même objet).

## 4. CSS (à recopier tel quel dans la charte de la fiche — tokens existants)

Le bloc complet est dans les fichiers de référence (après la règle `.sig-foot a{…}`). Il n'introduit **aucune** nouvelle variable : il consomme `--white --bg --bg2 --bg3 --border --border-m --t1 --t2 --t3 --mono --r-xl --r-lg --r-md --r-sm --r-f --sh-md --sh-lg --ease` + les couleurs de posture. Classes : `.v-card .v-head .v-ttl .v-info .v-body .v-score .v-pil .v-badge .v-pst .v-reason .v-foot .v-pop .v-pop-t .v-ax .v-axl .v-bar(.sev/.urg) .v-ex .v-form`.

## 5. Doctrine (hérite spec-21/23/30)

- Le score, la sévérité et l'urgence portent leur **provenance** ; aucun chiffre inventé. Compte sans signal armé → **pas de `.v-card`** (ou état neutre « aucun signal prioritaire »), jamais un verdict fabriqué.
- Le CTA est **générique** en v1 (« Préparer une action → ») — l'action-typée par pattern est un raffinement v2.
- Implémentation cible **React** (spec-29) : composant `<VerdictCard posture pilote score severite urgence reason/>` rendu en tête de la colonne rail ; ne pas reproduire l'`onclick` inline (état React).
