alter table public.community_reports
  add column if not exists notes text;

notify pgrst, 'reload schema';
