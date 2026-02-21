-- Create a function to get a user's public badge collection
CREATE OR REPLACE FUNCTION public.get_user_public_badges(target_user_id uuid)
RETURNS TABLE(badge_id text, earned_at timestamp with time zone)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT badge_id, earned_at
  FROM badge_events
  WHERE user_id = target_user_id
  ORDER BY earned_at ASC;
$$;

-- Create a function to get a user's join date (account creation)
CREATE OR REPLACE FUNCTION public.get_user_join_date(target_user_id uuid)
RETURNS timestamp with time zone
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT created_at FROM profiles WHERE user_id = target_user_id;
$$;