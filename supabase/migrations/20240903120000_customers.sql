-- Customer accounts (email + password login)

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

create table if not exists public.email_otps (
  email text primary key,
  code text not null,
  expires_at timestamptz not null,
  attempts int not null default 0,
  send_count int not null default 1,
  created_at timestamptz not null default now()
);

alter table public.customers add column if not exists password_hash text;

alter table public.orders add column if not exists customer_id uuid references public.customers(id);
alter table public.product_reviews add column if not exists customer_id uuid references public.customers(id);

create index if not exists orders_customer_id_idx on public.orders (customer_id);
create index if not exists orders_email_idx on public.orders (lower(email));

alter table public.customers enable row level security;
alter table public.email_otps enable row level security;

drop policy if exists "customers_service" on public.customers;
create policy "customers_service" on public.customers for all using (true) with check (true);

drop policy if exists "email_otps_service" on public.email_otps;
create policy "email_otps_service" on public.email_otps for all using (true) with check (true);
