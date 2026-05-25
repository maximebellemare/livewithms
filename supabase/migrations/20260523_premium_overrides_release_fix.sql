alter table public.premium_overrides
  add column if not exists active boolean not null default true;

update public.premium_overrides
set active = true
where active is null;

create index if not exists premium_overrides_active_idx
  on public.premium_overrides (active);

drop policy if exists "Users can read their own premium overrides" on public.premium_overrides;
create policy "Users can read their own premium overrides"
  on public.premium_overrides
  for select
  to authenticated
  using (
    active = true
    and (
      auth.uid() = user_id
      or (
        email is not null
        and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
    )
  );

insert into public.premium_overrides (email, active, expires_at, note)
values (
  'annadiaz@live.ca',
  true,
  now() + interval '90 days',
  'Temporary beta tester premium access'
)
on conflict (email) do update
set
  active = excluded.active,
  expires_at = excluded.expires_at,
  note = excluded.note;
