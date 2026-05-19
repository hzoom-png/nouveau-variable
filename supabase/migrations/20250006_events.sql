-- Events table
create table if not exists public.events (
  id               uuid primary key default gen_random_uuid(),
  title            text not null check (char_length(title) <= 200),
  description      text check (char_length(description) <= 5000),
  event_date       timestamptz not null,
  location         text check (char_length(location) <= 300),
  location_url     text check (char_length(location_url) <= 500),
  cover_image_url  text check (char_length(cover_image_url) <= 500),
  max_attendees    integer check (max_attendees > 0),
  is_published     boolean not null default false,
  created_by       uuid references auth.users(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists events_updated_at on public.events;
create trigger events_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

-- Indexes
create index if not exists events_event_date_idx on public.events (event_date asc);
create index if not exists events_is_published_idx on public.events (is_published);

-- RLS: only members can read published events
alter table public.events enable row level security;

drop policy if exists "members read published events" on public.events;
create policy "members read published events"
  on public.events for select
  using (is_published = true);
