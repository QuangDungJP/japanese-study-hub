CREATE TABLE IF NOT EXISTS public.course_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  value text NOT NULL UNIQUE,
  label text NOT NULL,
  label_vi text NOT NULL,
  description text,
  description_vi text,
  color text DEFAULT '#3b82f6',
  order_index int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.course_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active course levels"
  ON public.course_levels FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage course levels"
  ON public.course_levels FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_course_levels_updated_at
  BEFORE UPDATE ON public.course_levels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.course_levels (value, label, label_vi, order_index) VALUES
  ('N5', 'JLPT N5 - Beginner', 'JLPT N5 - Cơ bản', 1),
  ('N4', 'JLPT N4 - Elementary', 'JLPT N4 - Sơ cấp', 2),
  ('N3', 'JLPT N3 - Intermediate', 'JLPT N3 - Trung cấp', 3),
  ('N2', 'JLPT N2 - Upper Intermediate', 'JLPT N2 - Cao cấp', 4),
  ('N1', 'JLPT N1 - Advanced', 'JLPT N1 - Thành thạo', 5)
ON CONFLICT (value) DO NOTHING;