# ARCHITECTURE — Knowy Easy

## 1. Résumé du Concept

Knowy Easy est une web app d'intelligence comportementale et relationnelle qui prépare les professionnels avant leurs réunions importantes.  
Le produit connecte agenda, email, CRM, échanges texte issus de Zoom/Teams et sources publiques pour créer des fiches cognitives et comportementales scorées.  
Le coeur de valeur est "qui est dans la room" : comprendre les personnes, leurs modes d'interaction, leurs relations et la meilleure stratégie conversationnelle.  
Chaque échange enrichit une mémoire vivante afin d'améliorer continuellement la pertinence des fiches et des briefs.  
L'application cible sera déployée via Netlify avec Supabase comme socle auth, base de données, storage, realtime et edge/backend functions.

## 2. État Actuel du Projet

### Localisation

Projet analysé : `/Users/jordanchekroun/Downloads/Knowy Easy`

### Nature du code existant

- Application React + Vite issue d'un export Figma Make.
- Routing client-side avec `react-router`.
- Styling Tailwind CSS v4 + tokens Knowy dans `src/styles/theme.css`.
- Composants UI shadcn/Radix dans `src/app/components/ui`.
- Composants métier mockés dans `src/app/components`.
- Aucune couche backend, base de données, auth réelle, API réelle, tests ou persistence.
- Les données produit sont codées en dur dans les composants.

### Fichiers clés

- `src/app/App.tsx` : routes principales.
- `src/main.tsx` : bootstrap React.
- `src/styles/theme.css` : tokens "Violet Trust".
- `src/app/components/Layout.tsx` : shell app + recherche globale simulée.
- `src/app/components/Sidebar.tsx` : navigation fixe.
- `src/app/components/Dashboard.tsx` : réunions du jour et métriques.
- `src/app/components/Meetings.tsx` : feed de réunions futures/passées.
- `src/app/components/MeetingAnalysis.tsx` : page brief / analyse réunion.
- `src/app/components/Relations.tsx` et `RelationDetail.tsx` : mémoire relationnelle.
- `src/app/components/OnboardingStep1..5.tsx` : onboarding simulé.
- `src/imports/**` : brief produit, prompts Figma, pivot stratégique, specs UX.

### Routes actuelles

```txt
/                         -> redirect /dashboard
/signin                   -> SignIn
/onboarding/step1         -> OnboardingStep1
/onboarding/step2         -> OnboardingStep2
/onboarding/step3         -> OnboardingStep3
/onboarding/step4         -> OnboardingStep4
/onboarding/step5         -> OnboardingStep5
/dashboard                -> Layout + Dashboard
/meetings                 -> Layout + Meetings
/meeting/:id              -> Layout + MeetingAnalysis
/coaching                 -> Layout + Coaching
/relations                -> Layout + Relations
/relation/:id             -> Layout + RelationDetail
/network                  -> redirect /relations
/contact/:id              -> redirect /relation/:id
/subscription             -> Layout + Subscription
/account                  -> Layout + AccountSettings
```

Routes/components existants mais non exposés ou à recadrer : `Contacts`, `ContactDetail`, `CompanyDetail`, `Organization`, `Team`, `Analyse`, `MeetingCard`.

## 3. Essence Produit

### Problème résolu

Les commerciaux, founders et managers arrivent en réunion avec trop peu de contexte sur les personnes en face d'eux : style de communication, posture décisionnelle, historique relationnel, tensions, objections, influence et dynamique politique. Knowy transforme les signaux dispersés entre email, calendrier, CRM, LinkedIn, sources publiques et transcriptions textuelles Zoom/Teams en fiches comportementales/cognitives et en briefs fiables, sourcés et actionnables.

### Coeur Produit : Comprendre "Qui est dans la Room"

L'analyse comportementale de chaque participant est au centre du produit. La page brief et la mémoire relationnelle doivent d'abord répondre à ces questions :

