-- Fix the SECURITY DEFINER view issue by recreating as SECURITY INVOKER
DROP VIEW IF EXISTS public.content_public;

CREATE VIEW public.content_public
WITH (security_invoker = true)
AS
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
COMMENT ON VIEW public.content_public IS 'Public view of approved content excluding sensitive fields like contributor_id and admin_notes. Uses security_invoker=true to respect RLS policies.';