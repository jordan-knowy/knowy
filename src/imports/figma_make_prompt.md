# FIGMA MAKE — PROMPT KNOWY BRIEF INTERFACE
# Prompt de génération d'interface pour le brief pré-meeting Knowy
# Version 1.0 · Mai 2026

---

## CONTEXTE PRODUIT

Tu vas concevoir l'interface complète d'un **brief pré-meeting intelligent** pour Knowy — une plateforme d'intelligence relationnelle qui prépare automatiquement les réunions importantes.

Knowy génère un brief structuré avant chaque réunion à partir de signaux dispersés : emails, calendar, CRM, LinkedIn, données publiques.

**L'utilisateur type :** un commercial, un manager ou un dirigeant qui a 5 minutes avant une réunion importante et qui veut comprendre qui il va rencontrer, comment décide cette organisation, quels sont les risques, et quoi dire.

**Principe de design fondamental :**
> Ce brief doit être lisible en 5 minutes. Chaque seconde perdue à chercher une information est une seconde de moins pour se préparer. La densité prime sur l'exhaustivité. L'actionnable prime sur l'analytique.

---

## TYPE DE BRIEF À DESIGNER : COMMERCIAL

Il existe 3 types de briefs (Commercial / Partenariat / Productivité). Commence par le **brief commercial** — le plus complet et le plus complexe.

---

## ARCHITECTURE VISUELLE GLOBALE

### Header fixe (sticky)
- **Logo Knowy** + badge type de brief ("Brief Commercial")
- **Navigation par catégorie** (4 groupes, voir ci-dessous) avec dots colorés et scroll actif
- **Score de confiance global** visible en permanence (ex: "Conf. 42%")

### Sidebar gauche du header
- **Score de confiance** avec chiffre large (style Fraunces serif, couleur amber si < 60%)
- **Barre de progression** de la confiance
- **Liste des sources connectées** avec icônes : Gmail ✓ / Outlook ✗ / Slack ✗ / LinkedIn ✓ / CRM ✗
- **CTA contextuel** : "Connecter Gmail → +20%" (lien vers settings connecteurs)

### Corps principal
- Fond légèrement off-white (pas blanc pur)
- Cards arrondies avec bordure fine
- Navigation par 4 groupes avec séparateurs visuels clairs

---

## LES 4 GROUPES ET LEURS SECTIONS

### GROUPE 1 — CONTEXTE (couleur : gris neutre)

#### Section A — Résumé exécutif
**Objectif :** 3 à 5 phrases max. La synthèse que le commercial lit en premier.

Éléments visuels :
- Bloc de texte éditorial (police serif, italic, fond bleu très léger)
- Bordure gauche colorée (bleu accent)
- Tags de statut en dessous : "Momentum favorable" (vert) / "Champion non confirmé" (amber) / "MEDDPICC incomplet" (rouge) / etc.
- Barre de sources utilisées (pills avec icônes LinkedIn, presse, etc.)

**Note Romain :** Le résumé doit être dense et sans redondance avec les autres sections. Si une info est dans le résumé, elle ne se répète pas ailleurs.

#### Section B — Contexte entreprise
**Objectif :** Comprendre le momentum et le contexte stratégique de l'entreprise cible.

Éléments visuels :
- 4 stats cards en grille (Taille / Levée / Secteur / Croissance) — valeurs larges, labels petits
- Timeline verticale des événements récents (levée, recrutement, expansion, nouveau leadership) avec dots colorés par impact (vert = positif / amber = neutre / rouge = risque)
- Chaque event : date + titre + detail court + source

---

### GROUPE 2 — PERSONNES (couleur : bleu)

#### Section C — Participants & influence
**Objectif :** Voir en un coup d'œil qui est dans la salle, quel rôle il joue, et les dynamiques politiques.

