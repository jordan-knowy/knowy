# FIGMA MAKE — PROMPT KNOWY MÉMOIRE RELATIONNELLE
# Page de lecture enrichie — intelligence relationnelle persistante
# Version 1.0 · Mai 2026

---

## CONTEXTE PRODUIT

Tu vas concevoir la page **Mémoire Relationnelle** de Knowy — une plateforme d'intelligence relationnelle ambiante.

Cette page est distincte du brief pré-meeting (qui est contextuel à une réunion spécifique). La Mémoire Relationnelle est **persistante** — elle vit en dehors de tout meeting et représente l'intelligence accumulée sur une personne au fil du temps.

**Analogie de design :** pense à un LinkedIn augmenté, croisé avec un journal de relation — mais en mode lecture pure. Aucune saisie manuelle. Tout est généré automatiquement depuis les signaux connectés.

**L'utilisateur type :** un commercial, un manager ou un dirigeant qui veut comprendre l'état de ses relations clés, détecter celles qui refroidissent, préparer une réactivation, ou passer un contact à un collègue avec tout le contexte.

**Principe de design fondamental :**
> Cette page est une expérience de lecture, pas un formulaire. Elle doit donner l'impression de feuilleter un dossier intelligent sur quelqu'un — dense, lisible, non-intrusif. Zéro champ à remplir. Tout est observé et inféré.

---

## ARCHITECTURE GLOBALE DE LA PAGE

La page se compose de **deux vues** :

### VUE 1 — Liste des contacts (vue index)
Panneau gauche ou page dédiée listant tous les contacts avec leurs métriques clés.

### VUE 2 — Fiche individuelle (vue détail)
Page complète sur un contact spécifique, accessible en cliquant depuis la liste.

---

## VUE 1 — LISTE DES CONTACTS

### Structure générale
- Barre de recherche en haut
- Filtres horizontaux : Tous / Phase (+) / Phase (=) / Phase (−) / Alertes / Par entreprise / Par ownership
- Liste de contacts sous forme de cards horizontales compactes

### Card contact (row)

Chaque card affiche sur une ligne :

**Colonne 1 — Identité**
- Avatar initiales avec couleur de fond par phase (+= vert / = gris / − rouge)
- Nom complet + titre court
- Entreprise avec logo si disponible

**Colonne 2 — Score d'engagement**
- Jauge circulaire ou score numérique (0–100)
- Couleur : vert > 65 / amber 35–65 / rouge < 35
- Micro-label : "Élevé" / "Modéré" / "Faible"

**Colonne 3 — Phase de la relation**
- Badge pill avec icône directionnelle :
  - 🟢 **+** Développement
  - ⚪ **=** Stagnation
  - 🔴 **−** Décroissance
- Durée dans cette phase : "depuis 3 semaines"

**Colonne 4 — Dernier contact**
- Date relative : "Il y a 12 jours"
- Type : email / réunion / Slack
- Icône source correspondante

**Colonne 5 — Alertes**
- Maximum 1 alerte visible par contact
- Priorité d'affichage :
  - 🔴 Relation qui refroidit (seuil dépassé)
  - 🟡 Changement de poste détecté
  - 🟢 Actualité favorable (levée, expansion)
  - 🔵 Brief Knowy récent disponible

**Colonne 6 — Action rapide**
- Bouton ghost : "Voir la fiche →"
- Bouton icône : "Générer un brief"

### États de la liste
- **État chargé** : liste normale
- **État vide** : "Aucun contact — connectez Gmail ou votre CRM pour commencer"
- **État filtré sans résultat** : "Aucun contact dans cette catégorie"

---

## VUE 2 — FICHE INDIVIDUELLE

### Navigation
- Retour vers la liste (breadcrumb ou flèche)
- Prénom Nom — Entreprise dans le titre de page
- Actions en haut à droite : "Générer un brief" (CTA primaire) + "Partager" (icône)

---

### BLOC 1 — IDENTITÉ & STATUT ACTUEL

**Layout :** header card pleine largeur avec fond légèrement coloré selon la phase

**Contenu gauche :**
- Grand avatar avec initiales
- Nom complet (Fraunces serif, grand)
- Titre actuel — avec badge de confirmation (✓ confirmé / ⚠ à confirmer)
- Entreprise + secteur
- Ancienneté dans le poste actuel : "En poste depuis 2 ans et 4 mois" — signal clé
- Localisation si disponible

**Contenu centre :**
- **Score d'engagement** : chiffre large (ex: 74/100) avec jauge semi-circulaire
- **Phase relation** : badge + durée ("Développement · depuis 6 semaines")
- **Réciprocité** : mini-indicateur "Qui initie ?" — barre bicolore montrant le ratio initiation nous vs eux (ex: "Vous initiez 70% des échanges")

