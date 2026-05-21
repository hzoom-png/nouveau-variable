-- club_settings existe déjà — on ajoute uniquement la colonne waitlist_mode
ALTER TABLE club_settings
  ADD COLUMN IF NOT EXISTS waitlist_mode boolean NOT NULL DEFAULT true;
