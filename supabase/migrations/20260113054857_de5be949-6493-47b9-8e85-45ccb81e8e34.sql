-- Add RLS policy for admins to view all profiles
-- This allows the User Management dashboard to display user names
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));