**Contenu droite :**
- Date dernier contact + type
- Fréquence habituelle des échanges : "Habituellement tous les 21 jours"
- Prochain contact recommandé : "Dans 9 jours" (calculé depuis la fréquence habituelle)
- Sources connectées pour ce contact : pills Gmail ✓ / Calendar ✓ / LinkedIn ✓ / CRM ✗

---

### BLOC 2 — ALERTES ACTIVES

**Visibilité :** uniquement si alertes présentes — sinon bloc masqué

**Layout :** cards d'alerte horizontales, couleur selon urgence

Types d'alertes à afficher :
- 🔴 **Relation qui refroidit** : "Dernier contact il y a 47 jours — votre cycle habituel est 21 jours"
- 🟡 **Changement de poste détecté** : "A changé de poste il y a 3 semaines — le brief est peut-être obsolète"
- 🟡 **Titre non confirmé** : "Poste actuel non confirmé par double source — à vérifier"
- 🟢 **Actualité favorable** : "Acme Corp vient de lever 12M€ — fenêtre d'opportunité"
- 🔵 **Brief disponible** : "Brief Knowy généré le [date] — voir le détail"

---

### BLOC 3 — STATISTIQUES RELATIONNELLES

**Layout :** grille de stats compactes (4 à 6 métriques)

| Métrique | Exemple | Source |
|---|---|---|
| Emails échangés (total) | 47 emails | Gmail |
| Réunions tenues | 8 réunions | Calendar |
| Durée moyenne réunion | 42 min | Calendar |
| Dernier contact | Il y a 12 jours | Gmail |
| Taux de réponse moyen | < 4h | Gmail |
| Réunions manquées | 2 / 10 | Calendar |

Chaque stat : valeur grande + label petit + icône source en bas à droite

---

### BLOC 4 — ÉVOLUTION DE LA RELATION

**Layout :** graphique timeline horizontal — la pièce centrale de la page

**Ce que le graphique montre :**
- Axe X : temps (6 derniers mois par défaut, extensible à 12/24 mois)
- Axe Y : score d'engagement (0–100)
- **Courbe principale** : évolution du score d'engagement dans le temps
- **Marqueurs d'événements** sur la courbe :
  - 📧 Email important
  - 📅 Réunion
  - 🔄 Changement de phase détecté
  - ⚡ Événement externe (levée, changement poste)
- **Zones colorées** en fond : vert (développement) / gris (stagnation) / rouge (décroissance)
- **Tooltip au survol** de chaque marqueur : date + type + courte description

**Légende :** simple, discrète, en bas du graphique

**Sélecteur de période :** 3 mois / 6 mois / 12 mois / Tout

---

### BLOC 5 — PROFIL INTERACTIONNEL

**Layout :** deux colonnes — radar à gauche, axes et modes à droite

**Note :** contrairement au brief (contextuel à une réunion), ce profil est le profil **consolidé** — il agrège tous les signaux accumulés dans le temps. La confiance est plus élevée ici.

**Colonne gauche — Radar**
- Radar SVG hexagonal à 6 axes : Résultat / Rapidité / Structure / Relation / Intuition / Contrôle
- Polygone bleu semi-transparent
- Labels sur chaque axe
- Score de confiance global du profil : "Conf. 72% · basé sur 47 emails + 8 réunions"

**Colonne droite — Axes détaillés**
- 4 barres d'axes avec :
  - Label gauche (ex: "Résultat") / Label droite (ex: "Relation")
  - Barre avec position et couleur
  - Score de confiance individuel par axe
  - Description courte (ex: "Forte orientation résultat · Observable")
  - Niveau d'inférence : Observable / Inféré / Hypothétique

**Interaction Modes** (sous les axes) :
- Chips colorées en ordre de probabilité (max 3)
- Explication courte de chaque mode actif

---

### BLOC 6 — ANALYSE COMPORTEMENTALE (Qui est vraiment cette personne ?)

**C'est la section différenciante de Knowy — issue du feedback terrain**

> *"Ton analyse doit se baser sur les choix de la personne, pas son poste. Il est parti à l'étranger donc il n'a pas peur de l'aventure. Il a bossé dans 3 industries dont beaucoup dans la cuisine."* — Romain Charvet, AE Salesforce

**Layout :** cards insight empilées ou en grille 2 colonnes

**Types d'insights à afficher :**

🌍 **Mobilité / Aventure**
"A vécu à l'étranger 3+ ans → tolérance à l'incertitude, ouverture au changement"
Source : LinkedIn · Conf. 65%

🔀 **Transversalité**
"A travaillé dans 3 industries différentes (Food · SaaS · Conseil) → curiosité transversale, non-territorial"
Source : LinkedIn · Conf. 70%

