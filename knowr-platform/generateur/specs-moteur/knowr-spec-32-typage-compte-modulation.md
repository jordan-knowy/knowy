# Spec-32 — Typage de compte & modulation du moteur de priorisation

> Statut : draft v1 · dépend de spec-30 (moteur fusion) et spec-22 (santé relationnelle).
> Doctrine : **zéro-hallu**. Toute affectation de type sans source vérifiable → `null` (« à qualifier »).

## 1. Objectif

Classer chaque compte en **{acquisition, account_management, partenaire}** à partir des signaux internes (échanges, transcripts, infos compte, proposition de valeur), puis **moduler le moteur spec-30** selon ce type.

Le typage **n'est pas qu'une étiquette** : il change *quels signaux sont actifs* et *comment la posture / la priorité* sont calculées. Un « churn » n'a aucun sens sur une acquisition ; un partenaire ne « churn » pas comme un client.

## 2. Taxonomie

| Type | Définition | Motion |
|---|---|---|
| **Client — Acquisition** | Pas encore client (prospection → proposition) | Conquête / momentum deal |
| **Client — Account management** | Client actif (contrat / facturation) | Rétention / expansion |
| **Partenaire** | Partenariat ou fournisseur — pas une cible de vente | Entretien relationnel / co-selling |

Sous-règle client : *relation commerciale active (signée / payante) ?* → oui = **AM**, non = **Acquisition**.

## 3. Classifier (hybride règles + LLM, zéro-hallu)

### Signaux d'inférence (tous sourcés)

| Signal | Acquisition | Account mgmt | Partenaire |
|---|---|---|---|
| Champ lifecycle CRM | Lead / Opportunity | Customer | Partner |
| Contrat / facturation | aucun | on facture | on est facturé / accord cadre |
| Sens du flux monétaire | aucun encore | entrant (eux→nous) | sortant ou nul |
| Intent des conversations | pricing, closing | usage, support, expansion | co-marketing, intégration, fourniture |
| Rôle chaîne de valeur | acheteur potentiel | utilisateur | canal / fournisseur |
| Match ICP | acheteur cible | client installé | hors cible d'achat |

### Pipeline

1. **Règles dures** (prioritaires, forte confiance) : lifecycle CRM (`Lead/Opp→acq`, `Customer→am`, `Partner→part`) ; présence contrat/facture (`→am`) ; on est facturé par eux (`→part`).
2. **Classif LLM** sur les signaux synthétisés → `{type, confiance ∈ [0,1], preuves[]}`.
3. **Arbitrage** : une règle dure de forte confiance prime sur le LLM ; sinon LLM.
4. **Seuil τ = 0.60** : `confiance < τ → null` (« à qualifier »). On ne devine jamais.

Sortie : `{ type, confiance, preuves_sourcées }`.

## 4. Modulation du moteur spec-30

Le type agit sur trois leviers : **gating de signaux**, **posture par défaut**, **plafonds/pondération**.

### 4.1 Gating de signaux
Chaque type n'autorise qu'un sous-ensemble de la table `SIGNALS` (spec-30). Les signaux hors-set sont **neutralisés (mis à 0)** car non pertinents.

- **acquisition** — autorise : `objection`, `silence_cooling` (post-proposition), `nouveau_decideur`, `reengagement`, `levee_fonds`, `croissance`, fenêtre d'achat. **Bloque** : `active_churn`, `controle_ma`, `couverture_fragile` (logique rétention).
- **account_management** — set complet rétention : `active_churn`, `sla_breach_ours`, `silence_cooling`, `controle_ma`, `couverture_fragile`, `tension_paiement`, `objection`, `goodwill_recovery`, `reengagement`.
- **partenaire** — autorise : inactivité relationnelle (`silence_cooling`), perte de contact clé (`nouveau_decideur` / départ), opportunités de co-selling (`croissance`, `levee_fonds`). **Bloque** tout signal revenu/churn.

### 4.2 Posture par défaut
- acquisition → `capitaliser` / conquérir
- account_management → `défendre` / `dé-risquer` / `capitaliser` (selon signaux actifs)
- partenaire → `entretenir`

### 4.3 Plafonds & pondération
- **acquisition** : urgence pilotée par fraîcheur + fenêtre d'achat (demi-vies courtes).
- **partenaire** : **sévérité plafonnée** (cap ≈ 60) et demi-vies allongées — un partenaire ne peut pas atteindre une priorité « critique » de type churn.
- **account_management** : moteur spec-30 nominal.

### 4.4 Pseudocode

```python
def priority(account, signals):
    ty = classify_account_type(account.evidence)      # {type, conf, preuves}
    if ty.conf < TAU:
        ty.type = None                                # « à qualifier »
    base_type = ty.type or "account_management"       # défaut prudent
    allowed = TYPE_GATING[base_type]
    active  = {s: v for s, v in signals.items() if s in allowed}
    raw     = spec30_engine(active)                   # gravité × urgence (inchangé)
    raw     = apply_caps(raw, base_type)              # plafond partenaire, etc.
    posture = posture_default(base_type, active)
    return raw, posture, ty
```

## 5. Intégration UI (app-shell)

- **Colonne « Type »** dans le tableau Comptes (pastille `acq` / `am` / `part`, « à qualifier » si `null`).
- **Filtre portefeuille** par type (Tous types / Acquisition / Account mgmt / Partenaire).
- La **priorité affichée est déjà modulée** : le déclencheur et la posture respectent le type (ex. AAEP = acquisition → « Fenêtre d'achat / capitaliser », jamais « churn »).

## 6. Garde-fous

- Type sans double-source → `null` (« à qualifier »), jamais inféré comme fait.
- Le type est **réversible** : une acquisition qui signe bascule en AM (déclenché par contrat/facture).
- Préserve la règle emploi stricte : un « je rejoins X » LinkedIn ne vaut pas preuve de relation commerciale.
