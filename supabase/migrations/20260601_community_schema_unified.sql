create extension if not exists pgcrypto;

create or replace function public.community_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  parent_id uuid references public.community_posts(id) on delete cascade,
  category text not null,
  post_type text not null default 'question',
  title text,
  body text not null,
  display_name text,
  avatar_url text,
  is_hidden boolean not null default false,
  report_count integer not null default 0,
  reaction_count integer not null default 0,
  reply_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_posts_category_check check (
    category in (
      'symptoms-daily-life',
      'treatments-medications',
      'work-productivity',
      'mental-emotional-health',
      'exercise-wellness',
      'community-support',
      'app_suggestions'
    )
  ),
  constraint community_posts_post_type_check check (
    post_type in (
      'question',
      'experience',
      'practical_tip',
      'feature_idea',
      'bug_report',
      'improvement',
      'general_feedback'
    )
  ),
  constraint community_posts_thread_title_check check (
    parent_id is not null
    or (title is not null and length(btrim(title)) > 0)
  ),
  constraint community_posts_nonnegative_counts_check check (
    report_count >= 0 and reaction_count >= 0
  )
);

alter table public.community_posts
  add column if not exists parent_id uuid references public.community_posts(id) on delete cascade,
  add column if not exists title text,
  add column if not exists display_name text,
  add column if not exists avatar_url text,
  add column if not exists report_count integer not null default 0,
  add column if not exists reaction_count integer not null default 0,
  add column if not exists reply_count integer not null default 0;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'community_posts_category_check'
  ) then
    alter table public.community_posts
      add constraint community_posts_category_check check (
        category in (
          'symptoms-daily-life',
          'treatments-medications',
          'work-productivity',
          'mental-emotional-health',
          'exercise-wellness',
          'community-support',
          'app_suggestions'
        )
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'community_posts_post_type_check'
  ) then
    alter table public.community_posts
      add constraint community_posts_post_type_check check (
        post_type in (
          'question',
          'experience',
          'practical_tip',
          'feature_idea',
          'bug_report',
          'improvement',
          'general_feedback'
        )
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'community_posts_thread_title_check'
  ) then
    alter table public.community_posts
      add constraint community_posts_thread_title_check check (
        parent_id is not null
        or (title is not null and length(btrim(title)) > 0)
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'community_posts_nonnegative_counts_check'
  ) then
    alter table public.community_posts
      add constraint community_posts_nonnegative_counts_check check (
        report_count >= 0 and reaction_count >= 0 and reply_count >= 0
      );
  end if;
end $$;

create table if not exists public.community_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reaction text not null,
  created_at timestamptz not null default now(),
  constraint community_reactions_reaction_check check (
    reaction in ('heart', 'helpful', 'support', 'thanks')
  )
);

alter table public.community_reactions
  add column if not exists reaction text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'community_reactions_reaction_check'
  ) then
    alter table public.community_reactions
      add constraint community_reactions_reaction_check check (
        reaction in ('heart', 'helpful', 'support', 'thanks')
      );
  end if;
end $$;

create table if not exists public.community_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.community_posts(id) on delete cascade,
  reported_user_id uuid references auth.users(id) on delete cascade,
  reporter_user_id uuid not null references auth.users(id) on delete cascade,
  reason text not null,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.community_reports
  add column if not exists reported_user_id uuid references auth.users(id) on delete cascade,
  add column if not exists reporter_user_id uuid references auth.users(id) on delete cascade,
  add column if not exists notes text;

create table if not exists public.community_blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_user_id uuid not null references auth.users(id) on delete cascade,
  blocked_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint community_blocks_no_self_block check (blocker_user_id <> blocked_user_id),
  unique (blocker_user_id, blocked_user_id)
);

