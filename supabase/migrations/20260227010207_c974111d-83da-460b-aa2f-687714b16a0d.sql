
-- Create table for inflammatory scan history
CREATE TABLE public.inflammatory_scans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  meal_name TEXT NOT NULL,
  overall_score TEXT NOT NULL DEFAULT 'yellow',
  overall_label TEXT NOT NULL DEFAULT 'Moderate',
  summary TEXT,
  flags JSONB NOT NULL DEFAULT '[]'::jsonb,
  positives JSONB NOT NULL DEFAULT '[]'::jsonb,
  scanned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.inflammatory_scans ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own scans"
  ON public.inflammatory_scans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own scans"
  ON public.inflammatory_scans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own scans"
  ON public.inflammatory_scans FOR DELETE
  USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_inflammatory_scans_user_date ON public.inflammatory_scans (user_id, scanned_at DESC);
