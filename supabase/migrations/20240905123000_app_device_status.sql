alter table public.app_devices add column if not exists status text not null default 'Active';

notify pgrst, 'reload schema';
