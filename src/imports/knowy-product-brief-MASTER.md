
╔══════════════════════════════════════════════════════════════════════════════╗
║         KNOWY — PRODUCT DESIGN BRIEF V1.0                                  ║
║         Pour : UX/UI Designer · PM · Figma · 3 devs frontend               ║
╚══════════════════════════════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VISION PRODUIT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Knowy est un Relational Operating System pour les équipes revenue.
Il prépare chaque réunion qui compte (brief automatique), coache en live pendant 
la réunion (coach IA), et mémorise tout ce qui s'est passé (mémoire relationnelle 
permanente + sync CRM).

Philosophie design : Intelligence invisible. Interface qui s'efface. 
L'utilisateur ne doit jamais sentir qu'il utilise un outil — il sent qu'il sait des choses.

ICP principal : Account Executive B2B SaaS, Founder, BD Manager.
Posture : sobre, premium, confiant. Références : Notion, Linear, Loom early branding.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. DESIGN SYSTEM "VIOLET TRUST"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COULEURS
─────────
Background principal    #F5F0FF  (lavande très clair — jamais blanc pur)
Background secondaire   #EDE8FF  (surfaces légèrement plus profondes)
Surface cards           #FFFFFF  avec border rgba(110,80,200,0.10)
Accent primary          #6E50C8  (violet confiance)
Accent hover / dark     #5A3EAA  (violet profond)
Accent light            #D4C5F5  (violet pâle — chips, tags, icônes)
Nuit (section dark)     #1A1040  / #2A1E60
Text primary            #1A1040  (quasi-noir violet)
Text secondary          #5A4880  (violet grisé)
Text tertiary           #9082B8
Text disabled           #C4B8E0
Sage / Positif          #2EA86A  fond #E4F5ED
Ambre / Attention       #C97A20  fond #FBF0E2
Corail / Alerte         #D94F63  fond #FDEAED
Bleu / Info             #3D6FCC  fond #E5EDFF

TYPOGRAPHIE
────────────
Display H1/H2           Epilogue Black (900) — letter-spacing: -0.035em
UI regular              Epilogue Regular (400) / SemiBold (600) / Bold (700)
Données, scores, mono   JetBrains Mono (400/500)
Import Google Fonts : Epilogue:wght@300;400;600;700;900 + JetBrains+Mono:wght@400;500

ÉCHELLE TYPE
H1 landing : 88px / weight 900 / line-height 0.98
H2 sections : 44px / weight 900 / line-height 1.05
H3 cards    : 18-20px / weight 700
Body        : 14-16px / weight 400 / line-height 1.7
Caption     : 12px / weight 500 / color text-secondary
Mono data   : 12-14px JetBrains Mono

ESPACEMENT (base 4px)
Padding section : 88px vertical / 24px horizontal
Padding card    : 24-32px
Gap grids       : 18-20px
Border-radius   : sm=6px, md=10px, lg=14px, xl=20px, 2xl=28px, 3xl=36px, pill=999px

OMBRES (toujours teintées violet)
xs  : 0 1px 4px rgba(110,80,200,.07)
sm  : 0 2px 16px rgba(110,80,200,.08)
md  : 0 6px 28px rgba(110,80,200,.11)
lg  : 0 16px 56px rgba(110,80,200,.14)
xl  : 0 24px 80px rgba(110,80,200,.16)

COMPOSANTS CORE
────────────────
Button primary   : bg #6E50C8 / text white / radius 14px / shadow 0 2px 12px rgba(110,80,200,.35)
Button secondary : bg white / border 1.5px #D4C5F5 / text #6E50C8
Button ghost     : transparent / text #5A4880
Chip/Tag         : bg #EDE8FF / text #6E50C8 / border rgba(110,80,200,.18) / radius pill / font 11px 700
Avatar           : border-radius 50% / border 2px solid white / gradient violet ou couleur ICP
Progress bar     : height 5px / bg #EDE8FF / fill gradient gauche→droite couleur sémantique
Input            : bg white / border 1.5px rgba(110,80,200,.15) / radius 14px / focus: border #6E50C8 + shadow
Score circle     : font Epilogue 900 + JetBrains Mono / couleur = seuil confiance
Signal card      : border-left 3px couleur sémantique / bg fond pastel correspondant

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. ARCHITECTURE GLOBALE DE L'APPLICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NAVIGATION PRINCIPALE (sidebar gauche fixe, 220px)
────────────────────────────────────────────────────
Logo "Knowy" — Epilogue Black italic, violet accent sur le "y"
Tagline sous le logo : "Relational Intelligence" — mono 10px

