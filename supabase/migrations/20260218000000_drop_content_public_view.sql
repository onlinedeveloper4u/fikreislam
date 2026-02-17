-- Drop the content_public view
-- The application now queries the content table directly with status='approved' filter
-- This view is no longer needed

DROP VIEW IF EXISTS public.content_public;
