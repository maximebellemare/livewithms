-- Add water_glasses column to daily_entries
ALTER TABLE public.daily_entries ADD COLUMN water_glasses integer DEFAULT 0;

-- Add hydration_goal column to profiles
ALTER TABLE public.profiles ADD COLUMN hydration_goal integer NOT NULL DEFAULT 8;
