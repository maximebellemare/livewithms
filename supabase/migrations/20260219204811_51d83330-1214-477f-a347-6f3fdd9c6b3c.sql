
CREATE OR REPLACE FUNCTION public.notify_on_new_comment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _post_title TEXT;
  _post_author_id UUID;
  _commenter_name TEXT;
  _target_user_id UUID;
  _notify_pref BOOLEAN;
  _notify_push BOOLEAN;
  _existing_notif_id UUID;
  _comment_count INT;
  _notify_user_ids UUID[] := '{}';
  _supabase_url TEXT;
  _service_key TEXT;
BEGIN
  SELECT title, user_id INTO _post_title, _post_author_id
  FROM community_posts WHERE id = NEW.post_id;

  _commenter_name := NEW.display_name;

  -- Notify the post author (if not the commenter)
  IF _post_author_id IS NOT NULL AND _post_author_id != NEW.user_id THEN
    SELECT COALESCE(notify_post_comments, true), COALESCE(notify_push_enabled, true)
    INTO _notify_pref, _notify_push
    FROM profiles WHERE user_id = _post_author_id;

    IF _notify_pref THEN
      -- Check for existing unread comment notification on this post for author
      SELECT id INTO _existing_notif_id
      FROM notifications
      WHERE user_id = _post_author_id AND post_id = NEW.post_id AND type = 'comment' AND is_read = false
      ORDER BY created_at DESC LIMIT 1;

      IF _existing_notif_id IS NOT NULL THEN
        SELECT COUNT(DISTINCT user_id) INTO _comment_count
        FROM community_comments
        WHERE post_id = NEW.post_id AND user_id != _post_author_id;

        IF _comment_count <= 1 THEN
          UPDATE notifications
          SET title = _commenter_name || ' commented on your post',
              body = LEFT(NEW.body, 120), actor_id = NEW.user_id, actor_name = _commenter_name,
              comment_id = NEW.id, created_at = now()
          WHERE id = _existing_notif_id;
        ELSE
          UPDATE notifications
          SET title = _commenter_name || ' and ' || (_comment_count - 1) || ' other' || CASE WHEN _comment_count - 1 > 1 THEN 's' ELSE '' END || ' commented on your post',
              body = LEFT(NEW.body, 120), actor_id = NEW.user_id, actor_name = _commenter_name,
              comment_id = NEW.id, created_at = now()
          WHERE id = _existing_notif_id;
        END IF;
      ELSE
        INSERT INTO notifications (user_id, type, title, body, post_id, comment_id, actor_id, actor_name)
        VALUES (_post_author_id, 'comment', _commenter_name || ' commented on your post',
                LEFT(NEW.body, 120), NEW.post_id, NEW.id, NEW.user_id, _commenter_name);
      END IF;

      IF _notify_push THEN
        _notify_user_ids := array_append(_notify_user_ids, _post_author_id);
      END IF;
    END IF;
  END IF;

  -- Notify other commenters on same post
  FOR _target_user_id IN
    SELECT DISTINCT user_id FROM community_comments
    WHERE post_id = NEW.post_id
      AND user_id != NEW.user_id
      AND user_id != COALESCE(_post_author_id, '00000000-0000-0000-0000-000000000000')
  LOOP
    SELECT COALESCE(notify_thread_replies, true), COALESCE(notify_push_enabled, true)
    INTO _notify_pref, _notify_push
    FROM profiles WHERE user_id = _target_user_id;

    IF _notify_pref THEN
      SELECT id INTO _existing_notif_id
      FROM notifications
      WHERE user_id = _target_user_id AND post_id = NEW.post_id AND type = 'comment' AND is_read = false
      ORDER BY created_at DESC LIMIT 1;

      IF _existing_notif_id IS NOT NULL THEN
        SELECT COUNT(DISTINCT user_id) INTO _comment_count
        FROM community_comments
        WHERE post_id = NEW.post_id AND user_id != _target_user_id;

        IF _comment_count <= 1 THEN
          UPDATE notifications
          SET title = _commenter_name || ' also commented on "' || LEFT(_post_title, 60) || '"',
              body = LEFT(NEW.body, 120), actor_id = NEW.user_id, actor_name = _commenter_name,
              comment_id = NEW.id, created_at = now()
          WHERE id = _existing_notif_id;
        ELSE
          UPDATE notifications
          SET title = _commenter_name || ' and ' || (_comment_count - 1) || ' other' || CASE WHEN _comment_count - 1 > 1 THEN 's' ELSE '' END || ' commented on "' || LEFT(_post_title, 60) || '"',
              body = LEFT(NEW.body, 120), actor_id = NEW.user_id, actor_name = _commenter_name,
              comment_id = NEW.id, created_at = now()
          WHERE id = _existing_notif_id;
        END IF;
      ELSE
        INSERT INTO notifications (user_id, type, title, body, post_id, comment_id, actor_id, actor_name)
        VALUES (_target_user_id, 'comment',
                _commenter_name || ' also commented on "' || LEFT(_post_title, 60) || '"',
                LEFT(NEW.body, 120), NEW.post_id, NEW.id, NEW.user_id, _commenter_name);
      END IF;

      IF _notify_push THEN
        _notify_user_ids := array_append(_notify_user_ids, _target_user_id);
      END IF;
    END IF;
  END LOOP;

  -- Send push notifications
  IF array_length(_notify_user_ids, 1) > 0 THEN
    SELECT COALESCE(current_setting('app.settings.supabase_url', true), '') INTO _supabase_url;
    SELECT COALESCE(current_setting('app.settings.service_role_key', true), '') INTO _service_key;
    IF _supabase_url <> '' AND _service_key <> '' THEN
      PERFORM net.http_post(
        url := _supabase_url || '/functions/v1/send-comment-push',
        headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || _service_key),
        body := jsonb_build_object('user_ids', to_jsonb(_notify_user_ids), 'title', _commenter_name || ' replied 💬', 'body', LEFT(NEW.body, 100))
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;
