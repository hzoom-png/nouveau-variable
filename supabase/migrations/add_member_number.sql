-- Ajouter la colonne member_number
alter table profiles add column if not exists member_number integer;

-- Séquence auto-incrémentale à partir de 1
create sequence if not exists profiles_member_number_seq start 1;

-- Remplir les profils existants dans l'ordre de created_at
update profiles
set member_number = sub.row_num
from (
  select id, row_number() over (order by created_at asc) as row_num
  from profiles
  where member_number is null
) sub
where profiles.id = sub.id;

-- Trigger pour auto-attribuer le numéro aux nouveaux membres
create or replace function assign_member_number()
returns trigger language plpgsql as $$
begin
  if new.member_number is null then
    new.member_number := nextval('profiles_member_number_seq');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_assign_member_number on profiles;
create trigger trg_assign_member_number
  before insert on profiles
  for each row execute function assign_member_number();
