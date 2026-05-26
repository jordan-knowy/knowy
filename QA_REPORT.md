# QA REPORT — Knowy Easy

Date: 2026-05-26

## Fonctionnalités Validées

- ✓ Application démarre en local avec `npm run dev:host`.
- ✓ Build production validé avec `npm run build`.
- ✓ Audit npm haute sévérité résolu : Vite mis à jour vers `6.4.2`.
- ✓ Netlify SPA fallback configuré via `netlify.toml`.
- ✓ Supabase P0 scaffold créé : config, migration SQL, seed, stubs Edge Functions.
- ✓ Page publique non connectée créée sur `/`.
- ✓ CTA `Essayer maintenant` branché vers `/signin`.
- ✓ Onboarding d'accès Supabase Auth créé via email magic link, Gmail/Google, Microsoft Outlook et LinkedIn OIDC.
- ✓ Routes applicatives protégées : les visiteurs non connectés sont redirigés vers `/signin`.
- ✓ Supabase distant `mcp-supaknowy` connecté : URL, publishable key, `.env.local`.
- ✓ Migrations Supabase distantes appliquées : `core_p0_schema`, `hardening_and_fk_indexes`, `optimize_auth_rls_policies`, `move_rls_helpers_to_private_schema`, `create_user_workspace_on_signup`, `revoke_signup_trigger_rpc_access`, `profile_contexts_for_llm_memory`.
- ✓ Création automatique du profil, workspace, membership owner et préférences à l'inscription.
- ✓ 24 tables `public` créées avec RLS activé.
- ✓ Advisors Supabase sécurité propres après hardening.
- ✓ Edge Functions déployées et actives avec `verify_jwt=true` :
  - `generate-brief`
  - `score-cognitive-profile`
  - `ingest-communication`
- ✓ Repositories frontend branchés en Supabase-first avec fallback mock :
  - contacts et fiches cognitives
  - meetings et participants
  - invocation `generate-brief`
- ✓ Landing page enrichie avec captures produit concrètes et discours marketing premium.
- ✓ Onboarding profil branché sur Supabase Auth `linkIdentity` pour LinkedIn, Google/Gmail et Microsoft Outlook.
- ✓ Analyse de site web connectée à l’Edge Function `analyze-website`.
- ✓ Mémoire de contexte LLM créée dans `profile_contexts`.
- ✓ Compte test réel `jordan.knowy@gmail.com` initialisé avec profil, workspace, membership owner et contexte initial.
- ✓ Étape CRM active retirée du parcours et annoncée comme v2.
- ✓ RLS prévue sur les tables tenant-scoped avec policies basées sur `memberships`.
- ✓ API P0 documentée dans `API.md`.
- ✓ Questions de configuration projet listées dans `QUESTIONS.md`.
- ✓ Design system P0 créé dans `src/app/components/design-system`.
- ✓ Compatibilité maintenue via `src/app/components/knowy`.
- ✓ Brief recentré sur "Qui est dans la room".
- ✓ Relations et fiche relationnelle recentrées sur les fiches cognitives/comportementales.
- ✓ Routes profondes servies localement par Vite :
  - `/dashboard`
  - `/meeting/1`
  - `/relations`
  - `/relation/1`

## Bugs / Risques Résolus

- Vulnérabilité haute npm sur Vite `6.3.5` corrigée par passage à `6.4.2`.
- Absence de fallback Netlify pour `BrowserRouter` corrigée par redirection `/* -> /index.html`.
- Absence de dépendances directes React corrigée : `react` et `react-dom` ajoutés en dependencies.
- Absence de contrats fonctionnels corrigée par types domaine, schémas Zod et repos mock-first.
- Absence de documentation API corrigée par `API.md`.
- Démarrage initial sur `/dashboard` remplacé par une landing publique explicative.
- Sign-in simulé remplacé par Supabase Auth.
- Extension `vector` déplacée hors du schema `public`.
- Fonctions RLS `is_org_member` et `is_org_admin` retirées de l'exécution RPC publique.
- Helpers RLS déplacés dans le schema privé `private` pour conserver l'évaluation des policies sans exposer de RPC public.
- Accès RPC à la fonction trigger d'inscription révoqué.
- Faux onboarding LinkedIn/CRM simulé remplacé par des connexions Auth réelles ou un jalon v2 assumé.
- Index FK ajoutés pour éviter les warnings de performance structurels.
- Policies `auth.uid()` optimisées pour éviter les init plans ligne par ligne.

