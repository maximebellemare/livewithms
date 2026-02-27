
-- Create cache table for fatigue pattern analysis (weekly)
CREATE TABLE public.fatigue_pattern_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  week_start DATE NOT NULL DEFAULT (date_trunc('week', CURRENT_DATE))::date,
  pattern_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- One cache entry per user per week
CREATE UNIQUE INDEX idx_fatigue_pattern_cache_user_week ON public.fatigue_pattern_cache (user_id, week_start);

-- Enable RLS
ALTER TABLE public.fatigue_pattern_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own fatigue pattern cache" ON public.fatigue_pattern_cache FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own fatigue pattern cache" ON public.fatigue_pattern_cache FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own fatigue pattern cache" ON public.fatigue_pattern_cache FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own fatigue pattern cache" ON public.fatigue_pattern_cache FOR DELETE USING (auth.uid() = user_id);
