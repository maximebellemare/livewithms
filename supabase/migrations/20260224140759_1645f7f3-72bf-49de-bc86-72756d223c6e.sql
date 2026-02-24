ALTER TABLE public.profiles
ADD COLUMN pinned_metrics text[] NOT NULL DEFAULT '{}'::text[];