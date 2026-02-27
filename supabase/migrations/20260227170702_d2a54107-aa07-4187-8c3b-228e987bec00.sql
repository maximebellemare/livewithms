
-- Cache table for AI energy forecasts (one per user per day)
CREATE TABLE public.energy_forecast_cache (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  forecast_date date NOT NULL DEFAULT CURRENT_DATE,
  forecast_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Unique constraint: one forecast per user per day
CREATE UNIQUE INDEX idx_energy_forecast_cache_user_date ON public.energy_forecast_cache (user_id, forecast_date);

-- Enable RLS
ALTER TABLE public.energy_forecast_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own forecast cache"
  ON public.energy_forecast_cache FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own forecast cache"
  ON public.energy_forecast_cache FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own forecast cache"
  ON public.energy_forecast_cache FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own forecast cache"
  ON public.energy_forecast_cache FOR DELETE
  USING (auth.uid() = user_id);
