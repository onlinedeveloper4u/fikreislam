-- Create a public view for approved content that excludes sensitive fields
-- This provides an additional layer of security for public content access

CREATE OR REPLACE VIEW public.content_public AS
SELECT 
  id, 
  type, 
  title, 
  description, 
  author, 
  language, 
  tags,
  file_url, 
  cover_image_url, 
  status, 
  published_at, 
  created_at
FROM public.content
WHERE status = 'approved';

-- Grant access to the view
GRANT SELECT ON public.content_public TO anon, authenticated;

-- Add a comment explaining the view's purpose
COMMENT ON VIEW public.content_public IS 'Public view of approved content excluding sensitive fields like contributor_id and admin_notes';