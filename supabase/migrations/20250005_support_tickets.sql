-- support_tickets
CREATE TABLE IF NOT EXISTS support_tickets (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email     TEXT NOT NULL,
  user_name      TEXT NOT NULL,
  ticket_type    TEXT NOT NULL CHECK (ticket_type IN ('bug', 'feature', 'billing', 'general', 'other')),
  subject        TEXT NOT NULL CHECK (char_length(subject) <= 255),
  message        TEXT NOT NULL CHECK (char_length(message) <= 2000),
  status         TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority       TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  admin_response TEXT CHECK (char_length(admin_response) <= 2000),
  admin_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at    TIMESTAMPTZ
);

-- auto-update updated_at
CREATE OR REPLACE FUNCTION update_support_tickets_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_support_tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION update_support_tickets_updated_at();

-- indexes
CREATE INDEX IF NOT EXISTS idx_support_tickets_status     ON support_tickets (status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority   ON support_tickets (priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id    ON support_tickets (user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_email ON support_tickets (user_email);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets (created_at DESC);

-- RLS
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Users can see their own tickets (by user_id or email)
CREATE POLICY "support_tickets_select_own" ON support_tickets
  FOR SELECT USING (
    auth.role() = 'authenticated'
    AND (auth.uid() = user_id OR auth.jwt()->>'email' = user_email)
  );

-- Authenticated users can create tickets
CREATE POLICY "support_tickets_insert" ON support_tickets
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
