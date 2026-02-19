
-- Add like notification preference
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notify_post_likes boolean NOT NULL DEFAULT true;

-- Create trigger function for like notifications
CREATE OR REPLACE FUNCTION public.notify_on_new_like()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _post_author_id UUID;
  _post_title TEXT;
  _liker_name TEXT;
  _notify_post_likes BOOLEAN;
BEGIN
  -- Only handle post likes (not comment likes)
  IF NEW.post_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get post info
  SELECT user_id, title INTO _post_author_id, _post_title
  FROM community_posts WHERE id = NEW.post_id;

  -- Don't notify yourself
  IF _post_author_id IS NULL OR _post_author_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- Check preference
  SELECT COALESCE(notify_post_likes, true) INTO _notify_post_likes
  FROM profiles WHERE user_id = _post_author_id;

  IF NOT _notify_post_likes THEN
    RETURN NEW;
  END IF;

  -- Get liker display name
  SELECT COALESCE(display_name, 'Someone') INTO _liker_name
  FROM profiles WHERE user_id = NEW.user_id;

  INSERT INTO notifications (user_id, type, title, body, post_id, actor_id, actor_name)
  VALUES (
    _post_author_id,
    'like',
    _liker_name || ' ' || CASE NEW.reaction_type
      WHEN 'heart' THEN '❤️'
      WHEN 'thumbs_up' THEN '👍'
      WHEN 'laugh' THEN '😂'
      WHEN 'wow' THEN '😮'
      WHEN 'pray' THEN '🙏'
      WHEN 'strong' THEN '💪'
      ELSE '❤️'
    END || ' your post',
    LEFT(_post_title, 120),
    NEW.post_id,
    NEW.user_id,
    _liker_name
  );

  RETURN NEW;
END;
$function$;

-- Create the trigger
CREATE TRIGGER on_new_like
  AFTER INSERT ON community_likes
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_new_like();