alter table public.community_blocks
  add column if not exists blocker_user_id uuid references auth.users(id) on delete cascade;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'community_reactions'
      and column_name = 'reaction_type'
  ) then
    execute '
      update public.community_reactions
      set reaction = reaction_type
      where reaction is null
    ';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'community_reports'
      and column_name = 'reporter_id'
  ) then
    execute '
      update public.community_reports
      set reporter_user_id = reporter_id
      where reporter_user_id is null
    ';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'community_blocks'
      and column_name = 'blocker_id'
  ) then
    execute '
      update public.community_blocks
      set blocker_user_id = blocker_id
      where blocker_user_id is null
    ';
  end if;
end $$;

create unique index if not exists community_reactions_unique_post_user
  on public.community_reactions (post_id, user_id);

create index if not exists community_posts_category_created_idx
  on public.community_posts (category, created_at desc);

create index if not exists community_posts_parent_created_idx
  on public.community_posts (parent_id, created_at asc);

create index if not exists community_reactions_post_id_idx
  on public.community_reactions (post_id);

create index if not exists community_blocks_blocker_user_id_idx
  on public.community_blocks (blocker_user_id);

create unique index if not exists community_blocks_unique_blocker_blocked
  on public.community_blocks (blocker_user_id, blocked_user_id);

create unique index if not exists community_reports_unique_reporter_post
  on public.community_reports (reporter_user_id, post_id)
  where post_id is not null;

alter table public.community_posts enable row level security;
alter table public.community_reactions enable row level security;
alter table public.community_reports enable row level security;
alter table public.community_blocks enable row level security;

drop policy if exists "community_posts_select_visible" on public.community_posts;
create policy "community_posts_select_visible"
  on public.community_posts for select
  to authenticated
  using (is_hidden = false);

drop policy if exists "community_posts_insert_own" on public.community_posts;
create policy "community_posts_insert_own"
  on public.community_posts for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "community_posts_update_own" on public.community_posts;
create policy "community_posts_update_own"
  on public.community_posts for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "community_posts_delete_own" on public.community_posts;
create policy "community_posts_delete_own"
  on public.community_posts for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "community_reactions_select_all" on public.community_reactions;
create policy "community_reactions_select_all"
  on public.community_reactions for select
  to authenticated
  using (true);

drop policy if exists "community_reactions_insert_own" on public.community_reactions;
create policy "community_reactions_insert_own"
  on public.community_reactions for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "community_reactions_delete_own" on public.community_reactions;
create policy "community_reactions_delete_own"
  on public.community_reactions for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "community_reports_insert_own" on public.community_reports;
create policy "community_reports_insert_own"
  on public.community_reports for insert
  to authenticated
  with check (auth.uid() = reporter_user_id);

drop policy if exists "community_blocks_select_own" on public.community_blocks;
create policy "community_blocks_select_own"
  on public.community_blocks for select
  to authenticated
  using (auth.uid() = blocker_user_id);

drop policy if exists "community_blocks_insert_own" on public.community_blocks;
create policy "community_blocks_insert_own"
  on public.community_blocks for insert
  to authenticated
  with check (auth.uid() = blocker_user_id);

drop policy if exists "community_blocks_delete_own" on public.community_blocks;
create policy "community_blocks_delete_own"
  on public.community_blocks for delete
  to authenticated
  using (auth.uid() = blocker_user_id);

drop trigger if exists trg_community_posts_updated_at on public.community_posts;
create trigger trg_community_posts_updated_at
  before update on public.community_posts
  for each row execute function public.community_set_updated_at();

create or replace function public.community_sync_post_reaction_count()
returns trigger
language plpgsql
as $$
declare
  target_post_id uuid;
begin
  target_post_id := coalesce(new.post_id, old.post_id);
  if target_post_id is not null then
    update public.community_posts
    set reaction_count = (
      select count(*)
      from public.community_reactions
      where post_id = target_post_id
    )
    where id = target_post_id;
  end if;
  return coalesce(new, old);
end;
$$;

create or replace function public.community_sync_reply_count()
returns trigger
language plpgsql
as $$
declare
  target_post_id uuid;
