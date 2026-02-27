
-- Add height and weight goal fields to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS height_cm numeric NULL,
ADD COLUMN IF NOT EXISTS goal_weight numeric NULL,
ADD COLUMN IF NOT EXISTS goal_weight_unit text NOT NULL DEFAULT 'kg';
