-- Add audio metadata columns to content table
ALTER TABLE public.content 
ADD COLUMN IF NOT EXISTS duration TEXT,
ADD COLUMN IF NOT EXISTS venue TEXT,
ADD COLUMN IF NOT EXISTS hijri_date TEXT,
ADD COLUMN IF NOT EXISTS lecture_date DATE,
ADD COLUMN IF NOT EXISTS speaker TEXT,
ADD COLUMN IF NOT EXISTS audio_type TEXT,
ADD COLUMN IF NOT EXISTS categories TEXT[] DEFAULT '{}';

-- Update RLS if needed (usually columns don't need explicit RLS if table-level policy exists)
-- The existing policies should already cover these new columns.
