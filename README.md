# Knowy Easy

Knowy Easy is a React/Vite web app for meeting preparation and behavioral relationship intelligence.

The current build is a launchable P0 prototype:

- Design system and P0 screens are implemented.
- The brief is centered on "Qui est dans la room".
- Relations expose cognitive and behavioral profiles.
- Supabase is connected to the `mcp-supaknowy` project and Netlify scaffolding is ready.

## Quick Start

```bash
cd "/Users/jordanchekroun/Downloads/Knowy Easy"
npm install
npm run dev:host
```

Open:

```txt
http://127.0.0.1:5173/
```

Useful routes:

```txt
/
/signin
/onboarding/step1
/dashboard
/meetings
/meeting/1
/relations
/relation/1
/account
/subscription
```

Auth routes:

- `/` is the public non-connected landing page.
- `/signin` starts onboarding via email magic link, Gmail/Google, Microsoft Outlook, or LinkedIn.
- App routes such as `/dashboard` redirect unauthenticated visitors to `/signin`.

## Verification

```bash
npm run build
npm audit --audit-level=high
```

Expected result:

- `npm run build` completes successfully.
- `npm audit --audit-level=high` reports `0 vulnerabilities`.

## Supabase

The app is connected to the Supabase project:

```txt
https://bgmtzwfafcgjklgygvtx.supabase.co
```

Local Supabase files are mirrored in `supabase/`:

```txt
supabase/config.toml
supabase/migrations/202605260001_core_p0.sql
supabase/migrations/202605260002_hardening_and_fk_indexes.sql
supabase/migrations/202605260003_optimize_auth_rls_policies.sql
supabase/migrations/202605260004_move_rls_helpers_to_private_schema.sql
supabase/migrations/202605260005_create_user_workspace_on_signup.sql
supabase/migrations/202605260006_revoke_signup_trigger_rpc_access.sql
supabase/migrations/202605260007_profile_contexts_for_llm_memory.sql
supabase/functions/
```

Remote status:

- Core public tables created with RLS enabled.
- Migrations applied remotely: `core_p0_schema`, `hardening_and_fk_indexes`, `optimize_auth_rls_policies`, `move_rls_helpers_to_private_schema`, `create_user_workspace_on_signup`, `revoke_signup_trigger_rpc_access`, `profile_contexts_for_llm_memory`.
- Edge Functions deployed with JWT verification: `generate-brief`, `score-cognitive-profile`, `ingest-communication`, `analyze-website`.
- Security advisor: `subscription_plans`, `subscriptions`, and `ai_usage_events` currently have RLS disabled. Do not expose subscription/admin data from the frontend before adding the right policies.

Frontend credentials are in `.env.local`:

```txt
VITE_SUPABASE_URL=https://bgmtzwfafcgjklgygvtx.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

The current P0 repositories in `src/lib/api/*` are Supabase-first with mock fallback: after sign-in and membership resolution they query live contacts, meetings, cognitive profiles and the `generate-brief` function; without data/auth they keep the demo usable.

## Real Onboarding Setup

The onboarding flow is now wired to real Supabase writes:

- Email magic link creates/signs in users and redirects to `/onboarding/step1`.
- Google, Outlook/Microsoft, and LinkedIn use Supabase OAuth.
- Step 1 stores `profiles` and `profile_contexts` for the LLM memory.
- Step 2 records connected Google/Microsoft providers in `connectors`.
- Step 3 marks CRM as planned for v2.
- Step 4 stores `notification_preferences` and `privacy_settings`.
- Step 5 marks onboarding complete and queues an `initial_onboarding_sync` job.

OAuth providers must be enabled in Supabase Auth before production use:

```txt
Site URL: https://<your-netlify-domain>
Additional redirect URLs:
http://127.0.0.1:5173/onboarding/step1
http://127.0.0.1:5173/onboarding/step2
https://<your-netlify-domain>/onboarding/step1
https://<your-netlify-domain>/onboarding/step2
Providers: Google, Azure/Microsoft, LinkedIn OIDC
```

For real provider connections, configure these in Supabase Auth:

- Google provider: client ID/secret from Google Cloud, Gmail/Calendar scopes approved. Provider callback: `https://bgmtzwfafcgjklgygvtx.supabase.co/auth/v1/callback`.
- Azure provider: client ID/secret from Microsoft Entra, Outlook/Calendar scopes approved. Provider callback: `https://bgmtzwfafcgjklgygvtx.supabase.co/auth/v1/callback`.
- LinkedIn OIDC provider: client ID/secret from LinkedIn Developer Portal. Provider callback: `https://bgmtzwfafcgjklgygvtx.supabase.co/auth/v1/callback`.

The frontend requests these scopes:

```txt
Google: email profile https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/gmail.readonly
Microsoft: email openid profile offline_access Calendars.Read Mail.Read
LinkedIn: openid profile email
```

For real LLM website analysis, configure this Edge Function secret:

```txt
OPENAI_API_KEY=...
```

CLI example:

```bash
npx supabase secrets set OPENAI_API_KEY=sk-... --project-ref bgmtzwfafcgjklgygvtx
```

Without `OPENAI_API_KEY`, `analyze-website` still returns a deterministic heuristic analysis so the onboarding remains usable.

## Netlify

`netlify.toml` is configured for Vite:

- build command: `npm run build`
- publish directory: `dist`
- SPA fallback: `/* -> /index.html`

## Documentation

- Architecture: `ARCHITECTURE.md`
- API contracts: `API.md`
- Design system: `DESIGN_SYSTEM.md`
- QA report: `QA_REPORT.md`
- Open questions: `QUESTIONS.md`

## Attribution

This Figma Make file includes components from shadcn/ui under the MIT license and photos from Unsplash under the Unsplash license. See `ATTRIBUTIONS.md`.
