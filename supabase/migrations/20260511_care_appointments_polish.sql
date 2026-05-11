begin;

alter table public.appointments
  add column if not exists appointment_date date,
  add column if not exists appointment_time text,
  add column if not exists provider text,
  add column if not exists updated_at timestamptz not null default now();

update public.appointments
set
  appointment_date = coalesce(appointment_date, date),
  appointment_time = coalesce(appointment_time, time)
where appointment_date is null or appointment_time is null;

alter table public.appointments
  alter column appointment_date set not null;

alter table public.appointments enable row level security;

drop policy if exists "Users can select own appointments" on public.appointments;
create policy "Users can select own appointments"
on public.appointments
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own appointments native" on public.appointments;
create policy "Users can insert own appointments native"
on public.appointments
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own appointments native" on public.appointments;
create policy "Users can update own appointments native"
on public.appointments
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own appointments native" on public.appointments;
create policy "Users can delete own appointments native"
on public.appointments
for delete
to authenticated
using (auth.uid() = user_id);

drop trigger if exists update_appointments_updated_at on public.appointments;
create trigger update_appointments_updated_at
before update on public.appointments
for each row
execute function public.update_updated_at_column();

commit;
