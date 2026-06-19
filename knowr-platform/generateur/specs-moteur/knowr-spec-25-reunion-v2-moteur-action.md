# Spec 25 — Réunion v2, moteur d'action & enrichissements (base v6)

Cette spec fige l'architecture finale issue des itérations terrain. Les 3 fichiers
`templates-reference/exemple-*.html` SONT la référence canonique : en cas de doute,
recopier leur structure exacte. Ne jamais improviser de mémoire (cf. régressions passées).

> **Lien spec-30.** Le moteur d'action consomme désormais le **pattern pilote** d'un compte/RDV (déclencheur fusionné) et sa **sévérité × urgence** : la reco prioritaire d'une surface est l'action-type du pattern armé (ex. ⛔ Active Churn → « sauver sous 48h » ; ⤵ Slipping Opportunity → « relancer le momentum »). Les signaux restent des *faits* (spec-23) ; l'action en dérive (spec-30 §2).

## A. Charte CSS — source unique de vérité
- Le `<head>` maître = celui de `exemple-compte.html` : c'est le **SUPERSET**, avec **DEUX**
  blocs `<style>` (style#1 base + polices base64 ; style#2 primitives Compte
  `.ct-tbl/.ct-av/.ct-c1/.pm-grid/.pm-av/.pm-cell`). Recopier **les deux** `<style>` tels quels
  dans les 3 surfaces. Un head personne/réunion seul = pas de style#2 → le Compte casse (barres).
- N'utiliser que des `var(--x)` **définies** dans la charte. Interdits typiques : `var(--bg1)`
  (n'existe pas → fond transparent). Fonds : `var(--white)`, `var(--bg2)`.
- Réutiliser les **primitives** (`.sig-ttl/.sig-it-t/.dim-card/.pm-cell`…) plutôt que des
  `font-size` en px en dur (sinon dérive typo entre blocs).
- Un bloc inséré après coup (ex. `.mem-alert` ajouté sous un `.prov`) perd sa marge native :
  remettre `margin-top:12px`.

## B. Header — commutateur de vue centré
Chaque fiche : à gauche `Knowr | Nom du contact · Nom du compte` ; **au centre** (absolu) un
segmented control « Vue » avec les 3 surfaces, l'onglet courant **rempli violet**, les 2 autres
en boutons blancs cliquables. Navigation constante et lisible entre Réunion / Personne / Compte.

## C. Surface RÉUNION (commerciale) — architecture en 2 colonnes, scroll unique
Colonne centrale (penser), de haut en bas :
`sec-m5` (Mode 5 min, ouvert) · `sec-obj` (Objectif 3 tiers, ouvert) ·
`sec-questions` (Questions de découverte — **méthode SPIN**, ouvert) ·
`sec-tom` (Theory of Mind, **replié**) · `sec-meddpicc` (**replié**) ·
`sec-obj2` (Objections, ouvert) · `sec-piv` (Pivots, **replié**) ·
`sec-snap` (Relation/courbe MR complète, **replié**).
> SUPPRIMÉS de la réunion commerciale : `sec-conc` (Concurrence) et `sec-cout` (Coût de l'inaction).

Colonne droite (agir) = **2 blocs seulement** + le rail Signaux :
1. **🎯 Pourquoi maintenant** (bloc-héros, bordure violette) : le **signal d'achat** — un FAIT
   daté/verbatim issu des emails (ex. « levée + international, 10/05 ») qui justifie le RDV.
2. **⭐ Action recommandée** : voir §D.
3. **Signaux** (rail standard, spec 23).

## D. Moteur de "next best action" (une seule action, tranchée)
Le système lit le contexte et **tranche UNE seule action** (pas un menu), avec un **badge de type**,
une **justification légère** (une demi-phrase), et le bouton adapté. Cascade de décision :

| Contexte | Action | Badge / bouton |
|---|---|---|
| RDV déjà au calendrier | Confirmer + préparer | 📅 / mail de confirmation pré-édité |
| Signal chaud non relancé, pas de RDV | **Envoyer un mail** | ✉ / Ouvrir le mail |
| Accord de principe, pas de date | Caler un créneau | 📅 / proposer 3 créneaux |
| Balle dans son camp (« je t'envoie dès… ») | **Attendre** | ⏳ / programmer un rappel |
| Silence > N jours, fil ouvert | Relancer | ↩ / ouvrir la relance |
| Sujet sensible + contact tél-friendly | Appeler | 📞 / script + numéro |

- MVP : seul le type **Mail** est réellement câblé (modale). Les autres = badge + bouton (affichage).
- La justification reste **simple** (ex. « Pas de RDV calé + perche chaude »).
- L'action est **liée au signal** du bloc « Pourquoi maintenant ».

### Modale Mail — règle stricte
Génère **objet + corps + signature du compte mail sélectionné**, destinataire pré-rempli.
Permet d'éditer et de changer d'angle (ex. *Pré-suasion*). Envoi **réel depuis la plateforme**
mais **JAMAIS en un clic** : bouton « Envoyer » → **2ᵉ validation manuelle explicite**
(« Confirmer l'envoi à … ? ») → envoi + journalisation. Cette double validation est non négociable.

## E. Méthodologies comportementales (marque de fabrique) — où les nommer
À afficher en tag léger, UNIQUEMENT là où elles augmentent la décision (pas partout) :
- **SPIN** sur les Questions de découverte (Situation/Problème/Implication/Need-payoff).
- **Pré-suasion** (Cialdini) sur le Mail.
- **Trigger / JTBD** sur le Signal d'achat.
Ailleurs (pipeline, momentum) : rester factuel, pas de vernis méthodo.

## F. Surface PERSONNE — enrichissements
- **Mémoire Relationnelle** : chaque dimension (Intensité / Réciprocité / Récence) porte un
  **score /100 + barre**, et un encart **rollup** montre la moyenne pondérée = score global.
  Calibrer sur le réel (ex. récence = jours depuis le dernier contact ; un écart réel la fait baisser).
- **Profil comportemental** : le **détail des 4 axes** (Résultat↔Relation, Rapidité↔Analyse,
  Assertivité↔Adaptation, Innovation↔Conformité) doit être **VISIBLE** à côté du radar
  (pôle dominant + score + justification sourcée), pas caché dans une infobulle.

## G. Pipeline sans CRM — doctrine (honnêteté)
Sans CRM, via emails seuls : on récupère de façon fiable le **qualitatif** (vélocité, momentum,
décideur, signaux d'achat) ; le **chiffré** (montant exact, budget, date ferme) reste « à confirmer ».
Afficher un « pipeline relationnel » (momentum + dernier mouvement + signal), JAMAIS un € non lu.
Le CRM est le déclencheur qui débloque les chiffres exacts.

## H. Ancienneté (rappel critique)
Calculer l'ancienneté via une requête **`order:oldest` SANS filtre de sujet** sur le contact
(pas le 1ᵉʳ mail du dossier courant). Cf. spec 24.
