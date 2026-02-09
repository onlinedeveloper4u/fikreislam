-- Fix 1: Make the content-files storage bucket private
UPDATE storage.buckets SET public = false WHERE id = 'content-files';

-- Fix 2: Replace overly permissive content_analytics INSERT policy
-- Anyone could insert any data before - now we ensure content_id exists and limit what can be inserted
DROP POLICY IF EXISTS "Anyone can track content actions" ON public.content_analytics;

-- Allow authenticated and anonymous users to track actions, but only for valid content
CREATE POLICY "Anyone can track valid content actions"
ON public.content_analytics
FOR INSERT
WITH CHECK (
  -- Content must exist and be approved (public content only)
  EXISTS (
    SELECT 1 FROM public.content 
    WHERE id = content_analytics.content_id 
    AND status = 'approved'
  )
  -- If user is authenticated, user_id must match or be null
  AND (
    auth.uid() IS NULL 
    OR user_id IS NULL 
    OR user_id = auth.uid()
  )
);

-- Fix 3: Add storage policy for signed URL access (authenticated users can read approved content files)
-- First, clean up any existing policies that might conflict
DROP POLICY IF EXISTS "Authenticated users can view approved content files" ON storage.objects;

-- Users can only access files from approved content via signed URLs
CREATE POLICY "Authenticated users can view approved content files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'content-files' 
  AND (
    -- Check if this file belongs to approved content
    EXISTS (
      SELECT 1 FROM public.content 
      WHERE status = 'approved' 
      AND (
        file_url LIKE '%' || name 
        OR cover_image_url LIKE '%' || name
      )
    )
    -- Or the user owns this file (contributors can access their own uploads)
    OR (storage.foldername(name))[1] = auth.uid()::text
  )
);