begin;

create table if not exists public.daily_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  checkin_date date not null,
  mood integer,
  energy integer,
  pain integer,
  fatigue integer,
  mobility integer,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, checkin_date)
);

drop trigger if exists update_daily_checkins_updated_at on public.daily_checkins;

create trigger update_daily_checkins_updated_at
before update on public.daily_checkins
for each row
execute function public.update_updated_at_column();

alter table public.daily_checkins enable row level security;

drop policy if exists "Users can read own checkins" on public.daily_checkins;
create policy "Users can read own checkins"
on public.daily_checkins
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own checkins" on public.daily_checkins;
create policy "Users can insert own checkins"
on public.daily_checkins
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own checkins" on public.daily_checkins;
create policy "Users can update own checkins"
on public.daily_checkins
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

commit;
