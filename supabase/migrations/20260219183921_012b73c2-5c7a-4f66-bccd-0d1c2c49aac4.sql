
-- ============================================================
-- 1. User roles (admin, moderator, user)
-- ============================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles without recursion
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Only admins can see all roles; users can see their own
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Only admins can manage roles
CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 2. Add display_name to profiles
-- ============================================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name text;

-- ============================================================
-- 3. Community channels
-- ============================================================
CREATE TABLE public.community_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  emoji text NOT NULL DEFAULT '💬',
  category text NOT NULL DEFAULT 'General',
  description text,
  sort_order int NOT NULL DEFAULT 0,
  is_locked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.community_channels ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read channels
CREATE POLICY "Authenticated users can view channels"
  ON public.community_channels FOR SELECT
  TO authenticated USING (true);

-- Only admins can manage channels
CREATE POLICY "Admins can manage channels"
  ON public.community_channels FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 4. Community posts
-- ============================================================
CREATE TABLE public.community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid REFERENCES public.community_channels(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  display_name text NOT NULL DEFAULT 'Anonymous',
  title text NOT NULL,
  body text NOT NULL,
  is_pinned boolean NOT NULL DEFAULT false,
  is_hidden boolean NOT NULL DEFAULT false,
  likes_count int NOT NULL DEFAULT 0,
  comments_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view visible posts"
  ON public.community_posts FOR SELECT
  TO authenticated
  USING (is_hidden = false OR user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Users can create posts"
  ON public.community_posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
  ON public.community_posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Users can delete own posts"
  ON public.community_posts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 5. Community comments
-- ============================================================
CREATE TABLE public.community_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES public.community_posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  display_name text NOT NULL DEFAULT 'Anonymous',
  body text NOT NULL,
  is_hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view visible comments"
  ON public.community_comments FOR SELECT
  TO authenticated
  USING (is_hidden = false OR user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Users can create comments"
  ON public.community_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON public.community_comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Users can delete own comments"
  ON public.community_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 6. Community likes
-- ============================================================
CREATE TABLE public.community_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  post_id uuid REFERENCES public.community_posts(id) ON DELETE CASCADE,
  comment_id uuid REFERENCES public.community_comments(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT likes_target CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL) OR
    (post_id IS NULL AND comment_id IS NOT NULL)
  ),
  UNIQUE (user_id, post_id),
  UNIQUE (user_id, comment_id)
);

ALTER TABLE public.community_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view likes"
  ON public.community_likes FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Users can create likes"
  ON public.community_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes"
  ON public.community_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- 7. Community reports
-- ============================================================
CREATE TABLE public.community_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL,
  post_id uuid REFERENCES public.community_posts(id) ON DELETE CASCADE,
  comment_id uuid REFERENCES public.community_comments(id) ON DELETE CASCADE,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reports_target CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL) OR
    (post_id IS NULL AND comment_id IS NOT NULL)
  )
);

ALTER TABLE public.community_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reports"
  ON public.community_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view own reports"
  ON public.community_reports FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Moderators can update reports"
  ON public.community_reports FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- ============================================================
-- 8. Triggers for counts
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_post_comments_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_update_comments_count
AFTER INSERT OR DELETE ON public.community_comments
FOR EACH ROW EXECUTE FUNCTION public.update_post_comments_count();

CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.post_id IS NOT NULL THEN
    UPDATE community_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' AND OLD.post_id IS NOT NULL THEN
    UPDATE community_posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_update_likes_count
AFTER INSERT OR DELETE ON public.community_likes
FOR EACH ROW EXECUTE FUNCTION public.update_post_likes_count();

-- ============================================================
-- 9. Seed channels
-- ============================================================
INSERT INTO public.community_channels (name, emoji, category, description, sort_order, is_locked) VALUES
-- Core Support
('Newly Diagnosed', '🌱', '🌟 Core Support', 'A safe space for those just starting their MS journey', 1, false),
('Living with MS', '💚', '🌟 Core Support', 'General support for daily life with MS', 2, false),
('Fatigue Management', '🔋', '🌟 Core Support', 'Tips and support for managing MS fatigue', 3, false),
('Brain Fog & Cognition', '🌫️', '🌟 Core Support', 'Discuss cognitive challenges and strategies', 4, false),
('Mobility & Spasticity', '🦵', '🌟 Core Support', 'Support for mobility and spasticity issues', 5, false),
('Pain Management', '⚡', '🌟 Core Support', 'Share pain management strategies', 6, false),
('Heat Sensitivity (Uhthoff)', '🌡️', '🌟 Core Support', 'Coping with heat sensitivity and Uhthoff phenomenon', 7, false),
('Sleep & Insomnia', '🌙', '🌟 Core Support', 'Discuss sleep challenges and solutions', 8, false),

-- Medication
('Ocrevus', '💊', '💊 Medications', 'Discuss Ocrevus experiences and tips', 10, false),
('Kesimpta', '💉', '💊 Medications', 'Kesimpta community and support', 11, false),
('Tysabri', '🏥', '💊 Medications', 'Tysabri experiences and information', 12, false),
('Mavenclad', '💎', '💊 Medications', 'Mavenclad discussions', 13, false),
('Other DMTs', '📋', '💊 Medications', 'Discuss other disease-modifying therapies', 14, false),
('Side Effects Support', '🩹', '💊 Medications', 'Support for managing medication side effects', 15, false),

-- Mental & Emotional Health
('Anxiety & Panic', '😰', '🧠 Mental & Emotional Health', 'Support for anxiety and panic', 20, false),
('Depression & Mood', '💙', '🧠 Mental & Emotional Health', 'Discuss mood challenges and coping', 21, false),
('Identity & Confidence', '🪞', '🧠 Mental & Emotional Health', 'Navigating identity changes with MS', 22, false),
('Relationships & Dating', '❤️', '🧠 Mental & Emotional Health', 'Relationships and dating with MS', 23, false),
('Family & Parenting', '👨‍👩‍👧', '🧠 Mental & Emotional Health', 'Family life and parenting with MS', 24, false),
('Work & Career with MS', '💼', '🧠 Mental & Emotional Health', 'Navigating work and career challenges', 25, false),

-- Lifestyle & Optimization
('Exercise & Gym', '🏋️', '🏋️ Lifestyle & Optimization', 'Exercise routines and fitness with MS', 30, false),
('Diet & Nutrition', '🥗', '🏋️ Lifestyle & Optimization', 'Nutrition tips and dietary approaches', 31, false),
('Supplements', '💊', '🏋️ Lifestyle & Optimization', 'Supplement discussions and experiences', 32, false),
('Energy Budgeting', '⚡', '🏋️ Lifestyle & Optimization', 'Managing energy and pacing strategies', 33, false),
('Morning & Evening Routines', '🌅', '🏋️ Lifestyle & Optimization', 'Share your daily routines', 34, false),

-- Community & Connection
('Introduce Yourself', '👋', '🌍 Community & Connection', 'Say hello and share your story', 40, false),
('Small Wins & Celebrations', '🎉', '🌍 Community & Connection', 'Celebrate your victories, big or small', 41, false),
('Ask Anything', '❓', '🌍 Community & Connection', 'No question is too small', 42, false),
('Research & New Treatments', '🔬', '🌍 Community & Connection', 'Discuss latest research and treatments', 43, false),
('Clinical Trials', '📊', '🌍 Community & Connection', 'Information about clinical trials', 44, false),

-- Safety
('Emotional Crisis Support', '🆘', '⚠️ Safety', 'Crisis resources and professional help information. Posts are locked — resources only.', 50, true);