1. Qui est réellement important dans cette réunion ?
2. Quel est le style d'interaction dominant de chaque personne ?
3. Comment cette personne communique-t-elle dans ses échanges observables ?
4. Quelle est sa posture probable : décideur, validateur, champion, bloqueur, gardien, influenceur ?
5. Comment ses relations avec les autres participants modifient-elles la dynamique de réunion ?
6. Quels signaux comportementaux sont observables, lesquels sont inférés, lesquels restent hypothétiques ?
7. Quelle stratégie conversationnelle maximise la qualité de l'échange ?

Knowy ne doit pas produire un profil psychologique figé. Il produit une fiche opérationnelle probabiliste, scorée, sourcée et révisable à mesure que de nouveaux échanges sont analysés.

### Fiches Comportementales et Cognitives

Chaque contact possède une fiche vivante composée de :

- Score global de confiance.
- Scores par axe interactionnel : Relation/Résultat, Intuition/Structure, Prudence/Rapidité, Consensus/Contrôle.
- Modes d'interaction probables : Challenger, Validator, Strategist, Operator, Consensus Builder, Explorer.
- Signaux observables issus de ses choix de vie et de carrière : mobilité, changement d'industrie, création d'entreprise, parcours international, secteur dominant.
- Patterns de communication : longueur des réponses, délai de réponse, niveau de structure, objections fréquentes, demandes de preuve, langage utilisé.
- Historique relationnel : fréquence des échanges, momentum, récence, réciprocité, personnes connectées, influence dans le réseau.
- Sources et niveau d'inférence pour chaque insight : observable, inféré, hypothétique, non disponible.

### Amélioration Perpétuelle

Les emails, messages, notes CRM et transcriptions textuelles de réunions Zoom, Teams, Meet ou autres sont des mines d'or pour enrichir les fiches. Chaque nouvel échange doit :

- extraire des signaux de communication et de relation ;
- mettre à jour les scores avec pondération temporelle ;
- renforcer ou affaiblir les hypothèses existantes ;
- historiser les changements importants de profil ;
- améliorer les recommandations de brief futures ;
- préserver la traçabilité des sources pour éviter toute hallucination.

La mémoire Knowy est donc cumulative : plus une personne interagit avec l'utilisateur ou son organisation, plus sa fiche devient précise, utile et contextualisée.

### Utilisateurs cibles

- P0 : Account Executives B2B SaaS, founders, business developers, revenue leaders solo.
- P1 : équipes sales/customer success avec CRM et contacts partagés.
- P2 : managers revenue/ops cherchant une vue organisationnelle et des analytics d'équipe.

### User Journey Principal

```txt
Sign in
  -> onboarding profil
  -> connexion agenda/email
  -> CRM optionnel
  -> préférences notifications
  -> génération premier brief
  -> dashboard quotidien
  -> ouverture d'une réunion importante
  -> lecture du brief
  -> notes / questions / recommandations
  -> post-réunion : résumé, mémoire relationnelle, sync CRM
```

### Contraintes Métier Implicites

- Ne jamais donner une sensation de surveillance ou de profiling psychologique.
- Chaque insight doit afficher sa source et son niveau de confiance.
- Le produit doit fonctionner même sans CRM : email + calendar suffisent pour la valeur MVP.
- Les inférences comportementales doivent être présentées comme signaux observés, pas comme diagnostics.
- Les fiches cognitives et comportementales doivent rester probabilistes, sourcées et contestables.
- Toute donnée absente des sources doit rester `null` : ne jamais inventer pour remplir une fiche, un radar ou un MEDDPICC.
- Les échanges texte issus de Zoom, Teams, Meet, Slack ou autres canaux doivent être traités comme des sources internes à forte valeur, avec consentement et traçabilité.
- Les features sensibles, notamment analyse d'expression ou live assistant, exigent consentement explicite et transparence RGPD.
- Le brief doit être actionnable en 2 à 5 minutes.
- La confiance utilisateur est une feature centrale : permissions, stockage, sources, export et suppression de données doivent être clairs.

