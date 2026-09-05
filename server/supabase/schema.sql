-- BHR Traders schema for project akfrbpdxrbhuxqehpfqv (ap-southeast-1)
-- Run this in Supabase: SQL Editor → New query → Run

create table if not exists public.products (
  id text primary key,
  title text not null,
  short text,
  cat text,
  cats text,
  price numeric not null,
  price_label text,
  img text,
  description text,
  grain text,
  moisture text,
  pack text,
  origin text,
  moq text,
  broken text,
  aroma text,
  cook text,
  use_for text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text not null,
  company text,
  product text,
  qty text,
  message text,
  status text not null default 'Pending',
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id text primary key,
  name text not null,
  phone text not null,
  email text not null,
  address text not null,
  city text not null,
  pincode text not null,
  pay text,
  notes text,
  payment_proof text,
  total numeric not null default 0,
  status text,
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders(id) on delete cascade,
  product_id text,
  title text not null,
  qty int not null default 1,
  price numeric not null default 0
);

alter table public.products enable row level security;
alter table public.enquiries enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "products_read" on public.products;
create policy "products_read" on public.products for select using (true);

drop policy if exists "products_write" on public.products;
create policy "products_write" on public.products for insert with check (true);

drop policy if exists "products_update" on public.products;
create policy "products_update" on public.products for update using (true);

drop policy if exists "enquiries_insert" on public.enquiries;
create policy "enquiries_insert" on public.enquiries for insert with check (true);

drop policy if exists "enquiries_read" on public.enquiries;
create policy "enquiries_read" on public.enquiries for select using (true);

drop policy if exists "orders_insert" on public.orders;
create policy "orders_insert" on public.orders for insert with check (true);

drop policy if exists "orders_read" on public.orders;
create policy "orders_read" on public.orders for select using (true);

drop policy if exists "order_items_insert" on public.order_items;
create policy "order_items_insert" on public.order_items for insert with check (true);

drop policy if exists "order_items_read" on public.order_items;
create policy "order_items_read" on public.order_items for select using (true);

create table if not exists public.visits (
  id text primary key,
  kind text not null default 'page',
  path text,
  title text,
  referrer text,
  city text,
  region text,
  country text,
  tz text,
  lang text,
  screen text,
  device text,
  created_at timestamptz not null default now()
);

alter table public.visits add column if not exists screen text;
alter table public.visits add column if not exists device text;

alter table public.visits enable row level security;
drop policy if exists "visits_insert" on public.visits;
create policy "visits_insert" on public.visits for insert with check (true);
drop policy if exists "visits_read" on public.visits;
create policy "visits_read" on public.visits for select using (true);

alter table public.products add column if not exists packs jsonb not null default '[]'::jsonb;
alter table public.enquiries add column if not exists status text not null default 'Pending';

create table if not exists public.error_logs (
  id text primary key,
  level text not null default 'error',
  source text,
  message text,
  stack text,
  path text,
  status int,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id text primary key,
  actor text,
  action text,
  entity text,
  entity_id text,
  detail text,
  before_json text,
  after_json text,
  changes text,
  created_at timestamptz not null default now()
);

alter table public.audit_logs add column if not exists before_json text;
alter table public.audit_logs add column if not exists after_json text;
alter table public.audit_logs add column if not exists changes text;

alter table public.error_logs enable row level security;
alter table public.audit_logs enable row level security;
drop policy if exists "error_logs_all" on public.error_logs;
create policy "error_logs_all" on public.error_logs for all using (true) with check (true);
drop policy if exists "audit_logs_all" on public.audit_logs;
create policy "audit_logs_all" on public.audit_logs for all using (true) with check (true);

create table if not exists public.notification_config (
  id text primary key,
  admin_email text,
  email_enabled boolean not null default true,
  push_enabled boolean not null default true,
  ntfy_topic text not null default 'bhr-traders',
  ntfy_url text not null default 'https://ntfy.sh',
  inbox_cleared_at bigint not null default 0
);

alter table public.notification_config add column if not exists inbox_cleared_at bigint not null default 0;
alter table public.notification_config add column if not exists pending_alert_at bigint not null default 0;
alter table public.notification_config add column if not exists enquiry_alert_at bigint not null default 0;

insert into public.notification_config (id, admin_email, email_enabled, push_enabled, ntfy_topic, ntfy_url)
values ('default', 'info@bhrtraders.com', true, true, 'bhr-traders', 'https://ntfy.sh')
on conflict (id) do nothing;

