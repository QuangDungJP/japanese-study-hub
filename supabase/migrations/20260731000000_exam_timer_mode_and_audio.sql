-- Migration: Add timer_mode to exams table and create exam-audio storage bucket
-- Date: 2026-07-31

-- 1. Add timer_mode column to exams table
ALTER TABLE public.exams
  ADD COLUMN IF NOT EXISTS timer_mode TEXT NOT NULL DEFAULT 'countdown'
    CHECK (timer_mode IN ('none', 'stopwatch', 'countdown'));

-- 2. Create exam-audio storage bucket (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'exam-audio',
  'exam-audio',
  true,
  52428800,  -- 50MB limit
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/webm', 'audio/flac']
)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage policy: authenticated users can upload
CREATE POLICY "Authenticated users can upload exam audio"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'exam-audio');

-- 4. Storage policy: public can read exam audio
CREATE POLICY "Public can view exam audio"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'exam-audio');

-- 5. Storage policy: teachers can delete their own audio
CREATE POLICY "Authenticated users can delete exam audio"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'exam-audio');
