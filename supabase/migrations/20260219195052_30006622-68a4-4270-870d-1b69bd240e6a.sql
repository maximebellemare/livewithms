
-- Create bookmarks table
CREATE TABLE public.community_bookmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

-- Enable RLS
ALTER TABLE public.community_bookmarks ENABLE ROW LEVEL SECURITY;

-- Users can view their own bookmarks
CREATE POLICY "Users can view own bookmarks"
ON public.community_bookmarks FOR SELECT
USING (auth.uid() = user_id);

-- Users can create own bookmarks
CREATE POLICY "Users can create own bookmarks"
ON public.community_bookmarks FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete own bookmarks
CREATE POLICY "Users can delete own bookmarks"
ON public.community_bookmarks FOR DELETE
USING (auth.uid() = user_id);