🍽️ **Secteur dominant**
"60% de carrière dans le secteur Food → références culturelles, sujets de connexion informels"
Source : LinkedIn · Conf. 60%

🚀 **Entrepreneuriat**
"A fondé une entreprise en 2019 → tolérance à l'ambiguïté, orientation résultat"
Source : LinkedIn · Conf. 75%

🎯 **Style de communication observé**
"Emails courts (23 mots en moyenne), réponses < 2h, CTAs fréquents → directivité, orientation action"
Source : Gmail · Conf. 80%

**Règle d'affichage :** chaque insight montre sa source et son niveau de confiance. Si aucun signal comportemental disponible → section masquée ou état vide explicite.

---

### BLOC 7 — PARCOURS & CV OBSERVABLE

**Layout :** timeline verticale (style LinkedIn timeline, mais enrichie)

**Pour chaque poste :**
- Titre du poste + entreprise
- Durée (calculée automatiquement)
- Secteur
- Badge spécial si poste actuel : "Poste actuel · X ans Y mois"
- Badge si promotion interne : "↑ Promotion"
- Badge si pivot de secteur : "⇄ Pivot"
- Badge si création : "⚡ Fondateur"

**Sous la timeline :**
- Synthèse : "3 industries · 2 pivots · 1 expatriation · Secteur dominant : Food"
- Durée totale d'expérience calculée

---

### BLOC 8 — HISTORIQUE DES ÉCHANGES

**Layout :** feed chronologique inversé (plus récent en haut)

**Filtres :** Tout / Emails / Réunions / Briefs Knowy

**Item email :**
- Icône Gmail/Outlook + date + objet tronqué
- Ton détecté : pill coloré (chaleureux / neutre / tendu / formel)
- Longueur : "47 mots"
- Qui a initié : "Vous" / "Lui/Elle"

**Item réunion :**
- Icône Calendar + date + titre réunion
- Durée réelle vs planifiée
- Participants présents
- Lien vers le brief Knowy si disponible
- Badge si réunion manquée : "Annulé"

**Item brief Knowy :**
- Icône Knowy + date + type de brief (Commercial / Productivité)
- Score de confiance du brief
- Lien "Voir le brief →"

**Pagination :** "Voir les 23 échanges précédents" — ne pas tout charger d'un coup

---

### BLOC 9 — SUJETS & OBJECTIONS HISTORIQUES

**Layout :** deux colonnes

**Colonne gauche — Sujets abordés**
- Tags thématiques issus des échanges historiques
- Taille du tag proportionnelle à la fréquence
- Ex: "Budget" (×4) · "Intégration technique" (×3) · "Timeline" (×2)

**Colonne droite — Objections identifiées**
- Liste des objections historiques soulevées
- Date de première apparition
- Si résolue ou toujours active
- Ex: "Conflit avec solution actuelle" · soulevé 2× · Toujours active

---

### BLOC 10 — CONTEXTE ENTREPRISE ACTUEL

**Layout :** card compacte — ce qui se passe chez eux en ce moment

**Contenu :**
- Momentum actuel : Favorable 🟢 / Neutre ⚪ / Défavorable 🔴
- Dernière actualité significative avec source et date
- Recrutements actifs (nombre + type)
- Signaux détectés : levée / restructuration / expansion / changement leadership

**Note :** ce bloc est persistant — il se met à jour indépendamment des réunions

---

### BLOC 11 — RÉSEAU PARTAGÉ

**Layout :** section compacte

**Contenu :**
- Qui d'autre dans l'équipe a interagi avec ce contact
- Niveau d'interaction : "3 réunions" / "2 emails" / "Brief partagé"
- Date du dernier échange par collègue
- Si handoff effectué : "Passé par [Collègue] le [date] · Note : [...]"

---

### BLOC 12 — RECOMMANDATION D'ACTION

**Layout :** card d'action — dernière section, accent visuel fort

**Contenu selon la phase :**

**Phase développement :**
"La relation est en bonne dynamique. Dernier contact il y a 12 jours. Prochain contact recommandé dans 9 jours. Angle suggéré : [actualité entreprise récente]"

**Phase stagnation :**
"Aucune évolution depuis 6 semaines. Considérer une prise de contact avec un angle de valeur : [insight sectoriel] ou [actualité récente de leur entreprise]"

**Phase décroissance :**
"Dernier contact il y a 47 jours — au-delà de votre cycle habituel. Risque de relation froide. Action recommandée : [approche de réactivation]"

**CTA principal :** "Générer un brief pour la prochaine réunion →"

---

## FONCTIONNALITÉ PARTAGE

**Déclencheur :** bouton "Partager" en haut de la fiche

