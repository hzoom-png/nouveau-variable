-- ============================================================
-- Admin back-office — Nouveau Variable
-- ============================================================

-- 1. Champ role admin dans profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member'
  CHECK (role IN ('member', 'admin'));

-- 2. Secret TOTP admin
CREATE TABLE IF NOT EXISTS admin_totp (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  secret     TEXT NOT NULL,
  verified   BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE admin_totp ENABLE ROW LEVEL SECURITY;

-- 3. Log d'activité admin
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id    UUID REFERENCES auth.users(id),
  action      TEXT NOT NULL,
  target_type TEXT,
  target_id   TEXT,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- 4. Candidatures
CREATE TABLE IF NOT EXISTS candidatures (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name             TEXT NOT NULL,
  email                 TEXT NOT NULL,
  phone                 TEXT,
  company               TEXT,
  role                  TEXT,
  city                  TEXT,
  experience            TEXT,
  linkedin_url          TEXT,
  motivation            TEXT,
  referral_code         TEXT,
  status                TEXT DEFAULT 'received'
    CHECK (status IN ('received', 'reviewed', 'accepted', 'rejected')),
  admin_note            TEXT,
  payment_link_sent_at  TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE candidatures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_insert_candidatures" ON candidatures FOR INSERT WITH CHECK (true);

-- 5. Événements
CREATE TABLE IF NOT EXISTS events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  description     TEXT,
  event_date      TIMESTAMPTZ NOT NULL,
  location        TEXT,
  location_url    TEXT,
  cover_image_url TEXT,
  max_attendees   INTEGER,
  is_published    BOOLEAN DEFAULT FALSE,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "published_events_public" ON events FOR SELECT USING (is_published = true);

-- 6. Broadcasts
CREATE TABLE IF NOT EXISTS broadcasts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type             TEXT CHECK (type IN ('sms', 'email')),
  subject          TEXT,
  message          TEXT NOT NULL,
  recipients_count INTEGER,
  sent_by          UUID REFERENCES auth.users(id),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE broadcasts ENABLE ROW LEVEL SECURITY;

-- 7. Triggers updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_candidatures_updated_at ON candidatures;
CREATE TRIGGER trg_candidatures_updated_at
  BEFORE UPDATE ON candidatures FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_events_updated_at ON events;
CREATE TRIGGER trg_events_updated_at
  BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 8. Vue tokens usage par outil
CREATE OR REPLACE VIEW admin_tokens_usage AS
SELECT
  tool_name,
  COUNT(*)          AS total_uses,
  SUM(tokens_used)  AS total_tokens,
  DATE_TRUNC('month', created_at) AS month
FROM tokens_transactions
GROUP BY tool_name, DATE_TRUNC('month', created_at);
