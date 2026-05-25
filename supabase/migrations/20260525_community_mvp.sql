alter table public.community_posts
  alter column channel_id drop not null;

alter table public.community_posts
  add column if not exists category text not null default 'symptoms-daily-life',
  add column if not exists post_type text not null default 'question',
  add column if not exists report_count integer not null default 0;

alter table public.community_comments
  add column if not exists report_count integer not null default 0;

create table if not exists public.community_blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint community_blocks_no_self_block check (blocker_id <> blocked_user_id),
  unique (blocker_id, blocked_user_id)
);

create table if not exists public.community_reactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  post_id uuid references public.community_posts(id) on delete cascade,
  comment_id uuid references public.community_comments(id) on delete cascade,
  reaction_type text not null check (reaction_type in ('heart', 'thanks', 'idea', 'agree')),
  created_at timestamptz not null default now(),
  constraint community_reactions_single_target check (
    (post_id is not null and comment_id is null)
    or (post_id is null and comment_id is not null)
  )
);

alter table public.community_posts
  alter column category set default 'symptoms-daily-life';

update public.community_posts
set category = case category
  when 'ask-a-question' then 'community-support'
  when 'what-helped-me' then 'community-support'
  when 'appointments-care' then 'treatments-medications'
  when 'fatigue-pacing' then 'symptoms-daily-life'
  when 'brain-fog' then 'symptoms-daily-life'
  when 'daily-life' then 'symptoms-daily-life'
  else category
