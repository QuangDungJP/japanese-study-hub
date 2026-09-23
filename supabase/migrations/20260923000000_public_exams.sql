-- Add is_public column to exams table
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- Update RLS for public exams
-- We want to allow SELECT on exams where is_public = true to ALL users (even anonymous)
DROP POLICY IF EXISTS "Anyone can view public exams" ON public.exams;
CREATE POLICY "Anyone can view public exams" 
  ON public.exams 
  FOR SELECT 
  USING (is_public = true);

-- We also need to ensure that anonymous users can read exam_questions for public exams
DROP POLICY IF EXISTS "Anyone can view questions of public exams" ON public.exam_questions;
CREATE POLICY "Anyone can view questions of public exams"
  ON public.exam_questions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.exams 
      WHERE id = exam_questions.exam_id AND is_public = true
    )
  );
