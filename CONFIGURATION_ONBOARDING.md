# Configuration Onboarding Réel — Knowy Easy

Ce fichier liste ce que tu dois configurer côté services externes pour que l'onboarding fonctionne réellement en local puis sur Netlify.

## 1. Supabase Auth

Projet Supabase :

```txt
https://bgmtzwfafcgjklgygvtx.supabase.co
```

Dans Supabase Dashboard > Authentication > URL Configuration :

Site URL local :

```txt
http://localhost:5173
```

Redirect URLs à ajouter :

```txt
http://localhost:5173/onboarding/step1
http://localhost:5173/onboarding/step2
http://127.0.0.1:5173/onboarding/step1
http://127.0.0.1:5173/onboarding/step2
https://knowy-ai.netlify.app/onboarding/step1
https://knowy-ai.netlify.app/onboarding/step2
```

Le domaine Netlify actuel est :

```txt
https://knowy-ai.netlify.app
```

## 2. Email Magic Link

Dans Supabase Dashboard > Authentication > Providers :

- Active `Email`.
- Active `Confirm email` si tu veux forcer la validation.
- Vérifie que les magic links redirigent bien vers `/onboarding/step1`.

Compte test actuel :

```txt
jordan.knowy@gmail.com
```

## 3. Google / Gmail

Dans Google Cloud Console :

1. Crée ou sélectionne un projet Google Cloud.
2. Configure l'écran de consentement OAuth.
3. Crée un OAuth Client ID de type `Web application`.
4. Ajoute cette Authorized redirect URI :

```txt
https://bgmtzwfafcgjklgygvtx.supabase.co/auth/v1/callback
```

5. Active les APIs :

```txt
Gmail API
Google Calendar API
```

6. Scopes utilisés par Knowy :

```txt
email
profile
https://www.googleapis.com/auth/calendar.readonly
https://www.googleapis.com/auth/gmail.readonly
```

7. Copie le `Client ID` et le `Client Secret`.
8. Colle-les dans Supabase Dashboard > Authentication > Providers > Google.
9. Active le provider Google.

## 4. Microsoft Outlook

Dans Microsoft Entra Admin Center :

1. Crée une App Registration.
2. Type de plateforme : `Web`.
3. Redirect URI :

```txt
https://bgmtzwfafcgjklgygvtx.supabase.co/auth/v1/callback
```

4. Ajoute les permissions Microsoft Graph :

```txt
openid
email
profile
offline_access
Calendars.Read
Mail.Read
```

5. Crée un Client Secret.
6. Copie l'Application Client ID et le Client Secret.
7. Colle-les dans Supabase Dashboard > Authentication > Providers > Azure.
8. Active le provider Azure.

## 5. LinkedIn

Dans LinkedIn Developer Portal :

1. Crée une application LinkedIn.
2. Active `Sign In with LinkedIn using OpenID Connect`.
3. Ajoute la redirect URI :

```txt
https://bgmtzwfafcgjklgygvtx.supabase.co/auth/v1/callback
```

4. Scopes utilisés :

```txt
openid
profile
email
```

5. Copie le Client ID et le Client Secret.
6. Colle-les dans Supabase Dashboard > Authentication > Providers > LinkedIn OIDC.
7. Active le provider.

Note importante : LinkedIn OIDC ne renvoie pas toujours le poste et l'entreprise. C'est pour cela que l'onboarding garde les champs `Entreprise` et `Votre poste` éditables.

## 6. OpenAI pour l'analyse réelle du site

L'Edge Function `analyze-website` fonctionne déjà avec un fallback heuristique. Pour activer l'analyse LLM réelle :

```bash
npx supabase secrets set OPENAI_API_KEY=sk-... --project-ref bgmtzwfafcgjklgygvtx
```

Puis teste l'onboarding :

```txt
http://localhost:5173/signin
```

## 7. Netlify

Connexion opérationnelle :

```txt
Nom interne demandé: mcp-net-knowy
Projet Netlify: knowy-ai
Site ID: d4c6fedb-7175-4e81-a1c1-13da02aeb020
Production URL: https://knowy-ai.netlify.app
Dashboard: https://app.netlify.com/projects/knowy-ai/overview
```

Le dossier local est lié à Netlify via `.netlify/state.json`. Ce dossier est ignoré par Git et ne contient pas le token.

Dans Netlify > Site settings > Environment variables :

```txt
VITE_SUPABASE_URL=https://bgmtzwfafcgjklgygvtx.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_NpK05sr4q4kapxcPqtE5hQ_JZSsxi4Z
```

Ces deux variables ont été ajoutées sur Netlify.

Build settings :

```txt
Build command: npm run build
Publish directory: dist
```

Le fichier `netlify.toml` contient déjà le fallback SPA.

Dernier déploiement production validé :

```txt
Production URL: https://knowy-ai.netlify.app
Unique deploy URL: https://6a162480d5271e6537411683--knowy-ai.netlify.app
Build logs: https://app.netlify.com/projects/knowy-ai/deploys/6a162480d5271e6537411683
```

## 8. Sécurité Supabase à traiter

Supabase remonte une alerte RLS sur :

```txt
subscription_plans
subscriptions
ai_usage_events
```

Ne pas activer RLS à l'aveugle sans policies, sinon certaines pages peuvent casser. Décision recommandée :

- `subscription_plans` : lecture publique ou authenticated read-only.
- `subscriptions` : accès uniquement aux membres de l'organisation.
- `ai_usage_events` : accès admin/org owner uniquement, ou aucune lecture frontend.

## 9. Checklist de validation

Après configuration :

```bash
cd "/Users/jordanchekroun/Downloads/Knowy Easy"
npm run build
npm run dev:host
```

Ouvre :

```txt
http://localhost:5173/
```

Parcours à tester :

- Landing page > `Essayer maintenant`.
- Connexion email avec `jordan.knowy@gmail.com`.
- Connexion Google.
- Connexion Microsoft.
- Connexion LinkedIn.
- Analyse d'un site web.
- Sauvegarde de la description produit.
- Étapes 1 à 5 de l'onboarding.
- Arrivée sur `/dashboard`.