## 4. Stack Technique Validée

### Frontend

- React 18 + TypeScript.
- Vite 6.
- React Router 7.
- Tailwind CSS 4 avec tokens projet.
- Radix UI / shadcn comme base composants.
- `motion/react` pour transitions.
- Recharts pour graphiques si nécessaire.
- Sonner pour toasts.

### Backend Cible

- Supabase comme backend principal.
- Supabase Auth pour session, OAuth et contrôle d'accès.
- Supabase Postgres pour les données métier.
- Supabase Edge Functions pour endpoints sécurisés, webhooks OAuth, génération de briefs, ingestion de transcriptions et orchestration IA.
- Supabase Storage pour exports PDF, imports texte et pièces jointes autorisées.
- Supabase Realtime pour statuts de génération de brief et sync jobs.
- Netlify pour hébergement frontend Vite/React et déploiement continu.
- Netlify Functions uniquement en complément si une intégration spécifique ne rentre pas proprement dans Supabase Edge Functions.

### Base de Données

- Supabase PostgreSQL.
- Row Level Security obligatoire sur toutes les tables multi-tenant.
- Migrations SQL Supabase versionnées dans le repo.
- `pgvector` pour embeddings de mémoire relationnelle, recherche sémantique et retrieval avant génération de brief.
- Tables d'audit pour accès aux données sensibles, exports, suppressions et sync connecteurs.
- Jobs planifiés via Supabase Scheduled Functions ou déclencheurs backend dédiés pour sync calendrier, ingestion et digest.

### Services Tiers

- Auth : Supabase Auth.
- Hosting : Netlify.
- OAuth : Google Gmail/Calendar, Microsoft Graph Outlook/Calendar.
- CRM : HubSpot P0/P1, Salesforce/Pipedrive P1.
- IA : OpenAI Responses API pour génération de briefs, extraction d'insights et chat contextualisé.
- Email transactionnel : Resend ou Postmark.
- Paiement : Stripe.
- PDF : génération serveur via Playwright/Puppeteer.

## 5. Arborescence Cible

```txt
Knowy Easy/
  ARCHITECTURE.md
  API.md
  QA_REPORT.md
  QUESTIONS.md
  README.md
  package.json
  vite.config.ts
  postcss.config.mjs
  index.html
  netlify.toml
  supabase/
    config.toml
    migrations/
    seed.sql
    functions/
      oauth-google-callback/
      oauth-microsoft-callback/
      ingest-calendar/
      ingest-communication/
      generate-brief/
      score-cognitive-profile/
      brief-chat/
      export-brief-pdf/
  src/
    main.tsx
    app/
      App.tsx
      routes/
        public.tsx
        authenticated.tsx
      providers/
        AuthProvider.tsx
        QueryProvider.tsx
        ThemeProvider.tsx
        ToastProvider.tsx
      layouts/
        AppShell.tsx
        AuthLayout.tsx
        SettingsLayout.tsx
      pages/
        auth/
          SignInPage.tsx
        onboarding/
          ProfileStep.tsx
          CalendarStep.tsx
          CrmStep.tsx
          NotificationStep.tsx
          FirstBriefStep.tsx
        dashboard/
          DashboardPage.tsx
        meetings/
          MeetingsPage.tsx
          MeetingBriefPage.tsx
          PastMeetingPage.tsx
        contacts/
          RelationsPage.tsx
          RelationDetailPage.tsx
        settings/
          AccountPage.tsx
          ConnectorsPage.tsx
          NotificationsPage.tsx
          PrivacyPage.tsx
          BillingPage.tsx
        subscription/
          SubscriptionPage.tsx
      components/
        design-system/
          tokens.css
          Button.tsx
          Card.tsx
          Badge.tsx
          Input.tsx
          Modal.tsx
          Drawer.tsx
          Tabs.tsx
          EmptyState.tsx
          LoadingState.tsx
          ErrorState.tsx
          DataSourcePill.tsx
          ScoreDisplay.tsx
        app-shell/
          Sidebar.tsx
          Topbar.tsx
          CommandPalette.tsx
          NotificationsBell.tsx
        meetings/
          MeetingCard.tsx
          MeetingBriefPanel.tsx
          ConfidenceBanner.tsx
          ParticipantCard.tsx
          CompanySignals.tsx
          RecommendationsList.tsx
          MeddpiccGrid.tsx
          NotesEditor.tsx
          BriefChat.tsx
          ShareBriefPopover.tsx
        contacts/
          RelationCard.tsx
          RelationHeader.tsx
          RelationshipTimeline.tsx
          InteractionProfile.tsx
        settings/
          ConnectorCard.tsx
          PrivacyControl.tsx
      lib/
        api-client.ts
        auth.ts
        routes.ts
        dates.ts
        scores.ts
        errors.ts
      data/
        mock/
          meetings.ts
          contacts.ts
          users.ts
      hooks/
        useAuth.ts
        useMeetings.ts
        useBrief.ts
        useConnectors.ts
      styles/
        index.css
        tailwind.css
        fonts.css
        theme.css
    server/
      supabase/
        client.ts
        auth.ts
        rls.ts
      services/
        google.service.ts
        microsoft.service.ts
        hubspot.service.ts
        ai.service.ts
        signal-extraction.service.ts
        inference-engine.service.ts
        cognitive-profile.service.ts
        brief-generator.service.ts
        digest.service.ts
        pdf.service.ts
      schemas/
        auth.schema.ts
        meeting.schema.ts
        brief.schema.ts
        contact.schema.ts
        cognitive-profile.schema.ts
        inference.schema.ts
      tests/
        integration/
        unit/
  _legacy/
    figma-make-original/
```

