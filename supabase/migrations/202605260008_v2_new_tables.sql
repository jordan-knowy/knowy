-- ============================================================
-- Migration v2 — Nouvelles tables pour les features Knowy Easy (2)
-- ============================================================

-- ─── 1. Colonnes sur tables existantes ───────────────────────────────────────

-- meetings
ALTER TABLE meetings
  ADD COLUMN IF NOT EXISTS is_external          boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS has_decision_maker   boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS category             text,
  ADD COLUMN IF NOT EXISTS location             text,
  ADD COLUMN IF NOT EXISTS crm_synced           boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS crm_external_url     text,
  ADD COLUMN IF NOT EXISTS crm_sync_status      text CHECK (crm_sync_status IN ('pending','synced','error')),
  ADD COLUMN IF NOT EXISTS confidence_score     integer CHECK (confidence_score BETWEEN 0 AND 100);

-- contacts
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS crm_synced           boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS title_confirmed      boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tenure_start_date    date,
  ADD COLUMN IF NOT EXISTS location             text,
  ADD COLUMN IF NOT EXISTS influence_level      integer CHECK (influence_level BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS badge                text CHECK (badge IN ('champion','decider','gatekeeper','blocker'));

-- profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS linkedin_profile_data jsonb;

-- organizations
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS total_licenses       integer NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS active_licenses      integer NOT NULL DEFAULT 0;

-- connectors — support Attio
ALTER TABLE connectors
  DROP CONSTRAINT IF EXISTS connectors_provider_check;
ALTER TABLE connectors
  ADD CONSTRAINT connectors_provider_check
    CHECK (provider IN ('google','microsoft','linkedin','hubspot','salesforce','pipedrive','attio','zoom','teams'));

-- meeting_participants — participant job title
ALTER TABLE meeting_participants
  ADD COLUMN IF NOT EXISTS participant_job_title text;

-- ─── 2. Nouvelle table : knowy_activity_events ───────────────────────────────
CREATE TABLE IF NOT EXISTS knowy_activity_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_type      text NOT NULL CHECK (event_type IN (
    'notification_urgent','notification_important','notification_info',
    'profile_enriched','brief_ready','crm_sync','alert','birthday','job_change'
  )),
  title           text NOT NULL,
  description     text,
  entity_link     text,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_kae_org_created ON knowy_activity_events (organization_id, created_at DESC);
ALTER TABLE knowy_activity_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_select_activity" ON knowy_activity_events
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid())
  );

-- ─── 3. Nouvelle table : weekly_impact_stats ─────────────────────────────────
CREATE TABLE IF NOT EXISTS weekly_impact_stats (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id             uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_start          date NOT NULL,
  profiles_enriched   integer NOT NULL DEFAULT 0,
  insights_captured   integer NOT NULL DEFAULT 0,
  meetings_count      integer NOT NULL DEFAULT 0,
  active_contacts     integer NOT NULL DEFAULT 0,
  crm_synced_count    integer NOT NULL DEFAULT 0,
  crm_total_count     integer NOT NULL DEFAULT 0,
  time_saved_minutes  integer NOT NULL DEFAULT 0,
  evolution_pct       numeric(5,2) NOT NULL DEFAULT 0,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id, week_start)
);
ALTER TABLE weekly_impact_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_select_weekly" ON weekly_impact_stats
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid())
  );

-- ─── 4. Nouvelle table : relationship_snapshots ──────────────────────────────
CREATE TABLE IF NOT EXISTS relationship_snapshots (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id               uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  contact_id            uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  engagement_score      integer NOT NULL DEFAULT 0 CHECK (engagement_score BETWEEN 0 AND 100),
  score_evolution       integer NOT NULL DEFAULT 0,
  phase                 text NOT NULL DEFAULT 'stagnant' CHECK (phase IN ('growth','stagnant','decline')),
  phase_started_at      timestamptz NOT NULL DEFAULT now(),
  last_contact_at       timestamptz,
  last_contact_type     text CHECK (last_contact_type IN ('email','meeting','slack','linkedin')),
  reciprocity_pct       integer CHECK (reciprocity_pct BETWEEN 0 AND 100),
  avg_frequency_days    integer,
  next_recommended_days integer,
  crm_synced            boolean NOT NULL DEFAULT false,
  snapshot_date         date NOT NULL DEFAULT CURRENT_DATE,
  created_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id, contact_id, snapshot_date)
);
CREATE INDEX IF NOT EXISTS idx_rs_contact ON relationship_snapshots (organization_id, contact_id, snapshot_date DESC);
ALTER TABLE relationship_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_select_snapshots" ON relationship_snapshots
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid())
  );

