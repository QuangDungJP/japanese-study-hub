ALTER TABLE public.exam_attempts
  ADD COLUMN IF NOT EXISTS review_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS teacher_feedback text,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;