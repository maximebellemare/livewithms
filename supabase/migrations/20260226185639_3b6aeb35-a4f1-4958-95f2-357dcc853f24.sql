
-- Create user_blocks table
CREATE TABLE public.user_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID NOT NULL,
  blocked_id UUID NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own blocks" ON public.user_blocks FOR SELECT USING (auth.uid() = blocker_id);
CREATE POLICY "Users can create blocks" ON public.user_blocks FOR INSERT WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "Users can delete own blocks" ON public.user_blocks FOR DELETE USING (auth.uid() = blocker_id);

-- Update get_smart_matches to exclude blocked users (both directions)
CREATE OR REPLACE FUNCTION public.get_smart_matches(requesting_user_id uuid, result_limit integer DEFAULT 20)
 RETURNS TABLE(user_id uuid, display_name text, avatar_url text, ms_type text, age_range text, bio text, looking_for text, opt_in boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
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
    AND NOT EXISTS (SELECT 1 FROM user_blocks ub WHERE ub.blocker_id = requesting_user_id AND ub.blocked_id = smp.user_id)
    AND NOT EXISTS (SELECT 1 FROM user_blocks ub WHERE ub.blocker_id = smp.user_id AND ub.blocked_id = requesting_user_id)
  ORDER BY
    CASE WHEN p.ms_type = (SELECT ms_type FROM profiles WHERE user_id = requesting_user_id) THEN 0 ELSE 1 END,
    CASE WHEN p.age_range = (SELECT age_range FROM profiles WHERE user_id = requesting_user_id) THEN 0 ELSE 1 END,
    smp.updated_at DESC
  LIMIT result_limit;
$$;
