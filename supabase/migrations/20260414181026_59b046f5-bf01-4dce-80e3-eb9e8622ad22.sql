
-- Fix 1: Restrict feedback_posts and feedback_comments SELECT to authenticated users
DROP POLICY IF EXISTS "Anyone can view feedback posts" ON feedback_posts;
CREATE POLICY "Authenticated users can view feedback posts"
ON feedback_posts FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Anyone can view feedback comments" ON feedback_comments;
CREATE POLICY "Authenticated users can view feedback comments"
ON feedback_comments FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Anyone can view upvotes" ON feedback_upvotes;
CREATE POLICY "Authenticated users can view upvotes"
ON feedback_upvotes FOR SELECT
TO authenticated
USING (true);

-- Fix 2: Restrict exercise-illustrations storage INSERT to service_role only
DROP POLICY IF EXISTS "Service role can upload exercise illustrations" ON storage.objects;
CREATE POLICY "Service role can upload exercise illustrations"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'exercise-illustrations' AND auth.role() = 'service_role');

-- Fix 3: Realtime authorization - remove community tables from realtime publication
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'community_posts'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.community_posts;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'community_comments'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.community_comments;
  END IF;
END;
$$;
