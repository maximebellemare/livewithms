begin;

alter table public.medications
  add column if not exists notes text;

commit;
