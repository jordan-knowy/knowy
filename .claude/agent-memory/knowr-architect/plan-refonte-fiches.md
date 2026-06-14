---
name: plan-refonte-fiches
description: Plan de refonte des 4 fiches Knowr (Personne, Réunion Commerciale, Réunion Productivité, Compte) — delta gap, blocs, ordre d'implémentation, points d'attention UI/UX
metadata:
  type: project
---

# Plan de Refonte — 4 Fiches Knowr
## Produit par l'architecte Knowr · Juin 2026

---

## FICHE 1 — PERSONNE (`ContactDetail.tsx`)

### 1. Delta Gap

**Ce qui existe** dans `ContactDetail.tsx` :
- Hero header sombre (`#13111E`) avec avatar, score, phase, delta, sources — partiellement aligné sur `.hero-header`
- 3 dimensions Granovetter (Intensité/Réciprocité/Longévité) avec barres animées — structure correcte mais couleurs non conformes (utilise Recharts au lieu de canvas natif `drawMR`)
- Onglets (Profil Cognitif / Mémoire Relationnelle / Échanges) — modèle tab = **architecture incorrecte** : la spec exige une page scrollable, pas des onglets
- Theory of Mind présente dans "Profil Cognitif" — **violation de la spec 15** : la ToM doit vivre sur la Réunion uniquement, pas sur la Personne
- Profil cognitif : modes d'interaction, axes interactionnels (barres horizontales), JTBD — structure valide mais radar absent (RadarChart non connecté ici), pas de bloc `.radar-box` canvas
- Onglet "Échanges" avec timeline email — à transformer en section bas de page "Réunions récentes" avec `.mrow`
- Brief express 4 cases — à supprimer (c'est du duplicata de la ToM + Mode 5 min de la Réunion)

**Ce qui manque entièrement** :
- `.acard` Compte (rattachement, lien cliquable vers fiche Compte) — absent
- Bloc `.levier` (levier stratégique) — absent
- Mémoire Relationnelle avec `drawMR` canvas (spline monotone Hermite) — remplacé par Recharts AreaChart
- Bandeau `es-stats` (Score · Ancienneté · Échanges)
- `mem-alert` (bandeau reprise/churn)
- Dimensions barres conformes `.dim-card` / `.bar-track` / `.bar-fill` avec couleurs sémantiques (bleu intensité, ambre réciprocité, sage longévité)
- `.pos-metrics` (6 métriques email : Score d'initiative / Réactivité / Longueur email / Coordination interne / Centralité réseau ONA / Périmètre décision)
- `.pos-insight` + `.pos-warning`
- Bloc `.sig-card` (Signaux rail latéral) scopé Personne — tags Churn/Risque/Levier/Mobilité/Réseau/Présence
- `.mrow` (lignes réunions récentes) avec 3 visibles + bouton `.more-btn`
- `.csec` (sections collapsibles avec chevron) — toutes les sections
- Sources connectées `.hsrc` dans le header (liste connecteurs + CTA)
- Anneau de confiance en `conic-gradient` dans le hero
- Navigation inter-surfaces via lien `.nav-link`
- `prov` (provenance source sur chaque section)

---

### 2. Blocs à Implémenter (ordre canonique spec-15)

#### Bloc A — Hero Personne
- **Classe CSS** : `.hero-header` + `.hero-body` + `.hero-left` + `.hero-right` + `.hero-score-block` + `.hero-conf-block` + `.hero-last-block` + `.mh-meta` + `.mh-pill`
- **Props TS** : `contact.full_name`, `contact.role_title`, `contact.company_name`, `profile.engagement_score`, `profile.score_phase`, `profile.score_delta`, `profile.global_confidence`, `lastContact` (date), sources actives
- **Supabase** : `contacts`, `cognitive_profiles`, `connectors`
- Anneau de confiance en `conic-gradient` violet, score géant Epilogue 900, couleur sémantique (sage ≥70 / violet 40-69 / coral <40)
- **Complexite** : Moyen

#### Bloc B — Sources Connectées (dans le hero)
- **Classe CSS** : `.hsrc` / `.hsrc-t` / `.hsrc-list` / `.hsrc-i` / `.hsrc-on` / `.hsrc-off` / `.hsrc-ok` / `.hsrc-up` / `.hsrc-foot` / `.hsrc-reco` / `.hsrc-cta`
- **Props TS** : `connectors[]` (provider, status, gain_estimate)
- **Supabase** : `connectors` table (provider, status)
- Pastille sage = connecté, amber "+N% est." = non connecté
- **Complexite** : Simple

#### Bloc C — Carte Compte (acard)
- **Classe CSS** : `.acard` + `.acard-av` + `.acard-eyebrow` + `.acard-n` + `.acard-r` + `.acard-right` + `.acard-sc` + `.acard-go`
- **Props TS** : `contact.company_id`, `company.name`, `company.domain`, `company.description`, `company_score` (score MR du compte)
- **Supabase** : `companies`, `company_score_history`
- Hover : `translateY(-2px)` + ombre, avatar avec initiales + fond violet
- Eyebrow : "Rattaché au compte" en JetBrains Mono uppercase
- **Complexite** : Simple

#### Bloc D — Levier Stratégique
- **Classe CSS** : `.levier` + `.levier-ic` + `.levier-eyebrow` + `.levier-txt`
- **Props TS** : `profile.executive_summary` (conclusion remontée)
- Fond dégradé blanc→`--violet-s`, bord gauche 3px `--violet`, eyebrow mono "Levier stratégique"
- **Complexite** : Simple

#### Bloc E — Mémoire Relationnelle (section collapsible)
- **Classe CSS** : `.csec.open` + `.csec-header` + `.csec-body` + `.csec-inner` + `.es-stats` + `.mem-alert` + `.cwrap canvas` + `.mem-dims` + `.dim-card` + `.bar-track` + `.bar-fill` + `.prov`
- **Props TS** : `profile.engagement_score`, `profile.score_phase`, `profile.score_delta`, `profile.score_intensite`, `profile.score_reciprocite`, `profile.score_longevite`, `scoreHistory[]`
- **Supabase** : `cognitive_profiles`, `contact_score_history`
- Canvas `drawMR` spline monotone Hermite — courbe sage `#2EA86A`, fill `rgba(46,168,106,0.22)`
- 3 dims : Intensité bleu `--blue`, Réciprocité amber `--amber`, Longévité sage `--sage`
- **Complexite** : Complexe (implémentation drawMR v5)

#### Bloc F — Profil Comportemental & Radar (section collapsible)
- **Classe CSS** : `.csec` + `.radar-box canvas` + `.radar-legend` + `.radar-cap` + `.mem-alert` (violet pour avertissement inférence)
- **Props TS** : `axes[]` (4 paires bipolaires), `profile.cognitive_mode`, `profile.interaction_modes_data`
- Radar 8 branches canvas : axes bipolaires (Résultat↔Relation · Rapidité↔Analyse · Assertivité↔Adaptation · Innovation↔Conformité)
- Pôle dominant violet, pôle inverse `--t4`, accent amber. Rings violet-teintés.
- **Complexite** : Complexe (radar canvas natif spec-16)

#### Bloc G — Jobs-to-be-Done (section collapsible)
- **Classe CSS** : `.csec` + `.two` (grille 2 colonnes) + `.card` + `.card-lbl` + `.card-note`
- **Props TS** : `profile.jtbd_data` (functional_job, social_job, emotional_job, qualify_question)
- Items sourcés avec date Outlook en mono 9px
- **Complexite** : Simple

#### Bloc H — Position dans l'organisation (section collapsible)
- **Classe CSS** : `.csec` + `.pos-metrics` + `.pos-m` + `.pos-m-lbl` + `.pos-m-val` + `.bar-track` / `.bar-fill` + `.pos-m-note` + `.prov` + `.pos-insight` + `.pos-warning`
- **Props TS** : `emailAnalysis` (initiative_score, response_delay, email_length, internal_coordination, network_centrality, decision_scope)
- Grille 6 métriques, chacune avec barre + couleur sémantique + explication + provenance
- `.pos-insight` fond `--violet-s`, `.pos-warning` fond `--coral-s`
- **Complexite** : Moyen

#### Bloc I — Réunions récentes (section collapsible)
- **Classe CSS** : `.csec` + `.mrow` + `.mrow-date` + `.mrow-obj` + `.mrow-ppl` + `.mrow-tag` + `.mrow-go` + `.more-btn`
- **Props TS** : `meetings[]` (id, title, starts_at, participants)
- 3 visibles par défaut, bouton `.more-btn` révèle les 10 suivantes inline
- Réunion future : fond `--violet-s`, bord `--violet-x`
- **Complexite** : Simple

#### Bloc J — Signaux rail latéral (aside)
- **Classe CSS** : `.rail` + `.sig-card` + `.sig-head` + `.sig-ttl` + `.sig-sub` + `.sig-body` + `.sig-item` + `.sig-it-t` + `.sig-it-d` + `.sig-meta` + `.sig-conf` + `.sig-src` + `.sig-date` + `.sig-tag` + `.sig-foot`
- **Props TS** : `signals[]` (tag: Churn|Risque|Levier|Mobilité|Réseau|Présence, text, source, date, confidence: coral|amber|sage)
- Tri : Churn → Risque → Levier → reste. Tags autorisés sur Personne : Churn, Risque, Levier, Mobilité, Réseau, Présence
- Pastille de confiance colorée (fond coral/amber/sage, pas de texte)
- **Complexite** : Moyen

---

### 3. Ordre d'Implémentation Recommandé

1. Suppression des onglets — transformation en layout page scrollable avec aside `.rail` (structure architecturale, bloque tout le reste)
2. Hero (Bloc A) + Sources (Bloc B) — fondation visuelle critique
3. acard Compte (Bloc C) — navigation inter-surfaces, simple
4. Levier (Bloc D) — simple, haute valeur perçue
5. Mémoire Relationnelle + drawMR (Bloc E) — complexe, coeur de valeur
6. Position 6 métriques (Bloc H) — données disponibles dans emailAnalysis
7. Sections collapsibles .csec (Blocs F, G, I) — refactoring des sections existantes
8. Signaux rail (Bloc J) — nécessite schéma de données signal
9. Radar canvas (Bloc F) — complexe, peut passer après le reste

---

### 4. Points d'Attention UI/UX Critiques

- **Supprimer la ToM de la fiche Personne** (spec-15 §5 : état mental volatile = Réunion uniquement). Les données `theory_of_mind_data` restent en BDD mais ne s'affichent pas ici.
- **Supprimer le Brief Express 4 cases** — duplication de la Réunion.
- Layout : `display:grid; grid-template-columns: 1fr 280px` (main + rail). Rail sticky sur desktop, empilé sur mobile.
- Le drawMR doit lire `parentElement.clientWidth` (pleine largeur responsive) — pas de `width: 300px` par défaut.
- Responsive : rail passe sous la main à `max-width: 780px`.
- Couleur du levier : jamais violet en aplat plein — fond `--violet-s` (rgba 0.08).
- Sections toutes ouvertes par défaut (`max-height: 5000px`), refermables via chevron pivoté.
- Barres `.bar-fill` : animation `width 1.1s var(--overshoot)` au load — `cubic-bezier(.22,.68,0,1.2)`.

---

## FICHE 2 — RÉUNION COMMERCIALE (`MeetingAnalysis.tsx` · type Commercial)

### 1. Delta Gap

**Ce qui existe** dans `MeetingAnalysis.tsx` :
- Header sticky avec titre, badges, scores, bouton email — partiellement utile mais mauvaise structure (navbar sticky ≠ `.hero-header` dark)
- Tabs (Préparation / Participants / Résumé) — **architecture incorrecte** : la spec exige une page scrollable, pas des onglets
- Sidebar gauche avec score relationnel moyen et sources connectées — structure correctement séparée mais mauvais conteneur
- Résumé exécutif — à renommer "Mode 5 min"
- Section "Participants & Influence" avec sélection interactive — à remplacer par `.acard` par participant
- Radar comportemental + axes barres — valide mais doit migrer vers fiche Personne exclusivement (spec-15 §10 : pas de radar sur la Réunion)
- "Agenda personnel" = concept à mapper sur ToM
- "Alertes relationnelles" + "Questions JTBD" + "Adapter sa communication" — à restructurer dans les blocs canoniques
- Compte-rendu post-réunion (onglet Résumé) — à conserver, logique

**Ce qui manque entièrement** :
- `.hero-header` dark avec accent **violet** (type Commercial), `--night` background, glow radial
- Badges `.mh-pill` (type · date · participants · compte)
- Sources `.hsrc` dans le header
- `.acard` par participant (N participants = N acards) avec score individuel + tendance + lien Personne
- Bloc `sec-snap` "Relation avec le compte" (score compte + courbe `drawMR` violet + chip mono-thread)
- Mode 5 min `.m5-body` + `.m5-cell` + `.m5-cell-warn`
- Objectif 3 tiers (Minimal/Nominal/Stretch) avec `.card` colorés
- `.tom-wrap` Theory of Mind (3 colonnes sait/sait pas/croit + callouts humeur/risque)
- MEDDPICC 8 lignes avec badge lettre violet + 3 pastilles de force (sage/amber/coral)
- Concurrence & statu quo (grille `.two` `.card`)
- Coût de l'inaction (carte coral)
- Recommandations · structure · Next steps
- Objections + Anti-patterns
- Pivots (section `.csec` repliée par défaut)
- Signaux rail scopé Réunion (faits remontés de Personne/Compte, jamais de recommandations)

---

### 2. Blocs à Implémenter (ordre canonique spec-15 §4 Réunion)

#### Bloc A — Hero Réunion Commerciale
- **Classe CSS** : `.hero-header` + `.hero-body` + `.hero-left` + `.hero-right` + `.hero-score-block` + `.mh-meta` + `.mh-pill` + `.mh-pill-v` (accent violet)
- **Props TS** : `meeting.title`, `meeting.company`, `meeting.startsAt`, `meeting.endsAt`, `meeting.format`, `meeting.type = 'commercial'`, `confidenceScore`
- Accent violet : liseré 3px `--violet` en haut, badges `mh-pill-v`
- **Supabase** : `meetings`
- **Complexite** : Moyen

#### Bloc B — Sources Connectées (hero)
- Identique à Personne Bloc B
- **Complexite** : Simple

#### Bloc C — Cartes Participants (N acards)
- **Classe CSS** : `.acard` × N participants
- **Props TS** : `participants[].id`, `participants[].name`, `participants[].role_title`, `participants[].engagement_score`, `profiles[].score_phase`
- Eyebrow : "Participant · Personne" en mono uppercase
- Score individuel coloré + tendance
- Lien vers `/contact/:id`
- **Complexite** : Simple

#### Bloc D — Snapshot Compte (sec-snap)
- **Classe CSS** : `.csec.open#sec-snap` + `.es-stats` (Score compte · tendance) + `.cwrap canvas` (drawMR violet) + `.chart-legend` + chip `⚠ Mono-thread` si concentration >80%
- **Props TS** : `company.engagement_score`, `company_score_history[]`, `company.mono_thread_pct` (depuis santé relationnelle)
- Courbe `drawMR` : `line='#6E50C8'` (violet compte), bouton "Voir le compte →"
- **Supabase** : `companies`, `company_score_history`
- **Complexite** : Complexe (drawMR, données compte)

#### Bloc E — Mode 5 min
- **Classe CSS** : `.csec.open.csec-action#sec-m5` + `.m5-body` + `.m5-cell` + `.m5-cell-warn`
- **Props TS** : `brief.mode5min` (ce qu'il pense / 1ère phrase / question clé / anti-pattern / signal succès)
- Fond `.csec-action` légèrement distinct, cellule warn fond `--coral-s`
- **Supabase** : `meeting_briefs.mode5min` (JSON)
- **Complexite** : Simple

#### Bloc F — Objectif 3 Tiers
- **Classe CSS** : `.csec.open#sec-obj` + `.card` × 3 (Minimal `--t3` / Nominal `--violet` / Stretch `--sage`)
- **Props TS** : `brief.objective` { minimal, nominal, stretch }
- **Complexite** : Simple

#### Bloc G — Theory of Mind
- **Classe CSS** : `.tom-wrap` + `.tom-top` + `.tom-grid` + `.tc.tk` / `.tc.tdd` / `.tc.tbb` + `.tl` / `.ti` + `.tom-callouts` + `.tmood` + `.trisk`
- **Props TS** : `profile.theory_of_mind_data` (sait / ne_sait_pas / croit_probablement / humeur / risque_perception) scopé réunion
- Header `.tom-top` : fond `--night` + glow violet. 3 colonnes : sait sage / ne sait pas violet / croit amber
- Callouts : humeur (fond violet) + risque (fond coral)
- **Complexite** : Moyen

#### Bloc H — MEDDPICC (deal actif seulement)
- **Classe CSS** : `.csec#sec-meddpicc` + lignes custom (div flex) : badge lettre violet 26px + libellé uppercase + pastilles force (3 cercles sage/amber/coral) + `.prov`
- **Props TS** : `brief.meddpicc[]` { letter, label, content, force: 1|2|3, source }
- Force 3 = sage `●●●`, force 2 = amber `●●○`, force 1 = coral `●○○`
- Conditionnel : affiché seulement si `deal_active = true`
- **Supabase** : `meeting_briefs.meddpicc`
- **Complexite** : Moyen

#### Bloc I — Concurrence & Statu Quo (deal actif)
- **Classe CSS** : `.csec#sec-conc` + `.two` + `.card` (statu quo border coral)
- **Complexite** : Simple

#### Bloc J — Coût de l'Inaction (deal actif)
- **Classe CSS** : `.csec#sec-cout` + carte fond `--coral-s`, bord coral
- **Complexite** : Simple

#### Bloc K — Recommandations · Next Steps
- **Classe CSS** : `.csec#sec-reco` + `.dim-note` × N (bord gauche 3px `--violet`)
- **Complexite** : Simple

#### Bloc L — Objections + Anti-patterns
- **Classe CSS** : `.csec#sec-obj2` + `.card` (label coral + note)
- **Complexite** : Simple

#### Bloc M — Pivots (replié par défaut)
- **Classe CSS** : `.csec#sec-piv` (sans `.open`) + `.dim-note` × N
- Replié par défaut = seul bloc fermé à l'ouverture
- **Complexite** : Simple

#### Bloc N — Signaux Rail
- Identique à Personne Bloc J mais scope Réunion : tags Churn/Risque/Levier/Croissance/Réseau. Faits remontés de Personne/Compte, marqués `surfaced_from`.
- **Complexite** : Moyen

---

### 3. Ordre d'Implémentation Recommandé

1. Suppression des onglets — layout page scrollable + aside rail
2. Hero (A) + Sources (B)
3. Acards participants (C) — navigation vers Personne
4. Mode 5 min (E) + Objectif (F) — haute valeur immédiate
5. Theory of Mind (G) — bloc signature
6. Snapshot Compte drawMR (D)
7. MEDDPICC (H) + Concurrence (I) + Coût inaction (J)
8. Recommandations (K) + Objections (L)
9. Pivots repliés (M)
10. Signaux rail (N)

---

### 4. Points d'Attention UI/UX Critiques

- **Supprimer le radar de la Réunion** (spec-15 §10) — il vit sur Personne. Le spec est explicite : avec N participants, le radar n'a pas de place unique sur la Réunion.
- **Renommer** "Résumé Exécutif" → "Mode 5 min" (spec-20 §9 : pas de résumé exécutif séparé).
- Type accent : fond `--night` + liseré `--violet` + badge `mh-pill-v` pour Commercial.
- `.csec-action` (Mode 5 min, Objectif) : style légèrement distinct, section "d'action" groupée et contigüe — ne pas intercaler de l'analyse entre les blocs d'action.
- Chip mono-thread sur sec-snap : `⚠ Mono-thread · …` en une ligne, seulement si concentration >80% (spec-22 §2).
- MEDDPICC : conditionnel sur `deal_active`. Ne pas afficher si pas de deal.

---

## FICHE 3 — RÉUNION PRODUCTIVITÉ (`MeetingAnalysis.tsx` · type Productivité)

### 1. Delta Gap

Partage le même composant que la Réunion Commerciale. Le delta gap est donc identique pour la structure générale. Les différences sont dans le **groupe métier** qui remplace MEDDPICC/Concurrence/Coût inaction.

**Ce qui manque spécifiquement pour Productivité** :
- Accent header **teal** (`--teal`) au lieu de violet + badge "Productivité"
- Bloc "Type de réunion" (R10 en 1er) — contexte de la réunion (opérationnel, revue, décision...)
- Bloc "Tensions actives" — faits de friction relationnels scopés à ce groupe/projet
- Bloc "Sécurité psychologique & qualité de décision" (Edmondson/Janis, R11)
- "Ordre du jour time-boxé" (sortie avant-réunion)
- "Décisions & Actions" (artefact post-réunion)
- Objections fusionnées avec anti-patterns et signaux d'alerte (un seul bloc tight, pas de matrice commerciale)
- Signaux : tags Churn/Risque/Levier/Réseau autorisés (pas de Marché/Croissance qui sont Compte-only)

**Ce qui est identique à la Réunion Commerciale** (blocs transverses) :
- Hero, Sources, Acards participants, Snapshot Compte, Mode 5 min, Objectif 3 tiers, Theory of Mind, Pivots, Signaux rail

---

### 2. Blocs à Implémenter (delta vs Commerciale)

#### Bloc H-prod — Type de Réunion (R10)
- **Classe CSS** : `.csec.open#sec-type` + `.card` (description, enjeux, format attendu)
- **Props TS** : `brief.meeting_type_context` (type, enjeux, format, pré-requis)
- Placé EN PREMIER dans le groupe métier (avant ToM)
- **Complexite** : Simple

#### Bloc I-prod — Tensions Actives
- **Classe CSS** : `.csec#sec-tensions` + liste `.dim-note` (bord gauche amber)
- **Props TS** : `brief.active_tensions[]` (tension, from_signal, implication)
- Faits de friction relationnels datés, sourcés — pas des opinions
- **Complexite** : Simple

#### Bloc J-prod — Sécurité Psychologique (R11)
- **Classe CSS** : `.csec#sec-secu` + indicateurs Edmondson (prise de parole, désaccord ouvert, erreur sans pénalité) + Janis (pensée de groupe, clôture prématurée)
- **Props TS** : `brief.psych_safety` { score, signals[], recommendations[] }
- **Complexite** : Moyen

#### Bloc K-prod — Ordre du Jour Time-boxé (sortie)
- **Classe CSS** : `.csec#sec-odj` + tableau points (thème · durée · owner · outcome attendu)
- **Props TS** : `brief.agenda_items[]`
- **Complexite** : Simple

#### Bloc L-prod — Décisions & Actions (post-réunion)
- **Classe CSS** : `.csec#sec-decisions` + `.card` décision (border sage) + `.card` action (checkbox + owner + due)
- **Props TS** : `post_summary.decisions[]`, `post_summary.action_items[]`
- Visible si réunion passée
- **Complexite** : Simple

#### Bloc M-prod — Anti-patterns & Signaux d'alerte (fusionnés)
- **Classe CSS** : `.csec#sec-antipatterns` + `.card` (label + note tight)
- Bloc unique qui remplace la matrice d'objections commerciale
- **Complexite** : Simple

---

### 3. Ordre d'Implémentation Recommandé

1. Créer un `meetingType: 'commercial' | 'productivite'` prop sur le composant
2. Implémenter tous les blocs transverses (identiques Commerciale)
3. Conditionner le groupe métier : `if (meetingType === 'commercial')` → MEDDPICC/Concurrence/Coût ; `else` → Type/Tensions/SécuritéPsycho
4. Header accent : `style={{ '--accent': meetingType === 'commercial' ? '--violet' : '--teal' }}`
5. Objections : commercial = matrice tableau ; productivité = bloc `.card` fusionné

---

### 4. Points d'Attention UI/UX Critiques

- Accent teal pour le header : `border-top: 3px solid var(--teal)`, badge `.mh-pill` fond `--teal-s`, texte `--teal`
- Pas de Résumé Exécutif séparé (spec-20 §9).
- Pré/Post séparation : "Avant la réunion" (prep) + "Décisions & Actions" (post) — ne pas dupliquer dans les signaux.
- Objections productivité : fusionner pushback + anti-patterns + signaux d'alerte en UN bloc tight (pas de matrice).

---

## FICHE 4 — COMPTE (`Organization.tsx`)

### 1. Delta Gap

**Ce qui existe** dans `Organization.tsx` :
Le composant actuel est un **cockpit d'équipe** (membres, invitations, stats org) — c'est un composant complètement différent de la "fiche Compte" décrite dans la spec. Il n'y a quasiment **aucun recouvrement** avec la fiche Compte spec-15.

Ce composant `Organization.tsx` est le cockpit admin de l'organisation utilisatrice, pas la fiche d'un compte client B2B. La fiche Compte spec-15 n'existe pas encore dans le codebase — c'est une **création complète**.

**Ce qui manque entièrement** (tout) :
- `.hero-header` compte (fond `--night`, score compte, confiance)
- Sources `.hsrc` header
- Levier compte (`.levier` scopé compte)
- Mémoire Relationnelle compte (`.csec` + `drawMR` violet `#6E50C8`)
- Bloc "Santé relationnelle" (3 métriques : concentration/mono-thread, couverture réseau de décision, prochain contact à tisser)
- Contexte entreprise (`.panel`)
- ONA — `drawONA` canvas (hub coral → contacts colorés par rôle + white space pointillé)
- Table contacts `ct-tbl` (Contact · Rôle Miller Heiman · Score MR · Dernier contact · Voir/Générer)
- Power Map `pm-grid` (4 quadrants : Economic Buyer / Influenceur / Champion / Décideur technique)
- Signaux rail scopé Compte (tags : Churn/Risque/Levier/Marché/Croissance/Réseau/Présence)
- Navigation vers fiches Personne + lien Réunions
- `.chip` (rôles Miller Heiman colorés)

---

### 2. Blocs à Implémenter (ordre canonique spec-15 §4 Compte)

#### Bloc A — Hero Compte
- **Classe CSS** : `.hero-header` + `.hero-body` + `.mh-meta` + `.mh-pill`
- **Props TS** : `company.name`, `company.domain`, `company.description`, `company.logo_url`, `company_score` (MR global), `confidence`
- Pas de type → pas de couleur d'accent variable, header `--night` standard avec glow violet radial
- **Supabase** : `companies`, `company_score_history`
- **Complexite** : Moyen

#### Bloc B — Sources Connectées (hero)
- Identique aux autres surfaces
- **Complexite** : Simple

#### Bloc C — Levier Compte
- **Classe CSS** : `.levier`
- **Props TS** : `company.strategic_lever` (conclusion-synthèse scopée compte)
- **Supabase** : `company_profiles.strategic_lever`
- **Complexite** : Simple

#### Bloc D — Mémoire Relationnelle Compte
- **Classe CSS** : `.csec.open#sec-mem-compte` + `.es-stats` + `.mem-alert` + `.cwrap canvas` + `.mem-dims` + `.dim-card` + `.bar-track` / `.bar-fill` + `.prov`
- **Props TS** : `company_score`, `company_score_history[]`, dimensions Intensité/Réciprocité/Longévité agrégées sur tous les contacts du compte
- Courbe `drawMR` : `line='#6E50C8'` (violet), `fillA='rgba(110,80,200,0.22)'`
- Dimensions barres : bleu/amber/sage (identique Personne mais données agrégées compte)
- **Supabase** : `companies`, `company_score_history`
- **Complexite** : Complexe

#### Bloc E — Santé Relationnelle (spec-22, juste après MR)
- **Classe CSS** : `.csec#sec-sante` + 3 métriques `.pos-m` style + `.pos-warning` + ligne sidecar CRM
- **Props TS** :
  - `mono_thread_pct` : % des échanges portés par un seul contact (barre coral si >80%)
  - `network_coverage` : contacts actifs / contacts pertinents identifiés (barre sage)
  - `next_contact_to_weave` : objet { name, role, reason } + bouton "Générer son brief" → `gen()`
  - `crm_pipeline` : CA/pipeline (affiché seulement si CRM connecté, "à confirmer" sinon)
- **Supabase** : calculé depuis `communication_messages` (groupé par company_id + contact_id)
- **Complexite** : Complexe (calcul de concentration)

#### Bloc F — Contexte Entreprise
- **Classe CSS** : `.panel` (carte blanche, header icône + titre + sous-titre mono + meta)
- **Props TS** : `company.description`, `company.sector`, `company.size`, `company.founded_year`, `company.recent_news`
- **Complexite** : Simple

#### Bloc G — ONA (Organizational Network Analysis)
- **Classe CSS** : `.csec#sec-ona` + `.onawrap canvas` (`drawONA`)
- Hub : Optee/vous en coral, rayons vers contacts colorés par rôle Miller Heiman
- White space : contacts identifiés jamais contactés → traits pointillés coral fin
- Légende couleurs : Economic Buyer violet / Champion sage / User Buyer blue / Technical Buyer teal / Direction non contactée amber / Inconnu `--t3`
- **Props TS** : `contacts[]` (id, name, role_miller_heiman, engagement_score, last_contact, is_white_space)
- **Complexite** : Complexe (canvas ONA)

#### Bloc H — Table Contacts
- **Classe CSS** : `.csec#sec-contacts` + `.ct-tbl` + `.btn-brief.btn-view` + `.btn-brief.btn-gen` + `.ct-pos` (coral pour white space)
- **Props TS** : `contacts[]` (id, name, role_title, role_miller_heiman, engagement_score, last_contact_date, has_profile)
- `has_profile = true` → bouton "Voir le brief" → `/contact/:id`
- `has_profile = false` → bouton "Générer" → `gen(name, email, title)` → `sendPrompt()`
- **Responsive** : `@media(max-width:780px)` uniquement pour collapse mobile (JAMAIS en global CSS)
- `.chip` pour rôle MM : pilule mono uppercase, couleur par rôle (§5 spec-16)
- **Complexite** : Moyen

#### Bloc I — Power Map Miller Heiman
- **Classe CSS** : `.csec#sec-pm` + `.pm-grid` (4 quadrants) + `.pm-eb` / `.pm-ub` / `.pm-ch` / `.pm-tb` + `.pm-contact` + `.pm-signal` + `.pm-warn` (white space)
- Quadrants : Economic Buyer (violet) / User Buyer (blue) / Champion/Coach (sage) / Technical Buyer (teal)
- `.pm-warn` pour les white spaces dans chaque quadrant
- **Responsive** : `@media(max-width:780px)` uniquement → `grid-template-columns: 1fr`
- **Complexite** : Moyen

#### Bloc J — Signaux Rail Compte
- Tags autorisés : Churn, Risque, Levier, Marché, Croissance, Réseau, Présence
- Tags interdits : Mobilité (Personne-only)
- Structure identique aux autres surfaces
- **Complexite** : Moyen

---

### 3. Ordre d'Implémentation Recommandé

1. Créer `CompanyDetail.tsx` (nouveau composant, Organisation.tsx est un cockpit différent — ne pas modifier)
2. Route `/company/:id` dans le routeur
3. Hero (A) + Sources (B)
4. Levier (C) + MR compte drawMR violet (D)
5. Santé relationnelle (E) — nécessite calcul mono-thread
6. Contexte entreprise (F) — simple
7. Table Contacts (H) — action directe, boutons Voir/Générer
8. Power Map (I)
9. ONA canvas (G) — complexe, après la table
10. Signaux rail (J)

---

### 4. Points d'Attention UI/UX Critiques

- **Ne pas modifier `Organization.tsx`** — c'est un cockpit d'équipe différent. Créer `CompanyDetail.tsx`.
- La santé relationnelle (concentration/mono-thread) ne doit **jamais** apparaître sur la Personne ni en bloc complet sur la Réunion — uniquement sur le Compte (spec-22 §1).
- Règle responsive critique (spec-20 §7) : `.ct-tbl td{display:block}` et `.pm-grid{grid-template-columns:1fr}` doivent être dans `@media(max-width:780px)` uniquement — jamais en CSS global.
- ONA : le nœud Optee/vous est **coral** et central. Toutes les lignes en partent. White space = traits pointillés coral fin.
- Power Map : `pm-grid` = CSS Grid 2×2 avec `grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr`.
- Le CA/pipeline CRM est **optionnel et dans un encart sidecar** conditionné sur la connexion CRM (spec-22 §0).
- Ne jamais inclure le CA dans le score relationnel.

---

## Synthèse Transverse

### Blocs partagés — composants réutilisables à créer

| Composant | Usage | Priorité |
|-----------|-------|----------|
| `<HeroHeader>` | Personne + Réunion + Compte | Haute |
| `<SourcesConnectees>` | Toutes surfaces | Haute |
| `<ACard>` | Navigation inter-surfaces | Haute |
| `<CollapsibleSection>` (.csec) | Toutes sections | Haute |
| `<RelationalMemory>` (drawMR canvas) | Personne (sage) + Compte (violet) + Réunion (violet snap) | Haute |
| `<SignalRail>` | Toutes surfaces | Moyenne |
| `<MeetingRow>` (.mrow) | Personne uniquement | Moyenne |
| `<PositionMetrics>` | Personne uniquement | Moyenne |
| `<ContactTable>` | Compte uniquement | Moyenne |
| `<PowerMap>` | Compte uniquement | Moyenne |
| `<ONACanvas>` | Compte uniquement | Basse |
| `<RadarCanvas>` | Personne uniquement | Basse |

### Tables Supabase impliquées

| Table | Surface | Colonnes clés |
|-------|---------|---------------|
| `contacts` | Personne | id, full_name, role_title, company_id, avatar_url, linkedin_url |
| `companies` | Compte | id, name, domain, description, sector |
| `cognitive_profiles` | Personne + Réunion (ToM) | engagement_score, score_phase, score_delta, score_intensite, score_reciprocite, score_longevite, global_confidence, jtbd_data, theory_of_mind_data, behavioral_analysis_data, interaction_modes_data |
| `contact_score_history` | Personne | score, snapshot_date, phase |
| `company_score_history` | Compte + Réunion (snap) | score, snapshot_date, phase, company_id |
| `communication_messages` | Personne (position) + Compte (santé) | contact_id, company_id, direction, sent_at |
| `meetings` | Réunion | id, title, starts_at, ends_at, company_id, brief_type |
| `meeting_participants` | Réunion | meeting_id, contact_id |
| `meeting_briefs` | Réunion | meeting_id, mode5min, objective, theory_of_mind, meddpicc, recommendations |
| `connectors` | Toutes | user_id, provider, status |
| `signals` | Toutes (à créer si inexistante) | surface, entity_id, tag, text, source, date, confidence |

### Règle absolue zéro-hallucination

Chaque champ sans source vérifiable = `null` affiché comme "à confirmer" (classe `.tbc`). Jamais d'information inventée. Le moteur de génération IA doit valider chaque signal selon les 4 critères spec-23 avant rendu.

---

*Plan produit le 03 juin 2026 · à valider avant implémentation*
