
CREATE TABLE public.coach_message_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_id UUID NOT NULL REFERENCES public.coach_sessions(id) ON DELETE CASCADE,
  message_index INTEGER NOT NULL,
  reaction TEXT NOT NULL CHECK (reaction IN ('up', 'down')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, session_id, message_index)
);

ALTER TABLE public.coach_message_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reactions" ON public.coach_message_reactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reactions" ON public.coach_message_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reactions" ON public.coach_message_reactions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reactions" ON public.coach_message_reactions
  FOR DELETE USING (auth.uid() = user_id);
