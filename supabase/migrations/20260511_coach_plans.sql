begin;

create extension if not exists pgcrypto;

create table if not exists public.coach_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  priority text,
  avoid text,
  support_action text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

alter table public.coach_plans enable row level security;

drop policy if exists "Users can read own coach plans" on public.coach_plans;
create policy "Users can read own coach plans"
on public.coach_plans
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own coach plans" on public.coach_plans;
create policy "Users can insert own coach plans"
on public.coach_plans
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own coach plans" on public.coach_plans;
create policy "Users can update own coach plans"
on public.coach_plans
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own coach plans" on public.coach_plans;
create policy "Users can delete own coach plans"
on public.coach_plans
for delete
to authenticated
using (auth.uid() = user_id);

drop trigger if exists update_coach_plans_updated_at on public.coach_plans;
create trigger update_coach_plans_updated_at
before update on public.coach_plans
for each row
execute function public.update_updated_at_column();

commit;
