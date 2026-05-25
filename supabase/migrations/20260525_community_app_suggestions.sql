alter table public.community_posts
  add column if not exists suggestion_type text,
  add column if not exists reaction_count integer not null default 0;

alter table public.community_posts
  drop constraint if exists community_posts_category_check,
  drop constraint if exists community_posts_post_type_check,
  drop constraint if exists community_posts_suggestion_type_check;

alter table public.community_posts
  add constraint community_posts_category_check
  check (
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
  add constraint community_posts_post_type_check
  check (
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
  add constraint community_posts_suggestion_type_check
  check (
    suggestion_type is null
    or suggestion_type in (
      'feature_idea',
      'bug_report',
      'improvement',
      'general_feedback'
    )
  );

create index if not exists community_posts_app_suggestions_created_idx
  on public.community_posts (category, created_at desc)
  where is_hidden = false and category = 'app_suggestions';

create or replace function public.refresh_community_post_reaction_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_post_id uuid;
begin
  if tg_op = 'DELETE' then
    target_post_id := old.post_id;
  else
    target_post_id := new.post_id;
  end if;

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

drop trigger if exists trg_refresh_community_post_reaction_count_insert on public.community_reactions;
create trigger trg_refresh_community_post_reaction_count_insert
  after insert on public.community_reactions
  for each row execute function public.refresh_community_post_reaction_count();

drop trigger if exists trg_refresh_community_post_reaction_count_delete on public.community_reactions;
create trigger trg_refresh_community_post_reaction_count_delete
  after delete on public.community_reactions
  for each row execute function public.refresh_community_post_reaction_count();

notify pgrst, 'reload schema';
