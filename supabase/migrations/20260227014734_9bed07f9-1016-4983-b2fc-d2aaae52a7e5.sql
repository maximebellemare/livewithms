
-- Add weekly exercise goal (in minutes) to profiles
ALTER TABLE public.profiles
ADD COLUMN weekly_exercise_goal_minutes integer NOT NULL DEFAULT 150;
