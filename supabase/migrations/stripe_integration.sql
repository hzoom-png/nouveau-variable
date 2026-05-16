alter table profiles
  add column if not exists stripe_customer_id     text,
  add column if not exists stripe_subscription_id text,
  add column if not exists subscription_status    text default 'inactive',
  add column if not exists subscription_plan      text check (subscription_plan in ('monthly','annual')),
  add column if not exists subscription_start     timestamptz,
  add column if not exists subscription_end       timestamptz,
  add column if not exists is_manually_activated  boolean default false;

create table if not exists affiliate_commissions (
  id                    uuid primary key default gen_random_uuid(),
  created_at            timestamptz default now(),
  payer_user_id         uuid references profiles(id) on delete set null,
  beneficiary_id        uuid references profiles(id) on delete cascade not null,
  level                 int check (level in (1,2)) not null,
  plan                  text not null,
  amount_eur            numeric(10,2) not null,
  status                text default 'pending' check (status in ('pending','paid','cancelled')),
  stripe_payment_intent text
);

create table if not exists invoices (
  id                    uuid primary key default gen_random_uuid(),
  created_at            timestamptz default now(),
  user_id               uuid references profiles(id) on delete cascade not null,
  stripe_invoice_id     text,
  stripe_payment_intent text,
  amount_eur            numeric(10,2) not null,
  status                text default 'paid',
  invoice_pdf_url       text,
  period_start          timestamptz,
  period_end            timestamptz
);

alter table affiliate_commissions enable row level security;
create policy "own commissions" on affiliate_commissions
  for select using (auth.uid() = beneficiary_id);

alter table invoices enable row level security;
create policy "own invoices" on invoices
  for select using (auth.uid() = user_id);
