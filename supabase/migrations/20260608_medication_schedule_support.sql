begin;

alter table public.medications
  add column if not exists dose_times jsonb not null default '[]'::jsonb,
  add column if not exists selected_days text[] not null default '{}'::text[];

comment on column public.medications.dose_times is 'Structured medication dose times, e.g. [{"time":"08:00","dose":"1 pill"}]';
comment on column public.medications.selected_days is 'Days a medication is scheduled, used for weekly/custom recurrence.';

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'medication_logs'
  ) then
    alter table public.medication_logs
      add column if not exists scheduled_time text;

    comment on column public.medication_logs.scheduled_time is 'Scheduled dose time in HH:MM format for multi-dose tracking.';
  end if;
end
$$;

notify pgrst, 'reload schema';

commit;