-- ─── 5. Nouvelle table : contact_alerts ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS contact_alerts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id      uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  alert_type      text NOT NULL CHECK (alert_type IN ('cooling','job_change','news','birthday')),
  message         text NOT NULL,
  is_read         boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ca_contact ON contact_alerts (organization_id, contact_id, created_at DESC);
ALTER TABLE contact_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_select_contact_alerts" ON contact_alerts
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid())
  );

-- ─── 6. Nouvelle table : meeting_post_summaries ──────────────────────────────
CREATE TABLE IF NOT EXISTS meeting_post_summaries (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id          uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  meeting_id               uuid NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  actual_duration_minutes  integer,
  decisions                jsonb NOT NULL DEFAULT '[]',
  actions                  jsonb NOT NULL DEFAULT '[]',
  objections_handled       jsonb NOT NULL DEFAULT '[]',
  speaker_time             jsonb NOT NULL DEFAULT '[]',
  crm_sync_proposal        jsonb,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, meeting_id)
);
ALTER TABLE meeting_post_summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_select_post_summaries" ON meeting_post_summaries
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid())
  );

-- ─── 7. Nouvelle table : meeting_post_insights ───────────────────────────────
CREATE TABLE IF NOT EXISTS meeting_post_insights (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  meeting_id      uuid NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  contact_id      uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  text            text NOT NULL,
  category        text NOT NULL CHECK (category IN ('Deal','Motivation','Contexte','Comportement','Rôle','Critère décision')),
  created_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE meeting_post_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_select_post_insights" ON meeting_post_insights
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid())
  );

-- ─── 8. Nouvelle table : contact_topics ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS contact_topics (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id          uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  topic               text NOT NULL,
  mention_count       integer NOT NULL DEFAULT 1,
  last_mentioned_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, contact_id, topic)
);
ALTER TABLE contact_topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_select_topics" ON contact_topics
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid())
  );

-- ─── 9. Nouvelle table : contact_objections ──────────────────────────────────
CREATE TABLE IF NOT EXISTS contact_objections (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id          uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  objection_text      text NOT NULL,
  first_mentioned_at  timestamptz NOT NULL DEFAULT now(),
  mention_count       integer NOT NULL DEFAULT 1,
  status              text NOT NULL DEFAULT 'active' CHECK (status IN ('active','resolved'))
);
ALTER TABLE contact_objections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_select_objections" ON contact_objections
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid())
  );

-- ─── 10. Nouvelle table : contact_career_path ────────────────────────────────
CREATE TABLE IF NOT EXISTS contact_career_path (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id      uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  job_title       text NOT NULL,
  company_name    text NOT NULL,
  start_date      date,
  end_date        date,
  sector          text,
  is_current      boolean NOT NULL DEFAULT false,
  badges          text[] NOT NULL DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE contact_career_path ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_select_career" ON contact_career_path
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid())
  );

-- ─── 11. Nouvelle table : knowy_memory_snapshots ─────────────────────────────
CREATE TABLE IF NOT EXISTS knowy_memory_snapshots (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id         uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id              uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  brief_id                uuid REFERENCES briefs(id) ON DELETE SET NULL,
  brief_number            integer NOT NULL DEFAULT 1,
  confidence_score        integer NOT NULL CHECK (confidence_score BETWEEN 0 AND 100),
  capabilities_unlocked   text[] NOT NULL DEFAULT '{}',
  snapshot_date           date NOT NULL DEFAULT CURRENT_DATE
);
ALTER TABLE knowy_memory_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_select_memory" ON knowy_memory_snapshots
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid())
  );

