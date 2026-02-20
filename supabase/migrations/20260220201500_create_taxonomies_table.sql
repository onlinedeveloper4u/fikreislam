-- Create enum for taxonomy types if it doesn't exist
DO $$ BEGIN
    CREATE TYPE taxonomy_type AS ENUM ('speaker', 'language', 'audio_type', 'category');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create taxonomies table
CREATE TABLE IF NOT EXISTS public.taxonomies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type taxonomy_type NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(type, name)
);

-- Enable RLS
ALTER TABLE public.taxonomies ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view taxonomies" 
ON public.taxonomies FOR SELECT 
USING (true);

-- Assuming only admins or authenticated users can manage for now.
-- In a real scenario, this might be restricted to 'admin' role. 
-- For simplicity, allowing authenticated users to add based on your previous policies.
CREATE POLICY "Authenticated users can insert taxonomies"
ON public.taxonomies FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can update taxonomies"
ON public.taxonomies FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete taxonomies"
ON public.taxonomies FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_taxonomies_updated_at
BEFORE UPDATE ON public.taxonomies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
