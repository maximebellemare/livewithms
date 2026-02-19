
-- Add bookmark notification preference
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notify_post_bookmarks boolean NOT NULL DEFAULT true;

-- Create trigger function for bookmark notifications
CREATE OR REPLACE FUNCTION public.notify_on_new_bookmark()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _post_author_id UUID;
  _post_title TEXT;
  _bookmarker_name TEXT;
  _notify_pref BOOLEAN;
  _existing_notif_id UUID;
  _bookmark_count INT;
BEGIN
  SELECT user_id, title INTO _post_author_id, _post_title
  FROM community_posts WHERE id = NEW.post_id;

  IF _post_author_id IS NULL OR _post_author_id = NEW.user_id THEN RETURN NEW; END IF;

  SELECT COALESCE(notify_post_bookmarks, true) INTO _notify_pref
  FROM profiles WHERE user_id = _post_author_id;

  IF NOT _notify_pref THEN RETURN NEW; END IF;

  SELECT COALESCE(display_name, 'Someone') INTO _bookmarker_name
  FROM profiles WHERE user_id = NEW.user_id;

  -- Check for existing unread bookmark notification on this post
  SELECT id INTO _existing_notif_id
  FROM notifications
  WHERE user_id = _post_author_id AND post_id = NEW.post_id AND type = 'bookmark' AND is_read = false
  ORDER BY created_at DESC LIMIT 1;

  IF _existing_notif_id IS NOT NULL THEN
    SELECT COUNT(*) INTO _bookmark_count
    FROM community_bookmarks
    WHERE post_id = NEW.post_id AND user_id != _post_author_id;

    IF _bookmark_count <= 1 THEN
      UPDATE notifications
      SET title = _bookmarker_name || ' 🔖 saved your post',
          actor_id = NEW.user_id, actor_name = _bookmarker_name, created_at = now()
      WHERE id = _existing_notif_id;
    ELSE
      UPDATE notifications
      SET title = _bookmarker_name || ' and ' || (_bookmark_count - 1) || ' other' || CASE WHEN _bookmark_count - 1 > 1 THEN 's' ELSE '' END || ' 🔖 saved your post',
          actor_id = NEW.user_id, actor_name = _bookmarker_name, created_at = now()
      WHERE id = _existing_notif_id;
    END IF;
  ELSE
    INSERT INTO notifications (user_id, type, title, body, post_id, actor_id, actor_name)
    VALUES (
      _post_author_id, 'bookmark',
      _bookmarker_name || ' 🔖 saved your post',
      LEFT(_post_title, 120),
      NEW.post_id, NEW.user_id, _bookmarker_name
    );
  END IF;

  RETURN NEW;
END;
$function$;

CREATE TRIGGER on_new_bookmark
  AFTER INSERT ON community_bookmarks
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_new_bookmark();
