create table if not exists sidehustle_projects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references profiles(id) on delete cascade not null,
  project_id  uuid references projects(id)  on delete set null,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),

  -- Inputs
  name        text not null,
  description text,
  objective   text,
  target_date date,
  concept     text,
  stage       text check (stage in ('idea','validation','build','launch','growth')) default 'idea',

  -- AI outputs
  roadmap     jsonb,
  bmc         jsonb,
  forecast    jsonb
);

alter table sidehustle_projects enable row level security;

create policy "owner only" on sidehustle_projects
  for all using (auth.uid() = user_id);

create or replace function update_sidehustle_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger sidehustle_updated_at
  before update on sidehustle_projects
  for each row execute function update_sidehustle_updated_at();