## Points d'Amélioration

- Implémenter les Edge Functions au-delà des stubs.
- Remplacer le fallback mock par des empty states produit dès qu'un onboarding/org seed réel existe.
- Configurer les secrets OAuth Google, Microsoft et LinkedIn dans Supabase Auth.
- Ajouter `OPENAI_API_KEY` comme secret Supabase Edge Function pour activer l’analyse LLM réelle du site.
- Activer la protection Supabase Auth contre les mots de passe compromis.
- Générer les types Supabase complets avec un token CLI authentifié.
- Ajouter `tsconfig.json` et un script `typecheck` progressivement.
- Ajouter tests unitaires pour règles zéro hallucination : donnée absente = `null`.
- Ajouter tests RLS locaux pour isoler les organisations.
- Vérifier visuellement dans un navigateur complet les breakpoints mobile/tablette/desktop.
- Décider si les transcriptions Zoom/Teams/Meet sont importées manuellement en P0 ou synchronisées en P1.

## Commandes Exécutées

```txt
npm install
npm install @supabase/supabase-js zod
npm install react@18.3.1 react-dom@18.3.1
npm install -D vite@6.4.2
npm run build
npm audit --audit-level=high
npm run dev:host
curl -I http://127.0.0.1:5173/
curl -I http://127.0.0.1:5173/signin
curl -I http://127.0.0.1:5173/dashboard
curl -I http://127.0.0.1:5173/meeting/1
curl -I http://127.0.0.1:5173/relations
curl -I http://127.0.0.1:5173/relation/1
mcp-supaknowy.apply_migration core_p0_schema
mcp-supaknowy.apply_migration hardening_and_fk_indexes
mcp-supaknowy.apply_migration optimize_auth_rls_policies
mcp-supaknowy.apply_migration move_rls_helpers_to_private_schema
mcp-supaknowy.apply_migration create_user_workspace_on_signup
mcp-supaknowy.apply_migration revoke_signup_trigger_rpc_access
mcp-supaknowy.apply_migration profile_contexts_for_llm_memory
mcp-supaknowy.deploy_edge_function generate-brief
mcp-supaknowy.deploy_edge_function score-cognitive-profile
mcp-supaknowy.deploy_edge_function ingest-communication
mcp-supaknowy.deploy_edge_function analyze-website
curl https://bgmtzwfafcgjklgygvtx.supabase.co/rest/v1/contacts?select=id&limit=1
```

## Limites QA

- Le navigateur intégré n'était pas exposé dans les outils disponibles pendant cette passe ; la validation visuelle a donc été limitée au build et aux réponses HTTP locales.
- Les Edge Functions sont déployées mais restent des stubs contractuels : elles valident les inputs et ne lancent pas encore l'inférence réelle.
- Les providers Google, Microsoft et LinkedIn doivent être activés dans Supabase Auth avec leurs secrets OAuth avant un test end-to-end réel.
- `analyze-website` est déployée; sans secret `OPENAI_API_KEY`, elle utilise son fallback heuristique.
- Les warnings Supabase `unused_index` restent présents car la base est vide ; ils ne signalent pas un problème runtime.
- `npx supabase gen types` a été tenté, mais le CLI a répondu `Unauthorized`; les types complets nécessitent un token Supabase CLI.
- Le dossier `Knowy Easy` n'est pas un dépôt Git, donc aucun diff Git fiable n'a pu être produit.