## 6. Entités Domaine

```txt
User
Organization
Membership
Subscription
Connector
OAuthAccount
Calendar
CalendarEvent
Meeting
MeetingParticipant
Contact
Company
Relationship
Interaction
CommunicationThread
CommunicationMessage
MeetingTranscript
CognitiveProfile
BehavioralSignal
InferenceRule
InferenceRun
InteractionAxisScore
InteractionModeScore
RelationshipEdge
PersonMemory
RelationshipMemory
OrgMemory
MeetingMemory
Brief
BriefSection
BriefInsight
BriefVersion
Recommendation
Risk
Objection
MeddpiccItem
Note
NotificationPreference
Notification
CrmConnection
CrmMapping
CrmSyncLog
AuditLog
SharedBriefLink
```

## 7. Fonctionnalités

### P0 — MVP obligatoire

- Auth email/OAuth et session utilisateur.
- Onboarding 5 étapes : profil, agenda/email, CRM optionnel, notifications, premier brief.
- Connexion Google Calendar/Gmail.
- Connexion Outlook/Calendar via Microsoft Graph.
- Ingestion d'échanges texte : emails, messages, notes et transcriptions de réunions importées ou synchronisées.
- Détection automatique des réunions importantes.
- Dashboard quotidien focalisé sur "quelles réunions comptent aujourd'hui".
- Feed des réunions avec statuts de brief.
- Génération manuelle d'un brief.
- Page brief complète : résumé, participants, contexte entreprise, recommandations, objections, risques, next steps, score de confiance.
- Section "Qui est dans la room" prioritaire : fiches comportementales des participants, axes interactionnels, modes d'interaction, influence et dynamique relationnelle.
- Mémoire relationnelle minimale : liste contacts, fiche contact, timeline interactions, fiche cognitive/comportementale scorée.
- Moteur d'inférence P0 avec niveaux `observable`, `inféré`, `hypothétique`, `non disponible`.
- Règle zéro hallucination : `null` si une donnée n'est pas sourcée.
- Paramètres connecteurs, notifications, confidentialité et IA transparency.
- États de chargement, erreur, vide et permissions partielles.
- Sources et confiance visibles pour chaque insight.
- API documentée dans `API.md`.
- Seeds de démo.
- Tests critiques : auth, connectors, meeting detection, brief generation, privacy controls.

