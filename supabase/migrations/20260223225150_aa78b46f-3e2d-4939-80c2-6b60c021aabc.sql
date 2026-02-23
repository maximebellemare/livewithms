
-- Add is_premium to the profiles_public view so it's accessible to all authenticated users
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public WITH (security_barrier = true, security_invoker = false) AS
  SELECT user_id, display_name, avatar_url, is_premium
  FROM public.profiles;

ALTER VIEW public.profiles_public SET (security_invoker = false);
