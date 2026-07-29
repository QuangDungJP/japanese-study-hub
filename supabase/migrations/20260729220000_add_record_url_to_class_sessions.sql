-- Migration: Add record_url column to class_sessions for storing class video recording URLs/files
ALTER TABLE public.class_sessions ADD COLUMN IF NOT EXISTS record_url text;
