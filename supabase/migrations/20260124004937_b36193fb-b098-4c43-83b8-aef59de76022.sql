-- Add thumbnail_url, video_url, and content_html columns to lessons table
ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS content_html TEXT;