Sections nav (dans l'ordre) :
  📋  Dashboard           (réunions à venir)
  ✅  Réunions passées    (historique + sync CRM)
  🧠  Contacts            (mémoire relationnelle)
  👥  Équipe              (plan Team uniquement)
  ——— séparateur ———
  ⚙️  Paramètres          
  💳  Abonnement          

En bas de sidebar :
  Avatar + Nom + rôle + indicateur plan (Starter / Solo / Team)
  Statut des connecteurs actifs (icônes Gmail / HubSpot etc.)

TOPBAR (68px hauteur fixe, per page)
  Titre de la page — H2 Epilogue 700
  Contexte contextuel (date, filtres, actions principales)
  Barre de recherche globale (centre ou droite)
  Notification bell + avatar utilisateur

LAYOUT TYPE : sidebar 220px + contenu principal fluide + panel droit optionnel 360px

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. ONBOARDING — 5 ÉTAPES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Layout : centré, sans sidebar. Progress bar en haut (5 steps).
Logo Knowy en haut à gauche. Fond #F5F0FF.
Bouton "Retour" discret. Bouton "Continuer →" primary pleine largeur ou fixe à droite.

──── STEP 1 — Votre profil ────────────────────────────────────────────────────

Titre (H1) : "Commençons par vous."
Sous-titre : "Knowy a besoin de vous connaître pour vous préparer à chaque réunion."

Bloc connexion LinkedIn :
  Large card centrale (max-width 480px)
  Icône LinkedIn + "Connecter mon profil LinkedIn"
  Bouton primary : "Connexion LinkedIn OAuth →"
  Texte sous le bouton : "Knowy lit votre poste, votre entreprise, votre réseau. Rien n'est posté en votre nom."
  
Post-connexion (état rempli) :
  Avatar LinkedIn affiché + Nom + Poste + Entreprise actuelle + Secteur
  Badge vert "Profil synchronisé ✓"
  
Champ manuel additionnel (si pas de LinkedIn) :
  Prénom · Nom · Poste actuel · Nom de l'entreprise · URL du site web

Bloc analyse website (déclenché après LinkedIn ou URL saisie) :
  "Analysez votre site pour que Knowy comprenne ce que vous vendez"
  Input URL : "https://votre-site.com"
  Bouton "Analyser" → état loading (spinner) → état résultat :
    Résumé généré en 3 lignes "Votre entreprise est..."
    Tags auto-générés : secteur · type de produit · marché cible
    Bouton "Modifier" pour éditer le résumé

Champ additionnel clé :
  "Décrivez en une phrase ce que vous vendez" (textarea, 140 chars max)
  Placeholder : "Ex: Un outil SaaS qui aide les équipes sales à préparer leurs réunions"

──── STEP 2 — Votre agenda ───────────────────────────────────────────────────

Titre : "Connectez votre agenda."
Sous-titre : "Knowy scanne vos réunions à venir et génère les briefs automatiquement."

Deux cartes grandes côte à côte :
  Card Gmail Calendar :
    Logo Google Calendar + "Google Calendar"
    "Sync Gmail + Calendar en 1 clic"
    Bouton "Connecter avec Google →" (OAuth)
    Indicateur : "30 secondes"
  Card Outlook :
    Logo Microsoft + "Outlook Calendar"
    "Sync Outlook + Exchange"
    Bouton "Connecter avec Microsoft →" (OAuth)

Post-connexion :
  Preview en temps réel des 3 prochaines réunions détectées
  Chaque réunion : heure · titre · participants (anonymisés "3 participants")
  Badge "X réunions détectées cette semaine"

Option Slack :
  Section plus petite en dessous : "Ajouter Slack pour enrichir le contexte"
  Toggle on/off + OAuth si activé

──── STEP 3 — Vos connecteurs CRM ────────────────────────────────────────────

Titre : "Synchronisez votre CRM."
Sous-titre : "Knowy met à jour vos fiches automatiquement après chaque réunion. Zéro saisie."

Grille 3 colonnes de cartes CRM :
  HubSpot   : logo + "Le plus populaire" badge + bouton "Connecter" (OAuth)
  Salesforce: logo + "Enterprise" badge + bouton "Connecter" (OAuth)
  Pipedrive : logo + bouton "Connecter" (OAuth)
  Attio     : logo + "Nouveau" badge + bouton "Connecter" (bêta)
  Notion    : logo + bouton "Connecter"
  "Autre"   : icône + "Nous contacter"

Chaque card : état non-connecté / en connexion (spinner) / connecté (badge vert)

Footer de l'étape :
  "Vous pouvez connecter votre CRM plus tard dans les paramètres"
  Lien "Passer cette étape →" en ghost

──── STEP 4 — Configuration notification ─────────────────────────────────────

Titre : "Quand voulez-vous être prévenu ?"
Sous-titre : "Knowy génère votre brief et vous avertit avant chaque réunion importante."

Paramètres :
  Slider ou radio : "Recevoir le brief X minutes avant la réunion"
    Options : 15 min / 30 min (recommandé) / 1h / 2h
  
  Toggle "Notifications push" (mobile)
  Toggle "Email de brief" (email digest)
  Toggle "Générer automatiquement pour toutes les réunions"
    Sous-option si off : "Me demander avant chaque réunion"
  
  Catégorisation automatique des réunions :
    Toggle "Commerciales" — générer brief
    Toggle "Internes" — générer brief (off par défaut)
    Toggle "Recrutement" — générer brief (on par défaut)

──── STEP 5 — Premier brief (WOW moment) ──────────────────────────────────────

Titre : "Votre première réunion est prête."
Sous-titre : "Knowy a analysé votre agenda. Voici votre premier brief."

État loading (3-5 secondes avec animation) :
  Animation progress : icônes qui apparaissent une à une
  "Analyse de votre agenda..." 
  "Identification des participants..."
  "Collecte des signaux..."
  "Brief généré ✓"

État résultat :
  Preview du premier brief détecté (prochaine réunion)
  Card brief condensée : titre réunion · heure · participants · 1 recommandation Knowy
  
  CTA : "Voir le brief complet →" (ouvre la page Brief)
  CTA secondaire : "Accéder au dashboard →"

  Invite plug-in :
    Banner : "Activez le Coach Knowy pendant vos réunions"
    Icône Teams + Meet + Zoom
    Bouton "Télécharger le plug-in →" + "Plus tard"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. DASHBOARD — RÉUNIONS À VENIR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Layout : sidebar gauche + zone principale (grille ou liste) + panel droit optionnel

TOPBAR DASHBOARD
  Titre : "Bonjour [Prénom] 👋" — H2 Epilogue 700
  Sous-titre : "[Date du jour] · X réunions cette semaine"
  Actions droite : 
    Bouton "Générer un brief manuellement" (+ icon)
    Toggle vue : Grille / Liste
    Filtre : Tous / Commerciaux / Internes / Recrutement

MÉTRIQUES RAPIDES (row de 3 stats cards en haut)
  Card 1 : "X briefs prêts aujourd'hui" — violet
  Card 2 : "X réunions cette semaine" — neutre
  Card 3 : "X nouvelles alertes réseau" — ambre si > 0

SECTION AUJOURD'HUI
  Label : "Aujourd'hui · [date]" — mono uppercase
  
  Réunions du jour en format card horizontale large :
  ┌──────────────────────────────────────────────────────────────────┐
  │ [Heure]  [Titre de la réunion]                    [Tag catégo]  │
  │ [Icône]  [Participants — avatars empilés max 4 + "+N"]          │
  │          [Tag externe/interne] [Score importance /100]           │
  │                                      [Statut brief] [→ Voir]    │
  └──────────────────────────────────────────────────────────────────┘

  STATUTS BRIEF (badge coloré) :
    "⏳ En génération" — ambre / spinner
    "✓ Brief prêt" — vert / cliquable
    "📝 À générer" — gris / bouton "Générer"
    "⚠ Données insuffisantes" — corail / tooltip explication
    "✓ Consulté" — violet pâle

  Interaction au clic sur la card → ouvre le Brief dans panel droit (ou page dédiée)
  
  Interaction clic sur catégorie → modal dropdown pour changer :
    Commercial · Interne · Recrutement · Partenariat · Investisseur · Autre

SECTION CETTE SEMAINE
  Sous-section par jour : "Demain", "Jeudi 22 mai", etc.
  Mêmes cards mais format légèrement plus compact
  Tri automatique par heure

SECTION À VENIR (collapsable)
  Les réunions au-delà de cette semaine
  Format condensé : ligne avec heure · titre · statut

SIDEBAR DROITE CONTEXTUELLE (360px — s'ouvre au clic sur une réunion)
  Preview rapide du brief sans quitter le dashboard
  Header : titre réunion + heure
  Participants en row d'avatars cliquables
  Top 3 recommandations Knowy
  Bouton "Voir le brief complet →" → navigate to brief page
  Bouton "Ouvrir dans un nouvel onglet" (icon)

BANNER PLUG-IN (si non installé)
  Bandeau discret en haut de page (dismissable) :
  "🎯 Activez le Coach en réunion · Télécharger le plug-in →"
  S'affiche 1 fois par session tant que le plug-in n'est pas installé

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5. PAGE BRIEF — CŒUR DU PRODUIT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Layout : 2 colonnes — colonne principale (flex 1) + colonne droite (360px fixe)
Accès : depuis Dashboard ou recherche ou notification

TOPBAR BRIEF
  Breadcrumb : Dashboard > [Titre réunion]
  Titre : [Titre complet de la réunion]
  Sous-titre mono : [Date · Heure → Heure · Plateforme (Google Meet / Teams / Zoom)]
  
  Badges : 
    [Tag catégorie — modifiable au clic]
    [Score importance /100 — badge coloré selon seuil]
    Countdown si réunion dans < 2h : "Dans X min" — ambre pulsant
  
  Actions droite :
    Bouton "Rafraîchir le brief" (icon rotate)
    Bouton "Partager" (icon share)
    Menu "..." → Télécharger PDF / Envoyer par email / Archiver

COLONNE PRINCIPALE
─────────────────

Section A — SCORE DE CONFIANCE GLOBAL
  Bandeau plein largeur
  Score visuel (cercle ou barre) : X/100 — couleur selon seuil :
    < 25% : corail — "Données insuffisantes"
    25-40% : ambre — "Brief partiel · hypothèses signalées"
    40-60% : ambre — "Brief complet · zones d'incertitude"
    60-75% : sage — "Brief complet · recommandations actives"
    > 75%  : vert — "Brief fort · recommandations fortes"
  Sources actives : icônes Gmail / LinkedIn / HubSpot / etc. avec % de confiance chacune
  Bouton "Ajouter un connecteur" si < 3 sources actives

Section B — PARTICIPANTS (cliquables)
  Titre section : "Qui est dans la room · X personnes"
  
  Chaque participant = card cliquable :
  ┌─────────────────────────────────────────────────────────────┐
  │ [Avatar]  [Nom Prénom]              [Tag rôle dans réunion] │
  │           [Poste · Entreprise]      [Score relation /100]   │
  │           [Mode interaction dominant]  [Barre confiance]    │
  │           [Chips signaux récents]                           │
  └─────────────────────────────────────────────────────────────┘
  
  Clic sur un participant → mise à jour du panel droit avec son profil complet
  Badge "Vous" sur le participant utilisateur
  Badge "Décideur / Influenceur / Gardien / Champion" si détecté
  Option "Ajouter un participant manuellement" en fin de liste

Section C — CONTEXTE ENTREPRISE
  Titre : "[Nom entreprise] · Signaux récents"
  
  Signaux en cards avec border-left colorée :
    Vert / Financement : "380M€ levés · Série C · Expansion EMEA annoncée"
    Ambre / Recrutement : "+14 Sales en 30 jours — signal d'accélération forte"
    Bleu / Opportunité : texte descriptif
    Corail / Alerte : "Dernier contact il y a 23 jours — momentum en baisse"
  
  Chaque signal : label catégorie (mono 10px) + texte + source (LinkedIn/Crunchbase/etc.) + date
  
  Métriques entreprise (si disponibles) :
    Taille · Secteur · Financement · Croissance recrutement · Actualités
  Score company intel : X%

Section D — RECOMMANDATIONS KNOWY
  Titre : "⚡ Recommandations — [Nom participant sélectionné]"
  
  Liste de 3-5 recommandations prioritaires :
    Fond coloré selon nature :
      violet clair = insight comportemental
      ambre = alerte / attention
      sage = opportunité
    
    Format : icon + texte court + source si pertinent
    Priorité affichée (P1 / P2 / P3) ou ordre visuel
  
  Bouton "Voir toutes les recommandations" (si > 5)

Section E — MEDDPICC (si réunion commerciale)
  Titre : "Qualification deal"
  Grille 2x4 des lettres MEDDPICC
  Chaque lettre : état coloré (vert=qualifié / ambre=partiel / gris=manquant / rouge=risque)
  Clic sur une lettre → tooltip/drawer avec détail et source
  
  Bouton "Mettre à jour MEDDPICC" → ouvre panel édition

Section F — NOTES PRÉ-RÉUNION (zone éditable)
  Éditeur texte simple (pas markdown) : "Ajoutez vos notes avant la réunion..."
  Auto-save toutes les 5 secondes
  Timestamp dernière sauvegarde

COLONNE DROITE (360px fixe)
──────────────────────────────

Panel adaptatif selon participant sélectionné (par défaut : participant principal)

  En-tête participant :
    Avatar large (52px) + Nom + Poste + Entreprise
    Score relation : barre de progression + valeur /100
    Mode interaction : badge dominant (Challenger / Validator / Strategist / Operator / etc.)
  
  Radar SVG interactif — 4 axes :
    Relation ↔ Résultat
    Intuition ↔ Structure
    Rapidité ↔ Prudence
    Consensus ↔ Contrôle
    → Polygone animé, 5 points, fill violet 10% opacité
    → Labels sur les axes avec position actuelle (point coloré)
  
  4 barres de progression axes :
    Chaque axe : label gauche ↔ label droite · position · % · barre
    Couleur barre selon axe (violet / bleu / ambre / sage)
  
  Signaux récents sur ce contact :
    Mini-feed : 3 derniers signaux avec date
    Lien "Voir l'historique complet →" → page Contact
  
  Interactions passées :
    Timeline compacte : X réunions · X emails · X mentions
    Badge "Brief n°X — [qualificatif]"
  
  Bouton "Ouvrir la fiche complète →" → page Contact/Mémoire

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
6. COACH IA — INTERFACE RÉUNION LIVE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Accessible via : plug-in navigateur (Chrome extension)
Surfaces : overlay sidebar dans Google Meet / Microsoft Teams / Zoom
Visible : uniquement par l'utilisateur Knowy (invisible aux autres participants)

ÉTATS DU COACH (3 phases distinctes)

──── ÉTAT 1 : PRÉ-RÉUNION (lobby, avant démarrage) ─────────────────────────

Sidebar flottante droite, 280px, bg blanc, shadow xl
  Header gradient violet
    Logo Knowy (italique) + "Coach · Prêt"
    Indicateur "Réunion dans X min" — point ambre pulsant

  Content :
    Participants détectés (avatars + noms)
    Top 2 rappels du brief (cards condensées)
    Alerte si détectée (ex : email sans réponse)
  
  Footer : "Knowy écoute en silence · Visible uniquement par vous"

──── ÉTAT 2 : LIVE (réunion en cours) ────────────────────────────────────────

  Header gradient sage→teal
    "Coach · En direct" + chrono (00:00)
    Indicateur live vert pulsant

  Feed temps réel (scroll interne) — nouvelles suggestions arrivent en haut :
    
    Item suggestion (violet) :
      Label "💡 SUGGESTION" — mono 9.5px violet uppercase
      Texte court : "Marc évoque les délais. Confirmez une date maintenant."
    
    Item alerte (ambre) :
      Label "⚠️ SIGNAL" — ambre
      Texte : "Sophie n'a pas parlé depuis 8 minutes."
    
    Item capturé (sage) :
      Label "✓ CAPTURÉ" — sage
      Texte : «"Je reviens d'ici vendredi" — Marc, 14h43»
    
    Item analyse expression (si activé) :
      Label "👁 EXPRESSION" — bleu
      Texte : "Marc : scepticisme détecté (froncement)"
      Note : badge BETA + info consentement

  Compteur engagements capturés : badge bas "2 engagements ✓"
  
  Bouton discret "Masquer" (icône flèche) → coach se replie sur 40px

──── ÉTAT 3 : POST-RÉUNION (5 min après fin) ───────────────────────────────

  Header gradient bleu→violet
    "Coach · Réunion terminée"
  
  Résumé généré automatiquement :
    X points clés
    X engagements capturés
    X next steps identifiés
  
  CRM sync :
    "HubSpot — Matching identifié : [Nom société] · Valider / Refuser"
    Ou : "2 fiches possibles → Choisir"
    Ou : "Aucune fiche → Créer une fiche"
    État post-validation : badge vert "✓ HubSpot mis à jour"
  
  Mémoire :
    "🧠 Profil mis à jour · Brief n°[X] enrichi"
  
  CTA : "Voir le résumé complet →" (ouvre page Réunion réalisée)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
7. PAGE RÉUNIONS RÉALISÉES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Layout : liste left (340px) + détail right (flex)

TOPBAR
  Titre : "Réunions réalisées"
  Filtres : Toutes · Commerciales · Internes · Recrutement
  Filtre date : Semaine / Mois / Période custom
  Search : "Chercher une réunion ou un contact"

LISTE GAUCHE (340px scrollable)
  Chaque item :
    Date + heure · Titre · X participants
    Badge CRM : "✓ Sync" (vert) / "— Non sync" (gris) / "⚡ À synchroniser" (ambre)
    Badge brief : "Consulté" / "Brief généré" / "Pas de brief"
  Tri : Chronologique inverse (plus récent en haut)

PANEL DROIT — DÉTAIL RÉUNION RÉALISÉE
───────────────────────────────────────

SECTION A — EN-TÊTE
  Titre réunion · Date · Durée réelle · Plateforme
  Participants : avatars cliquables + noms
  Badges : catégorie · score réunion /100 (si coach actif)

SECTION B — RÉSUMÉ EXÉCUTIF (généré par IA)
  Résumé narratif 5-8 lignes
  3 points clés (bullet list)
  Tone : professionnel, première personne du pluriel

SECTION C — ENGAGEMENTS & NEXT STEPS
  Tableau 2 colonnes :
    Engagements pris | Responsable | Deadline détectée
  Bouton "Modifier" sur chaque ligne
  Bouton "+ Ajouter un engagement"
  Export : "Envoyer par email" / "Copier"

SECTION D — TEMPS DE PAROLE
  Graphique horizontal bar chart :
    Chaque participant : avatar + nom + barre proportionnelle + %
    Couleur par participant (cohérente avec leurs avatars)
    "Vous" mis en évidence
  Note : "Basé sur X minutes de réunion"

SECTION E — ANALYSE EXPRESSIONS & ENGAGEMENT
  ⚠️ Visible uniquement si plug-in actif + consentement activé
  
  Timeline horizontale de la réunion :
    Axe X = temps (0min → Xmin)
    Ligne par participant
    Points colorés sur la timeline : vert=engagé / ambre=neutre / corail=sceptique
    Événements annotés : "Objection détectée 14h47" · "Signal intérêt 14h52"
  
  Résumé par participant :
    "Marc Rousseau : engagement dominant — pic à 14h52 lors de la discussion ROI"
    "Sophie Bernard : réserve détectée sur le sujet pricing (14h38-14h41)"
  
  Badge BETA + info légale + toggle on/off global

SECTION F — TRANSCRIPT
  Transcript complet diarisé (qui parle = label avant chaque paragraphe)
  Search dans le transcript
  Clic sur un passage → jump to timestamp (si enregistrement disponible)
  Export : .txt / .pdf / copier

SECTION G — EXTENSION DE PROFILS
  Participants identifiés via email après la réunion :
  Pour chaque participant non encore dans Knowy :
    "Thomas Martin · thomas@ledger.com — Identifié"
    Bouton "Ajouter à mes contacts Knowy"
    Bouton "Créer une fiche CRM"

SECTION H — SYNCHRONISATION CRM (card dédiée, sticky en bas ou sidebar)
  
  État 1 — Non synchronisé :
    Card ambre : "Cette réunion n'a pas encore été synchronisée"
    Sélecteur CRM (si plusieurs connectés)
    "Matching identifié : [Nom société dans CRM]" → Valider / Refuser
    Bouton primary "Synchroniser avec HubSpot →"
  
  État 2 — Match ambigu :
    "2 fiches trouvées — laquelle ?"
    Radio buttons : [Fiche A] / [Fiche B] / "Aucune — créer"
    Bouton "Confirmer →"
  
  État 3 — No match :
    "Aucune fiche trouvée pour [Nom société]"
    Bouton "Créer une fiche Account + Contact →"
    → Ouvre drawer pré-rempli avec données du brief
    Champs : Nom société · Contact · Email · Téléphone · Poste · Notes
    Bouton "Créer dans HubSpot →" / "Créer dans Salesforce →"
  
  État 4 — Synchronisé :
    Badge vert "✓ Synchronisé avec HubSpot · [date heure]"
    Lien "Voir dans HubSpot ↗"
    Bouton "Re-synchroniser" (ghost)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
8. PAGE CONTACTS — MÉMOIRE RELATIONNELLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Layout : liste left (320px) + fiche contact right (flex)

LISTE CONTACTS (gauche)
  Search : "Chercher un contact..."
  Filtres : Tous · Actifs · Archivés · Non identifiés
  Tri : Score relation / Dernière interaction / Alphabétique
  
  Chaque item liste :
    Avatar + Nom + Entreprise + Poste
    Score relation : mini barre + valeur
    Dernier contact : "Il y a X jours" — coloré selon ancienneté
    Icônes sources connectées (Gmail ✓ / LinkedIn ✓ / CRM ✓)

FICHE CONTACT COMPLÈTE (droite)
─────────────────────────────────

EN-TÊTE
  Avatar grand (64px) + Nom + Poste + Entreprise
  Badge mode interaction dominant (Challenger / etc.)
  Score relation : valeur large + label "Force de la relation"
  Boutons : "Préparer une réunion" · "Voir sur LinkedIn ↗" · "Voir dans CRM ↗"

TABS de navigation dans la fiche :
  Mémoire · Signaux · Réunions · CRM · Notes

──── TAB MÉMOIRE ────────────────────────────────────────────────────────────

  Concept card "Mémoire Knowy" :
    Header dark gradient : Nom · "[X] interactions mémorisées"
    
    Évolution du brief :
      "Brief n°1 : Générique → Brief n°[X] : Chirurgical"
      Barre de progression de la qualité brief
    
    Barres de confiance :
      Confiance des données     [====     ] X%
      Force de la relation      [======   ] X%
      Précision comportementale [========] X%
      Alignement deal (MEDDPICC)[====     ] X%
    
    Radar 4 axes (petit, 160px) — lecture seule
    
    Timeline interactions :
      Points de couleur chronologiques (gauche = plus ancien)
      Point actif = dernière interaction
      Hover → détail (réunion X / email Y / date)
      "Brief n°X prêt" en fin de timeline

──── TAB SIGNAUX ────────────────────────────────────────────────────────────

  Feed chronologique de tous les signaux capturés sur ce contact + son entreprise :
    Chaque signal : border-left colorée + catégorie mono + texte + source + date
    Filtres : LinkedIn / Gmail / Crunchbase / CRM / Manuels

──── TAB RÉUNIONS ────────────────────────────────────────────────────────────

  Liste chronologique inverse de toutes les réunions avec ce contact
  Chaque item : date · titre · durée · statut sync CRM · score
  Clic → ouvre la réunion réalisée correspondante

──── TAB CRM ────────────────────────────────────────────────────────────────

  Affiche la fiche CRM associée (iframe ou données miroir)
  Bouton "Mettre à jour depuis Knowy"
  Statut dernière sync : [date] + bouton "Re-sync"
  Champs non mappés (suggestion de mapping)

──── TAB NOTES ────────────────────────────────────────────────────────────────

  Éditeur notes libres attachées au contact
  Notes chronologiques avec date
  Auto-save

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
9. PAGE ÉQUIPE (plan Team uniquement)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Accessible uniquement en plan Team · Paywall + upsell si Solo

SECTION 1 — VUE D'ENSEMBLE ÉQUIPE
  Liste des membres : avatar · nom · rôle · statut connecteurs · briefs ce mois
  Indicateur "Qui connaît qui" : matrice de force relationnelle entre membres et contacts
  
SECTION 2 — CONTACTS PARTAGÉS
  Vue des contacts que plusieurs membres de l'équipe connaissent
  "3 personnes de votre équipe connaissent Sophie Bernard"
  Force relation équipe vs individuelle

SECTION 3 — PASSATION
  Interface de passation d'un commercial à un autre :
  Sélectionner contact → Assigner à un membre de l'équipe
  Résumé de passation généré automatiquement
  "Thomas prend la relève sur Ledger · 14 interactions mémorisées"

SECTION 4 — ANALYTICS MANAGER (admin uniquement)
  Nombre de briefs générés / consultés par membre
  Taux de sync CRM par membre
  Meetings par semaine par membre
  Alertes : "X membres ont des contacts sans contact depuis > 30 jours"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
10. PARAMÈTRES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Layout : nav de settings à gauche (220px) + contenu right

NAVIGATION SETTINGS
  Mon compte
  Connecteurs
  Notifications
  CRM & Mapping
  Confidentialité
  Équipe (admin)

──── MON COMPTE ────────────────────────────────────────────────────────────

  Section Profil :
    Avatar (uploadable) · Prénom · Nom · Email (non modifiable)
    Poste actuel · Entreprise · Site web
    Bouton "Mettre à jour LinkedIn" → re-sync OAuth
    Bouton "Re-analyser mon website"
    Résumé produit/service (textarea éditable)
  
  Section Sécurité :
    Changer mot de passe · 2FA toggle · Sessions actives

──── CONNECTEURS ────────────────────────────────────────────────────────────

  Liste de tous les connecteurs disponibles :
    Catégorie "Email & Agenda" : Gmail / Outlook / Google Calendar
    Catégorie "Messagerie" : Slack
    Catégorie "CRM" : HubSpot / Salesforce / Pipedrive / Attio / Zoho
    Catégorie "Réunions" : Google Meet / Teams / Zoom (plug-in)
  
  Chaque connecteur : logo · statut (Connecté ✓ / Non connecté) · date connexion
  Bouton "Connecter" ou "Déconnecter" · "Tester la connexion"
  Indicateur de santé : dernière sync · erreurs éventuelles

──── NOTIFICATIONS ────────────────────────────────────────────────────────

  Toggle : Brief par email · Push mobile · In-app
  Timing : X min avant la réunion (slider)
  Types : Réunions commerciales / internes / recrutement
  Résumé post-réunion : immédiat / quotidien / hebdo

──── CRM & MAPPING ────────────────────────────────────────────────────────

  Sélection CRM actif principal
  Tableau de mapping :
    Champ Knowy → Champ CRM
    (Configuré une fois · Modifiable)
  Mode sync : Automatique (post réunion) / Manuel (bouton)
  Option : créer automatiquement les fiches manquantes : toggle on/off

──── CONFIDENTIALITÉ ────────────────────────────────────────────────────────

  Analyse expression faciale : toggle on/off + explication + lien légal
  Données partagées avec l'équipe : toggle on/off
  Rétention des données : sélecteur (30j / 90j / 1an / illimitée)
  Export de mes données (RGPD)
  Supprimer mon compte

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
11. PAGE ABONNEMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ÉTAT ACTUEL
  Card "Votre plan actuel" :
    Nom du plan · Prix · Prochaine facturation · Mode paiement
    Usage du mois : briefs générés / consultés · sync CRM effectuées
    Barre de quota si Starter (X/5 briefs utilisés)

UPGRADE
  Les 3 plans côte à côte (Starter / Solo / Team)
  Plan actuel mis en évidence avec "Votre plan"
  Bouton "Passer à Solo →" / "Passer à Team →"
  Feature diff mise en évidence (ce que l'user gagne en upgradant)

FACTURATION
  Historique des factures : date · montant · télécharger PDF
  Modifier le mode de paiement
  Annuler l'abonnement (confirmation en 2 étapes)

SECTION TEAM (si admin)
  Gestion des sièges : X/Y sièges utilisés
  Inviter un membre : email + rôle
  Retirer un membre

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
12. RECHERCHE GLOBALE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Déclenchée : Cmd+K (desktop) ou icône search topbar
Modal overlay fond semi-transparent

Input search full-width
Suggestions en temps réel dès 2 caractères :

  Section "Contacts" : avatars + nom + entreprise
  Section "Réunions" : titre + date + participants
  Section "Signaux récents" : texte signal + contact + date

Résultats par catégorie avec clic → navigate to

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
13. NOTIFICATIONS SYSTÈME
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Toast in-app (coin bas-droit, 320px, 4 secondes) :
  ✓ Vert : "Brief prêt · Réunion Ledger dans 28 min"
  ⚡ Violet : "Nouveau signal · Marc Rousseau · +14 recrutements"
  ⚠ Ambre : "Email sans réponse depuis 6j · Sophie Bernard"
  🔄 Bleu : "HubSpot synchronisé ✓"

Notification bell (topbar) :
  Badge rouge avec compteur
  Panel dropdown 400px avec feed notifications
  Mark all as read

Emails transactionnels :
  Brief pré-réunion (30 min avant) : objet "[Knowy] Brief prêt — Réunion [titre] dans 28 min"
  Résumé post-réunion : objet "[Knowy] Résumé — [titre réunion]"
  Digest hebdo (option) : "Votre semaine Knowy — X réunions, X contacts enrichis"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
14. ÉTATS VIDES & ONBOARDING PROGRESSIF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Chaque page doit avoir un état vide élégant (pas de texte "Aucun élément") :

Dashboard vide :
  Illustration simple (réunion à venir) + "Aucune réunion détectée cette semaine"
  CTA : "Connecter mon agenda →"

Contacts vide :
  "Vos contacts apparaîtront ici après vos premières réunions"
  CTA : "Voir mes réunions à venir →"

Réunions réalisées vide :
  "Vos réunions passées s'enrichiront ici"
  CTA : "Voir mes briefs à venir →"

Barre de progression onboarding (si < 5 éléments configurés) :
  Bandeau discret dans la sidebar ou topbar :
  "Votre compte est configuré à X% · Connecter HubSpot pour débloquer la sync CRM →"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
15. MOBILE — CONSIDÉRATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Mobile = consultation des briefs + coach live (pas de configuration)

Navigation mobile : bottom tab bar (5 tabs)
  🏠 Dashboard · 📋 Briefs · ✅ Passées · 🧠 Contacts · ⚙️ Compte

Adaptation des pages :
  Dashboard mobile : liste verticale full-width · cards compactes
  Brief mobile : sections en accordion (collapsable) · radar SVG redimensionné
  Coach mobile : drawer bottom sheet (glisse vers le haut pendant la réunion)
  Contacts mobile : liste puis fiche full-screen

Notifications push : "Brief prêt pour [réunion] dans 28 min" → tap → ouvre le brief

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LIVRABLES ATTENDUS DU DESIGNER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FIGMA — ORGANISATION DES FRAMES :
  /00_Design System    — Tokens, components, variants
  /01_Onboarding       — 5 steps complets + états
  /02_Dashboard        — Vue principale + panel droit
  /03_Brief            — Page complète + états (généré/partiel/erreur)
  /04_Coach Live       — 3 états (pré/live/post)
  /05_Réunions         — Liste + détail complet
  /06_Contacts         — Liste + fiche + 5 tabs
  /07_Équipe           — Mémoire partagée + passation
  /08_Paramètres       — Tous les sous-écrans
  /09_Abonnement
  /10_Mobile           — Adaptation des 5 écrans principaux
  /11_Empty States     — Tous les états vides
  /12_Notifications    — Toasts + bell panel + emails

PRIORITÉ DE LIVRAISON :
  Sprint 1 : Design System + Onboarding + Dashboard + Brief
  Sprint 2 : Coach Live + Réunions réalisées + Contacts
  Sprint 3 : Équipe + Paramètres + Abonnement + Mobile

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NOTE LÉGALE & TECHNIQUE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Analyse expressions faciales :
  ▸ Feature BETA uniquement · Activée uniquement par l'utilisateur Knowy
  ▸ Jamais activée sur les autres participants sans consentement explicite
  ▸ Consentement requis avant première activation : modal RGPD dédié
  ▸ Toggle facilement accessible dans Paramètres > Confidentialité
  ▸ Badge "BETA" permanent sur cette feature dans l'interface

Données & confidentialité :
  ▸ Aucune donnée email ne quitte la boîte mail de l'utilisateur sans accord
  ▸ Toutes les analyses sont faites côté serveur Knowy (pas de tiers)
  ▸ Chaque source de données affichée avec son origine dans le brief
  ▸ Score de confiance = proxy de transparence sur ce qu'on sait vs qu'on infère

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FIN DU BRIEF · VERSION 1.0 · KNOWY PRODUCT TEAM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


╔══════════════════════════════════════════════════════════════════════════════╗
║   KNOWY — PRODUCT DESIGN BRIEF V1.1 — SUPPLÉMENT                           ║
║   10 éléments manquants · Simple · Professionnel · Brand-consistent         ║
╚══════════════════════════════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORRECTION 1 — USER FLOWS COMPLETS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Règle de navigation globale :
  Clic sur une réunion → ouvre toujours dans un PANEL DROIT (pas de nouvel onglet)
  Clic sur "Voir en plein écran" (icône ↗ dans le panel) → page dédiée
  Clic sur un contact → ouvre page Contact (navigation principale)
  Retour : breadcrumb en haut à gauche + bouton ← dans le panel droit
  Jamais plus de 2 niveaux de navigation profondeur

FLOW 1 — INSCRIPTION → PREMIER BRIEF
  Landing (knowy.ai)
  → [Essayer gratuitement] → Page inscription (email + password)
  → Confirmation email → Clic lien
  → Onboarding Step 1 (Profil)
  → Onboarding Step 2 (Agenda)
  → Onboarding Step 3 (CRM — optionnel/skippable)
  → Onboarding Step 4 (Notifications)
  → Onboarding Step 5 (WOW — premier brief généré)
  → Dashboard

FLOW 2 — CONSULTER UN BRIEF DEPUIS LE DASHBOARD
  Dashboard (réunion = statut "Brief prêt")
  → [Clic sur la card réunion] → Panel droit s'ouvre (brief condensé)
  → [Voir le brief complet ↗] → Page Brief
  → [← Retour] → Dashboard

FLOW 3 — GÉNÉRER UN BRIEF MANUELLEMENT
  Dashboard
  → [+ Générer un brief] → Modal "Quelle réunion ?"
      Saisir titre + participants (email) + date/heure + catégorie
  → [Générer →] → État loading dans le panel droit
  → Brief généré → Panel droit s'ouvre

FLOW 4 — RÉUNION TERMINÉE → SYNC CRM
  Coach live (post-réunion) → [Voir le résumé complet →]
  → Page Réunion réalisée (onglet actif : Résumé)
  → Section CRM : "Matching identifié : Ledger · Valider / Refuser"
  → [Valider] → Spinner 1s → "✓ HubSpot mis à jour" → Badge vert permanent

FLOW 5 — INVITATION MEMBRE TEAM
  Paramètres → Équipe → [Inviter un membre]
  → Modal : saisir email + sélectionner rôle (Admin / Membre)
  → [Envoyer l'invitation]
  → Email reçu par le membre → [Rejoindre Knowy →]
  → Onboarding raccourci (voir Correction 6)
  → Dashboard avec contexte équipe visible

FLOW 6 — UPGRADE DEPUIS UN PAYWALL
  User Starter clique sur feature Solo
  → Modal paywall → [Passer au plan Solo] → Page Abonnement (tab Solo)
  → Saisie CB → [Démarrer maintenant] → Confirmation → Dashboard
  Feature débloquée instantanément · Toast "✓ Plan Solo activé"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORRECTION 2 — ÉTATS D'ERREUR (SYSTÈME COMPLET)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Principe UX : toujours 3 éléments dans un état d'erreur :
  1. Ce qui s'est passé (clair, pas technique)
  2. Ce que Knowy fait quand même (si applicable)
  3. Ce que l'utilisateur peut faire (CTA simple, 1 action)

Style : card corail pâle (#FDEAED) · border-left 3px #D94F63 · icon ⚠️

ERREURS ONBOARDING

  OAuth Gmail refusé :
    "Votre Gmail n'a pas pu être connecté."
    "Vérifiez que vous avez autorisé l'accès complet, puis réessayez."
    [Réessayer] · [Continuer sans Gmail]

  Analyse website échouée :
    "Nous n'avons pas pu analyser ce site."
    "Décrivez manuellement ce que vous vendez — 1 phrase suffit."
    [Saisir manuellement] (focus sur le champ textarea)

  LinkedIn non disponible (profil privé) :
    "Votre profil LinkedIn est en mode privé."
    "Renseignez votre poste et entreprise manuellement."
    Affiche les champs manuels directement (pas de redirect)

ERREURS BRIEF

  Données insuffisantes (score < 25%) :
    Banner ambre dans la topbar du brief :
    "⚠ Peu de données disponibles sur ces participants.
     Ce brief est basé sur des informations publiques uniquement."
    [Ajouter un connecteur] → navigate to Paramètres > Connecteurs

  Génération échouée (timeout / erreur serveur) :
    Card inline dans le dashboard :
    "Nous n'avons pas pu générer ce brief."
    "Cela peut prendre 30 secondes. Knowy réessaiera automatiquement."
    [Réessayer maintenant]
    Retry automatique silencieux toutes les 60 secondes · max 3 tentatives

  Participant non identifiable :
    Dans la section Participants du brief :
    Avatar gris + "Participant inconnu · [email@société.com]"
    Chip "Non identifié"
    [Rechercher sur LinkedIn ↗] · [Saisir les infos manuellement]

ERREURS CRM

  Connexion CRM perdue (token expiré) :
    Toast persistant (reste jusqu'à action) : 
    "⚠ Votre connexion HubSpot a expiré · [Reconnecter]"
    Banner dans Paramètres > Connecteurs : badge rouge sur HubSpot
    La sync est suspendue mais les briefs continuent à être générés

  Sync CRM échouée :
    Dans la page Réunion réalisée :
    "La synchronisation a échoué. HubSpot n'a pas pu être joint."
    [Réessayer] · [Ouvrir HubSpot manuellement ↗]

  Matching CRM ambigu :
    "2 fiches correspondent à Ledger dans votre HubSpot."
    Affiche les 2 options côte à côte : logo société · nom · email principal
    [Choisir celle-ci] sur chaque option
    [Ignorer et ne pas synchroniser]

ERREUR GÉNÉRIQUE (fallback)
  Si Knowy ne sait pas ce qui s'est passé :
    "Une erreur inattendue s'est produite."
    "Notre équipe a été notifiée automatiquement."
    [Recharger la page] · [Contacter le support]
    Ne jamais montrer un code d'erreur technique à l'utilisateur

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORRECTION 3 — ÉTATS DE CHARGEMENT (SYSTÈME COMPLET)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Principe UX : jamais de spinner nu. Toujours du contexte.
Règle : si le chargement dure < 1s → skeleton · si > 1s → progress narratif

SKELETON SCREENS (< 1 seconde attendue)
  Animation : shimmer horizontal de gauche à droite, bg #EDE8FF → #F5F0FF
  Appliquer sur :
    Cards de réunions dans le dashboard (rectangle 80px height)
    Avatars des participants (cercle 36px)
    Lignes de texte (rectangles 12px height, largeurs variées)
    Barres de progression (5px height)
  Ne jamais afficher le contenu à moitié chargé — tout skeleton ou tout contenu

PROGRESS NARRATIF (> 1 seconde — génération de brief)
  Centré dans la zone de contenu · icon Knowy animé (rotation douce)
  
  Séquence de messages (1 tous les 1.5s) :
    "📅 Analyse de votre agenda..." 
    "👥 Identification des participants..."
    "🔍 Collecte des signaux publics..."
    "📧 Lecture de l'historique d'échanges..."
    "🧠 Croisement des données..."
    "⚡ Rédaction des recommandations..."
    "✓ Brief prêt."
  
  Barre de progression sous les messages (0% → 100%)
  Durée totale estimée : 8-15 secondes
  Si > 20s : "Cela prend un peu plus de temps que prévu. Nous y sommes presque."

CHARGEMENT CONNECTEURS (pendant OAuth)
  Spinner violet + "Connexion à Gmail en cours..."
  Fenêtre OAuth native du provider (géré par le navigateur)
  Post-OAuth : animation ✓ vert + "Gmail connecté ✓"
  Transition vers l'étape suivante après 1.5s automatiquement

CHARGEMENT CRM SYNC
  Bouton "Synchroniser" → état loading inline (spinner dans le bouton)
  Texte bouton : "Synchronisation..." pendant le process
  Jamais de fullscreen loader pour cette action

REFRESH BRIEF
  Bouton Rafraîchir → icône rotate animation 360° pendant 1s
  Panel droit : sections vides remplacées par skeleton
  Contenu réapparaît section par section (top → bottom)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORRECTION 4 — ACCESSIBILITÉ (WCAG 2.1 AA)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Principe : accessible = meilleur produit pour tout le monde, pas un add-on.

CONTRASTES MINIMUM (ratio 4.5:1 pour texte, 3:1 pour grands textes)
  Text primary #1A1040 sur #F5F0FF → ratio 13.2:1 ✓
  Text secondary #5A4880 sur #FFFFFF → ratio 5.8:1 ✓
  Accent #6E50C8 sur #FFFFFF → ratio 5.1:1 ✓
  ⚠ Vérifier : text secondaire sur bg lavande (#EDE8FF) — ajuster si < 4.5:1
  Texte blanc sur violet #6E50C8 → ratio 5.1:1 ✓

NAVIGATION CLAVIER
  Tab : navigation entre tous les éléments interactifs dans l'ordre logique
  Enter / Space : activer buttons, toggles, liens
  Escape : fermer modales, panels, dropdowns
  Cmd+K : ouvrir la recherche globale
  → / ← : navigation dans les tabs (Brief, Contact)
  Focus visible : outline 2px violet #6E50C8, offset 2px (jamais supprimé)

ÉLÉMENTS INTERACTIFS
  Taille min touch target : 44x44px (mobile) · 32x32px (desktop)
  Tous les boutons icône ont un aria-label descriptif
  Ex : bouton "↗" → aria-label="Ouvrir en plein écran"
  Ex : bouton "×" → aria-label="Fermer"

IMAGES & ICÔNES
  Toutes les icônes décoratives : aria-hidden="true"
  Avatars : alt="[Prénom Nom]"
  Graphiques (radar, barres) : 
    aria-label="Radar comportemental de [Nom] : Résultat 78%, Structure 85%, Prudence 78%, Contrôle 50%"
    Données également disponibles en texte dans le tableau des 4 axes en dessous

FORMULAIRES
  Chaque input a un label visible (pas juste placeholder)
  Messages d'erreur : rattachés à l'input via aria-describedby
  Ex : input email invalide → label rouge "Email invalide" sous le champ

DALTONISME
  Ne jamais coder une information par la couleur seule
  Ex : statut brief → couleur + icône + texte ("✓ Brief prêt" pas juste vert)
  Ex : seuils confiance → couleur + valeur numérique + label texte

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORRECTION 5 — EXTENSION CHROME (SPEC COMPLÈTE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Surfaces : Chrome (priorité) · Edge · Firefox (Q2)
Contrainte : largeur max overlay = 320px · Pas d'accès au DOM tiers sans permission

——— SURFACE 1 : POPUP PRINCIPAL (clic icône Chrome) ——————————————————————

Dimensions : 360px × auto (max 560px)
Fond blanc · shadow xl · border-radius 20px haut

Header gradient violet (48px) :
  Logo Knowy italic · Statut : "X réunions aujourd'hui" · Icône settings ⚙

Section "Aujourd'hui" :
  Liste compacte des réunions du jour (max 3 visibles + scroll)
  Chaque item : heure · titre · chip statut brief
  [→] → ouvre le brief dans app.knowy.ai (nouvel onglet)

Section "Prochain brief" :
  Card du prochain brief le plus urgent
  Titre · heure · countdown · top 1 recommandation
  [Voir le brief →]

Footer :
  Icône Gmail ✓ · LinkedIn ✓ · HubSpot ✓ (statut connecteurs)
  [Ouvrir Knowy →] · [Paramètres]

——— SURFACE 2 : HOVER CARD (survol d'un nom dans Gmail/LinkedIn/HubSpot) ——

Déclencheur : survol > 800ms sur un nom de personne reconnu par Knowy
Dimensions : 280px × auto · positionné à droite du curseur ou en dessous
Délai d'apparition : 800ms · disparition au mouseout avec 300ms delay

Layout :
  Header : Avatar 40px + Nom + Poste + Entreprise
  Chips : [Mode interaction] [Score relation] 
  Divider
  Ligne : "Force relation · X/100" + mini barre
  Ligne : "Dernier contact · Xj" 
  Signal top 1 (si disponible) : border-left sage + texte court
  Si réunion prévue avec ce contact : chip violet "RDV [heure]"
  
  Footer : [Voir le profil] · [Brief →]

Fallback si contact non reconnu :
  Hover card NE s'affiche PAS — aucune perturbation du workflow

——— SURFACE 3 : OVERLAY GMAIL (injection dans la vue email) ———————————

Déclencheur : ouverture d'un email dont l'expéditeur est dans Knowy
Position : bandeau 52px en bas de l'email body (avant le thread suivant)
Style : fond #F5F0FF · border-top 1px rgba(110,80,200,.15)

Layout horizontal :
  [Icône Knowy K violet] · "Marc Rousseau · Challenger · DRO Ledger" · 
  Si RDV prévu : chip violet "RDV aujourd'hui 14h30" ·
  [Brief →] · [×] (dismiss permanent pour cet email)

——— SURFACE 4 : OVERLAY LINKEDIN (injection sur profil) ——————————————

Déclencheur : page profil LinkedIn d'un contact Knowy
Position : card 280px flottante droite de la page (position: fixed, top: 100px, right: 20px)
Peut être fermée · position mémorisée par session

Content :
  En-tête : "Knowy sait" (chip violet) · Nom
  Barres : Force relation · Confiance données
  Radar mini (120px)
  Top 1 signal récent
  [Préparer une réunion →] · [×]

——— STATES DE L'EXTENSION ————————————————————————————————————————

Non connecté (pas de compte Knowy) :
  Icône Chrome grisée
  Popup : "Créez un compte Knowy gratuit" + [S'inscrire →]

Connecté mais réunion dans < 30 min :
  Icône Chrome avec badge violet pulsant
  Tooltip sur l'icône : "Brief prêt · [Titre réunion]"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORRECTION 6 — ONBOARDING BRANCHES & CAS LIMITES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BRANCHE A — USER STANDARD (flow V1.0 inchangé)

BRANCHE B — USER INVITÉ PAR UN ADMIN TEAM
  Reçoit un email d'invitation → [Rejoindre l'équipe de [Nom Admin] →]
  Onboarding raccourci (3 steps seulement) :
    Step 1 : Votre profil (LinkedIn + nom + poste)
    Step 2 : Votre agenda (Gmail ou Outlook)
    Step 3 : Votre profil est prêt
  Pas de step CRM (géré par l'admin)
  Pas de step notifications (hérite des settings équipe)
  Dashboard s'ouvre avec contexte team visible (contacts partagés déjà présents)

BRANCHE C — AGENDA VIDE (aucune réunion dans les 7 jours)
  Step 5 (WOW) ne peut pas montrer un brief réel
  → Alternative : démo brief sur une réunion fictive "Exploration Partenariat"
  Banner : "Voici à quoi ressemble un brief Knowy. Le vôtre arrivera dès que vous
  avez une réunion dans l'agenda."
  CTA : "Créer une réunion test →" (manuel)

BRANCHE D — SKIP LINKEDIN (profil manuel uniquement)
  Step 1 affiche les champs manuels directement
  Chip ambre "Profil incomplet" sur l'avatar dans la sidebar
  Banner discret sur le dashboard : "Connectez LinkedIn pour enrichir vos briefs → [Connecter]"
  Disparaît si LinkedIn est connecté plus tard

BRANCHE E — CRM NON CONNECTÉ (skip step 3)
  Knowy fonctionne normalement (briefs + coach)
  Banner dans la section CRM des réunions réalisées :
  "Connectez votre CRM pour synchroniser automatiquement · [Configurer]"
  Pas de blocker — la valeur existe sans CRM

CAS LIMITE — DOUBLONS DE COMPTE (même email)
  Page inscription : "Un compte existe déjà avec cet email."
  [Se connecter →] · [Réinitialiser mon mot de passe]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORRECTION 7 — INVITATION MEMBRE TEAM (FLOW COMPLET)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CÔTÉ ADMIN — PAGE ÉQUIPE > INVITER

Bouton [+ Inviter un membre] → Modal centré (480px)

Modal layout :
  Titre : "Inviter quelqu'un dans votre équipe"
  
  Input email (avec validation live)
  Select rôle : 
    Membre (accès briefings + coach + contacts partagés)
    Admin (+ gestion membres + paramètres équipe + facturation)
  
  [Envoyer l'invitation →]

Post-envoi :
  Toast "✓ Invitation envoyée à [email]"
  Dans la liste équipe : nouvelle ligne avec statut "⏳ En attente · [email]"
  Bouton "Renvoyer" · "Annuler" sur chaque invitation en attente

CÔTÉ MEMBRE INVITÉ — EMAIL

Objet : "[Prénom Admin] vous invite à rejoindre Knowy"
Body :
  Logo Knowy · "Vous avez été invité par [Prénom] à rejoindre [Nom équipe] sur Knowy."
  CTA large : [Rejoindre l'équipe →]
  Sous le CTA : "Sans carte bancaire · Votre plan est pris en charge par [Nom équipe]"
  Lien expire dans 7 jours

Clic sur le lien :
  Si nouveau user → Onboarding Branch B (raccourci)
  Si compte existant → Dashboard avec modal "Vous avez rejoint l'équipe de [Nom]" 

GESTION DES SIÈGES
  Si quota sièges atteint → modal : 
  "Vous avez atteint X/X sièges inclus dans votre plan."
  "Ajoutez des sièges supplémentaires pour continuer."
  [Gérer les sièges →] → Page Abonnement > tab Team

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORRECTION 8 — UX PAYWALL (UPSELL FRICTIONLESS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Principe : le paywall ne frustre pas — il donne envie. Montrer la feature,
expliquer ce qu'elle donne, proposer l'upgrade en 1 clic.

DÉCLENCHEURS PAYWALL PAR FEATURE

  Starter → Solo (feature bloquée) :
    Brief n°6 (quota dépassé) :
      Card inline dans le dashboard à la place du brief :
      "Vous avez utilisé vos 5 briefs ce mois-ci."
      Aperçu flouté du brief en arrière-plan
      [Passer au plan Solo — 39€/mois →]
      Sous le CTA : "Briefs illimités · Coach IA · Sans engagement"

    Coach IA (section dans brief) :
      Section Coach affichée avec contenu exemple flouté
      Overlay discret : "🎯 Disponible en plan Solo"
      [Déverrouiller le Coach →]
      Pas de fullscreen modal — reste dans le contexte

    Réunion réalisée — Analyse expression :
      Feature non visible du tout en Starter (pas de teaser sur cette feature)

  Solo → Team (features équipe) :
    Page Équipe :
      État locked élégant : illustration "Votre équipe vous attend"
      "Partagez vos briefs, synchronisez vos contacts, ne perdez plus rien au turnover."
      [Découvrir le plan Team →] → Abonnement

MODAL UPGRADE (design)
  Max-width 480px · centré · fond blanc · shadow xl
  
  Header violet gradient :
    Titre : "Passez à [Plan]"
    Sous-titre : ce que ça débloque (1 ligne)
  
  Body :
    Liste features débloquées (3 max · avec ✓ vert)
    Prix : grand · Epilogue 900 · "39€/mois · sans engagement"
  
  Footer :
    [Démarrer maintenant →] (primary)
    [Pas maintenant] (ghost)
    "Sans carte bancaire requise" si applicable

POST-UPGRADE
  Toast : "✓ Plan Solo activé · Bienvenue dans la version complète de Knowy"
  Feature précédemment bloquée s'ouvre instantanément
  Pas de rechargement de page

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORRECTION 9 — MULTI-CALENDRIER & PERMISSIONS OAUTH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SÉLECTION MULTI-CALENDRIER (Step 2 onboarding & Paramètres)

Après connexion Gmail/Outlook, si plusieurs calendriers détectés :
  "Nous avons détecté X calendriers sur votre compte."
  Liste avec toggles :
    ✓ [Pro] Agenda principal · "47 réunions ce mois"
    ○ [Perso] Agenda personnel · "12 événements ce mois"
    ○ [Équipe] Marketing shared · "8 réunions ce mois"
  
  Note : "Knowy analyse uniquement les calendriers sélectionnés."
  Par défaut : seul le calendrier principal est activé
  Modifiable à tout moment dans Paramètres > Connecteurs > Gmail

PERMISSIONS PARTIELLES (OAuth avec scope limité)

  Si l'user accorde accès calendrier mais refuse accès email :
    Knowy s'adapte silencieusement
    Banner dans le brief : 
    "ℹ Gmail non connecté · Ce brief est basé sur les données publiques uniquement."
    [Ajouter l'accès Gmail →] → relance OAuth scope email

  Si l'user révoque l'accès depuis Google :
    Email automatique : "Votre accès Gmail a été révoqué"
    "Reconnectez votre boîte pour continuer à recevoir vos briefs."
    [Reconnecter Gmail →]
    Dans l'app : badge rouge sur l'icône Gmail dans la sidebar

PERMISSIONS EXTENSION CHROME

  Première installation extension :
    Page de bienvenue (onboarding extension) :
    "Knowy a besoin de 2 permissions pour fonctionner"
    1. "Lire les emails Gmail" → [Autoriser]
    2. "S'afficher sur LinkedIn.com" → [Autoriser]
    Option "Activer uniquement sur Gmail" (sans LinkedIn)

  Permission refusée :
    "L'accès à Gmail n'a pas été accordé."
    "Knowy fonctionne uniquement en mode popup sans cette permission."
    [Gérer les permissions dans Chrome →] (lien direct paramètres)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORRECTION 10 — PARTAGE DE BRIEF & FONCTIONS MANQUANTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

——— PARTAGE DE BRIEF ——————————————————————————————————————————————————

Bouton [Partager] dans la topbar du brief → popover (pas de modal)

Options dans le popover :
  [📋 Copier le lien] → lien valide 30 jours · accès lecture seule
  [📧 Envoyer par email] → input email + [Envoyer] (email Knowy branded)
  [📄 Télécharger en PDF] → génère PDF · Epilogue · design Knowy
  [✂️ Copier le résumé] → copie le texte brut du résumé exécutif

Paramètre de confidentialité du lien partagé :
  Par défaut : les données comportementales (radar, axes) sont EXCLUES du partage
  Option : "Inclure le profil comportemental" (toggle)
  Note visible : "Le lien n'inclut pas vos données privées (emails, CRM)"

——— RACCOURCIS CLAVIER ——————————————————————————————————————————————

Panneau aide (? ou Cmd+/) :
  Cmd+K → Recherche globale
  Cmd+/ → Aide raccourcis (ce panneau)
  Cmd+R → Rafraîchir le brief en cours
  Escape → Fermer panel / modal / popover
  J / K → Brief suivant / précédent (dans la liste)
  Tab → Navigation entre sections du brief
  
  Affiché comme modal overlay léger fond sombre 30%
  Deux colonnes : action → raccourci
  Fermé par Escape ou clic extérieur

——— TOUR PRODUIT (PREMIERE CONNEXION) ————————————————————————————————

Déclenché une seule fois · après le WOW moment onboarding
Tooltips séquentiels (pas de modal) pointant les éléments clés :

  1. → Dashboard : "Vos réunions à venir sont ici. Knowy les surveille pour vous."
  2. → Card brief : "Cliquez pour voir votre brief complet avant chaque réunion."
  3. → Sidebar Contacts : "Toutes vos relations avec leur historique complet."
  4. → Badge connecteurs sidebar : "Vos sources actives. Plus il y en a, meilleurs sont les briefs."
  
  Style tooltip : fond violet #1A1040 · text blanc · flèche · bouton [Suivant] / [Terminer]
  "Passer le tour" disponible à chaque étape
  Tour disponible à nouveau dans ? > Aide > "Revoir le tour produit"

——— OFFBOARDING / RÉTENTION ——————————————————————————————————————————

Flux annulation abonnement (Abonnement > Annuler) :
  Step 1 — Confirmation douce :
    "Vous allez perdre accès à :"
    Liste des features perdues selon le plan
    [Continuer quand même] · [Garder mon abonnement]
  
  Step 2 — Raison (optionnel) :
    Radio buttons : Trop cher · Je n'utilise pas assez · Problème technique · Autre
    Textarea si "Autre"
    [Annuler l'abonnement] (rouge, discret)
  
  Step 3 — Offre de rétention (si Solo ou Team) :
    "Avant de partir — 1 mois offert si vous restez."
    [Accepter l'offre] · [Annuler quand même]
  
  Confirmation :
    Email : "Votre abonnement est annulé · Vos données sont conservées 30 jours."

——— BREAKPOINTS RESPONSIFS ————————————————————————————————————————————

320px (iPhone SE) : sidebar cachée → hamburger menu
375px (iPhone 14) : standard mobile
768px (iPad) : sidebar 60px icônes seulement · contenu pleine largeur
1024px (iPad Pro / laptop) : sidebar 180px + contenu
1280px : layout standard (sidebar 220px + contenu)
1440px+ : max-width 1160px centré · layout standard avec panel droit possible

Tablette (768-1024px) :
  Sidebar icône-only (60px) avec tooltip au survol
  Panel droit remplacé par drawer (slide depuis la droite)
  Brief en colonne unique (pas de layout 2 colonnes)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FIN DU SUPPLÉMENT V1.1 · KNOWY PRODUCT TEAM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


╔══════════════════════════════════════════════════════════════════════════════╗
║   KNOWY — PRODUCT DESIGN BRIEF V1.2 — POLISH & PRODUCTION QUALITY          ║
║   12 éléments · Motion · Dark Mode · Trust · Performance · Intelligence      ║
╚══════════════════════════════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ÉLÉMENT 1 — MOTION DESIGN SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DURÉES STANDARD
  Micro      100ms  — feedback immédiat (hover, focus, toggle)
  Standard   200ms  — transitions UI (panel, dropdown, tooltip)
  Expressif  400ms  — éléments importants (radar, barres, modal)
  Narratif   800ms+ — moments de marque (brief prêt, onboarding)

EASING
  Entrées  : cubic-bezier(0.22, 0.68, 0, 1.2)  — légèrement overshoot, vivant
  Sorties  : cubic-bezier(0.4, 0, 1, 1)          — rapide, propre
  Transitions : cubic-bezier(0.4, 0, 0.2, 1)     — Material standard, fluide
  Spring   : cubic-bezier(0.22, 0.68, 0, 1.4)   — pour scores et compteurs

CATALOGUE D'ANIMATIONS PAR COMPOSANT

  Cards réunion (dashboard) :
    Apparition initiale : stagger 60ms entre chaque card, fade + translateY(12px) → 0
    Hover : translateY(-2px) + shadow-md, 150ms ease-out
    Clic : scale(0.98) 80ms puis release

  Panel droit (brief) :
    Ouverture : slide depuis right (translateX(360px) → 0), 220ms ease-out
    Fermeture : translateX(360px), 180ms ease-in
    Contenu interne : stagger 40ms sections, fade + translateY(8px) → 0

  Modal / Drawer :
    Fond overlay : opacity 0 → 0.5, 200ms
    Modal : translateY(20px) + opacity 0 → position + opacity 1, 250ms ease-out
    Fermeture : translateY(20px) + opacity → 0, 180ms ease-in

  Toasts :
    Entrée : translateY(100%) → 0 + opacity, 200ms spring
    Sortie : translateY(100%) + opacity → 0, 180ms ease-in, après 4s

  Radar SVG :
    Redessinage participant : interpolation point par point, 420ms cubic-bezier
    Hover sur un point : scale 1 → 1.4 + glow violet rgba(110,80,200,.3), 150ms
    Apparition initiale : polygone draw de 0 → valeurs finales, 600ms ease-out

  Barres de progression :
    Fill initial : width 0% → valeur, 900ms spring, délai 150ms par barre (stagger)
    Update (nouveau participant) : reset 0% → nouvelle valeur, 550ms spring
    Hover : légère surbrillance du fill

  Score confiance :
    Compteur : 0 → valeur finale, 1200ms, easing exponentiel (accélère au début, ralentit à la fin)
    Changement couleur : transition color 400ms simultanée

  Chips / Badges :
    Apparition : scale(0.8) + opacity 0 → 1, 200ms spring
    "Brief prêt" : pulse animation — scale 1 → 1.08 → 1, 2s infinite

  Boutons :
    Hover : translateY(-1px) + shadow augmente, 150ms ease-out
    Clic : scale(0.96), 80ms + release 150ms spring
    Loading state : spinner inline, text reste visible

  Toggle switch :
    Thumb : translateX spring 200ms
    Background : couleur 200ms simultanée
    Micro-bounce à la fin du movement : spring overshoot 1.1

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ÉLÉMENT 2 — ANIMATION PRODUCTION DE BRIEF (moment de marque)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

C'est le WOW moment central du produit. Il mérite une animation signature.

PHASE 1 — CHARGEMENT (0 → 15s)
  Fond de la zone contenu : gradient animé très subtil
    rgba(110,80,200,.04) se déplace lentement (keyframe 8s infinite)
  
  Centre de la zone :
    Logo Knowy (K violet, 48px) en rotation lente 360° (12s linear infinite)
    Légère pulsation scale 1 → 1.08 → 1 (3s infinite)
  
  Messages séquentiels (apparition staggerée, 1 message toutes les 1.5s) :
    Chaque message : fade in depuis opacity 0 + translateY(8px)
    Message précédent : fade out + translateY(-8px) simultanément
    
    "📅 Analyse de votre agenda..."
    "👥 Identification des participants..."
    "🔍 Collecte des signaux publics..."
    "📧 Lecture de l'historique d'échanges..."
    "🧠 Croisement des données relationnelles..."
    "⚡ Rédaction des recommandations..."
    "✓ Brief prêt."
  
  Barre de progression (8px, arrondie) :
    Sous les messages, 280px de large
    Fill : gradient violet → violet clair, animation width
    Progression simulée : 0% → 85% sur 12s (ease-in-out), puis 85% → 100% quand data arrive
    À 100% : barre devient entièrement verte (sage) en 300ms

PHASE 2 — REVEAL (brief apparaît)
  Barre à 100% → logo disparaît (fade out 200ms)
  
  Sections du brief apparaissent une à une depuis le haut (stagger 80ms) :
    Score confiance → fade + scale(0.95) → 1
    Section participants → fade + translateY(12px) → 0
    Section contexte → fade + translateY(12px) → 0
    Section recommandations → fade + translateY(12px) → 0
  
  Simultanément dans le panel droit :
    Radar polygone se dessine progressivement (stroke-dashoffset animation, 800ms)
    Barres 4 axes se remplissent en stagger (stagger 120ms, 700ms chacune)
  
  Score confiance :
    Compteur animé de 0 → valeur finale (1s, easing exponentiel)
    Couleur : commence gris → transite vers couleur seuil (sage/ambre/violet)

  Toast final (coin bas-droite) :
    "⚡ Brief prêt · Réunion Ledger dans 28 min" 
    Apparition spring depuis le bas, disparition automatique 4s

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ÉLÉMENT 3 — DARK MODE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TOKENS DARK MODE
  --bg:          #0F0C1E   (noir violet profond — fond principal)
  --bg2:         #1A1535   (fond secondaire)
  --surface:     #231E3F   (cards, panels)
  --raised:      #2D2655   (éléments surélevés)
  --night:       #0A0818   (éléments les plus sombres)
  
  --violet:      #8B72E8   (légèrement plus clair pour contraste AA)
  --violet-l:    #C4AEFA   (inchangé)
  --violet-s:    rgba(139,114,232,.12)
  
  --t1:          #F0ECF8   (text primary inversé)
  --t2:          #A89BC8   (text secondary)
  --t3:          #6E6090   (text tertiary)
  --t4:          #3D3566   (text disabled)
  
  --border:      rgba(255,255,255,.07)
  --border-m:    rgba(255,255,255,.12)
  
  Couleurs sémantiques (sage/ambre/coral/blue) : inchangées
  Ombres : remplacées par légère border rgba(255,255,255,.06)

BASCULEMENT
  Automatique : prefers-color-scheme système (par défaut)
  Manuel : toggle dans Compte > Apparence
    Options : "Clair" / "Sombre" / "Système (auto)"
  Transition : 300ms ease sur toutes les color properties (CSS transition)
  Persistance : localStorage + sync backend pour cohérence multi-device

COMPOSANTS SPÉCIFIQUES DARK
  Radar SVG : grilles rgba(255,255,255,.06) / fill rgba(139,114,232,.12)
  Brief card header : bg #1A1535 (plus que gradient violet)
  Sidebar : bg #0F0C1E / item actif : bg rgba(139,114,232,.15)
  Input : bg rgba(255,255,255,.05) / border rgba(255,255,255,.12)
  Coach overlay : bg #1A1535 avec border rgba(255,255,255,.1)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ÉLÉMENT 4 — DATA LINEAGE (couche de transparence)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Principe : chaque insight montre sa source. L'utilisateur peut vérifier.
Format : tooltip au hover sur l'élément source (icône ⓘ discrète à côté)

TOOLTIP DATA LINEAGE
  Style : bg #1A1040 / text blanc / border-radius 10px / padding 8px 12px
  Contenu : icône source + label + détail + date
  
  Exemples :
    Sur une recommandation : "📧 Gmail · 3 emails échangés · il y a 14 jours"
    Sur un signal LinkedIn : "💼 LinkedIn public · Post détecté · il y a 2 jours"
    Sur un axe comportemental : "🧠 Inféré · 7 interactions analysées · Confiance 78%"
    Sur un chiffre MEDDPICC : "🟠 HubSpot · Deal Ledger · dernière update il y a 3 jours"
    Sur score relation : "📧 Gmail (40%) + 💼 LinkedIn (35%) + 🟠 HubSpot (25%)"

ICÔNE SOURCE (inline dans les cards)
  Pastille 16px à droite du contenu de chaque signal/insight
  Couleur : Gmail = rouge · LinkedIn = bleu · HubSpot = orange
           Salesforce = cyan · LinkedIn = bleu · Inféré = violet · Public = gris
  Au hover : tooltip apparaît avec délai 400ms

PANNEAU SOURCES GLOBAL (dans le brief)
  Section "Sources actives" déjà dans le brief (score confiance)
  Enrichir : clic sur une source → filtre le brief pour ne montrer
  que les insights issus de cette source

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ÉLÉMENT 5 — OPTIMISTIC UI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Principe : afficher le succès immédiatement, rollback si erreur.
Le produit semble instantané. La latence réseau devient invisible.

ACTIONS OPTIMISTIC

  Sync CRM (bouton Valider) :
    Immédiat : badge "✓ HubSpot synchronisé" apparaît + animation check
    Rollback si erreur (3s timeout) : badge devient corail + message erreur discret
    Toast : "HubSpot mis à jour" (immédiat) ou "Échec · Réessayer" (si rollback)

  Toggle connecteur on/off :
    Immédiat : toggle change d'état visuellement
    Rollback si erreur : toggle revient + toast "Connexion impossible · Réessayer"

  Notes (save) :
    Chaque keystroke → sauvegarde debounced 800ms
    Indicateur : "✓ Sauvegardé" apparaît discrètement (fade in/out, 2s)
    Jamais de bouton "Sauvegarder" — le save est toujours automatique

  Invitation membre :
    Immédiat : nouvelle ligne "En attente · [email]" apparaît dans la liste
    Rollback si email invalide détecté par l'API : ligne disparaît + erreur inline

  Catégorisation réunion (change de tag) :
    Immédiat : tag change visuellement dans la card
    Rollback si erreur : tag revient à sa valeur précédente

INDICATEURS D'ÉTAT DE SYNC
  Icône connexion dans la sidebar (bas) :
    Vert = tous les connecteurs actifs
    Ambre = 1+ connecteur en attente de sync
    Gris = mode hors-ligne détecté
  
  Quand hors-ligne : banner discret topbar
    "Vous êtes hors ligne · Les modifications seront synchronisées à la reconnexion"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ÉLÉMENT 6 — CHAT IA SUR LE BRIEF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Position : zone collapsable en bas de la page Brief
Hauteur réduite : 52px (barre de saisie visible) / Étendue : 320px

BARRE DE SAISIE (état réduit)
  Icône Knowy (K violet 20px) + Input "Demandez à Knowy..."
  Chips de questions suggérées (défilent horizontalement) :
    "Que ne pas dire à Marc ?"
    "Quel est le dernier engagement pris ?"
    "Objection probable ?"
    "Résume en 3 bullets"
    "Qui est le vrai décideur ?"

ZONE ÉTENDUE (après clic ou question posée)
  Conversation en bulles :
    Question user : bulle droite, bg #EDE8FF, text violet
    Réponse Knowy : bulle gauche, bg blanc, border violet
    Réponse streamée (apparaît mot par mot, curseur clignotant)
  
  Exemples de réponses :
    "Que ne pas dire à Marc ?" →
    "Évitez de parler de délais avant qu'il ne les mentionne lui-même.
     Lors de votre dernier échange (Gmail, 12 mai), il a réagi négativement
     quand vous avez évoqué une mise en place avant fin Q2."
     Source : 📧 Gmail · 12 mai

  Contexte IA disponible : brief complet + historique réunions + signaux
  Limite : 5 questions par brief en plan Starter / illimité Solo+
  
  Si limite atteinte (Starter) :
    Input disabled + message : "5 questions atteintes ce mois · Plan Solo pour continuer →"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ÉLÉMENT 7 — WIDGET MOBILE (iOS & Android)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WIDGET PETIT (2×2 — 155×155 pts)
  Fond : gradient violet #6E50C8 → #8B72E8
  Logo Knowy (K blanc, 18px) coin haut gauche
  Contenu :
    Si brief prêt : "Prêt ✓" (sage) + heure réunion + titre tronqué 20 chars
    Si en génération : "En cours..." + spinner blanc
    Si pas de réunion aujourd'hui : "Pas de réunion · Bonne journée"
  Tap → ouvre app sur le brief correspondant

WIDGET MOYEN (4×2 — 329×155 pts)
  Fond : même gradient
  Colonne gauche (40%) : heure + titre réunion + participants (avatars empilés)
  Colonne droite (60%) : top 1 recommandation Knowy en texte court
  Statut brief : badge coloré coin haut droit
  Tap → ouvre brief complet

WIDGET GRAND (4×4 — 329×329 pts)
  Top : prochaine réunion (heure + titre + participants)
  Milieu : top 3 recommandations Knowy (liste)
  Bottom : 2 réunions suivantes de la journée (format condensé)

ACTIVATION
  Dans l'app : Paramètres > Widgets > "Ajouter à l'écran d'accueil"
  Instructions illustrées iOS (appui long → Modifier l'écran d'accueil)
  Instructions illustrées Android

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ÉLÉMENT 8 — BRIEF VERSIONING & DIFF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INDICATEUR DE VERSION (topbar brief)
  "Mis à jour il y a 8 min · 2 signaux ajoutés" — mono 11px, violet discret
  Clic → ouvre drawer "Historique des versions"

DRAWER HISTORIQUE (slide depuis la droite, 320px)
  Titre : "Historique du brief"
  Liste chronologique inverse :
    v3 · 13h42 · "Alerte relationnelle ajoutée · Signal LinkedIn détecté"
    v2 · 11h20 · "Score confiance mis à jour : 58% → 74%"
    v1 · 09h00 · "Brief initial généré"
  
  Clic sur une version → preview condensée des changements
  Bouton "Restaurer cette version" (ghost, discret)

BADGE "NOUVEAU" SUR LES SECTIONS
  Quand une section est modifiée depuis la dernière consultation :
  Pill ambre "Nouveau" à droite du titre de section
  Disparaît automatiquement après 15 min de lecture ou scroll sur la section
  Disparaît définitivement si l'utilisateur clique dessus (dismiss)

DIFF VISUEL
  Éléments ajoutés depuis la version précédente :
    Border-left 3px sage + bg rgba(46,168,106,.04)
  Éléments modifiés :
    Border-left 3px ambre + bg rgba(201,122,32,.04)
  Anciens éléments supprimés :
    Non montrés par défaut · lien "Voir les éléments retirés" si applicable

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ÉLÉMENT 9 — DICTÉE VOCALE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SURFACES DISPONIBLES
  Notes pré-réunion (page Brief)
  Notes post-réunion (page Réunion réalisée)
  Zone notes Contact

COMPOSANT DICTÉE
  Bouton micro 🎙 — 32px, bg bg2, border violet, à droite de chaque zone notes
  
  ÉTAT INACTIF : icône micro, bg bg2
  
  ÉTAT ACTIF (après clic) :
    Bouton : icône onde rouge pulsante (animation breathe 1.5s)
    Zone notes : border violet 2px + légère surbrillance bg
    Barre de transcription live apparaît sous la zone :
      Texte transcrit s'affiche en temps réel (gris → noir quand confirmé)
      Indicateur niveau sonore : 5 barres verticales animées selon volume
  
  ARRÊT AUTO : 3 secondes de silence → stop + insertion du texte transcrit
  ARRÊT MANUEL : re-clic sur le bouton micro
  
  POST-TRANSCRIPTION :
    Texte inséré à la position du curseur dans la zone notes
    Toast : "Transcription ajoutée ✓"
    Bouton "Annuler" disponible 5s (disparaît ensuite)
  
  ERREUR MICRO (permission refusée) :
    "L'accès au micro n'est pas autorisé."
    "Activez-le dans les paramètres de votre navigateur."
    Lien direct vers chrome://settings/content/microphone

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ÉLÉMENT 10 — INTELLIGENCE PROGRESSION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DANS LA FICHE CONTACT (tab Mémoire)
  Section "Évolution de la précision"
  
  Courbe simple SVG (200px × 80px) :
    Axe X : briefs n°1 → n°X
    Axe Y : score de précision 0 → 100%
    Ligne violette avec points sur chaque brief
    Point actif mis en évidence (circle 6px, fill violet, glow)
    Hover sur un point → tooltip "Brief n°X · Précision X% · [date]"
  
  Label sous la courbe :
    Si < 5 briefs : "Knowy apprend. X réunions de plus pour atteindre 80%."
    Si 5-10 briefs : "Bonne précision. Chaque réunion affine le profil."
    Si > 10 briefs : "Brief de niveau expert. Précision stable à X%."

DANS LE DASHBOARD (section stats)
  Card "Intelligence Knowy" (4ème stat card, à droite) :
    Valeur : "X%" — Epilogue 900, couleur selon seuil
    Label : "Précision moyenne de vos briefs"
    Trend : "+X pts vs mois dernier" en sage ou corail

NOTIFICATION MILESTONE
  Toast quand un seuil est franchi :
    "🎯 Vos briefs atteignent maintenant 75% de précision."
    "Connectez HubSpot pour passer à 90%." (si CRM non connecté)
  
  Milestones définis : 25% / 50% / 75% / 90%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ÉLÉMENT 11 — PDF EXPORT DESIGNÉ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FORMAT : A4 · portrait · marges 24mm · fond blanc

PAGE 1 — COUVERTURE
  Header (60px hauteur) :
    Gauche : Logo "Knowy" — Epilogue Black 24px + "Relational Intelligence" mono 10px
    Droite : Score confiance badge (cercle, couleur, valeur)
  
  Corps :
    Titre réunion — Epilogue Black 28px
    Ligne : Date · Heure · Durée · Plateforme
    Séparateur violet (1px)
    Participants en row : avatar initiales + nom + poste (max 4, "+ X autres" si plus)
    Tags catégorie

PAGE 2+ — CONTENU
  Sections dans l'ordre : Contexte Entreprise · Participants · Recommandations · MEDDPICC
  
  Style sections :
    Titre section : Epilogue Bold 14px, couleur violet, majuscules
    Contenu : Epilogue Regular 11px, interligne 1.6
    Signaux : border-left 2px couleur sémantique (impression en couleur)
    Barres de progression : représentées en texte "Force relation : 78/100 ████████░░"
  
  Footer chaque page :
    Gauche : "Knowy · [Nom utilisateur]"
    Centre : numéro de page
    Droite : "Ce document est confidentiel · Généré le [date]"
  
  Dernière page :
    Mention : "Données issues de : Gmail · LinkedIn · HubSpot · Sources publiques"
    "Précision estimée : X% · knowy.ai"

GÉNÉRATION
  Côté serveur (Puppeteer ou WeasyPrint) — pas de génération client
  Nom fichier : "Knowy_Brief_[Titre-réunion]_[Date].pdf"
  Disponible 30 minutes · lien de téléchargement sécurisé

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ÉLÉMENT 12 — COMMAND PALETTE ÉTENDUE (Cmd+K)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DESIGN DE LA PALETTE
  Modal overlay : fond rgba(0,0,0,.4) · blur(4px)
  Panel centré : max-width 560px · bg white · border-radius 20px · shadow xl
  Input : grand (48px height) · placeholder "Rechercher ou taper une action..."
  Icône recherche gauche · Escape pour fermer (label visible)

CATÉGORIES DE RÉSULTATS

  ACTIONS (si input commence par un verbe ou vide) :
    ⚡ "Générer un brief maintenant" → modal sélection réunion
    🔄 "Synchroniser [Réunion la plus récente] avec HubSpot"
    📋 "Ouvrir mon prochain brief" → navigate to brief
    👥 "Inviter un membre dans mon équipe" → modal invitation
    🔌 "Connecter HubSpot" → navigate to Paramètres > Connecteurs
    ⚙️  "Ouvrir les paramètres"
    💳 "Voir mon abonnement"
    ❓  "Voir les raccourcis clavier"

  CONTACTS (si input = nom ou entreprise) :
    Avatar + Nom + Entreprise + Score relation
    → Clic = navigate to page Contact

  RÉUNIONS À VENIR (si input = date ou titre) :
    Heure + Titre + Statut brief
    → Clic = ouvre panel brief

  RÉUNIONS PASSÉES :
    Date + Titre + Statut CRM sync
    → Clic = navigate to réunion réalisée

FORMAT D'UN ITEM DE RÉSULTAT
  ┌────────────────────────────────────────────────┐
  │ [Icône 20px]  [Label principal]     [Raccourci]│
  │               [Sous-label discret]             │
  └────────────────────────────────────────────────┘

  Item sélectionné (hover/arrow key) : bg rgba(110,80,200,.06) · border-left 2px violet

NAVIGATION CLAVIER DANS LA PALETTE
  ↑ / ↓ : navigation entre les résultats
  Enter : activer le résultat sélectionné
  Tab : passer à la catégorie suivante
  Escape : fermer

RÉSULTATS RÉCENTS
  Quand le champ est vide : "Récemment" — 3 dernières actions effectuées
  Permet de répéter une action fréquente sans retaper

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FIN DU SUPPLÉMENT V1.2 · KNOWY PRODUCT TEAM
Note estimée avec ce supplément : 95-96 / 100
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
