begin;

create table if not exists public.affiliate_users (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliates(id) on delete cascade,
  email text not null,
  user_id uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists affiliate_users_affiliate_id_email_key
  on public.affiliate_users (affiliate_id, lower(email));

create unique index if not exists affiliate_users_user_id_key
  on public.affiliate_users (user_id)
  where user_id is not null;

create index if not exists affiliate_users_email_idx
  on public.affiliate_users (lower(email));

create index if not exists affiliate_users_affiliate_id_idx
  on public.affiliate_users (affiliate_id);

alter table public.affiliate_users enable row level security;

drop policy if exists "Admins can manage affiliate users" on public.affiliate_users;
create policy "Admins can manage affiliate users"
on public.affiliate_users
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

drop policy if exists "Creators can read own affiliate user row" on public.affiliate_users;
create policy "Creators can read own affiliate user row"
on public.affiliate_users
for select
to authenticated
using (
  user_id = auth.uid()
  or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

drop policy if exists "Creators can claim own affiliate user row" on public.affiliate_users;
create policy "Creators can claim own affiliate user row"
on public.affiliate_users
for update
to authenticated
using (
  lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  and (user_id is null or user_id = auth.uid())
)
with check (
  lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  and user_id = auth.uid()
);

drop policy if exists "Creators can read own affiliate record" on public.affiliates;
create policy "Creators can read own affiliate record"
on public.affiliates
for select
to authenticated
using (
  exists (
    select 1
    from public.affiliate_users
    where affiliate_users.affiliate_id = affiliates.id
      and (
        affiliate_users.user_id = auth.uid()
        or lower(affiliate_users.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
  )
);

drop policy if exists "Creators can read own referral links" on public.referral_links;
create policy "Creators can read own referral links"
on public.referral_links
for select
to authenticated
using (
  exists (
    select 1
    from public.affiliate_users
    where affiliate_users.affiliate_id = referral_links.affiliate_id
      and (
        affiliate_users.user_id = auth.uid()
        or lower(affiliate_users.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
  )
);

drop policy if exists "Creators can read own affiliate clicks" on public.affiliate_clicks;
create policy "Creators can read own affiliate clicks"
on public.affiliate_clicks
for select
to authenticated
using (
  exists (
    select 1
    from public.affiliate_users
    where affiliate_users.affiliate_id = affiliate_clicks.affiliate_id
      and (
        affiliate_users.user_id = auth.uid()
        or lower(affiliate_users.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
  )
  or exists (
    select 1
    from public.referral_links
    join public.affiliate_users on affiliate_users.affiliate_id = referral_links.affiliate_id
    where referral_links.id = affiliate_clicks.referral_link_id
      and (
        affiliate_users.user_id = auth.uid()
        or lower(affiliate_users.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
  )
);

drop policy if exists "Creators can read own affiliate installs" on public.affiliate_installs;
create policy "Creators can read own affiliate installs"
on public.affiliate_installs
for select
to authenticated
using (
  exists (
    select 1
    from public.affiliate_users
    where affiliate_users.affiliate_id = affiliate_installs.affiliate_id
      and (
        affiliate_users.user_id = auth.uid()
        or lower(affiliate_users.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
  )
);

drop policy if exists "Creators can read own commissions" on public.commissions;
create policy "Creators can read own commissions"
on public.commissions
for select
to authenticated
using (
  exists (
    select 1
    from public.affiliate_users
    where affiliate_users.affiliate_id = commissions.affiliate_id
      and (
        affiliate_users.user_id = auth.uid()
        or lower(affiliate_users.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
  )
);

drop policy if exists "Creators can read own affiliate payouts" on public.affiliate_payouts;
create policy "Creators can read own affiliate payouts"
on public.affiliate_payouts
for select
to authenticated
using (
  exists (
    select 1
    from public.affiliate_users
    where affiliate_users.affiliate_id = affiliate_payouts.affiliate_id
      and (
        affiliate_users.user_id = auth.uid()
        or lower(affiliate_users.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
  )
);

notify pgrst, 'reload schema';

commit;
