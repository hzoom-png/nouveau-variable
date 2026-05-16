-- Ajouter les colonnes manquantes si absentes
alter table admin_audit_log
  add column if not exists metadata  jsonb,
  add column if not exists target_id uuid,
  add column if not exists action    text,
  add column if not exists admin_id  uuid;
