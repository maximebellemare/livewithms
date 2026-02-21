-- Add streak freeze toggle to profiles
ALTER TABLE public.profiles
ADD COLUMN streak_freeze_enabled boolean NOT NULL DEFAULT false;