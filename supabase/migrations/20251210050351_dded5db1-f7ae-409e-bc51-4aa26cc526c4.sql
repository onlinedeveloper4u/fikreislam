-- Fix storage policies to properly check user roles

-- Drop existing problematic storage policies
DROP POLICY IF EXISTS "Contributors can upload content files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete content files" ON storage.objects;

-- Create new INSERT policy that properly checks for contributor or admin role
CREATE POLICY "Contributors and admins can upload content files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'content-files'
  AND (
    public.has_role(auth.uid(), 'contributor'::public.app_role) 
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  )
);

-- Create new DELETE policy that properly checks for admin role
CREATE POLICY "Admins can delete content files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'content-files'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);