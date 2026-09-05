-- Mobile / webview app device tracking

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

create index if not exists app_locations_device_id_idx on public.app_locations (device_id, created_at desc);
create index if not exists app_devices_last_heartbeat_idx on public.app_devices (last_heartbeat_at desc);

alter table public.app_devices enable row level security;
alter table public.app_locations enable row level security;
drop policy if exists "app_devices_all" on public.app_devices;
create policy "app_devices_all" on public.app_devices for all using (true) with check (true);
drop policy if exists "app_locations_all" on public.app_locations;
create policy "app_locations_all" on public.app_locations for all using (true) with check (true);

notify pgrst, 'reload schema';