Éléments visuels :
- **Participants cards** : avatar initiales + nom + titre + role badge (champion / décideur / gatekeeper / bloqueur) + dots d'influence (1 à 5)
- **IMPORTANT — Participants cliquables :** cliquer sur un participant met à jour les sections D (profil interactionnel) et E (agenda personnel) en temps réel avec une transition douce
- Badge "Profil actif" sur le participant sélectionné
- **Carte dynamique politique** : visualisation des relations entre participants (valide auprès de / bloqué par / influence)
- Info-bulle explicative : "Cliquez sur un participant pour voir son profil"
- Sources pills en bas : LinkedIn public / Calendar / Email

**Note Romain :** L'analyse du poste seul ne suffit pas. Les signaux comportementaux observés doivent être visibles sous chaque participant (ex: "Réponses emails de plus en plus courtes · 1 réunion manquée").

#### Section D — Profil interactionnel
**Objectif :** Comprendre comment communiquer efficacement avec cette personne.

Éléments visuels :
- **Header du profil** : avatar + nom + score de confiance individuel — se met à jour selon le participant sélectionné en C
- **Radar SVG à 6 axes** : Résultat / Rapidité / Structure / Relation / Intuition / Contrôle — polygone bleu semi-transparent sur grille hexagonale
- **4 barres d'axes** à côté du radar : chaque barre montre la position sur l'axe avec label gauche/droite, score de confiance individuel par axe, et description courte (ex: "Orientée résultat · 70%")
- **Interaction Modes** : chips colorées (1 à 3 max) : Challenger / Validator / Strategist / Operator / Consensus Builder / Explorer — primaires en bleu plein, secondaires en contour
- **Analyse comportementale** (section critique ajoutée post-feedback) :
  - Décisions de vie observables : "A vécu à l'étranger 3 ans → tolérance à l'incertitude"
  - Industries traversées : "Food · SaaS · Conseil → curiosité transversale"
  - Signal culturel si corroboré (jamais seul)

**Note Romain :** "Ton analyse doit se baser sur les choix de la personne, pas son poste. Il est parti à l'étranger donc il n'a pas peur de l'aventure. Il a bossé dans 3 industries dont beaucoup dans la cuisine." → Cette section doit afficher des insights réels sur les décisions de vie, pas des inférences génériques depuis le titre.

#### Section E — Agenda personnel
**Objectif :** Pourquoi CETTE personne a accepté CE meeting. Qu'est-ce qu'elle cherche vraiment.

Éléments visuels :
- Cards par participant (grille 3 colonnes si 3 participants)
- Card active = celle du participant sélectionné en C
- Chaque card : nom + role + liste de motivations probables avec dots colorés + score de confiance
- Si agenda inconnu → card avec état vide + message "Agenda inconnu — à qualifier en ouverture" + question suggérée

---

### GROUPE 3 — DEAL (couleur : violet)

#### Section F — MEDDPICC
**Objectif :** État de la qualification du deal. Voir en 3 secondes ce qu'on sait et ce qu'on ne sait pas.

Éléments visuels :
- **Score de santé deal** dans le header de section : "3/8 qualifiés" avec barre segmentée (rouge/amber/vert)
- **Grille 4×2** de 8 cases MEDDPICC :
  - Lettre large (Fraunces serif, colorée selon statut)
  - Label en capsules
  - Statut dot (vert = qualifié / amber = partiel / rouge = non qualifié)
  - Texte court de la valeur ou "Inconnu — à qualifier"
- Règle d'affichage critique : **jamais de case remplie avec une donnée inventée**. Mieux vaut 3/8 honnête que 8/8 faux.

**Note Romain :** "Rarement vu un MEDDPICC aussi bancal. Tout est faux." → Le MEDDPICC doit afficher honnêtement ce qui est qualifié vs ce qui ne l'est pas. Les cases vides sont une information en elles-mêmes.

#### Section G — Concurrence & statu quo
**Objectif :** Qui d'autre est dans la course. Quel est le statu quo à déloger.

Éléments visuels :
- Alerte amber si concurrence non qualifiée
- Liste des concurrents avec statut (confirmé / probable / inconnu) et source
- Zone "Questions à poser" : 2-3 questions directement formulées pour qualifier en meeting
- Si statu quo non identifié → état vide explicite

#### Section H — Critères de sélection
**Objectif :** Sur quoi vont-ils réellement décider.

