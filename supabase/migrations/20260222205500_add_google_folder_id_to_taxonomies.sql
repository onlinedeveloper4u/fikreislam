-- Add google_folder_id to taxonomies table for more reliable storage sync
ALTER TABLE public.taxonomies
ADD COLUMN IF NOT EXISTS google_folder_id TEXT;
