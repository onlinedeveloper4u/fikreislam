-- Fix 1: Allow admins to insert content
-- Admins should be able to upload content as well
CREATE POLICY "Admins can insert content"
ON public.content
FOR INSERT
WITH CHECK (
  auth.uid() = contributor_id 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Fix 2: The profiles SELECT policies are both RESTRICTIVE, which means ALL must pass
-- We need to change them to PERMISSIVE so that ANY can pass
-- First, drop the existing restrictive policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Recreate as PERMISSIVE policies (default type)
-- This means if ANY policy passes, access is granted
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));