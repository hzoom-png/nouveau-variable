-- Idempotency table for Stripe webhooks
-- Prevents duplicate processing when Stripe retries events

CREATE TABLE IF NOT EXISTS processed_stripe_events (
  stripe_event_id TEXT PRIMARY KEY,
  event_type      VARCHAR(100) NOT NULL,
  processed_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Cleanup index (for the 30-day retention job)
CREATE INDEX IF NOT EXISTS idx_pse_processed_at ON processed_stripe_events (processed_at);

-- RLS: service role only (no user access)
ALTER TABLE processed_stripe_events ENABLE ROW LEVEL SECURITY;
