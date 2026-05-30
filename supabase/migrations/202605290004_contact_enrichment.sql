-- ============================================================
-- Migration: contact enrichment system + rich cognitive profiles
-- ============================================================

-- ─── 1. Enrichment columns on contacts ──────────────────────
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS enrichment_status   text NOT NULL DEFAULT 'pending'
    CHECK (enrichment_status IN ('pending', 'running', 'done', 'failed')),
  ADD COLUMN IF NOT EXISTS last_enriched_at    timestamptz,
  ADD COLUMN IF NOT EXISTS web_bio             text,
  ADD COLUMN IF NOT EXISTS linkedin_headline   text,
  ADD COLUMN IF NOT EXISTS enrichment_error    text;

CREATE INDEX IF NOT EXISTS idx_contacts_enrichment
  ON public.contacts (organization_id, enrichment_status);

-- ─── 2. Rich profile columns on cognitive_profiles ──────────
ALTER TABLE public.cognitive_profiles
  ADD COLUMN IF NOT EXISTS jtbd_data               jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS interaction_modes_data  jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS theory_of_mind_data     jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS behavioral_analysis_data jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS executive_summary       text,
  ADD COLUMN IF NOT EXISTS cognitive_mode          text
    CHECK (cognitive_mode IN ('s1_dominant','s2_dominant','contextual','unavailable')),
  ADD COLUMN IF NOT EXISTS cognitive_mode_confidence numeric(4,3),
  ADD COLUMN IF NOT EXISTS engagement_score        integer CHECK (engagement_score BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS score_phase             text
    CHECK (score_phase IN ('growth','stagnant','decline')),
  ADD COLUMN IF NOT EXISTS score_intensite         integer CHECK (score_intensite BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS score_reciprocite       integer CHECK (score_reciprocite BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS score_longevite         integer CHECK (score_longevite BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS score_delta             integer;

-- ─── 3. Score history for the evolution chart ───────────────
CREATE TABLE IF NOT EXISTS public.contact_score_history (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  contact_id      uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score           integer NOT NULL CHECK (score BETWEEN 0 AND 100),
  phase           text    NOT NULL CHECK (phase IN ('growth','stagnant','decline')),
  score_intensite integer,
  score_reciprocite integer,
  score_longevite integer,
  snapshot_date   date    NOT NULL DEFAULT CURRENT_DATE,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, contact_id, user_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_score_history_contact
  ON public.contact_score_history (contact_id, snapshot_date DESC);

ALTER TABLE public.contact_score_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "score_history_member_all" ON public.contact_score_history
  FOR ALL USING (private.is_org_member(organization_id))
  WITH CHECK (private.is_org_member(organization_id));
