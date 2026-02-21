
-- Store when each badge was earned
CREATE TABLE public.badge_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  badge_id TEXT NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Enable RLS
ALTER TABLE public.badge_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own badge events"
  ON public.badge_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own badge events"
  ON public.badge_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own badge events"
  ON public.badge_events FOR DELETE
  USING (auth.uid() = user_id);