end;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'community_posts_category_check'
  ) then
    alter table public.community_posts
      add constraint community_posts_category_check
      check (
        category in (
          'symptoms-daily-life',
          'treatments-medications',
          'work-productivity',
          'mental-emotional-health',
          'exercise-wellness',
          'community-support'
        )
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'community_posts_post_type_check'
  ) then
    alter table public.community_posts
      add constraint community_posts_post_type_check
      check (post_type in ('question', 'experience', 'practical_tip'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'community_posts_report_count_check'
  ) then
    alter table public.community_posts
      add constraint community_posts_report_count_check
      check (report_count >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'community_comments_report_count_check'
  ) then
    alter table public.community_comments
      add constraint community_comments_report_count_check
      check (report_count >= 0);
  end if;
end $$;

create index if not exists community_posts_native_visible_created_idx
  on public.community_posts (is_hidden, created_at desc);

create index if not exists community_posts_native_category_created_idx
  on public.community_posts (category, is_hidden, created_at desc);

create index if not exists community_comments_native_post_created_idx
  on public.community_comments (post_id, is_hidden, created_at);

create unique index if not exists community_reports_unique_post_report
  on public.community_reports (reporter_id, post_id)
  where post_id is not null;

create unique index if not exists community_reports_unique_comment_report
  on public.community_reports (reporter_id, comment_id)
  where comment_id is not null;

create unique index if not exists community_reactions_unique_post
  on public.community_reactions (user_id, post_id)
  where post_id is not null;

create unique index if not exists community_reactions_unique_comment
  on public.community_reactions (user_id, comment_id)
  where comment_id is not null;

alter table public.community_blocks enable row level security;
alter table public.community_reactions enable row level security;

drop policy if exists "users can read own community blocks" on public.community_blocks;
create policy "users can read own community blocks"
  on public.community_blocks for select
  to authenticated
  using (blocker_id = auth.uid());

drop policy if exists "users can create own community blocks" on public.community_blocks;
create policy "users can create own community blocks"
  on public.community_blocks for insert
  to authenticated
  with check (blocker_id = auth.uid());

drop policy if exists "users can remove own community blocks" on public.community_blocks;
create policy "users can remove own community blocks"
  on public.community_blocks for delete
  to authenticated
  using (blocker_id = auth.uid());

drop policy if exists "users can read community reactions" on public.community_reactions;
create policy "users can read community reactions"
  on public.community_reactions for select
  to authenticated
  using (true);

drop policy if exists "users can create own community reactions" on public.community_reactions;
create policy "users can create own community reactions"
  on public.community_reactions for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "users can remove own community reactions" on public.community_reactions;
create policy "users can remove own community reactions"
  on public.community_reactions for delete
  to authenticated
  using (user_id = auth.uid());

create or replace function public.increment_community_report_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.post_id is not null then
    update public.community_posts
    set report_count = report_count + 1
    where id = new.post_id;
  end if;

  if new.comment_id is not null then
    update public.community_comments
    set report_count = report_count + 1
    where id = new.comment_id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_increment_community_report_count on public.community_reports;
create trigger trg_increment_community_report_count
  after insert on public.community_reports
  for each row execute function public.increment_community_report_count();

insert into public.community_posts (
  id,
  user_id,
  display_name,
  title,
  body,
  category,
  post_type,
  comments_count,
  created_at,
  updated_at
) values
  (
    '10000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    'Community member',
    'How do you manage brain fog during workdays?',
    'I’m looking for practical ways to get through work tasks when focus drops. What helps you reduce mental load without making the day more complicated?',
    'work-productivity',
    'question',
    3,
    '2026-05-24T13:00:00Z',
    '2026-05-24T13:00:00Z'
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000001',
    'Community member',
    'What helps your fatigue the most?',
    'Not looking for a cure, just practical things that make fatigue easier to manage day to day. What has been worth keeping in your routine?',
    'symptoms-daily-life',
    'question',
    3,
    '2026-05-23T18:25:00Z',
    '2026-05-23T18:25:00Z'
  ),
  (
    '10000000-0000-4000-8000-000000000003',
    '20000000-0000-4000-8000-000000000001',
    'Community member',
    'How do you prepare for appointments?',
    'I forget things once I’m in the room. What do you bring or write down ahead of time so the appointment is easier to use well?',
    'treatments-medications',
    'question',
    3,
    '2026-05-22T15:10:00Z',
    '2026-05-22T15:10:00Z'
  ),
  (
    '10000000-0000-4000-8000-000000000004',
    '20000000-0000-4000-8000-000000000001',
    'Community member',
    'Anyone else feel overstimulated easily?',
    'Busy spaces, noise, and multiple conversations can make symptoms feel harder to manage. What helps you lower stimulation before it builds too much?',
    'mental-emotional-health',
    'experience',
    2,
    '2026-05-21T20:15:00Z',
    '2026-05-21T20:15:00Z'
  )
on conflict (id) do nothing;

insert into public.community_comments (
  id,
  post_id,
  user_id,
  display_name,
  body,
  created_at
) values
  ('30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002', 'Community member', 'I write the next step on paper, not the whole task. It keeps me from rereading the same thing over and over.', '2026-05-24T14:00:00Z'),
  ('30000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000003', 'Community member', 'Reducing tabs helps me. One document, one note, one timer if I need it.', '2026-05-24T15:10:00Z'),
  ('30000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000004', 'Community member', 'I try to schedule the thinking-heavy part earlier and keep admin tasks for later if possible.', '2026-05-24T16:30:00Z'),
  ('30000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000005', 'Community member', 'Planning around my actual energy instead of my ideal energy has helped the most.', '2026-05-23T19:20:00Z'),
  ('30000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000006', 'Community member', 'I keep a short list of tasks that can be done seated. It helps on days when standing is the problem.', '2026-05-23T20:00:00Z'),
  ('30000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000007', 'Community member', 'Earlier rest works better for me than waiting until I’m already wiped out.', '2026-05-23T20:40:00Z'),
  ('30000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000008', 'Community member', 'I bring three bullets: what changed, what I’m worried about, and what I need a decision on.', '2026-05-22T16:05:00Z'),
  ('30000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000009', 'Community member', 'Medication changes go in a separate note so I don’t lose them inside symptom details.', '2026-05-22T17:25:00Z'),
  ('30000000-0000-4000-8000-000000000009', '10000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000010', 'Community member', 'I ask at the start if I can check my notes. That makes it easier to use them.', '2026-05-22T18:40:00Z'),
  ('30000000-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000011', 'Community member', 'I leave earlier than I used to. It is easier to recover from a shorter outing than from pushing too long.', '2026-05-21T21:00:00Z'),
  ('30000000-0000-4000-8000-000000000011', '10000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000012', 'Community member', 'Noise-cancelling earbuds help in stores, even without music.', '2026-05-21T21:35:00Z')
on conflict (id) do nothing;

insert into public.community_reactions (
  id,
  user_id,
  post_id,
  reaction_type,
  created_at
) values
  ('40000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'heart', '2026-05-24T14:05:00Z'),
  ('40000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', 'idea', '2026-05-24T15:15:00Z'),
  ('40000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000001', 'thanks', '2026-05-24T16:35:00Z'),
  ('40000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000002', 'heart', '2026-05-23T19:25:00Z'),
  ('40000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000002', 'agree', '2026-05-23T20:05:00Z'),
  ('40000000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000002', 'thanks', '2026-05-23T20:45:00Z'),
  ('40000000-0000-4000-8000-000000000007', '20000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000003', 'thanks', '2026-05-22T16:10:00Z'),
  ('40000000-0000-4000-8000-000000000008', '20000000-0000-4000-8000-000000000009', '10000000-0000-4000-8000-000000000003', 'idea', '2026-05-22T17:30:00Z'),
  ('40000000-0000-4000-8000-000000000009', '20000000-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000003', 'thanks', '2026-05-22T18:45:00Z'),
  ('40000000-0000-4000-8000-000000000010', '20000000-0000-4000-8000-000000000011', '10000000-0000-4000-8000-000000000004', 'heart', '2026-05-21T21:05:00Z'),
  ('40000000-0000-4000-8000-000000000011', '20000000-0000-4000-8000-000000000012', '10000000-0000-4000-8000-000000000004', 'agree', '2026-05-21T21:40:00Z')
on conflict (id) do nothing;
