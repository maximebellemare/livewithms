alter table public.community_posts
  add column if not exists display_name text,
  add column if not exists avatar_url text,
  add column if not exists reaction_count integer not null default 0,
  add column if not exists reply_count integer not null default 0,
  add column if not exists report_count integer not null default 0;

alter table public.community_posts enable row level security;
alter table public.community_reactions enable row level security;

drop policy if exists "community_posts_update_own" on public.community_posts;
drop policy if exists "community_posts_delete_own" on public.community_posts;
drop policy if exists "Update own community posts" on public.community_posts;
drop policy if exists "Delete own community posts" on public.community_posts;

create policy "Update own community posts"
on public.community_posts
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Delete own community posts"
on public.community_posts
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "community_reactions_select_all" on public.community_reactions;
drop policy if exists "community_reactions_insert_own" on public.community_reactions;
drop policy if exists "community_reactions_delete_own" on public.community_reactions;
drop policy if exists "Read reactions" on public.community_reactions;
drop policy if exists "Create own reactions" on public.community_reactions;
drop policy if exists "Delete own reactions" on public.community_reactions;

create policy "Read reactions"
on public.community_reactions
for select
to authenticated
using (true);

create policy "Create own reactions"
on public.community_reactions
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Delete own reactions"
on public.community_reactions
for delete
to authenticated
using (auth.uid() = user_id);

notify pgrst, 'reload schema';
