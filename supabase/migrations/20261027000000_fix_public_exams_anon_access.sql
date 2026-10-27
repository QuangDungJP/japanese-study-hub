-- Anonymous visitors of /thi-thu got "permission denied for function is_class_student" (HTTP 401):
-- Postgres evaluates every SELECT policy that applies to the role, and EXECUTE on
-- has_role / is_class_student is revoked from anon. Restrict those policies to signed-in
-- users so anon is only checked against "Anyone can view public exams".

DROP POLICY IF EXISTS "Admins can manage all exams" ON public.exams;
CREATE POLICY "Admins can manage all exams" ON public.exams
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Students view published exams for their classes" ON public.exams;
CREATE POLICY "Students view published exams for their classes" ON public.exams
  FOR SELECT TO authenticated
  USING (is_published = true AND class_id IS NOT NULL AND public.is_class_student(class_id, auth.uid()));

DROP POLICY IF EXISTS "Teachers can manage own exams" ON public.exams;
CREATE POLICY "Teachers can manage own exams" ON public.exams
  FOR ALL TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

DROP POLICY IF EXISTS "Anyone can view public exams" ON public.exams;
CREATE POLICY "Anyone can view public exams" ON public.exams
  FOR SELECT TO anon, authenticated
  USING (is_public = true);
