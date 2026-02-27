
-- Side effects tracking table
CREATE TABLE public.medication_side_effects (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  medication_id uuid NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  effect text NOT NULL,
  severity text NOT NULL DEFAULT 'mild', -- mild, moderate, severe
  date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.medication_side_effects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own side effects" ON public.medication_side_effects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own side effects" ON public.medication_side_effects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own side effects" ON public.medication_side_effects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own side effects" ON public.medication_side_effects FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_med_side_effects_user ON public.medication_side_effects(user_id, medication_id);

-- Add supply tracking columns to medications
ALTER TABLE public.medications
ADD COLUMN supply_count integer,
ADD COLUMN supply_unit text DEFAULT 'pills',
ADD COLUMN refill_date date,
ADD COLUMN pills_per_dose integer DEFAULT 1;
