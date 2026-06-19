# Spec-28 — Composants de fiche CRM (v8)

Composants transverses ajoutés aux surfaces Personne / Compte. Réfs :
`templates-reference/exemple-personne-crm.html`, `templates-reference/exemple-compte-crm.html`.

## 1. Badge « Enregistrer sur KnowR » (F12)
Pastille en **haut à droite de la nav**, sur les 4 surfaces. Action : enregistrer la fiche dans
l'espace de l'utilisateur (mémoire relationnelle persistée). État : « 🔖 Enregistrer » → « ✓ Enregistré ».

## 2. Coordonnées + Enrichissement (Personne)
- **Carte « Coordonnées » dans le rail, SOUS le bloc Signaux** (mail + téléphone), cliquable (mailto / tel). Emplacement volontaire : hors du hero (ne pas surcharger) et hors `.sig-card` (ne pas déclencher le garde-fou Signaux).
- **Si une coordonnée est `null` → bouton « ✨ Enrichir »** (consomme un crédit). **JAMAIS de numéro inventé.**
- Résultat d'enrichissement → **« à confirmer »** (règle double-source : un mail/tél récupéré reste à vérifier).
- Source réelle en prod : RocketReach / GoJiBerry / connecteur.

## 3. Pénétration du compte (Compte)
En tête de la section Contacts : **« X contacts connus / Y dans l'entreprise » → % de l'effectif couvert**,
barre segmentée (en relation · identifié à analyser · non couverts).
- **L'effectif total (Y) est SOURCÉ, jamais inventé** (presse / Société.info / Pappers / connecteur). Sourçe affichée sous l'indicateur. Si introuvable → « à confirmer / estimer via connecteur ».
- À distinguer de « analysés / identifiés » (qui mesure la qualité de couverture des contacts connus).
- Met en évidence la **marge de couverture** (non couverts) → alimente le panneau Découverte (§5).

## 4. Tendance « dernière réunion » + Prochain pas (Personne)
Bandeau sous le hero : **Tendance ↗/→/↘ depuis la dernière réunion** (delta) + **Prochain pas**.
**Alimenté par le Compte-rendu** (spec-27) : delta de score + engagements. Pas de tendance inventée :
sans réunion récente → « stable ».

## 5. Panneau Découverte account-scoped (F10-A)
Sur la fiche **Compte** (section « Étendre la couverture relationnelle ») : recherche IA **scoppée au compte/groupe**
→ profils clés identifiés (sources publiques) → **Enrichir** + **Enregistrer**.
- Les profils sortent en **« à confirmer »** ; ils **ne polluent pas** le scoring du compte (hors `.ct-tbl`).
- **Positionnement (frontière produit) :** extension de la **couverture relationnelle** autour de comptes déjà
  travaillés — **PAS de la prospection à froid** (= rôle de Pisteur). Ne pas brouiller les deux produits.
- Déclencheur = la fiche Compte (intention « qui d'autre ici ? »), **pas un onglet froid** global.