-- ─── 12. Nouvelle table : company_signals ────────────────────────────────────
CREATE TABLE IF NOT EXISTS company_signals (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  company_id       uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  signal_type      text NOT NULL,
  description      text NOT NULL,
  detected_at      timestamptz NOT NULL DEFAULT now(),
  source           text,
  active_jobs_count integer NOT NULL DEFAULT 0
);
ALTER TABLE company_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_select_signals" ON company_signals
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid())
  );

-- ─── 13. Nouvelle table : org_alerts ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS org_alerts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  alert_type      text NOT NULL,
  severity        text NOT NULL DEFAULT 'info' CHECK (severity IN ('info','warning','critical')),
  message         text NOT NULL,
  meeting_id      uuid REFERENCES meetings(id) ON DELETE SET NULL,
  recommendation  text,
  is_resolved     boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE org_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_select_org_alerts" ON org_alerts
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid())
  );

-- ─── 14. Nouvelle table : org_activity_stats ─────────────────────────────────
CREATE TABLE IF NOT EXISTS org_activity_stats (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id          uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_start       date NOT NULL,
  meetings_count   integer NOT NULL DEFAULT 0,
  accounts_managed integer NOT NULL DEFAULT 0,
  activity_score   integer NOT NULL DEFAULT 0 CHECK (activity_score BETWEEN 0 AND 100),
  UNIQUE (organization_id, user_id, week_start)
);
ALTER TABLE org_activity_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_select_org_stats" ON org_activity_stats
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid())
  );

-- ─── 15. Nouvelle table : team_invitations ───────────────────────────────────
CREATE TABLE IF NOT EXISTS team_invitations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invited_by      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email           text NOT NULL,
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','revoked')),
  token           text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at      timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, email)
);
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_select_invitations" ON team_invitations
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid())
  );

-- ─── 16. Nouvelle table : plugin_installations ───────────────────────────────
CREATE TABLE IF NOT EXISTS plugin_installations (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  os           text NOT NULL CHECK (os IN ('macos','windows','linux')),
  version      text NOT NULL,
  installed_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  status       text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','error')),
  UNIQUE (user_id)
);
ALTER TABLE plugin_installations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_plugin" ON plugin_installations
  FOR ALL USING (user_id = auth.uid());

-- ─── 17. Nouvelle table : meeting_coaching_sessions ─────────────────────────
CREATE TABLE IF NOT EXISTS meeting_coaching_sessions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  meeting_id            uuid NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  plugin_session_id     text,
  started_at            timestamptz NOT NULL DEFAULT now(),
  ended_at              timestamptz,
  speaker_stats         jsonb NOT NULL DEFAULT '{}',
  suggestions_generated integer NOT NULL DEFAULT 0,
  decisions_captured    integer NOT NULL DEFAULT 0
);
ALTER TABLE meeting_coaching_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_select_coaching" ON meeting_coaching_sessions
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid())
  );

-- ─── 18. Nouvelle table : onboarding_progress ────────────────────────────────
CREATE TABLE IF NOT EXISTS onboarding_progress (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  current_step     integer NOT NULL DEFAULT 1 CHECK (current_step BETWEEN 1 AND 5),
  steps_completed  jsonb NOT NULL DEFAULT '{}',
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_onboarding" ON onboarding_progress
  FOR ALL USING (user_id = auth.uid());

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ language 'plpgsql';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_weekly_impact_updated_at') THEN
    CREATE TRIGGER set_weekly_impact_updated_at
      BEFORE UPDATE ON weekly_impact_stats
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_post_summary_updated_at') THEN
    CREATE TRIGGER set_post_summary_updated_at
      BEFORE UPDATE ON meeting_post_summaries
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_onboarding_updated_at') THEN
    CREATE TRIGGER set_onboarding_updated_at
      BEFORE UPDATE ON onboarding_progress
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
