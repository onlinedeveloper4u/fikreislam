-- 1. Create separate tables for each taxonomy type
CREATE TABLE IF NOT EXISTS public.speakers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    google_folder_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.languages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.audio_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 2. Migrate existing data from taxonomies table
INSERT INTO public.speakers (name, google_folder_id, created_at, updated_at)
SELECT name, google_folder_id, created_at, updated_at 
FROM public.taxonomies 
WHERE type = 'speaker'
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.languages (name, created_at, updated_at)
SELECT name, created_at, updated_at 
FROM public.taxonomies 
WHERE type = 'language'
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.audio_types (name, created_at, updated_at)
SELECT name, created_at, updated_at 
FROM public.taxonomies 
WHERE type = 'audio_type'
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.categories (name, created_at, updated_at)
SELECT name, created_at, updated_at 
FROM public.taxonomies 
WHERE type = 'category'
ON CONFLICT (name) DO NOTHING;

-- 3. Enable RLS and create policies
ALTER TABLE public.speakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audio_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Policies for speakers
CREATE POLICY "Anyone can view speakers" ON public.speakers FOR SELECT USING (true);
CREATE POLICY "Admins can manage speakers" ON public.speakers FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Policies for languages
CREATE POLICY "Anyone can view languages" ON public.languages FOR SELECT USING (true);
CREATE POLICY "Admins can manage languages" ON public.languages FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Policies for audio_types
CREATE POLICY "Anyone can view audio_types" ON public.audio_types FOR SELECT USING (true);
CREATE POLICY "Admins can manage audio_types" ON public.audio_types FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Policies for categories
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));

-- 4. Create updated_at triggers
CREATE TRIGGER update_speakers_updated_at BEFORE UPDATE ON public.speakers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_languages_updated_at BEFORE UPDATE ON public.languages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_audio_types_updated_at BEFORE UPDATE ON public.audio_types FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