### P1 — Produit commercial solide

- HubSpot sync : contacts, companies, deals, notes, activities.
- Salesforce/Pipedrive connecteurs.
- Résumé post-réunion et sync CRM assistée.
- Daily email digest.
- Command palette Cmd+K.
- Chat IA sur le brief.
- Partage de brief : lien, email, PDF.
- Versioning/diff des briefs.
- Historique d'évolution des fiches cognitives et comparaison des scores dans le temps.
- Ingestion automatique de transcriptions Zoom/Teams/Meet via connecteurs.
- Notes auto-save.
- Paywall Starter/Solo/Team avec Stripe.
- Page équipe basique : membres, contacts partagés, invitations.
- Export RGPD et suppression compte.

### P2 — Extensions avancées

- Extension Chrome/Safari : popup, hover card, Gmail/LinkedIn overlays.
- Coach live pour Meet/Teams/Zoom.
- Analyse post-réunion avancée.
- Organization OS : org map, global calendar, team coverage, alerts manager.
- Widget mobile.
- Dark mode complet.
- Analyse expression faciale uniquement avec consentement explicite.
- Analytics revenue/team avancés.

## 8. Flux de Données

```txt
[User]
  -> signs in / connects providers
  -> [OAuth Connector]
    -> stores tokens encrypted
    -> queues sync jobs

[Calendar Sync Job]
  -> fetches events
  -> normalizes participants
  -> creates/updates Meetings
  -> scores importance
  -> queues Brief Generation for important meetings

[Brief Generation Job]
  -> loads Meeting + Participants
  -> pulls Gmail snippets/metadata with permissions
  -> pulls text exchanges from email, Teams, Zoom, Meet transcripts when authorized
  -> pulls CRM/public/company/contact signals
  -> creates source-grounded context pack
  -> runs signal extraction and cognitive/behavioral scoring
  -> updates PersonMemory / RelationshipMemory with temporal weighting
  -> calls AI brief generator
  -> persists Brief + BriefSections + Insights + confidence scores
  -> emits notification

[Frontend]
  -> fetches Dashboard / Meetings / Brief
  -> renders source pills + confidence
  -> user edits notes / shares / asks chat
  -> API persists actions and audit logs

[Post Meeting]
  -> user validates summary/next steps
  -> optional CRM sync
  -> transcript/messages enrich cognitive profile and relationship memory
```

### Moteur Cognitif — Pipeline

```txt
SOURCES
  Gmail / Outlook / Calendar / CRM / LinkedIn / public web / Zoom text / Teams text / Meet text
    ↓
SIGNAL EXTRACTION
  extract, classify, normalize, source, timestamp
    ↓
JSON VALIDATION
  missing source = null, never invented
    ↓
INFERENCE ENGINE
  rules, weights, temporal decay, conflict resolution
    ↓
COGNITIVE PROFILE SCORING
  axes, interaction modes, relationship momentum, confidence
    ↓
MEMORY UPDATE
  person memory, relationship memory, org memory, meeting memory
    ↓
BRIEF SYNTHESIS
  operational recommendations, objections, risks, next steps
    ↓
UI RENDERING
  source pills, confidence labels, behavioral cards, "who is in the room"
```

### Architecture en 6 Couches du Moteur

| # | Couche | Rôle |
|---|---|---|
| 1 | Interaction Style Modeling | Déterminer comment communiquer efficacement avec chaque personne |
| 2 | Communication Signal Intelligence | Analyser les patterns observables dans emails, messages et transcriptions |
| 3 | Organizational Network Analysis | Identifier influence, pouvoir, dépendances et relations entre participants |
| 4 | Decision Dynamics Modeling | Comprendre comment l'organisation décide et valide |
| 5 | Business Context Intelligence | Relier les signaux humains au contexte stratégique de l'entreprise |
| 6 | Adaptive Recommendation Engine | Transformer l'analyse en recommandations conversationnelles concrètes |

