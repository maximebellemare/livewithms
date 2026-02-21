
CREATE OR REPLACE FUNCTION public.get_coach_feedback_stats()
RETURNS TABLE(
  session_id UUID,
  session_title TEXT,
  session_mode TEXT,
  user_display_name TEXT,
  thumbs_up BIGINT,
  thumbs_down BIGINT,
  session_created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    cs.id AS session_id,
    COALESCE(cs.title, 'Untitled') AS session_title,
    cs.mode AS session_mode,
    COALESCE(pp.display_name, 'Anonymous') AS user_display_name,
    COUNT(*) FILTER (WHERE cmr.reaction = 'up') AS thumbs_up,
    COUNT(*) FILTER (WHERE cmr.reaction = 'down') AS thumbs_down,
    cs.created_at AS session_created_at
  FROM coach_message_reactions cmr
  JOIN coach_sessions cs ON cs.id = cmr.session_id
  LEFT JOIN profiles_public pp ON pp.user_id = cmr.user_id
  GROUP BY cs.id, cs.title, cs.mode, pp.display_name, cs.created_at
  ORDER BY cs.created_at DESC;
$$;
