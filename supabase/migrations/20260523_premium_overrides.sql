create table if not exists public.premium_overrides (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  email text,
  expires_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  constraint premium_overrides_user_or_email_required
    check (user_id is not null or email is not null)
);

create unique index if not exists premium_overrides_email_key
  on public.premium_overrides (email)
  where email is not null;

create unique index if not exists premium_overrides_user_id_key
  on public.premium_overrides (user_id)
  where user_id is not null;

create index if not exists premium_overrides_expires_at_idx
  on public.premium_overrides (expires_at);

alter table public.premium_overrides enable row level security;

drop policy if exists "Users can read their own premium overrides" on public.premium_overrides;
create policy "Users can read their own premium overrides"
  on public.premium_overrides
  for select
  to authenticated
  using (
    auth.uid() = user_id
    or (
      email is not null
      and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

insert into public.premium_overrides (email, expires_at, note)
values (
  'annadiaz@live.ca',
  now() + interval '90 days',
  'Temporary beta tester premium access'
)
on conflict (email) do update
set
  expires_at = excluded.expires_at,
  note = excluded.note;
