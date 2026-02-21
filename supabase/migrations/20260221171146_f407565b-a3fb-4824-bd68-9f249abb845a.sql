-- Add city column for heat alerts feature
ALTER TABLE public.profiles ADD COLUMN city text DEFAULT null;