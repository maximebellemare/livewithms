-- Function to get smart matches for a user
-- Returns opted-in users with their public profile + MS type + age range
CREATE OR REPLACE FUNCTION public.get_smart_matches(requesting_user_id uuid, result_limit integer DEFAULT 20)
RETURNS TABLE(
  user_id uuid,
  display_name text,
  avatar_url text,
  ms_type text,
  age_range text,
  bio text,
  looking_for text,
  opt_in boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    smp.user_id,
    COALESCE(pp.display_name, 'MS Warrior') AS display_name,
    pp.avatar_url,
    p.ms_type,
    p.age_range,
    smp.bio,
    smp.looking_for,
    smp.opt_in
  FROM smart_match_profiles smp
  LEFT JOIN profiles_public pp ON pp.user_id = smp.user_id
  LEFT JOIN profiles p ON p.user_id = smp.user_id
  WHERE smp.opt_in = true
    AND smp.user_id != requesting_user_id
  ORDER BY
    -- Prioritize same MS type, then same age range
    CASE WHEN p.ms_type = (SELECT ms_type FROM profiles WHERE user_id = requesting_user_id) THEN 0 ELSE 1 END,
    CASE WHEN p.age_range = (SELECT age_range FROM profiles WHERE user_id = requesting_user_id) THEN 0 ELSE 1 END,
    smp.updated_at DESC
  LIMIT result_limit;
$$;