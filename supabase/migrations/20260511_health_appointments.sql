begin;

create extension if not exists pgcrypto;

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  date date not null,
  time text,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.appointments
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists title text,
  add column if not exists date date,
  add column if not exists time text,
  add column if not exists notes text,
  add column if not exists created_at timestamptz default now();

alter table public.appointments
  alter column title set not null,
  alter column date set not null,
  alter column user_id set not null,
  alter column created_at set not null;

alter table public.appointments enable row level security;

drop policy if exists "Users can read own appointments" on public.appointments;
create policy "Users can read own appointments"
on public.appointments
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own appointments" on public.appointments;
create policy "Users can insert own appointments"
on public.appointments
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own appointments" on public.appointments;
create policy "Users can update own appointments"
on public.appointments
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own appointments" on public.appointments;
create policy "Users can delete own appointments"
on public.appointments
for delete
to authenticated
using (auth.uid() = user_id);

commit;
