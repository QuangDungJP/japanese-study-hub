-- Columns the frontend already reads/writes but that never existed in the database.
-- Every insert/update touching them failed with 42703 "column does not exist":
--   * lessons.slide_url / document_url  -> creating/editing a lesson in a class failed
--   * exam_attempts.metadata             -> JLPT mock exam submissions were never saved
--   * exam_attempts.graded_at            -> grading quiz/exam attempts failed
--   * class_students.evaluation_*        -> end-of-course student evaluation failed

ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS slide_url text,
  ADD COLUMN IF NOT EXISTS document_url text;

ALTER TABLE public.exam_attempts
  ADD COLUMN IF NOT EXISTS metadata jsonb,
  ADD COLUMN IF NOT EXISTS graded_at timestamptz;

ALTER TABLE public.class_students
  ADD COLUMN IF NOT EXISTS evaluation_result text,
  ADD COLUMN IF NOT EXISTS evaluation_grade text,
  ADD COLUMN IF NOT EXISTS evaluation_comment text,
  ADD COLUMN IF NOT EXISTS evaluated_at timestamptz,
  ADD COLUMN IF NOT EXISTS evaluated_by uuid;

NOTIFY pgrst, 'reload schema';
