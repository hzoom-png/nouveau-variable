create table if not exists project_members (
  id           uuid        primary key default gen_random_uuid(),
  project_id   uuid        not null references projects(id) on delete cascade,
  member_id    uuid        not null references profiles(id) on delete cascade,
  role         varchar(50) not null default 'participant',
  status       varchar(50) not null default 'pending',
  invited_at   timestamptz not null default now(),
  responded_at timestamptz,
  created_at   timestamptz not null default now(),
  constraint uq_project_member unique (project_id, member_id)
);

create index if not exists idx_pm_project on project_members(project_id);
create index if not exists idx_pm_member  on project_members(member_id);
create index if not exists idx_pm_status  on project_members(status);

alter table project_members enable row level security;

create policy "pm_select" on project_members
  for select using (
    auth.uid() = member_id
    or exists (
      select 1 from projects
      where projects.id = project_id
        and projects.user_id = auth.uid()
    )
  );

create policy "pm_insert" on project_members
  for insert with check (
    exists (
      select 1 from projects
      where projects.id = project_id
        and projects.user_id = auth.uid()
    )
  );

create policy "pm_update" on project_members
  for update using (
    auth.uid() = member_id
    or exists (
      select 1 from projects
      where projects.id = project_id
        and projects.user_id = auth.uid()
    )
  );

create policy "pm_delete" on project_members
  for delete using (
    exists (
      select 1 from projects
      where projects.id = project_id
        and projects.user_id = auth.uid()
    )
  );
