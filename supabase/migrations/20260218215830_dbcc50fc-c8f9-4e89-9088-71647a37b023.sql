ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS weekly_log_goal integer NOT NULL DEFAULT 7;
