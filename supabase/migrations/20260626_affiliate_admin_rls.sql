begin;

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and coalesce(is_admin, false) = coalesce(
    (
      select current_profile.is_admin
      from public.profiles as current_profile
      where current_profile.user_id = auth.uid()
    ),
    false
  )
);

alter table if exists public.affiliates enable row level security;
alter table if exists public.referral_links enable row level security;
alter table if exists public.affiliate_clicks enable row level security;
alter table if exists public.affiliate_installs enable row level security;
alter table if exists public.commissions enable row level security;
alter table if exists public.affiliate_payouts enable row level security;

do $$
begin
  if to_regclass('public.affiliates') is not null then
    drop policy if exists "Admins can manage affiliates" on public.affiliates;
    create policy "Admins can manage affiliates"
      on public.affiliates
      for all
      to authenticated
      using (
        exists (
          select 1
          from public.profiles
          where profiles.user_id = auth.uid()
            and profiles.is_admin = true
        )
      )
      with check (
        exists (
          select 1
          from public.profiles
          where profiles.user_id = auth.uid()
            and profiles.is_admin = true
        )
      );
  end if;
end $$;

do $$
begin
  if to_regclass('public.referral_links') is not null then
    drop policy if exists "Admins can manage referral links" on public.referral_links;
    create policy "Admins can manage referral links"
      on public.referral_links
      for all
      to authenticated
      using (
        exists (
          select 1
          from public.profiles
          where profiles.user_id = auth.uid()
            and profiles.is_admin = true
        )
      )
      with check (
        exists (
          select 1
          from public.profiles
          where profiles.user_id = auth.uid()
            and profiles.is_admin = true
        )
      );
  end if;
end $$;

do $$
begin
  if to_regclass('public.affiliate_clicks') is not null then
    drop policy if exists "Admins can view affiliate clicks" on public.affiliate_clicks;
    create policy "Admins can view affiliate clicks"
      on public.affiliate_clicks
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.profiles
          where profiles.user_id = auth.uid()
            and profiles.is_admin = true
        )
      );
  end if;
end $$;

do $$
begin
  if to_regclass('public.affiliate_installs') is not null then
    drop policy if exists "Admins can view affiliate installs" on public.affiliate_installs;
    create policy "Admins can view affiliate installs"
      on public.affiliate_installs
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.profiles
          where profiles.user_id = auth.uid()
            and profiles.is_admin = true
        )
      );
  end if;
end $$;

do $$
begin
  if to_regclass('public.commissions') is not null then
    drop policy if exists "Admins can manage commissions" on public.commissions;
    create policy "Admins can manage commissions"
      on public.commissions
      for all
      to authenticated
      using (
        exists (
          select 1
          from public.profiles
          where profiles.user_id = auth.uid()
            and profiles.is_admin = true
        )
      )
      with check (
        exists (
          select 1
          from public.profiles
          where profiles.user_id = auth.uid()
            and profiles.is_admin = true
        )
      );
  end if;
end $$;

do $$
begin
  if to_regclass('public.affiliate_payouts') is not null then
    drop policy if exists "Admins can manage affiliate payouts" on public.affiliate_payouts;
    create policy "Admins can manage affiliate payouts"
      on public.affiliate_payouts
      for all
      to authenticated
      using (
        exists (
          select 1
          from public.profiles
          where profiles.user_id = auth.uid()
            and profiles.is_admin = true
        )
      )
      with check (
        exists (
          select 1
          from public.profiles
          where profiles.user_id = auth.uid()
            and profiles.is_admin = true
        )
      );
  end if;
end $$;

commit;
