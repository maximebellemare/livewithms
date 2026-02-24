
ALTER TABLE public.profiles
ADD COLUMN hydration_reminder_hour integer NOT NULL DEFAULT 14;

COMMENT ON COLUMN public.profiles.hydration_reminder_hour IS 'UTC hour (0-23) when hydration reminder should be sent';
