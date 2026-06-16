begin;

create table if not exists public.user_push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  expo_push_token text not null,
  platform text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, expo_push_token)
);

create table if not exists public.community_notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid not null references auth.users(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  type text not null,
  post_id uuid references public.community_posts(id) on delete cascade,
  thread_id uuid references public.community_posts(id) on delete cascade,
  reaction text,
  title text,
  body text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'community_notifications_type_check'
  ) then
    alter table public.community_notifications
      add constraint community_notifications_type_check
      check (type in ('reply_to_thread', 'reaction_to_post', 'reaction_to_reply'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'community_notifications_reaction_check'
  ) then
    alter table public.community_notifications
      add constraint community_notifications_reaction_check
      check (reaction is null or reaction in ('heart', 'helpful', 'support', 'thanks'));
  end if;
end $$;

alter table public.user_push_tokens enable row level security;
alter table public.community_notifications enable row level security;

drop policy if exists "Users can view own push tokens" on public.user_push_tokens;
create policy "Users can view own push tokens"
on public.user_push_tokens
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create own push tokens" on public.user_push_tokens;
create policy "Users can create own push tokens"
on public.user_push_tokens
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own push tokens" on public.user_push_tokens;
create policy "Users can update own push tokens"
on public.user_push_tokens
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own push tokens" on public.user_push_tokens;
create policy "Users can delete own push tokens"
on public.user_push_tokens
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can view own community notifications" on public.community_notifications;
create policy "Users can view own community notifications"
on public.community_notifications
for select
to authenticated
using (auth.uid() = recipient_user_id);

drop policy if exists "Users can create community notifications" on public.community_notifications;
create policy "Users can create community notifications"
on public.community_notifications
for insert
to authenticated
with check (auth.uid() = actor_user_id);

drop policy if exists "Users can update own community notifications" on public.community_notifications;
create policy "Users can update own community notifications"
on public.community_notifications
for update
to authenticated
using (auth.uid() = recipient_user_id)
with check (auth.uid() = recipient_user_id);

create index if not exists community_notifications_recipient_created_idx
  on public.community_notifications (recipient_user_id, created_at desc);

create index if not exists community_notifications_thread_idx
  on public.community_notifications (thread_id, created_at desc);

create index if not exists user_push_tokens_user_active_idx
  on public.user_push_tokens (user_id, is_active);

drop trigger if exists update_user_push_tokens_updated_at on public.user_push_tokens;

create trigger update_user_push_tokens_updated_at
before update on public.user_push_tokens
for each row execute function public.update_updated_at_column();

notify pgrst, 'reload schema';

commit;
