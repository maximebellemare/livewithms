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
  avatar_url,
  is_hidden,
  created_at,
  updated_at
)
select
  seed.id,
  seed_author.id,
  null::uuid,
  seed.category,
  seed.post_type,
  seed.title,
  seed.body,
  'LiveWithMS',
  null::text,
  false,
  seed.created_at,
  seed.updated_at
from seed_author
cross join (
  values
    (
      '10000000-0000-4000-8000-000000000001'::uuid,
      'work-productivity'::text,
      'question'::text,
      'How do you manage brain fog during workdays?'::text,
      'I’m looking for practical ways to get through work tasks when focus drops. What helps you reduce mental load without making the day more complicated?'::text,
      '2026-05-24T13:00:00Z'::timestamptz,
      '2026-05-24T13:00:00Z'::timestamptz
    ),
    (
      '10000000-0000-4000-8000-000000000002'::uuid,
      'symptoms-daily-life'::text,
      'question'::text,
      'What helps your fatigue the most?'::text,
      'Not looking for a cure, just practical things that make fatigue easier to manage day to day. What has been worth keeping in your routine?'::text,
      '2026-05-23T18:25:00Z'::timestamptz,
      '2026-05-23T18:25:00Z'::timestamptz
    ),
    (
      '10000000-0000-4000-8000-000000000003'::uuid,
      'treatments-medications'::text,
      'question'::text,
      'How do you prepare for appointments?'::text,
      'I forget things once I’m in the room. What do you bring or write down ahead of time so the appointment is easier to use well?'::text,
      '2026-05-22T15:10:00Z'::timestamptz,
      '2026-05-22T15:10:00Z'::timestamptz
    )
) as seed(id, category, post_type, title, body, created_at, updated_at)
on conflict (id) do update
set
  category = excluded.category,
  post_type = excluded.post_type,
  title = excluded.title,
  body = excluded.body,
  display_name = excluded.display_name,
  avatar_url = excluded.avatar_url,
  is_hidden = excluded.is_hidden,
  updated_at = excluded.updated_at;

notify pgrst, 'reload schema';
