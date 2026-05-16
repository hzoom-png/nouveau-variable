-- Fix: ON DELETE CASCADE sur les tables référençant profiles
-- À exécuter dans Supabase SQL Editor → confirmer avant le déploiement

-- meeting_requests
alter table meeting_requests
  drop constraint if exists meeting_requests_sender_id_fkey,
  drop constraint if exists meeting_requests_receiver_id_fkey;
alter table meeting_requests
  add constraint meeting_requests_sender_id_fkey
    foreign key (sender_id) references profiles(id) on delete cascade,
  add constraint meeting_requests_receiver_id_fkey
    foreign key (receiver_id) references profiles(id) on delete cascade;

-- affiliate_commissions
alter table affiliate_commissions
  drop constraint if exists affiliate_commissions_payer_user_id_fkey,
  drop constraint if exists affiliate_commissions_beneficiary_id_fkey;
alter table affiliate_commissions
  add constraint affiliate_commissions_payer_user_id_fkey
    foreign key (payer_user_id) references profiles(id) on delete set null,
  add constraint affiliate_commissions_beneficiary_id_fkey
    foreign key (beneficiary_id) references profiles(id) on delete cascade;

-- invoices
alter table invoices
  drop constraint if exists invoices_user_id_fkey;
alter table invoices
  add constraint invoices_user_id_fkey
    foreign key (user_id) references profiles(id) on delete cascade;

-- affiliation_pipe
alter table affiliation_pipe
  drop constraint if exists affiliation_pipe_user_id_fkey;
alter table affiliation_pipe
  add constraint affiliation_pipe_user_id_fkey
    foreign key (user_id) references profiles(id) on delete cascade;

-- sidehustle_projects
alter table sidehustle_projects
  drop constraint if exists sidehustle_projects_user_id_fkey;
alter table sidehustle_projects
  add constraint sidehustle_projects_user_id_fkey
    foreign key (user_id) references profiles(id) on delete cascade;

-- replique_scripts (si existe)
alter table replique_scripts
  drop constraint if exists replique_scripts_user_id_fkey;
alter table replique_scripts
  add constraint replique_scripts_user_id_fkey
    foreign key (user_id) references profiles(id) on delete cascade;

-- tokens_transactions
alter table tokens_transactions
  drop constraint if exists tokens_transactions_user_id_fkey;
alter table tokens_transactions
  add constraint tokens_transactions_user_id_fkey
    foreign key (user_id) references profiles(id) on delete cascade;
