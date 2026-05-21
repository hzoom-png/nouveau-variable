ALTER TABLE candidatures
  ADD COLUMN IF NOT EXISTS blocked boolean NOT NULL DEFAULT false;
