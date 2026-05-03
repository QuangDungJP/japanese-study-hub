
-- class_assignments
CREATE TABLE IF NOT EXISTS public.class_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  file_url text,
  link_url text,
  due_date timestamptz,
  lesson_id uuid,
  exercise_id uuid,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.class_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage class_assignments" ON public.class_assignments
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers manage assignments of own classes" ON public.class_assignments
  FOR ALL USING (public.is_class_teacher(class_id, auth.uid()));

CREATE POLICY "Students view assignments of enrolled classes" ON public.class_assignments
  FOR SELECT USING (public.is_class_student(class_id, auth.uid()));

CREATE TRIGGER trg_class_assignments_updated_at
  BEFORE UPDATE ON public.class_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Group lessons & vocabulary into classes
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS class_id uuid;
ALTER TABLE public.vocabulary ADD COLUMN IF NOT EXISTS class_id uuid;

CREATE INDEX IF NOT EXISTS idx_lessons_class_id ON public.lessons(class_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_class_id ON public.vocabulary(class_id);
CREATE INDEX IF NOT EXISTS idx_class_assignments_class_id ON public.class_assignments(class_id);

-- Storage bucket for class assignments
INSERT INTO storage.buckets (id, name, public)
VALUES ('class-assignments', 'class-assignments', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read class assignments"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'class-assignments');

CREATE POLICY "Authenticated upload class assignments"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'class-assignments' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated update class assignments"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'class-assignments' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated delete class assignments"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'class-assignments' AND auth.role() = 'authenticated');