begin
  target_post_id := coalesce(new.parent_id, old.parent_id);
  if target_post_id is not null then
    update public.community_posts
    set reply_count = (
      select count(*)
      from public.community_posts
      where parent_id = target_post_id
        and is_hidden = false
    )
    where id = target_post_id;
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_community_reply_count_ins on public.community_posts;
create trigger trg_community_reply_count_ins
  after insert on public.community_posts
  for each row execute function public.community_sync_reply_count();

drop trigger if exists trg_community_reply_count_del on public.community_posts;
create trigger trg_community_reply_count_del
  after delete on public.community_posts
  for each row execute function public.community_sync_reply_count();

with seed_author as (
  select id
  from auth.users
  order by created_at asc
  limit 1
)
insert into public.community_posts (
  id,
  user_id,
  parent_id,
  category,
  post_type,
  title,
  body,
  display_name,
  is_hidden,
  created_at,
  updated_at
)
select
  seed.id,
  seed_author.id,
  seed.parent_id,
  seed.category,
  seed.post_type,
  seed.title,
  seed.body,
  seed.display_name,
  seed.is_hidden,
  seed.created_at,
  seed.updated_at
from seed_author
cross join (
  values
    (
      '10000000-0000-4000-8000-000000000001'::uuid,
      null::uuid,
      'work-productivity',
      'question',
      'How do you manage brain fog during workdays?',
      'I’m looking for practical ways to get through work tasks when focus drops. What helps you reduce mental load without making the day more complicated?',
      'Community member',
      false,
      '2026-05-24T13:00:00Z'::timestamptz,
      '2026-05-24T13:00:00Z'::timestamptz
    ),
    (
      '10000000-0000-4000-8000-000000000002'::uuid,
      null::uuid,
      'symptoms-daily-life',
      'question',
      'What helps your fatigue the most?',
      'Not looking for a cure, just practical things that make fatigue easier to manage day to day. What has been worth keeping in your routine?',
      'Community member',
      false,
      '2026-05-23T18:25:00Z'::timestamptz,
      '2026-05-23T18:25:00Z'::timestamptz
    ),
    (
      '10000000-0000-4000-8000-000000000003'::uuid,
      null::uuid,
      'treatments-medications',
      'question',
      'How do you prepare for appointments?',
      'I forget things once I’m in the room. What do you bring or write down ahead of time so the appointment is easier to use well?',
      'Community member',
      false,
      '2026-05-22T15:10:00Z'::timestamptz,
      '2026-05-22T15:10:00Z'::timestamptz
    ),
    (
      '10000000-0000-4000-8000-000000000004'::uuid,
      null::uuid,
      'mental-emotional-health',
      'experience',
      'Anyone else feel overstimulated easily?',
      'Busy spaces, noise, and multiple conversations can make symptoms feel harder to manage. What helps you lower stimulation before it builds too much?',
      'Community member',
      false,
      '2026-05-21T20:15:00Z'::timestamptz,
      '2026-05-21T20:15:00Z'::timestamptz
    ),
    (
      '10000000-0000-4000-8000-000000000005'::uuid,
      null::uuid,
      'symptoms-daily-life',
      'practical_tip',
      'Small heat-sensitivity strategies that actually help',
      'Warm days can change what feels possible. What practical adjustments help you keep plans realistic when heat is a factor?',
      'Community member',
      false,
      '2026-05-20T12:40:00Z'::timestamptz,
      '2026-05-20T12:40:00Z'::timestamptz
    ),
    (
      '10000000-0000-4000-8000-000000000006'::uuid,
      null::uuid,
      'exercise-wellness',
      'question',
      'Movement ideas for lower-energy days',
      'What kinds of movement still feel manageable when energy is limited? I’m interested in low-pressure options that do not turn into a full routine.',
      'Community member',
      false,
      '2026-05-19T16:30:00Z'::timestamptz,
      '2026-05-19T16:30:00Z'::timestamptz
    ),
    (
      '10000000-0000-4000-8000-000000000007'::uuid,
      null::uuid,
      'community-support',
      'question',
      'What would have helped you early on?',
      'For people farther along: what practical information or routines would have helped in the first months after diagnosis?',
      'Community member',
      false,
      '2026-05-18T14:45:00Z'::timestamptz,
      '2026-05-18T14:45:00Z'::timestamptz
    ),
    (
      '10000000-0000-4000-8000-000000000008'::uuid,
      null::uuid,
      'treatments-medications',
      'question',
      'Tracking side effects without overthinking it',
      'How do you keep track of possible medication side effects in a way that is useful for appointments but not stressful every day?',
      'Community member',
      false,
      '2026-05-17T11:20:00Z'::timestamptz,
      '2026-05-17T11:20:00Z'::timestamptz
    ),
    (
      '10000000-0000-4000-8000-000000000009'::uuid,
      null::uuid,
      'app_suggestions',
      'feature_idea',
      'What feature would help you most?',
      'If LiveWithMS could make one part of daily tracking, planning, or care organization easier, what would be most useful?',
      'Community member',
      false,
      '2026-05-24T10:15:00Z'::timestamptz,
      '2026-05-24T10:15:00Z'::timestamptz
    ),
    (
      '10000000-0000-4000-8000-000000000010'::uuid,
      null::uuid,
      'app_suggestions',
      'improvement',
      'What should we improve next?',
      'Which part of the app would feel more useful with a clearer flow, better wording, or less friction?',
      'Community member',
      false,
      '2026-05-23T09:30:00Z'::timestamptz,
      '2026-05-23T09:30:00Z'::timestamptz
    ),
    (
      '10000000-0000-4000-8000-000000000011'::uuid,
      null::uuid,
      'app_suggestions',
      'general_feedback',
      'What feels confusing in the app?',
      'If anything takes extra effort to understand, this is a good place to name it. Short, specific examples are helpful.',
      'Community member',
      false,
      '2026-05-22T08:50:00Z'::timestamptz,
      '2026-05-22T08:50:00Z'::timestamptz
    ),
    (
      '10000000-0000-4000-8000-000000000012'::uuid,
      null::uuid,
      'app_suggestions',
      'feature_idea',
      'What would make tracking easier?',
      'What would reduce the effort of checking in, noticing patterns, or bringing useful notes to appointments?',
      'Community member',
      false,
      '2026-05-21T12:05:00Z'::timestamptz,
      '2026-05-21T12:05:00Z'::timestamptz
    )
) as seed(id, parent_id, category, post_type, title, body, display_name, is_hidden, created_at, updated_at)
on conflict (id) do update
set
  category = excluded.category,
  post_type = excluded.post_type,
  title = excluded.title,
  body = excluded.body,
  display_name = excluded.display_name,
  is_hidden = excluded.is_hidden,
  updated_at = excluded.updated_at;

drop trigger if exists trg_community_reaction_count_ins on public.community_reactions;
create trigger trg_community_reaction_count_ins
  after insert on public.community_reactions
  for each row execute function public.community_sync_post_reaction_count();

drop trigger if exists trg_community_reaction_count_del on public.community_reactions;
create trigger trg_community_reaction_count_del
  after delete on public.community_reactions
  for each row execute function public.community_sync_post_reaction_count();

create or replace function public.community_sync_post_report_count()
returns trigger
language plpgsql
as $$
declare
  target_post_id uuid;
begin
  target_post_id := coalesce(new.post_id, old.post_id);
  if target_post_id is not null then
    update public.community_posts
    set report_count = (
      select count(*)
      from public.community_reports
      where post_id = target_post_id
    )
    where id = target_post_id;
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_community_report_count_ins on public.community_reports;
create trigger trg_community_report_count_ins
  after insert on public.community_reports
  for each row execute function public.community_sync_post_report_count();

drop trigger if exists trg_community_report_count_del on public.community_reports;
create trigger trg_community_report_count_del
  after delete on public.community_reports
  for each row execute function public.community_sync_post_report_count();

notify pgrst, 'reload schema';
