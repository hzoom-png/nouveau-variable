-- Add preference columns to meeting_requests for the new slot-free RDV system
ALTER TABLE meeting_requests
  ADD COLUMN IF NOT EXISTS preferred_days    text[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS preferred_moments text[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS confirmed_time    text   DEFAULT NULL;
