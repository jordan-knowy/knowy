-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Subscription & Plan System
-- Date: 2026-05-27
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Subscription plans catalogue ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscription_plans (
  id                        TEXT PRIMARY KEY,               -- 'free','pro','business','enterprise','super_admin'
  name                      TEXT NOT NULL,
  description               TEXT,
  price_monthly             INTEGER DEFAULT 0,              -- EUR cents
  price_yearly              INTEGER DEFAULT 0,              -- EUR cents
  max_licenses              INTEGER DEFAULT 1,              -- -1 = unlimited
  max_briefs_per_month      INTEGER DEFAULT 5,              -- -1 = unlimited
  max_ai_calls_per_month    INTEGER DEFAULT 100,            -- -1 = unlimited
  max_storage_gb            INTEGER DEFAULT 1,
  features                  JSONB DEFAULT '[]',
  is_active                 BOOLEAN DEFAULT true,
  sort_order                INTEGER DEFAULT 0,
  created_at                TIMESTAMPTZ DEFAULT now()
);

-- ── 2. Organisation subscriptions ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id                        UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id           UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id                   TEXT NOT NULL REFERENCES subscription_plans(id),
  status                    TEXT NOT NULL DEFAULT 'active'
                            CHECK (status IN ('active','trialing','past_due','canceled','paused')),
  billing_cycle             TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly','yearly')),
  amount_per_period         INTEGER DEFAULT 0,              -- EUR cents
  started_at                TIMESTAMPTZ DEFAULT now(),
  current_period_start      TIMESTAMPTZ DEFAULT now(),
  current_period_end        TIMESTAMPTZ DEFAULT (now() + INTERVAL '1 month'),
  trial_ends_at             TIMESTAMPTZ,
  canceled_at               TIMESTAMPTZ,
  stripe_subscription_id    TEXT,
  stripe_customer_id        TEXT,
  notes                     TEXT,                           -- admin notes
  created_at                TIMESTAMPTZ DEFAULT now(),
  updated_at                TIMESTAMPTZ DEFAULT now(),
  UNIQUE (organization_id)                                  -- one active sub per org
);

-- ── 3. AI usage tracking ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_usage_events (
  id                        UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id           UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id                   UUID NOT NULL REFERENCES auth.users(id),
  event_type                TEXT NOT NULL,                  -- 'brief_generated','ai_call','profile_scored'
  tokens_used               INTEGER DEFAULT 0,
  model                     TEXT,
  meeting_id                UUID REFERENCES meetings(id),
  contact_id                UUID REFERENCES contacts(id),
  created_at                TIMESTAMPTZ DEFAULT now()
);

-- ── 4. Seed: plan catalogue ────────────────────────────────────────────────
INSERT INTO subscription_plans (id, name, description, price_monthly, price_yearly, max_licenses, max_briefs_per_month, max_ai_calls_per_month, max_storage_gb, features, sort_order)
VALUES
  (
    'free', 'Free', 'Commencer gratuitement',
    0, 0, 1, 5, 50, 1,
    '["5 briefs/mois","Sync calendrier","Intelligence humaine basique","Résumés basiques","Export CRM manuel"]',
    1
  ),
  (
    'pro', 'Pro', 'Pour les commerciaux ambitieux',
    3900, 3200, 20, -1, -1, 10,
    '["Briefs illimités","Intelligence humaine avancée","Intelligence entreprise","Mémoire relationnelle","CRM sync","Insights historiques","Organigrammes basiques","Support prioritaire"]',
    2
  ),
  (
    'business', 'Business', 'Pour les équipes performantes',
    7900, 6600, 100, -1, -1, 50,
    '["Tout Pro, plus:","Intelligence temps réel","Advisory live","Organizational mapping avancé","Revenue intelligence","Analyse risque deal","Multi-thread tracking","Analytics équipe","Automatisations IA","API access"]',
    3
  ),
  (
    'enterprise', 'Enterprise', 'Sur mesure pour les grandes organisations',
    0, 0, -1, -1, -1, -1,
    '["Tout Business, plus:","SSO / SAML","Gouvernance avancée","Compliance & audit logs","IA privée dédiée","APIs illimitées","Couche mémoire dédiée","Infrastructure dédiée","Success manager dédié","SLA personnalisé"]',
    4
  ),
  (
    'super_admin', 'Super Admin', 'Accès test et administration globale',
    0, 0, -1, -1, -1, -1,
    '["Accès illimité à toutes les fonctionnalités","Switch entre plans","Gestion des organisations","Accès aux logs et métriques","Mode super admin"]',
    5
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  max_licenses = EXCLUDED.max_licenses,
  max_briefs_per_month = EXCLUDED.max_briefs_per_month,
  max_ai_calls_per_month = EXCLUDED.max_ai_calls_per_month,
  max_storage_gb = EXCLUDED.max_storage_gb,
  features = EXCLUDED.features;

-- ── 5. Add super_admin flag to profiles ───────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_override TEXT REFERENCES subscription_plans(id);

-- ── 6. RLS policies ────────────────────────────────────────────────────────
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_events ENABLE ROW LEVEL SECURITY;

-- Plans are readable by all authenticated users
CREATE POLICY "subscription_plans_read" ON subscription_plans
  FOR SELECT TO authenticated USING (true);

-- Subscriptions: org members can read their org's subscription
CREATE POLICY "subscriptions_read_own_org" ON subscriptions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.organization_id = subscriptions.organization_id
        AND m.user_id = auth.uid()
    )
  );

-- Super admins can read all subscriptions
CREATE POLICY "subscriptions_super_admin_read" ON subscriptions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.is_super_admin = true
    )
  );

-- Super admins can update subscriptions
CREATE POLICY "subscriptions_super_admin_update" ON subscriptions
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.is_super_admin = true
    )
  );

-- ai_usage_events: org members can read their org's events
CREATE POLICY "ai_usage_events_read_own_org" ON ai_usage_events
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.organization_id = ai_usage_events.organization_id
        AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "ai_usage_events_insert" ON ai_usage_events
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ── 7. Helper view: subscription usage stats ────────────────────────────────
CREATE OR REPLACE VIEW subscription_usage AS
SELECT
  s.organization_id,
  s.plan_id,
  s.status,
  s.current_period_start,
  s.current_period_end,
  sp.max_licenses,
  sp.max_briefs_per_month,
  sp.max_ai_calls_per_month,
  sp.price_monthly,
  -- Count active licenses
  (SELECT COUNT(DISTINCT m.user_id) FROM memberships m WHERE m.organization_id = s.organization_id) AS licenses_used,
  -- Count briefs generated this period
  (SELECT COUNT(*) FROM meetings mt
   WHERE mt.organization_id = s.organization_id
     AND mt.brief_status IN ('ready', 'consulted')
     AND mt.created_at >= s.current_period_start) AS briefs_used,
  -- Count AI calls this period
  (SELECT COUNT(*) FROM ai_usage_events ae
   WHERE ae.organization_id = s.organization_id
     AND ae.created_at >= s.current_period_start) AS ai_calls_used
FROM subscriptions s
JOIN subscription_plans sp ON sp.id = s.plan_id
WHERE s.status = 'active';
