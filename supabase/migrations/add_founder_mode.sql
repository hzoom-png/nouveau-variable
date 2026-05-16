-- Mode founder : compte gratuit, tous les avantages, Brevo désactivé
ALTER TABLE candidatures
  ADD COLUMN IF NOT EXISTS is_founder          BOOLEAN     DEFAULT false,
  ADD COLUMN IF NOT EXISTS founder_activated_at TIMESTAMPTZ DEFAULT NULL;
