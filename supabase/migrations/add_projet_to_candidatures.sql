-- Migration : ajout champs projet + code_parrain + sector + statuts waitlist

-- Champs projet
ALTER TABLE candidatures
  ADD COLUMN IF NOT EXISTS projet_nom        TEXT,
  ADD COLUMN IF NOT EXISTS projet_website    TEXT,
  ADD COLUMN IF NOT EXISTS projet_concept    TEXT,
  ADD COLUMN IF NOT EXISTS projet_avancement TEXT
    CHECK (projet_avancement IN ('idee', 'mvp', 'lancement', 'croissance', 'mature')),
  ADD COLUMN IF NOT EXISTS projet_besoins    JSONB;

-- Code parrain généré à l'inscription (code unique que le candidat partage)
ALTER TABLE candidatures
  ADD COLUMN IF NOT EXISTS code_parrain TEXT UNIQUE;

-- Secteur (déjà inséré par la route API mais absent de la migration initiale)
ALTER TABLE candidatures
  ADD COLUMN IF NOT EXISTS sector TEXT;

-- Nouveaux statuts waitlist
ALTER TABLE candidatures
  DROP CONSTRAINT IF EXISTS candidatures_status_check;
ALTER TABLE candidatures
  ADD CONSTRAINT candidatures_status_check
    CHECK (status IN ('received', 'reviewed', 'accepted', 'rejected', 'pending', 'pending_payment'));

-- Index projet et code_parrain
CREATE INDEX IF NOT EXISTS idx_candidatures_projet_nom
  ON candidatures(projet_nom)
  WHERE projet_nom IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_candidatures_code_parrain
  ON candidatures(code_parrain)
  WHERE code_parrain IS NOT NULL;
