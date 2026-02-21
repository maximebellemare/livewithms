
-- Coach sessions table
CREATE TABLE public.coach_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  mode text NOT NULL DEFAULT 'emotional',
  title text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.coach_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own coach sessions" ON public.coach_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own coach sessions" ON public.coach_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own coach sessions" ON public.coach_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own coach sessions" ON public.coach_sessions FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_coach_sessions_updated_at BEFORE UPDATE ON public.coach_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Coach messages table
CREATE TABLE public.coach_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.coach_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'user',
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.coach_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own coach messages" ON public.coach_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own coach messages" ON public.coach_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own coach messages" ON public.coach_messages FOR DELETE USING (auth.uid() = user_id);

-- Coach memory table (summarized traits, not raw conversations)
CREATE TABLE public.coach_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  traits jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.coach_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own coach memory" ON public.coach_memory FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own coach memory" ON public.coach_memory FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own coach memory" ON public.coach_memory FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own coach memory" ON public.coach_memory FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_coach_memory_updated_at BEFORE UPDATE ON public.coach_memory FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add AI memory toggle to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ai_memory_enabled boolean NOT NULL DEFAULT true;

-- Add daily coach message counter for free tier limiting
CREATE TABLE public.coach_daily_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  message_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.coach_daily_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own coach usage" ON public.coach_daily_usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own coach usage" ON public.coach_daily_usage FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own coach usage" ON public.coach_daily_usage FOR UPDATE USING (auth.uid() = user_id);
