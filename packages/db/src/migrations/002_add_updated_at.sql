-- Add updated_at to venues for stale-score detection
alter table public.venues
  add column if not exists updated_at timestamptz not null default now();

-- Trigger to keep updated_at current on every row update
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists venues_set_updated_at on public.venues;
create trigger venues_set_updated_at
  before update on public.venues
  for each row execute procedure public.set_updated_at();

-- Back-fill existing rows so last_verified_at-based stale logic is consistent
update public.venues set updated_at = coalesce(last_verified_at, created_at) where updated_at = now();