### Axes et Modes Interactionnels

| Axe | Pôle gauche | Pôle droit |
|---|---|---|
| AXE 1 | Relation | Résultat |
| AXE 2 | Intuition | Structure |
| AXE 3 | Prudence | Rapidité |
| AXE 4 | Consensus | Contrôle |

Modes d'interaction :

- Challenger : rapide, direct, orienté décision.
- Validator : structuré, analytique, orienté preuve.
- Strategist : vision globale, impact business.
- Operator : pragmatique, exécution, efficacité.
- Consensus Builder : alignement, coordination, collaboration.
- Explorer : curiosité, innovation, ouverture.

### Niveaux d'Inférence

| Niveau | Définition | Confiance typique |
|---|---|---|
| OBSERVABLE | Fait direct, source primaire confirmée | 60-90% |
| INFÉRÉ | Déduit de plusieurs signaux convergents | 35-65% |
| HYPOTHÉTIQUE | Signal unique ou faible, à valider | 15-35% |
| NON DISPONIBLE | Aucun signal, afficher null | 0% |

### Dégradation Temporelle

| Ancienneté | Coefficient |
|---|---|
| < 30 jours | 100% |
| 30-90 jours | 80% |
| 3-6 mois | 60% |
| 6-12 mois | 40% |
| > 12 mois | 20% |
| Mémoire comportementale Knowy | 70% stable, révisable par signaux récents |

### Source de Vérité Algorithmique

La conception du moteur cognitif décrite dans la page "ARCHITECTURE DATA" est intégrée comme référence produit/technique pour la Phase 2. Elle fixe notamment :

- un framework cognitif en 6 couches ;
- une matrice de signaux Personne x Entreprise ;
- 80+ règles d'inférence avec scores de confiance ;
- 3 types de briefs : Commercial, Partenariat, Productivité ;
- un system prompt de production anti-hallucination ;
- un schéma JSON de validation qui force `null` si la donnée est absente ;
- une règle terrain critique : l'analyse comportementale part des décisions observables et des échanges réels, pas du seul titre de poste ;
- une section objections obligatoire dans les briefs commerciaux.

Pour la production, le JSON validé est la source de vérité, l'interface n'est que son rendu. Le moteur d'inférence backend doit donc produire des objets structurés, sourcés, scorés et auditables avant toute synthèse LLM.

### JSON logique simplifié

```json
{
  "meeting": {
    "id": "meeting_123",
    "title": "Q1 Strategic Review",
    "startsAt": "2026-05-28T14:00:00+03:00",
    "companyId": "company_contentsquare",
    "participants": ["contact_sarah", "contact_marc"],
    "importanceScore": 95,
    "briefStatus": "ready"
  },
  "brief": {
    "id": "brief_123",
    "meetingId": "meeting_123",
    "confidenceScore": 72,
    "sections": ["summary", "participants", "company", "recommendations", "objections", "risks", "next_steps"],
    "sources": [
      { "type": "gmail", "weight": 0.35, "status": "connected" },
      { "type": "calendar", "weight": 0.2, "status": "connected" },
      { "type": "crm", "weight": 0.25, "status": "missing" },
      { "type": "public_web", "weight": 0.2, "status": "available" }
    ]
  }
}
```

### JSON cible d'une fiche cognitive

