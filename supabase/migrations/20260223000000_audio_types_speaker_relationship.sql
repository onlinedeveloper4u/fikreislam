-- Migration to establish one-to-many relationship between speakers and audio_types

-- 1. Add speaker_id column to audio_types
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'audio_types' AND COLUMN_NAME = 'speaker_id') THEN
        ALTER TABLE public.audio_types ADD COLUMN speaker_id UUID REFERENCES public.speakers(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 2. Drop the global UNIQUE constraint on name
ALTER TABLE public.audio_types DROP CONSTRAINT IF EXISTS audio_types_name_key;

-- 3. Add composite UNIQUE constraint for speaker_id and name
-- First, ensure there are no existing duplicates that would violate this (highly unlikely if it was globally unique before, but good practice)
ALTER TABLE public.audio_types ADD CONSTRAINT audio_types_speaker_id_name_key UNIQUE (speaker_id, name);
