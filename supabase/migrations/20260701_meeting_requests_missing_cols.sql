-- Add columns missing from meeting_requests that the API route inserts
ALTER TABLE meeting_requests
  ADD COLUMN IF NOT EXISTS availability_note TEXT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS points_cost       INTEGER DEFAULT 8;

-- Points transactions table (referenced by meetings route)
CREATE TABLE IF NOT EXISTS points_transactions (
  id                 UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id         UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount             INTEGER     NOT NULL,
  balance_after      INTEGER     NOT NULL,
  transaction_type   TEXT        NOT NULL,
  related_meeting_id UUID        REFERENCES meeting_requests(id) ON DELETE SET NULL,
  created_at         TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "points_transactions_select_own" ON points_transactions
  FOR SELECT TO authenticated
  USING (profile_id = auth.uid());