```json
{
  "contactId": "contact_sarah",
  "profileVersion": 7,
  "globalConfidence": 72,
  "axes": {
    "relation_result": { "value": 76, "confidence": 68, "level": "inferred" },
    "intuition_structure": { "value": 42, "confidence": 61, "level": "inferred" },
    "caution_speed": { "value": 70, "confidence": 64, "level": "inferred" },
    "consensus_control": { "value": 55, "confidence": 49, "level": "hypothetical" }
  },
  "interactionModes": [
    { "mode": "Challenger", "score": 81, "confidence": 66 },
    { "mode": "Strategist", "score": 74, "confidence": 58 }
  ],
  "signals": [
    {
      "id": "signal_1",
      "type": "career_mobility",
      "text": "A vécu à l'étranger plusieurs années",
      "inference": "tolérance à l'incertitude et mobilité",
      "level": "inferred",
      "confidence": 62,
      "source": "linkedin_public",
      "observedAt": "2026-05-20"
    }
  ],
  "updatedFrom": ["gmail", "calendar", "zoom_transcript", "linkedin_public"]
}
```

## 9. Architecture API Cible

```txt
POST   /api/auth/sign-in
POST   /api/auth/sign-out
GET    /api/me

GET    /api/connectors
POST   /api/connectors/:provider/oauth/start
GET    /api/connectors/:provider/oauth/callback
POST   /api/connectors/:provider/disconnect
POST   /api/connectors/:provider/test

GET    /api/meetings
POST   /api/meetings/manual
GET    /api/meetings/:id
PATCH  /api/meetings/:id

POST   /api/meetings/:id/briefs
GET    /api/briefs/:id
POST   /api/briefs/:id/refresh
POST   /api/briefs/:id/share
POST   /api/briefs/:id/export-pdf
POST   /api/briefs/:id/chat

GET    /api/contacts
GET    /api/contacts/:id
PATCH  /api/contacts/:id/notes
GET    /api/contacts/:id/cognitive-profile
POST   /api/contacts/:id/cognitive-profile/recompute
GET    /api/contacts/:id/signals
POST   /api/communications/ingest-text
POST   /api/meetings/:id/transcript

GET    /api/settings/notifications
PATCH  /api/settings/notifications
GET    /api/settings/privacy
PATCH  /api/settings/privacy
POST   /api/privacy/export
DELETE /api/privacy/account

POST   /api/crm/sync-meeting/:meetingId
GET    /api/billing/subscription
POST   /api/billing/checkout
```

`API.md` devra préciser pour chaque endpoint : auth requise, input/output typés, erreurs métier, scopes OAuth consommés, audit logs.

## 10. Décisions d'Architecture

- Le pivot MVP prévaut sur la vision large : priorité à la préparation de réunions par compréhension comportementale des participants.
- La fiche comportementale/cognitive est le coeur durable du produit ; le brief est son rendu contextuel avant une réunion.
- Supabase + Netlify est la stack cible validée : Supabase pour auth/data/backend, Netlify pour hosting frontend.
- Les composants existants seront conservés et déplacés progressivement, pas supprimés. Toute partie remplacée ira dans `_legacy/figma-make-original/`.
- Les données mockées doivent être extraites vers `src/data/mock` avant branchement API.
- Le design system Knowy doit devenir la seule source de styles applicatifs pour éviter les styles ad hoc.
- La génération de brief doit être asynchrone, car elle dépend de plusieurs connecteurs et de l'IA.
- Les insights et signaux comportementaux doivent être stockés avec leurs sources, timestamps, niveaux d'inférence et scores, pas seulement sous forme de texte rendu.
- Le moteur d'inférence doit vivre dans le backend Supabase/Edge Functions et non dans le prompt seul.
- Les transcriptions texte de réunions et échanges interpersonnels alimentent la mémoire, sous réserve de consentement et de permissions explicites.
- Le CRM est optionnel en P0 : il enrichit la confiance mais ne bloque pas la valeur.
- La confidentialité est une surface produit P0, pas une page secondaire.

## 11. Plan d'Exécution Séquencé

### Agent Design — à instancier en premier

1. Auditer `theme.css`, `knowy/*` et `ui/*`.
2. Stabiliser les tokens : couleurs, typo, radius, ombres, motion, états sémantiques.
3. Créer/remplacer les primitives design system dans `src/app/components/design-system`.
4. Produire un index de démo interne pour boutons, cards, inputs, badges, modals, drawers, tabs, loading/error/empty states, score displays, source pills.
5. Refondre les layouts P0 sans logique métier :
   - Auth layout.
   - Onboarding.
   - App shell sidebar/topbar.
   - Dashboard quotidien.
   - Meetings feed.
   - Meeting brief page + panel.
   - Relations list/detail avec fiche cognitive/comportementale comme surface centrale.
   - Settings privacy/connectors.
