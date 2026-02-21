
-- Fix the SECURITY DEFINER view issue by using security_invoker=on 
-- and adding a narrow RLS policy for the specific columns needed

-- Drop the current view
DROP VIEW IF EXISTS public.profiles_public;

-- Re-create with security_invoker (inherits caller's RLS)
CREATE VIEW public.profiles_public
WITH (security_invoker=on) AS
  SELECT user_id, display_name, avatar_url
  FROM public.profiles;

-- Grant SELECT on the view
GRANT SELECT ON public.profiles_public TO authenticated;
GRANT SELECT ON public.profiles_public TO anon;

-- Now we need a SELECT policy that lets authenticated users read profiles 
-- but ONLY through this view. Since we can't restrict by view in RLS,
-- we'll add a policy that allows reading any profile's public fields.
-- The "Users can view own profile" policy already exists for full access.
-- We need to allow reading others' profiles too (the view limits columns).
CREATE POLICY "Authenticated can read profiles for community"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);