**Ce qui se partage :**
- Version lecture seule de la fiche (sans les données privées de l'initiateur)
- Données partagées : profil interactionnel, parcours, comportemental, contexte entreprise
- Données non partagées : historique emails personnels, notes internes

**Expérience :**
- Modal de partage avec champ "Note de contexte" (texte libre)
- Destinataire : membre de l'équipe ou lien de partage
- La note de contexte apparaît en haut de la fiche partagée ("Passé par Maxime le 25/05/2026 · Note : attention, sensible sur le budget")

---

## DESIGN SYSTEM

### Identique au brief — cohérence plateforme

**Typographie :**
- Titres / chiffres clés : Fraunces (serif, light 300)
- Corps / UI : DM Sans (300/400/500)
- Métriques / scores : DM Mono

**Couleurs de phase relation :**
- Développement (+) : #059669 vert / fond #ECFDF5
- Stagnation (=) : #78716C gris / fond #F5F5F4
- Décroissance (−) : #DC2626 rouge / fond #FEF2F2

**Couleurs système :**
- Fond principal : #F5F3EF
- Cards : #FFFFFF
- Fond cards internes : #F9F8F6
- Bordures : #E8E5DF (0.5px)
- Texte : #1C1917 / #78716C / #A8A29E

**Score d'engagement :**
- > 65 : #059669 vert
- 35–65 : #D97706 amber
- < 35 : #DC2626 rouge

### Composants spécifiques à cette page
- Score gauge (circulaire ou semi-circulaire)
- Phase badge (+/=/−) avec icône directionnelle
- Reciprocity bar (barre bicolore)
- Event marker sur timeline (émoji + tooltip)
- Insight card comportemental (avec source + confiance)
- Alert card (4 variantes couleur)
- Historique item (email / réunion / brief)

---

## CE QU'IL NE FAUT PAS FAIRE

❌ **Pas de champ de saisie** — c'est une vue lecture pure. Zéro formulaire, zéro input manuel.

❌ **Pas de données inventées** — si un signal est absent, afficher l'état vide explicite, jamais une valeur par défaut fictive.

❌ **Pas d'analyse par le titre de poste seul** — le profil comportemental doit venir des choix de vie observables (expatriation, multi-industries, création d'entreprise), pas du titre LinkedIn.

❌ **Pas de graphique vide sans explication** — si pas assez de données pour la timeline d'évolution, afficher "Données insuffisantes — connectez Gmail pour voir l'évolution"

❌ **Pas de brief dans cette page** — la Mémoire Relationnelle est persistante et non-contextuelle. Le brief est généré à part, à la demande. Le lien vers le brief est dans la fiche, pas le brief lui-même.

❌ **Pas d'interface surchargée** — tous les blocs secondaires (Réseau partagé, Sujets historiques, Contexte entreprise) peuvent être en toggles / accordéons fermés par défaut. Seuls les blocs 1 à 5 sont ouverts au chargement.

---

## ORDRE D'AFFICHAGE AU CHARGEMENT

**Ouverts par défaut (above the fold) :**
1. Identité & statut actuel
2. Alertes actives (si présentes)
3. Stats relationnelles
4. Évolution de la relation (graphique)
5. Profil interactionnel

**Fermés par défaut (scroll ou toggle) :**
6. Analyse comportementale
7. Parcours & CV
8. Historique des échanges
9. Sujets & objections historiques
10. Contexte entreprise actuel
11. Réseau partagé
12. Recommandation d'action

---

## ÉTATS DE DONNÉES

| Situation | Comportement |
|---|---|
| Contact riche (Gmail + Calendar + LinkedIn) | Tous les blocs affichés |
| Contact pauvre (LinkedIn seulement) | Blocs 1, 6, 7 affichés — reste masqué avec "Connectez Gmail" |
| Contact nouveau (< 3 échanges) | Graphique en état vide, stats minimales |
| Contact inactif (> 6 mois sans contact) | Alerte décroissance + recommandation réactivation |
| Poste non confirmé | Badge ⚠ sur le titre + alerte dans bloc 2 |

---

## LIVRABLES ATTENDUS

1. **Vue liste contacts** — avec tous les états (chargé / vide / filtré)
2. **Fiche individuelle** — contact riche (tous les blocs)
3. **Fiche individuelle** — contact pauvre (blocs partiels)
4. **Modal de partage** — avec champ note de contexte
5. **Composants réutilisables** : score gauge, phase badge, reciprocity bar, event marker, insight card, alert card, historique item
6. **États vides** de chaque bloc

---

*Knowy · Mémoire Relationnelle Design Prompt v1.0 · Mai 2026*
*Page lecture enrichie — intelligence relationnelle persistante*
