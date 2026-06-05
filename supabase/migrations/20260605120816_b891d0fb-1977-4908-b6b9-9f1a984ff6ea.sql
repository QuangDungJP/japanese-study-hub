ALTER TABLE public.exam_attempts 
  ADD COLUMN IF NOT EXISTS student_comment text,
  ADD COLUMN IF NOT EXISTS attachment_url text,
  ADD COLUMN IF NOT EXISTS attachment_name text,
  ADD COLUMN IF NOT EXISTS video_url text;