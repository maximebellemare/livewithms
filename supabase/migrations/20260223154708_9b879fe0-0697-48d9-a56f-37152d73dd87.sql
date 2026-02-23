
-- Create table to persist weekly risk scores
CREATE TABLE public.risk_scores (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  week_start date NOT NULL,
  week_end date NOT NULL,
  score integer NOT NULL,
  level text NOT NULL,
  factors text[] NOT NULL DEFAULT '{}'::text[],
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Unique constraint: one score per user per week
CREATE UNIQUE INDEX idx_risk_scores_user_week ON public.risk_scores (user_id, week_start);

-- Index for efficient lookups
CREATE INDEX idx_risk_scores_user_date ON public.risk_scores (user_id, week_start DESC);

-- Enable RLS
ALTER TABLE public.risk_scores ENABLE ROW LEVEL SECURITY;

-- Users can view their own scores
CREATE POLICY "Users can view own risk scores"
ON public.risk_scores FOR SELECT
USING (auth.uid() = user_id);

-- Service role inserts (from edge function)
CREATE POLICY "Service role can insert risk scores"
ON public.risk_scores FOR INSERT
WITH CHECK ((auth.uid() = user_id) OR (current_setting('role'::text) = 'service_role'::text));
