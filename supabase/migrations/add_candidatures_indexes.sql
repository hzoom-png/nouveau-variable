-- À exécuter dans Supabase Dashboard > SQL Editor
-- Ou via : supabase db push

-- Index sur email pour la recherche anti-doublon et backoffice
CREATE INDEX IF NOT EXISTS idx_candidatures_email
  ON candidatures(email);

-- Index sur status pour le compteur waitlist et le backoffice
CREATE INDEX IF NOT EXISTS idx_candidatures_status
  ON candidatures(status);

-- Index sur referral_code pour le tracking affiliation (colonne réelle : referral_code)
CREATE INDEX IF NOT EXISTS idx_candidatures_referral_code
  ON candidatures(referral_code)
  WHERE referral_code IS NOT NULL;

-- Index sur created_at pour les tris chronologiques backoffice
CREATE INDEX IF NOT EXISTS idx_candidatures_created_at
  ON candidatures(created_at DESC);