6. Designer la section "Qui est dans la room" comme moment clé : participant cards, scores comportementaux, axes, relation graph léger et sources.
7. Garantir responsive desktop/tablette/mobile.
8. Ajouter accessibilité WCAG AA : focus visible, labels, aria, contrastes, touch targets.
9. Livrer `DESIGN_SYSTEM.md` ou section README UI avec conventions.

Contraintes Agent Design :

- Ne pas brancher d'API.
- Ne pas créer de logique métier.
- Ne pas inventer une nouvelle palette hors tokens Knowy.
- Remplacer les styles arbitraires par composants/tokens.

### Agent Fonction — à instancier après Design

1. Extraire les types domaine partagés.
2. Mettre en place Supabase Auth, session, protected routes et RLS.
3. Ajouter schema Supabase, migrations SQL et seeds.
4. Implémenter Supabase Edge Functions P0.
5. Brancher calendar/email connectors en mode réel ou adaptateur mock si credentials absents.
6. Implémenter ingestion texte : email, messages, transcriptions meeting importées.
7. Implémenter moteur d'extraction de signaux, règles d'inférence, scoring cognitif/comportemental et dégradation temporelle.
8. Implémenter jobs : sync calendrier, scoring meeting, génération brief, notifications.
9. Brancher les composants Design via hooks typed contracts.
10. Implémenter états chargement/erreur/success.
11. Ajouter notes auto-save et paramètres privacy.
12. Écrire `API.md`.
13. Ajouter tests unitaires et intégration P0.
14. Vérifier `npm run dev` et `npm run build`.

Contraintes Agent Fonction :

- Utiliser uniquement les composants Design livrés.
- Chaque endpoint et service expose des contrats typés.
- Les données sensibles passent par chiffrement au repos et audit logs.
- Les erreurs utilisateur restent non techniques.
- Les règles zéro hallucination doivent être testées : absence de source = `null`, pas de texte inventé.

### Orchestrateur — intégration finale

1. Vérifier que les livrables Design et Fonction respectent `ARCHITECTURE.md`.
2. Résoudre les conflits props/types/styles.
3. Lancer lint/build/tests.
4. Vérifier les parcours P0 end-to-end :
   - inscription/onboarding,
   - connexion agenda,
   - dashboard,
   - génération brief,
   - consultation brief,
   - mémoire relationnelle,
   - paramètres confidentialité.
5. Produire `QA_REPORT.md`.
6. Confirmer que l'application démarre avec `npm run dev`.

## 12. Questions Ouvertes

À formaliser dans `QUESTIONS.md` si elles bloquent la Phase 2 :

- Credentials et projet Supabase existent-ils déjà ou faut-il créer/configurer un nouveau projet ?
- Netlify est-il déjà relié au repo ou faut-il préparer le déploiement depuis zéro ?
- Les credentials Google/Microsoft/HubSpot existent-ils déjà ?
- Le MVP doit-il utiliser Supabase distant directement ou une stack Supabase locale d'abord ?
- Quelle langue UI finale : français uniquement ou FR/EN ?
- Le nom public est-il "Knowy", "Knowy Easy" ou autre ?
- Le design doit-il conserver strictement "Violet Trust" ou intégrer le pivot plus neutre `#FAFAFC` / `#6E7CF6` ?
- Les transcriptions Zoom/Teams/Meet seront-elles importées manuellement en P0 ou synchronisées via connecteurs en P1 ?

## 13. Validation Requise

Phase 1 terminée avec ce document.  
Ne pas passer à la Phase 2 sans validation explicite de `ARCHITECTURE.md`.
