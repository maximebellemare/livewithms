-- Add excluded_ingredients column to profiles
ALTER TABLE public.profiles
ADD COLUMN excluded_ingredients text[] NOT NULL DEFAULT '{}'::text[];