-- ============================================================
-- N3 AFFILIATION — Migration
-- ============================================================

-- 1. Extend referrals.level CHECK constraint to allow level=3
--    (drop existing constraint on level if any, then re-add with 3 levels)
DO $$
DECLARE
  con text;
BEGIN
  SELECT conname INTO con
  FROM pg_constraint
  WHERE conrelid = 'public.referrals'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%level%';
  IF con IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.referrals DROP CONSTRAINT %I', con);
  END IF;
END $$;

ALTER TABLE public.referrals
  ADD CONSTRAINT referrals_level_check CHECK (level IN (1, 2, 3));

-- 2. Track when a member becomes N3 eligible (6 months after subscription_start)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS n3_eligible_since TIMESTAMPTZ DEFAULT NULL;

-- 3. Index to speed up N3 network queries
CREATE INDEX IF NOT EXISTS idx_referrals_level_referrer
  ON public.referrals (level, referrer_id);

-- 4. Back-fill n3_eligible_since for members already past 6 months
UPDATE public.profiles
SET n3_eligible_since = subscription_start + INTERVAL '6 months'
WHERE subscription_start IS NOT NULL
  AND subscription_start <= NOW() - INTERVAL '6 months'
  AND n3_eligible_since IS NULL
  AND subscription_status = 'active';
