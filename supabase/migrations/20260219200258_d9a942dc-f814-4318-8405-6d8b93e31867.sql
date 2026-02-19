
-- Notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'comment',
  title TEXT NOT NULL,
  body TEXT,
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.community_comments(id) ON DELETE CASCADE,
  actor_id UUID,
  actor_name TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Allow system inserts (trigger runs as SECURITY DEFINER)
CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- Index for fast lookups
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = false;

-- Trigger function: notify post author + other commenters when a new comment is created
CREATE OR REPLACE FUNCTION public.notify_on_new_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _post_title TEXT;
  _post_author_id UUID;
  _commenter_name TEXT;
  _target_user_id UUID;
BEGIN
  -- Get post info
  SELECT title, user_id INTO _post_title, _post_author_id
  FROM community_posts WHERE id = NEW.post_id;

  _commenter_name := NEW.display_name;

  -- Notify the post author (if not the commenter)
  IF _post_author_id IS NOT NULL AND _post_author_id != NEW.user_id THEN
    INSERT INTO notifications (user_id, type, title, body, post_id, comment_id, actor_id, actor_name)
    VALUES (
      _post_author_id,
      'comment',
      _commenter_name || ' commented on your post',
      LEFT(NEW.body, 120),
      NEW.post_id,
      NEW.id,
      NEW.user_id,
      _commenter_name
    );
  END IF;

  -- Notify other users who have commented on this post (excluding the commenter and post author)
  FOR _target_user_id IN
    SELECT DISTINCT user_id FROM community_comments
    WHERE post_id = NEW.post_id
      AND user_id != NEW.user_id
      AND user_id != COALESCE(_post_author_id, '00000000-0000-0000-0000-000000000000')
  LOOP
    INSERT INTO notifications (user_id, type, title, body, post_id, comment_id, actor_id, actor_name)
    VALUES (
      _target_user_id,
      'comment',
      _commenter_name || ' also commented on "' || LEFT(_post_title, 60) || '"',
      LEFT(NEW.body, 120),
      NEW.post_id,
      NEW.id,
      NEW.user_id,
      _commenter_name
    );
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_comment_notify
AFTER INSERT ON public.community_comments
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_new_comment();
