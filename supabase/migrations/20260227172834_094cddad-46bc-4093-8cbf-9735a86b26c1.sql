
-- Add recurrence fields to appointments
ALTER TABLE public.appointments
ADD COLUMN recurrence text NOT NULL DEFAULT 'none',
ADD COLUMN recurrence_parent_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL;

-- Add checklist field to appointments (jsonb array of {text, checked})
ALTER TABLE public.appointments
ADD COLUMN checklist jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Index for finding children of recurring appointments
CREATE INDEX idx_appointments_recurrence_parent ON public.appointments(recurrence_parent_id) WHERE recurrence_parent_id IS NOT NULL;
