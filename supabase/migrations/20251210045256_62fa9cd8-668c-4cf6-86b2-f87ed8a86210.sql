
-- Create content status enum
CREATE TYPE public.content_status AS ENUM ('pending', 'approved', 'rejected');

-- Create content type enum
CREATE TYPE public.content_type AS ENUM ('book', 'audio', 'video');

-- Create content table (unified for all content types)
CREATE TABLE public.content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contributor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type content_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  author TEXT,
  language TEXT DEFAULT 'English',
  tags TEXT[] DEFAULT '{}',
  file_url TEXT,
  cover_image_url TEXT,
  status content_status NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  published_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;

-- Users can view only approved content
CREATE POLICY "Users can view approved content"
ON public.content
FOR SELECT
USING (status = 'approved');

-- Contributors can view their own content (any status)
CREATE POLICY "Contributors can view own content"
ON public.content
FOR SELECT
USING (auth.uid() = contributor_id);

-- Contributors can insert content (pending by default)
CREATE POLICY "Contributors can insert content"
ON public.content
FOR INSERT
WITH CHECK (
  auth.uid() = contributor_id 
  AND has_role(auth.uid(), 'contributor')
);

-- Contributors can update their own pending/rejected content
CREATE POLICY "Contributors can update own pending content"
ON public.content
FOR UPDATE
USING (
  auth.uid() = contributor_id 
  AND status IN ('pending', 'rejected')
);

-- Admins can view all content
CREATE POLICY "Admins can view all content"
ON public.content
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Admins can update any content (for approval)
CREATE POLICY "Admins can update all content"
ON public.content
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Admins can delete content
CREATE POLICY "Admins can delete content"
ON public.content
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Contributors can delete their own pending content
CREATE POLICY "Contributors can delete own pending content"
ON public.content
FOR DELETE
USING (
  auth.uid() = contributor_id 
  AND status = 'pending'
);

-- Create trigger for updated_at
CREATE TRIGGER update_content_updated_at
BEFORE UPDATE ON public.content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for content files
INSERT INTO storage.buckets (id, name, public) VALUES ('content-files', 'content-files', true);

-- Storage policies
CREATE POLICY "Anyone can view content files"
ON storage.objects FOR SELECT
USING (bucket_id = 'content-files');

CREATE POLICY "Contributors can upload content files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'content-files' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Contributors can update own files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'content-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can delete content files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'content-files'
);
