-- Fix: contrainte CHECK role_type — ajouter salarie_entrepreneur
-- À exécuter dans Supabase SQL Editor → confirmer avant le déploiement

alter table profiles
  drop constraint if exists profiles_role_type_check;
alter table profiles
  add constraint profiles_role_type_check
    check (role_type in ('salarie', 'freelance', 'entrepreneur', 'dirigeant', 'salarie_entrepreneur', 'autre'));
