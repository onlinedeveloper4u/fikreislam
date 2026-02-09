-- Create content analytics table
CREATE TABLE public.content_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
  user_id UUID,
  action_type TEXT NOT NULL CHECK (action_type IN ('view', 'download', 'play')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.content_analytics ENABLE ROW LEVEL SECURITY;

-- Anyone can insert analytics (for tracking views/downloads)
CREATE POLICY "Anyone can track content actions"
ON public.content_analytics
FOR INSERT
WITH CHECK (true);

-- Only admins can view all analytics
CREATE POLICY "Admins can view all analytics"
ON public.content_analytics
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Contributors can view analytics for their own content
CREATE POLICY "Contributors can view analytics for own content"
ON public.content_analytics
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.content
    WHERE content.id = content_analytics.content_id
    AND content.contributor_id = auth.uid()
  )
);

-- Create index for performance
CREATE INDEX idx_content_analytics_content_id ON public.content_analytics(content_id);
CREATE INDEX idx_content_analytics_created_at ON public.content_analytics(created_at);