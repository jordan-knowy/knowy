# API — Knowy Easy P0

This document defines the Phase 2 API contracts. The target runtime is Supabase:

- Browser client: `@supabase/supabase-js` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Server actions: Supabase Edge Functions.
- Database: Supabase Postgres with RLS enabled on all tenant-scoped tables.

## Auth

Supabase Auth owns sessions. All organization-scoped reads and writes require a valid session and a `memberships` row for the target `organization_id`.

## Edge Functions

Base URL:

```txt
https://bgmtzwfafcgjklgygvtx.supabase.co/functions/v1
```

Currently deployed on `mcp-supaknowy` with `verify_jwt=true`:

- `generate-brief`
- `score-cognitive-profile`
- `ingest-communication`
- `analyze-website`

### `analyze-website`

Analyzes a public website during onboarding to build the user's LLM-ready business context.

Input:

```json
{ "url": "https://company.com" }
```

Output:

```json
{
  "url": "https://company.com",
  "title": "Company title",
  "usedLlm": true,
  "analysis": {
    "companyName": "Company",
    "industry": "B2B Software",
    "positioning": "Source-grounded positioning",
    "targetCustomers": ["Sales teams"],
    "productSignals": ["AI", "Workflow"],
    "valueProposition": "What the site appears to sell",
    "confidence": 72,
    "summary": "Concise source-grounded summary"
  }
}
```

Runtime behavior:

- Uses `OPENAI_API_KEY` from Supabase Edge Function secrets when available.
- Falls back to deterministic website text heuristics if no LLM key is configured.
- Never writes directly to the database; the authenticated frontend stores the approved context in `profile_contexts`.

### `oauth-google-callback`

Handles Google OAuth callback and stores connector state.

Input:

```json
{ "code": "oauth_code", "state": "opaque_state" }
```

Output:

```json
{ "connectorId": "uuid", "status": "connected" }
```

### `oauth-microsoft-callback`

Handles Microsoft OAuth callback for Outlook/Calendar.

Input/output mirrors `oauth-google-callback`.

### `ingest-calendar`

Synchronizes calendar events and normalizes meetings.

Input:

```json
{ "organizationId": "uuid", "connectorId": "uuid", "rangeDays": 14 }
```

Output:

```json
{ "meetingsCreated": 3, "meetingsUpdated": 9, "queuedBriefs": 2 }
```

### `ingest-communication`

Ingests text from email, messages, CRM notes, or authorized meeting transcript imports.

Input:

```json
{
  "organizationId": "uuid",
  "sourceType": "gmail",
  "sourceRef": "thread:abc",
  "contactHints": [{ "email": "person@company.com", "name": "Person" }],
  "text": "Plain text content",
  "observedAt": "2026-05-26T08:00:00Z"
}
```

Output:

```json
{ "threadId": "uuid|null", "messageId": "uuid|null", "signalsQueued": true }
```

Current remote implementation is a protected stub validating required fields.

### `score-cognitive-profile`

Runs signal extraction, inference rules, temporal decay and profile scoring for one contact.

Input:

```json
{ "organizationId": "uuid", "contactId": "uuid", "reason": "new_message" }
```

Output:

```json
{
  "contactId": "uuid",
  "profileId": "uuid",
  "profileVersion": 7,
  "globalConfidence": 72,
  "signalsCreated": 4
}
```

Current remote implementation is a protected stub validating required fields.

Rules:

- Missing source data must be stored as `null`.
- Never synthesize an invented fact to fill a field.
- Store each behavioral signal with `source_type`, `source_ref`, `confidence`, and `inference_level`.

### `generate-brief`

Generates a meeting brief from meeting data, participant cognitive profiles and source-grounded context.

Input:

```json
{ "organizationId": "uuid", "meetingId": "uuid", "forceRefresh": false }
```

Output:

```json
{
  "briefId": "uuid",
  "meetingId": "uuid",
  "status": "ready",
  "confidenceScore": 68
}
```

Current remote implementation is a protected stub validating required fields.

Required sections for commercial briefs:

- summary
- company context
- who is in the room
- interaction profiles
- personal agenda
- MEDDPICC
- objections
- risks
- next steps

### `privacy-export`

Exports user/org data according to privacy settings.

Input:

```json
{ "organizationId": "uuid", "userId": "uuid" }
```

Output:

```json
{ "exportId": "uuid", "status": "queued" }
```

### `privacy-delete-account`

Starts account deletion and retention cleanup.

Input:

```json
{ "organizationId": "uuid", "userId": "uuid", "confirmation": "DELETE" }
```

Output:

```json
{ "status": "queued", "retentionDays": 30 }
```

## Browser Data Contracts

Until real Edge Functions are connected, UI code should consume typed view models, not raw Supabase rows.

```ts
type InferenceLevel = 'observable' | 'inferred' | 'hypothetical' | 'unavailable';

interface BehavioralSignalView {
  id: string;
  title: string;
  summary: string;
  confidence: number;
  inferenceLevel: InferenceLevel;
  sourceLabel: string;
  observedAt: string | null;
}

interface CognitiveProfileView {
  contactId: string;
  globalConfidence: number;
  axes: Array<{
    axis: 'relation_result' | 'intuition_structure' | 'caution_speed' | 'consensus_control';
    value: number;
    confidence: number;
    inferenceLevel: InferenceLevel;
  }>;
  modes: Array<{
    mode: 'Challenger' | 'Validator' | 'Strategist' | 'Operator' | 'Consensus Builder' | 'Explorer';
    score: number;
    confidence: number;
  }>;
  signals: BehavioralSignalView[];
}
```

## Profile Context Memory

The onboarding writes one row per user/workspace in `profile_contexts`.

Purpose:

- Store analyzed website context.
- Store the user's 140-character offer description.
- Store connected identity providers.
- Store a single `llm_context_summary` that downstream agents can use as the source of truth for the user's business context.

## RLS Requirements

- Every tenant-scoped table must include `organization_id`.
- Client queries must only access rows through RLS policies backed by `memberships`.
- Edge Functions using service role must manually verify membership before any read/write.
- OAuth tokens, raw messages and transcripts are never exposed directly to the browser.
- `audit_logs` are insertable by members but readable only by admins.
