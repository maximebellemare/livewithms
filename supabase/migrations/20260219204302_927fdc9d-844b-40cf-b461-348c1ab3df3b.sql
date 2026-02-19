
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
  _existing_notif_id UUID;
  _existing_actor_name TEXT;
  _existing_title TEXT;
  _like_count INT;
  _emoji TEXT;
BEGIN
  IF NEW.post_id IS NULL THEN RETURN NEW; END IF;

  SELECT user_id, title INTO _post_author_id, _post_title
  FROM community_posts WHERE id = NEW.post_id;

  IF _post_author_id IS NULL OR _post_author_id = NEW.user_id THEN RETURN NEW; END IF;

  SELECT COALESCE(notify_post_likes, true) INTO _notify_post_likes
  FROM profiles WHERE user_id = _post_author_id;

  IF NOT _notify_post_likes THEN RETURN NEW; END IF;

  SELECT COALESCE(display_name, 'Someone') INTO _liker_name
  FROM profiles WHERE user_id = NEW.user_id;

  _emoji := CASE NEW.reaction_type
    WHEN 'heart' THEN '❤️' WHEN 'thumbs_up' THEN '👍' WHEN 'laugh' THEN '😂'
    WHEN 'wow' THEN '😮' WHEN 'pray' THEN '🙏' WHEN 'strong' THEN '💪' ELSE '❤️'
  END;

  -- Check for existing unread like notification on this post
  SELECT id, actor_name, title INTO _existing_notif_id, _existing_actor_name, _existing_title
  FROM notifications
  WHERE user_id = _post_author_id
    AND post_id = NEW.post_id
    AND type = 'like'
    AND is_read = false
  ORDER BY created_at DESC
  LIMIT 1;

  IF _existing_notif_id IS NOT NULL THEN
    -- Count total likes from others on this post (excluding author)
    SELECT COUNT(*) INTO _like_count
    FROM community_likes
    WHERE post_id = NEW.post_id
      AND user_id != _post_author_id;

    IF _like_count <= 1 THEN
      -- Just the new liker
      UPDATE notifications
      SET title = _liker_name || ' ' || _emoji || ' your post',
          actor_id = NEW.user_id,
          actor_name = _liker_name,
          created_at = now()
      WHERE id = _existing_notif_id;
    ELSE
      -- Group: "Name and N others liked your post"
      UPDATE notifications
      SET title = _liker_name || ' and ' || (_like_count - 1) || ' other' || CASE WHEN _like_count - 1 > 1 THEN 's' ELSE '' END || ' ' || _emoji || ' your post',
          actor_id = NEW.user_id,
          actor_name = _liker_name,
          created_at = now()
      WHERE id = _existing_notif_id;
    END IF;
  ELSE
    -- First like notification for this post
    INSERT INTO notifications (user_id, type, title, body, post_id, actor_id, actor_name)
    VALUES (
      _post_author_id, 'like',
      _liker_name || ' ' || _emoji || ' your post',
      LEFT(_post_title, 120),
      NEW.post_id, NEW.user_id, _liker_name
    );
  END IF;

  RETURN NEW;
END;
$function$;