Éléments visuels :
- Liste classée par rang avec barre de probabilité (% + barre colorée)
- Source du signal pour chaque critère (petit pill à droite)
- Critères inconnus → état vide + "À qualifier"

#### Section I — Coût de l'inaction
**Objectif :** Ce qu'il se passe pour eux s'ils ne décident pas.

Éléments visuels :
- 3 cards : Fournisseur actuel / Coût de l'inaction (élevé/moyen/faible) / Fenêtre d'opportunité (ouverte/se ferme/incertaine)
- Bloc insight éditorial : phrase forte en serif italic sur fond bleu clair
- Sources pills

---

### GROUPE 4 — ACTION (couleur : vert)

#### Section J — Recommandations meeting
**Objectif :** Ce que le commercial va dire et faire, dans quel ordre, pendant la réunion.

Éléments visuels :
- Liste numérotée de recommandations
- Chaque item : numéro + phase temporelle (ex: "Ouverture · min 0–5") + action en gras + justification en gris clair avec "→" prefix
- Pas de recommandation générique — chaque item est ancré dans un signal

**Note Romain :** "C'est un peu un bis repetita de ce qui c'est dit tout à l'heure. Peu de valeur." → Les recommandations ne doivent jamais répéter ce qui est dit dans d'autres sections. Chaque recommandation est unique et directement actionnelle.

#### Section K — Objections probables
**SECTION CRITIQUE — NE JAMAIS OMETTRE**

**Note Romain :** "Il y a un truc que t'as oublié. Ce sont les objections. Alors que c'est le truc qui aide de fou quand t'es préparé."

Éléments visuels :
- Section avec accent visuel fort (border gauche verte, fond légèrement distinct)
- Chaque objection : libellé de l'objection formulé comme l'interlocuteur le dirait (entre guillemets) + badge type (confusion catégorie / ROI / timing / statu quo / process / build vs buy) + barre de probabilité + réponse préparée en italique
- Source du signal qui permet d'anticiper l'objection
- Minimum 1 objection obligatoire — jamais vide
- Design : cette section doit visuellement "attirer l'œil" autant que le MEDDPICC

#### Section L — Risques identifiés
**Objectif :** Ce qui peut faire capoter le deal ou le meeting.

Éléments visuels :
- Cards de risque avec barre colorée latérale (rouge / amber / vert)
- Background légèrement teinté selon niveau
- Titre du risque + description + conséquence si non adressé

#### Section M — Next steps CRM
**Objectif :** Actions concrètes à faire pendant et après le meeting.

Éléments visuels :
- Grille 2 colonnes
- Chaque item : checkbox vide + texte + timing (pill : "En meeting" / "J+1" / "J+2 à J+7") + assignation
- Actions prioritaires en premier (badge "Obligatoire" ou "Priorité 1")

---

## ÉLÉMENTS TRANSVERSAUX

### Score de confiance — logique visuelle
- **< 25%** : rouge · Message "Données insuffisantes"
- **25–40%** : amber · "Brief partiel — hypothèses marquées"
- **40–60%** : amber/vert · "Brief complet — zones d'incertitude"
- **60–75%** : vert · "Recommandations actives"
- **> 75%** : vert foncé · "Brief complet — recommandations fortes"

### Signal pills (sources)
Chaque section affiche ses sources en bas :
- 🟣 Violet = source externe (LinkedIn, presse, web)
- 🟢 Vert = source interne (Gmail, Calendar, CRM)
- 🟡 Amber = Mémoire Knowy
- ⚫ Gris = non disponible

### Connecteurs — bloc d'activation
Visible dans le header et dans un bloc dédié :
- Icônes réelles : Gmail / Outlook / Slack / LinkedIn
- Statut : connecté (vert) / non connecté (gris + gain de confiance affiché)
- Lien : "Gérer les connecteurs →" vers app.knowy.io/settings/connectors
- Slack : surligné en amber avec mention "Recommandé pour ce type de brief"

