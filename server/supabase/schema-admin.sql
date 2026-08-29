create table if not exists public.categories (
  id text primary key,
  name text not null,
  slug text,
  sort int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.pack_sizes (
  id text primary key,
  size text not null,
  best_for text,
  typical_use text,
  buying_tip text,
  sort int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;
alter table public.pack_sizes enable row level security;

drop policy if exists "categories_read" on public.categories;
create policy "categories_read" on public.categories for select using (true);
drop policy if exists "categories_write" on public.categories;
create policy "categories_write" on public.categories for insert with check (true);
drop policy if exists "categories_update" on public.categories;
create policy "categories_update" on public.categories for update using (true);
drop policy if exists "categories_delete" on public.categories;
create policy "categories_delete" on public.categories for delete using (true);

drop policy if exists "products_delete" on public.products;
create policy "products_delete" on public.products for delete using (true);

drop policy if exists "packs_read" on public.pack_sizes;
create policy "packs_read" on public.pack_sizes for select using (true);
drop policy if exists "packs_write" on public.pack_sizes;
create policy "packs_write" on public.pack_sizes for insert with check (true);
drop policy if exists "packs_update" on public.pack_sizes;
create policy "packs_update" on public.pack_sizes for update using (true);
drop policy if exists "packs_delete" on public.pack_sizes;
create policy "packs_delete" on public.pack_sizes for delete using (true);
