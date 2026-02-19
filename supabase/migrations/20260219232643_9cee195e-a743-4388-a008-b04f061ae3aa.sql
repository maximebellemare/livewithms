
-- Allow all authenticated users to see admin and moderator roles (for badge display)
CREATE POLICY "Authenticated users can view admin and moderator roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (role IN ('admin', 'moderator'));
