-- ── COMMISSION REQUESTS ─────────────────────────────────────────────────────
-- Système de commissions manuelles par facture (Mai 2026)
-- Les affiliés soumettent une facture PDF chaque mois,
-- l'admin valide et marque payé manuellement.

CREATE TABLE IF NOT EXISTS commission_requests (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  month_year          VARCHAR(7) NOT NULL,  -- Format: "2026-05"

  -- Statuts: pending → facture_recue → validee → payee | rejetee
  status              VARCHAR(50) NOT NULL DEFAULT 'pending',

  -- Déclaration affilié
  revenue_earned      NUMERIC(10,2),        -- € générés (N1 + N2 + missions déclarés)
  commission_amount   NUMERIC(10,2),        -- € à verser (fixé par admin à la validation)

  -- Facture PDF
  facture_path        TEXT,                 -- path dans Supabase Storage
  facture_url         TEXT,                 -- URL publique ou signée
  facture_received_at TIMESTAMPTZ,

  -- Paiement
  payment_date        TIMESTAMPTZ,
  payment_reference   VARCHAR(100),

  -- Admin
  admin_notes         TEXT,
  rejection_reason    TEXT,

  -- Timestamps
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  submitted_at        TIMESTAMPTZ,
  validated_at        TIMESTAMPTZ,

  CONSTRAINT uq_commission_affiliate_month UNIQUE (affiliate_id, month_year)
);

CREATE INDEX IF NOT EXISTS idx_commission_requests_status
  ON commission_requests(status);

CREATE INDEX IF NOT EXISTS idx_commission_requests_affiliate
  ON commission_requests(affiliate_id);

CREATE INDEX IF NOT EXISTS idx_commission_requests_month
  ON commission_requests(month_year);

-- ── AFFILIATE BANKING INFO ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS affiliate_banking_info (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id         UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,

  iban                 VARCHAR(34),
  bic                  VARCHAR(11),
  account_holder_name  VARCHAR(100),

  -- Méthode alternative: 'bank_transfer' | 'wise'
  payment_method       VARCHAR(50) DEFAULT 'bank_transfer',
  payment_details      JSONB,

  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE commission_requests ENABLE ROW LEVEL SECURITY;

-- Affiliés voient uniquement leurs propres demandes
CREATE POLICY "commission_requests_select_own"
  ON commission_requests FOR SELECT
  USING (auth.uid() = affiliate_id);

-- Affiliés peuvent insérer leurs propres demandes
CREATE POLICY "commission_requests_insert_own"
  ON commission_requests FOR INSERT
  WITH CHECK (auth.uid() = affiliate_id);

-- Affiliés peuvent mettre à jour leurs propres demandes (upload facture)
CREATE POLICY "commission_requests_update_own"
  ON commission_requests FOR UPDATE
  USING (auth.uid() = affiliate_id);

-- Service role (admin backend) peut tout faire — bypass RLS via service client

ALTER TABLE affiliate_banking_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "affiliate_banking_select_own"
  ON affiliate_banking_info FOR SELECT
  USING (auth.uid() = affiliate_id);

CREATE POLICY "affiliate_banking_upsert_own"
  ON affiliate_banking_info FOR INSERT
  WITH CHECK (auth.uid() = affiliate_id);

CREATE POLICY "affiliate_banking_update_own"
  ON affiliate_banking_info FOR UPDATE
  USING (auth.uid() = affiliate_id);
