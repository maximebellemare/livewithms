-- Attach notification triggers to their tables

-- Comments trigger (handles post author + thread participant notifications)
CREATE TRIGGER trg_notify_on_new_comment
  AFTER INSERT ON public.community_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_new_comment();

-- Likes trigger
CREATE TRIGGER trg_notify_on_new_like
  AFTER INSERT ON public.community_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_new_like();

-- Bookmarks trigger
CREATE TRIGGER trg_notify_on_new_bookmark
  AFTER INSERT ON public.community_bookmarks
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_new_bookmark();

-- Post likes count triggers
CREATE TRIGGER trg_update_post_likes_count_insert
  AFTER INSERT ON public.community_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_post_likes_count();

CREATE TRIGGER trg_update_post_likes_count_delete
  AFTER DELETE ON public.community_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_post_likes_count();

-- Post comments count triggers
CREATE TRIGGER trg_update_post_comments_count_insert
  AFTER INSERT ON public.community_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_post_comments_count();

CREATE TRIGGER trg_update_post_comments_count_delete
  AFTER DELETE ON public.community_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_post_comments_count();

-- Feedback upvotes count triggers
CREATE TRIGGER trg_update_feedback_upvotes_count_insert
  AFTER INSERT ON public.feedback_upvotes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_feedback_upvotes_count();

CREATE TRIGGER trg_update_feedback_upvotes_count_delete
  AFTER DELETE ON public.feedback_upvotes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_feedback_upvotes_count();

-- Feedback comments count triggers
CREATE TRIGGER trg_update_feedback_comments_count_insert
  AFTER INSERT ON public.feedback_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_feedback_comments_count();

CREATE TRIGGER trg_update_feedback_comments_count_delete
  AFTER DELETE ON public.feedback_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_feedback_comments_count();

-- Conversation last_message_at trigger
CREATE TRIGGER trg_update_conversation_last_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_last_message();

-- Updated_at triggers
CREATE TRIGGER trg_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_updated_at_medications
  BEFORE UPDATE ON public.medications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_updated_at_community_posts
  BEFORE UPDATE ON public.community_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();