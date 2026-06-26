alter table public.profiles
  add column if not exists affiliate_id uuid references public.affiliates(id) on delete set null;

create index if not exists profiles_affiliate_id_idx
  on public.profiles (affiliate_id);