create table if not exists public.notification_logs (
  id text primary key,
  channel text,
  audience text,
  event text,
  title text,
  body text,
  to_addr text,
  status text,
  error text,
  href text,
  entity text,
  entity_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_inbox (
  id text primary key,
  title text,
  body text,
  href text,
  entity text,
  entity_id text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notification_config enable row level security;
alter table public.notification_logs enable row level security;
alter table public.admin_inbox enable row level security;
drop policy if exists "notification_config_all" on public.notification_config;
create policy "notification_config_all" on public.notification_config for all using (true) with check (true);
drop policy if exists "notification_logs_all" on public.notification_logs;
create policy "notification_logs_all" on public.notification_logs for all using (true) with check (true);
drop policy if exists "admin_inbox_all" on public.admin_inbox;
create policy "admin_inbox_all" on public.admin_inbox for all using (true) with check (true);

create table if not exists public.product_reviews (
  id text primary key,
  product_id text not null,
  product_title text,
  name text not null,
  city text,
  phone text,
  order_id text,
  rating int not null,
  comment text not null,
  created_at timestamptz not null default now()
);

alter table public.product_reviews add column if not exists phone text;
alter table public.product_reviews add column if not exists order_id text;

alter table public.product_reviews enable row level security;
drop policy if exists "product_reviews_read" on public.product_reviews;
create policy "product_reviews_read" on public.product_reviews for select using (true);
drop policy if exists "product_reviews_insert" on public.product_reviews;
create policy "product_reviews_insert" on public.product_reviews for insert with check (true);
drop policy if exists "product_reviews_all" on public.product_reviews;
create policy "product_reviews_all" on public.product_reviews for all using (true) with check (true);

create table if not exists public.report_schedules (
  id text primary key,
  enabled boolean not null default false,
  kind text not null default 'overall',
  category text,
  hour int not null default 9,
  minute int not null default 0,
  frequency text not null default 'daily',
  email text,
  last_run_key text,
  last_attempt_key text,
  last_sent_at timestamptz,
  last_error text
);

insert into public.report_schedules (id, enabled, kind, hour, minute, frequency)
values ('default', false, 'overall', 9, 0, 'daily')
on conflict (id) do nothing;

alter table public.orders add column if not exists notes text;
alter table public.orders add column if not exists payment_proof text;
alter table public.orders add column if not exists cancel_remark text;
alter table public.orders add column if not exists status_note text;

alter table public.report_schedules enable row level security;
drop policy if exists "report_schedules_all" on public.report_schedules;
create policy "report_schedules_all" on public.report_schedules for all using (true) with check (true);

create table if not exists public.backup_schedules (
  id text primary key,
  enabled boolean not null default false,
  email_enabled boolean not null default true,
  email text,
  cron text not null default '0 2 * * *',
  last_run_key text,
  last_attempt_key text,
  last_sent_at timestamptz,
  last_error text
);

alter table public.backup_schedules add column if not exists email_override boolean not null default false;

insert into public.backup_schedules (id, enabled, email_enabled, email, cron)
values ('default', false, true, 'info@bhrtraders.com', '0 2 * * *')
on conflict (id) do nothing;

alter table public.backup_schedules enable row level security;
drop policy if exists "backup_schedules_all" on public.backup_schedules;
create policy "backup_schedules_all" on public.backup_schedules for all using (true) with check (true);

create table if not exists public.scheduler_state (
  id text primary key,
  enabled boolean not null default true,
  tick_interval_minutes int not null default 30,
  last_tick_at timestamptz,
  last_reminder_at timestamptz,
  updated_at timestamptz not null default now()
);

insert into public.scheduler_state (id, enabled, tick_interval_minutes)
values ('default', true, 30)
on conflict (id) do nothing;

alter table public.scheduler_state enable row level security;
drop policy if exists "scheduler_state_all" on public.scheduler_state;
create policy "scheduler_state_all" on public.scheduler_state for all using (true) with check (true);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text,
  name text,
  phone text,
  address text,
  city text,
  pincode text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.customers add column if not exists password_hash text;
alter table public.customers add column if not exists failed_login_attempts int not null default 0;
alter table public.customers add column if not exists locked_at timestamptz;
alter table public.customers add column if not exists lock_reason text;
alter table public.customers add column if not exists unlock_requested_at timestamptz;

create table if not exists public.email_otps (
  email text primary key,
  code text not null,
  expires_at timestamptz not null,
  attempts int not null default 0,
  send_count int not null default 1,
  created_at timestamptz not null default now()
);

alter table public.orders add column if not exists customer_id uuid references public.customers(id);
alter table public.product_reviews add column if not exists customer_id uuid references public.customers(id);

create index if not exists orders_customer_id_idx on public.orders (customer_id);
create index if not exists orders_email_idx on public.orders (lower(email));

alter table public.email_otps add column if not exists send_count int not null default 1;

alter table public.customers enable row level security;
alter table public.email_otps enable row level security;
drop policy if exists "customers_service" on public.customers;
create policy "customers_service" on public.customers for all using (true) with check (true);
drop policy if exists "email_otps_service" on public.email_otps;
create policy "email_otps_service" on public.email_otps for all using (true) with check (true);

create table if not exists public.app_devices (
  id text primary key,
  platform text,
  model text,
  os_version text,
  app_version text,
  push_token text,
  customer_id uuid references public.customers(id),
  ua text,
  screen text,
  device text,
  battery numeric,
  network text,
  app_state text,
  status text not null default 'Active',
  last_heartbeat_at timestamptz,
  last_lat numeric,
  last_lng numeric,
  last_location_accuracy numeric,
  last_city text,
  last_region text,
  last_country text,
  last_location_at timestamptz,
  registered_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_locations (
  id text primary key,
  device_id text not null references public.app_devices(id) on delete cascade,
  lat numeric not null,
  lng numeric not null,
  accuracy numeric,
  city text,
  region text,
  country text,
  created_at timestamptz not null default now()
);

alter table public.app_devices add column if not exists status text not null default 'Active';

create index if not exists app_locations_device_id_idx on public.app_locations (device_id, created_at desc);
create index if not exists app_devices_last_heartbeat_idx on public.app_devices (last_heartbeat_at desc);

alter table public.app_devices enable row level security;
alter table public.app_locations enable row level security;
drop policy if exists "app_devices_all" on public.app_devices;
create policy "app_devices_all" on public.app_devices for all using (true) with check (true);
drop policy if exists "app_locations_all" on public.app_locations;
create policy "app_locations_all" on public.app_locations for all using (true) with check (true);

