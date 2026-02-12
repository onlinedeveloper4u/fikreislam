-- Add preferred_language column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT 'ur';

-- Update existing profiles to default to 'ur' if they don't have one
UPDATE public.profiles 
SET preferred_language = 'ur' 
WHERE preferred_language IS NULL;
