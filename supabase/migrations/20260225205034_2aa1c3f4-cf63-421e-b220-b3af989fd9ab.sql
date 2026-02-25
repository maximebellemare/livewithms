-- Add reminder preference column to appointments
ALTER TABLE public.appointments
ADD COLUMN reminder text NOT NULL DEFAULT 'none';

-- Add a column to track if reminders have been sent to avoid duplicates
ALTER TABLE public.appointments
ADD COLUMN reminder_day_sent boolean NOT NULL DEFAULT false;

ALTER TABLE public.appointments
ADD COLUMN reminder_hour_sent boolean NOT NULL DEFAULT false;