
-- 1. lesson_materials table
CREATE TABLE IF NOT EXISTS public.lesson_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid REFERENCES public.lessons(id) ON DELETE CASCADE,
  class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  file_url text NOT NULL,
  file_type text NOT NULL DEFAULT 'other',
  file_size bigint,
  order_index int NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.lesson_materials TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_materials TO authenticated;
GRANT ALL ON public.lesson_materials TO service_role;
ALTER TABLE public.lesson_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone read published materials" ON public.lesson_materials
  FOR SELECT USING (is_published = true);
CREATE POLICY "teacher manage own materials" ON public.lesson_materials
  FOR ALL USING (teacher_id = auth.uid()) WITH CHECK (teacher_id = auth.uid());
CREATE POLICY "admin manage all materials" ON public.lesson_materials
  FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_lesson_materials_updated BEFORE UPDATE ON public.lesson_materials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Augment exams
ALTER TABLE public.exams
  ADD COLUMN IF NOT EXISTS starts_at timestamptz,
  ADD COLUMN IF NOT EXISTS ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS lock_after_end boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS shuffle_questions boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS max_attempts int NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS instructions text,
  ADD COLUMN IF NOT EXISTS video_url text;

-- 3. exam_attempts table
CREATE TABLE IF NOT EXISTS public.exam_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz,
  time_spent_seconds int NOT NULL DEFAULT 0,
  score int,
  total int,
  answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'in_progress',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.exam_attempts TO authenticated;
GRANT ALL ON public.exam_attempts TO service_role;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student manage own attempts" ON public.exam_attempts
  FOR ALL USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());
CREATE POLICY "teacher view attempts of own exams" ON public.exam_attempts
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.exams e WHERE e.id = exam_id AND e.teacher_id = auth.uid()));
CREATE POLICY "admin all attempts" ON public.exam_attempts
  FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_exam_attempts_updated BEFORE UPDATE ON public.exam_attempts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_exam_attempts_exam ON public.exam_attempts(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_student ON public.exam_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_lesson_materials_lesson ON public.lesson_materials(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_materials_class ON public.lesson_materials(class_id);
