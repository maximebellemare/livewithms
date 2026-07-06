alter table public.profiles
  add column if not exists has_seen_app_tour boolean not null default false;

update public.profiles
set has_seen_app_tour = true
where onboarding_completed = true
  and coalesce(has_seen_app_tour, false) = false;
