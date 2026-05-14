begin;

create table if not exists public.coach_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.coach_messages
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists role text,
  add column if not exists content text,
  add column if not exists created_at timestamptz default now();

update public.coach_messages
set role = coalesce(role, 'user')
where role is null;

update public.coach_messages
set content = coalesce(content, '')
where content is null;

update public.coach_messages
set created_at = coalesce(created_at, now())
where created_at is null;

alter table public.coach_messages
  alter column user_id set not null,
  alter column role set not null,
  alter column content set not null,
  alter column created_at set not null;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'coach_messages'
      and column_name = 'session_id'
  ) then
    execute 'alter table public.coach_messages alter column session_id drop not null';
  end if;
end $$;

create index if not exists coach_messages_user_created_at_idx
  on public.coach_messages (user_id, created_at);

alter table public.coach_messages enable row level security;

drop policy if exists "Users can view own coach messages" on public.coach_messages;
create policy "Users can view own coach messages"
  on public.coach_messages
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create own coach messages" on public.coach_messages;
create policy "Users can create own coach messages"
  on public.coach_messages
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own coach messages" on public.coach_messages;
create policy "Users can delete own coach messages"
  on public.coach_messages
  for delete
  using (auth.uid() = user_id);

commit;
