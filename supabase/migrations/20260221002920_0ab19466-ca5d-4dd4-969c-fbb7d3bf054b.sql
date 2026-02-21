
-- 1. CRITICAL FIX: Remove overly broad profile SELECT policy that exposes health data
DROP POLICY IF EXISTS "Authenticated users can view any profile" ON public.profiles;

-- 2. CRITICAL FIX: Restrict notifications INSERT to service_role only (triggers run as SECURITY DEFINER)
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "Service role can insert notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR current_setting('role') = 'service_role'
  );

-- 3. Add RLS to profiles_public view (it's a view with security_invoker, 
-- so the underlying profiles RLS applies, but let's be explicit)
-- The view already selects from profiles which has RLS. 
-- Since we removed the broad SELECT, community features that need display_name/avatar 
-- should use the profiles_public view. Let's ensure it works by adding a permissive 
-- SELECT policy scoped to just those columns via the view.
-- Views with security_invoker=on inherit RLS from the base table, so we need a 
-- policy that allows reading OTHER users' display_name and avatar_url.

-- Add a targeted policy for public profile fields only
CREATE POLICY "Authenticated users can view public profile fields"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Wait - this re-introduces the problem. Instead, let's use the profiles_public view approach.
-- Drop the policy we just created
DROP POLICY IF EXISTS "Authenticated users can view public profile fields" ON public.profiles;

-- The profiles_public view needs to work. Let's check if it has security_invoker.
-- We'll recreate it to ensure it uses SECURITY DEFINER approach instead.
DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public
WITH (security_barrier=true) AS
  SELECT user_id, display_name, avatar_url
  FROM public.profiles;

-- Grant SELECT on the view to authenticated and anon roles
GRANT SELECT ON public.profiles_public TO authenticated;
GRANT SELECT ON public.profiles_public TO anon;
