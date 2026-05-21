-- ── SIDE HUSTLE — Assumptions & Forecasts ─────────────────────────────────
-- Extend existing sidehustle_projects with structured assumptions
-- and versioned quantitative forecasts.

-- ── ASSUMPTIONS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS side_hustle_assumptions (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID        NOT NULL REFERENCES sidehustle_projects(id) ON DELETE CASCADE,

  category       VARCHAR(100) NOT NULL,  -- TARIFICATION, CAC, RETENTION, COUTS, CROISSANCE …
  key            VARCHAR(200) NOT NULL,  -- Abonnement Pro, Taux de churn mensuel …
  value          TEXT        NOT NULL,   -- valeur modifiable par l'utilisateur
  unit           VARCHAR(50),            -- €, %, M/M, jours …
  initial_value  TEXT,                   -- valeur Claude originale (pour comparaison)

  is_key         BOOLEAN     NOT NULL DEFAULT false,
  order_index    INT         NOT NULL DEFAULT 0,
  generated_by_claude BOOLEAN NOT NULL DEFAULT true,

  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sha_project  ON side_hustle_assumptions (project_id);
CREATE INDEX IF NOT EXISTS idx_sha_category ON side_hustle_assumptions (category);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sha_unique
  ON side_hustle_assumptions (project_id, category, key);

ALTER TABLE side_hustle_assumptions ENABLE ROW LEVEL SECURITY;

-- Ownership via parent project (auth.uid() = sidehustle_projects.user_id)
CREATE POLICY "owner_assumptions" ON side_hustle_assumptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM sidehustle_projects
      WHERE id = project_id AND user_id = auth.uid()
    )
  );

-- ── FORECASTS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS side_hustle_forecasts (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID        NOT NULL REFERENCES sidehustle_projects(id) ON DELETE CASCADE,

  duration_months  INT         NOT NULL,                 -- 12, 24, 36, 48, 60
  granularity      VARCHAR(20) NOT NULL,                  -- monthly | quarterly | annual

  forecast_data    JSONB       NOT NULL DEFAULT '[]',    -- [{period, mrr, arr, churn, cac, ltv, cashflow, status}]
  forecast_summary JSONB,                                -- {total_revenue, total_cost, breakeven_month, final_status}

  assumptions_hash TEXT,                                 -- md5 des assumptions au moment de la génération
  is_current       BOOLEAN     NOT NULL DEFAULT true,

  generated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shf_project ON side_hustle_forecasts (project_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_shf_unique
  ON side_hustle_forecasts (project_id, duration_months, granularity);

ALTER TABLE side_hustle_forecasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_forecasts" ON side_hustle_forecasts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM sidehustle_projects
      WHERE id = project_id AND user_id = auth.uid()
    )
  );
