
-- Create a public view for community-visible profile fields only
CREATE VIEW public.profiles_public
WITH (security_invoker = on) AS
  SELECT user_id, avatar_url, display_name
  FROM public.profiles;

-- Allow all authenticated users to read from the view
-- (security_invoker means the view respects the caller's permissions,
-- so we need a SELECT policy that allows reading these fields)
-- Add a policy that allows any authenticated user to read any profile row
CREATE POLICY "Authenticated users can view any profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);
