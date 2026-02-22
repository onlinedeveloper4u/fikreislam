-- Migration to drop the legacy taxonomies table and add google_folder_id to audio_types

-- 1. Add google_folder_id to audio_types
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'audio_types' AND COLUMN_NAME = 'google_folder_id') THEN
        ALTER TABLE public.audio_types ADD COLUMN google_folder_id TEXT;
    END IF;
END $$;

-- 2. Drop the legacy taxonomies table
-- WARNING: This is a destructive action, but requested by the user after data migration.
DROP TABLE IF EXISTS public.taxonomies;

-- 3. Update existing policies if necessary (though they already use auth.uid() and has_role)
-- No changes needed to policies for audio_types as the previous migration handled them.
