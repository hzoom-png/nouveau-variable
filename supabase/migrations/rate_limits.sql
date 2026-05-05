-- Table de rate limiting persistant (survit aux redémarrages Vercel)
-- À appliquer dans le dashboard Supabase > SQL Editor

CREATE TABLE IF NOT EXISTS rate_limits (
  key          text        PRIMARY KEY,
  count        integer     NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now()
);

-- Index pour le nettoyage périodique des entrées expirées
CREATE INDEX IF NOT EXISTS rate_limits_window_start_idx ON rate_limits(window_start);

-- Nettoyage automatique : supprimer les entrées de plus d'1 heure
CREATE OR REPLACE FUNCTION cleanup_rate_limits() RETURNS void LANGUAGE sql AS $$
  DELETE FROM rate_limits WHERE window_start < now() - interval '1 hour';
$$;
