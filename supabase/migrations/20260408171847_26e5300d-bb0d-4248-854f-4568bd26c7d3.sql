
-- Add trial_started_at to profiles
ALTER TABLE public.profiles
ADD COLUMN trial_started_at timestamp with time zone DEFAULT now();

-- Update handle_new_user to set trial_started_at
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, trial_started_at) VALUES (NEW.id, now());
  RETURN NEW;
END;
$$;
