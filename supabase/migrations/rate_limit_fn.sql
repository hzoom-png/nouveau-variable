-- Fonction RPC de rate limiting atomique
-- À appliquer dans le dashboard Supabase > SQL Editor APRÈS rate_limits.sql

CREATE OR REPLACE FUNCTION upsert_rate_limit(
  p_key    text,
  p_max    integer,
  p_window timestamptz
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE v_count integer;
BEGIN
  INSERT INTO rate_limits(key, count, window_start)
  VALUES (p_key, 1, now())
  ON CONFLICT (key) DO UPDATE
    SET count = CASE
      WHEN rate_limits.window_start < p_window THEN 1
      ELSE rate_limits.count + 1
    END,
    window_start = CASE
      WHEN rate_limits.window_start < p_window THEN now()
      ELSE rate_limits.window_start
    END
  RETURNING count INTO v_count;

  RETURN v_count <= p_max;
END;
$$;
