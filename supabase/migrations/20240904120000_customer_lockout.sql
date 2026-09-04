-- Lock customer accounts after repeated failed login attempts

alter table public.customers add column if not exists failed_login_attempts int not null default 0;
alter table public.customers add column if not exists locked_at timestamptz;
alter table public.customers add column if not exists lock_reason text;
alter table public.customers add column if not exists unlock_requested_at timestamptz;