### États vides
Pour tout champ null ou non disponible :
- Ne jamais cacher l'absence de donnée
- Afficher explicitement "Non disponible — à qualifier en meeting"
- Couleur gris neutre, pas d'espace blanc non justifié
- Accompagner d'une question suggérée si applicable

### Niveaux d'inférence
Chaque donnée affiche son niveau de fiabilité :
- **Observable** : fait direct sourcé
- **Inféré** : déduit de plusieurs signaux
- **Hypothétique** : signal faible, à valider
- **Non disponible** : null — jamais inventé

---

## DESIGN SYSTEM

### Typographie
- **Titres / chiffres clés** : Fraunces (serif, light 300) — crée la chaleur éditoriale
- **Corps / UI** : DM Sans (sans-serif, 300/400/500)
- **Valeurs numériques / codes** : DM Mono — rigueur et lisibilité des scores

### Couleurs
**Mode jour uniquement** (mode nuit abandonné après tests)

- Fond principal : #F5F3EF (off-white chaud)
- Cards : #FFFFFF
- Fond cards internes : #F9F8F6
- Bordures : #E8E5DF
- Texte principal : #1C1917
- Texte secondaire : #78716C
- Texte tertiaire : #A8A29E

**Couleurs accent par groupe :**
- Contexte : gris neutre #D4CFC7
- Personnes : bleu #2563EB (accent-light #EFF6FF)
- Deal : violet #7C3AED (accent-light #F5F3FF)
- Action : vert #059669 (accent-light #ECFDF5)

**Statuts :**
- Vert : #059669 / fond #ECFDF5
- Amber : #D97706 / fond #FFFBEB
- Rouge : #DC2626 / fond #FEF2F2

### Composants clés
- Radius cards : 14px
- Radius chips/pills : 20px (full rounded)
- Border cards : 0.5px solid — très fine, élégante
- Shadow : pas de box-shadow — remplacé par bordures fines
- Spacing système : 8px base (8/12/16/20/24/28/32)

---

## CE QU'IL NE FAUT PAS FAIRE

D'après les retours terrain (Romain Charvet, AE Salesforce — test utilisateur Mai 2026) :

❌ **Pas de radar générique** — le radar doit être alimenté par de vraies données comportementales, pas des valeurs par défaut qui "pourraient s'appliquer à n'importe qui"

❌ **Pas de répétition entre sections** — si une info est dans le résumé, elle n'est pas répétée dans les recommandations

❌ **Pas de données inventées** — un champ vide est préférable à un champ rempli avec une donnée hallucinée

❌ **Pas d'analyse par le poste seul** — "VP Sales" ne dit pas comment cette personne communique. Les décisions de vie (expatriation, multi-industries, création d'entreprise) sont plus révélatrices

❌ **Pas de MEDDPICC complet factice** — mieux vaut 3/8 cases qualifiées honnêtement que 8/8 inventées

❌ **Jamais d'objections vides** — c'est la section la plus actionnelle. Toujours au moins 1 objection préparée

❌ **Pas de mode nuit** — les tests ont montré que le mode jour est plus lisible dans un contexte pré-meeting (bureau, mobile, lumière naturelle)

---

## VARIANTES À PRÉVOIR

### Brief Productivité (interne)
Même système de design, palette verte (#0D9488), sections différentes :
- Remplace MEDDPICC par "Engagements en attente"
- Remplace Concurrence par "Tensions potentielles"
- Ajoute "Historique des réunions"
- Slack est le connecteur prioritaire (conversations d'équipe transverses)

### Brief Partenariat
Palette teal, sections hybrides entre Commercial et Productivité.

### Mobile
Même structure, navigation par swipe entre groupes, score de confiance toujours visible.

---

## LIVRABLES ATTENDUS

1. **Frame desktop** (1280px) — brief commercial complet, 13 sections
2. **Composants réutilisables** : participant card, MEDDPICC grid, risk item, objection item, signal pill, confidence badge
3. **États** : champ rempli / champ null / champ hypothétique / loading
4. **Interactivité** : participant cliquable → mise à jour profil interactionnel
5. **Brief productivité** (variante) avec palette verte

---

*Knowy · Brief Interface Design Prompt v1.0 · Mai 2026*
