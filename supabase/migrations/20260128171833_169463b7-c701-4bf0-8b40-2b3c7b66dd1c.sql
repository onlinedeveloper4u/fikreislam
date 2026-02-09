-- Create questions table
CREATE TABLE public.questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content_type public.content_type NOT NULL,
  question TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create answers table with approval workflow
CREATE TABLE public.answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  answered_by UUID NOT NULL,
  answer TEXT NOT NULL,
  status public.content_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;

-- Questions policies: Anyone authenticated can ask, everyone can view
CREATE POLICY "Anyone can view questions"
ON public.questions FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can ask questions"
ON public.questions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own questions"
ON public.questions FOR DELETE
USING (auth.uid() = user_id);

-- Answers policies
CREATE POLICY "Anyone can view approved answers"
ON public.answers FOR SELECT
USING (status = 'approved');

CREATE POLICY "Admins can view all answers"
ON public.answers FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Contributors can view own answers"
ON public.answers FOR SELECT
USING (auth.uid() = answered_by);

CREATE POLICY "Contributors can submit answers"
ON public.answers FOR INSERT
WITH CHECK (
  (auth.uid() = answered_by) AND 
  (has_role(auth.uid(), 'contributor') OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Admins can update all answers"
ON public.answers FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Contributors can update own pending answers"
ON public.answers FOR UPDATE
USING (auth.uid() = answered_by AND status = 'pending');

CREATE POLICY "Admins can delete answers"
ON public.answers FOR DELETE
USING (has_role(auth.uid(), 'admin'));