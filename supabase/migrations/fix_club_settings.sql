create table if not exists club_settings (
  id              int primary key default 1 check (id = 1), -- une seule ligne
  max_members     int  not null default 1000,
  admin_email     text,
  welcome_message text default 'Bienvenue dans le club.',
  applications_open boolean not null default true,
  updated_at      timestamptz default now()
);

-- Insérer les valeurs par défaut si absent
insert into club_settings (id) values (1)
on conflict (id) do nothing;
