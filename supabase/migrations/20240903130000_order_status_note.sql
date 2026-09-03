-- Optional admin note shown to customer on order tracking (e.g. expected delivery time)
alter table public.orders add column if not exists status_note text;
