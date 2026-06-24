begin;

create table if not exists public.coach_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null default 'practical',
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.coach_sessions enable row level security;

drop policy if exists "Users can view own coach sessions" on public.coach_sessions;
create policy "Users can view own coach sessions"
  on public.coach_sessions
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create own coach sessions" on public.coach_sessions;
create policy "Users can create own coach sessions"
  on public.coach_sessions
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own coach sessions" on public.coach_sessions;
create policy "Users can update own coach sessions"
  on public.coach_sessions
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own coach sessions" on public.coach_sessions;
create policy "Users can delete own coach sessions"
  on public.coach_sessions
  for delete
  using (auth.uid() = user_id);

alter table public.coach_messages
  add column if not exists session_id uuid references public.coach_sessions(id) on delete cascade;

create index if not exists coach_messages_session_created_at_idx
  on public.coach_messages (session_id, created_at);

create index if not exists coach_sessions_user_updated_at_idx
  on public.coach_sessions (user_id, updated_at desc);

with legacy_users as (
  select distinct user_id
  from public.coach_messages
  where session_id is null
),
inserted_sessions as (
  insert into public.coach_sessions (user_id, mode, title)
  select
    legacy_users.user_id,
    'practical',
    'Earlier Coach conversations'
  from legacy_users
  returning id, user_id
)
update public.coach_messages as messages
set session_id = inserted_sessions.id
from inserted_sessions
where messages.user_id = inserted_sessions.user_id
  and messages.session_id is null;

update public.coach_sessions as sessions
set
  created_at = message_bounds.first_message_at,
  updated_at = message_bounds.last_message_at,
  title = coalesce(
    sessions.title,
    case
      when message_bounds.first_user_content is not null and length(trim(message_bounds.first_user_content)) > 0
        then left(trim(message_bounds.first_user_content), 80)
      else 'Coach conversation'
    end
  )
from (
  select
    messages.session_id,
    min(messages.created_at) as first_message_at,
    max(messages.created_at) as last_message_at,
    (
      select content
      from public.coach_messages inner_messages
      where inner_messages.session_id = messages.session_id
        and inner_messages.role = 'user'
      order by inner_messages.created_at asc
      limit 1
    ) as first_user_content
  from public.coach_messages messages
  where messages.session_id is not null
  group by messages.session_id
) as message_bounds
where sessions.id = message_bounds.session_id;

notify pgrst, 'reload schema';

commit;
