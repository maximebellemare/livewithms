begin;

create extension if not exists pgcrypto;

create table if not exists public.care_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  body text not null,
  category text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.care_notes add column if not exists title text;
alter table public.care_notes add column if not exists body text;
alter table public.care_notes add column if not exists category text;
alter table public.care_notes drop constraint if exists care_notes_user_id_key;

update public.care_notes
set body = coalesce(body, content)
where body is null;

alter table public.care_notes alter column body set not null;

alter table public.care_notes enable row level security;

drop policy if exists "Users can read own care notes" on public.care_notes;
create policy "Users can read own care notes"
on public.care_notes
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own care notes" on public.care_notes;
create policy "Users can insert own care notes"
on public.care_notes
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own care notes" on public.care_notes;
create policy "Users can update own care notes"
on public.care_notes
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own care notes" on public.care_notes;
create policy "Users can delete own care notes"
on public.care_notes
for delete
to authenticated
using (auth.uid() = user_id);

drop trigger if exists update_care_notes_updated_at on public.care_notes;
create trigger update_care_notes_updated_at
before update on public.care_notes
for each row
execute function public.update_updated_at_column();

commit;
