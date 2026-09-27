-- Give assigned teachers the same classroom capabilities as the primary teacher.
-- Teacher assignment itself remains an admin-only operation.

CREATE OR REPLACE FUNCTION public.is_class_teacher(_class_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.classes
    WHERE id = _class_id AND teacher_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.class_teachers
    WHERE class_id = _class_id AND teacher_id = _user_id
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_class_teacher(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_class_teacher(uuid, uuid) TO authenticated;

-- Only admins can add, remove, or replace teachers on a class.
DROP POLICY IF EXISTS "Admins can manage class_teachers" ON public.class_teachers;
DROP POLICY IF EXISTS "Teachers can view their class_teachers" ON public.class_teachers;
DROP POLICY IF EXISTS "Primary teachers can insert/delete class_teachers" ON public.class_teachers;

CREATE POLICY "Admins can manage class_teachers"
ON public.class_teachers FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Class teachers can view teaching team"
ON public.class_teachers FOR SELECT TO authenticated
USING (public.is_class_teacher(class_id, auth.uid()));

CREATE OR REPLACE FUNCTION public.protect_class_primary_teacher()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND OLD.teacher_id IS DISTINCT FROM NEW.teacher_id
     AND NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Only admins can change the primary teacher of a class';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_class_primary_teacher_trigger ON public.classes;
CREATE TRIGGER protect_class_primary_teacher_trigger
BEFORE UPDATE OF teacher_id ON public.classes
FOR EACH ROW EXECUTE FUNCTION public.protect_class_primary_teacher();

DROP POLICY IF EXISTS "Teachers can manage own classes" ON public.classes;
DROP POLICY IF EXISTS "Co-teachers can view assigned classes" ON public.classes;

CREATE POLICY "Class teachers can view classes"
ON public.classes FOR SELECT TO authenticated
USING (public.is_class_teacher(id, auth.uid()));

CREATE POLICY "Class teachers can create classes"
ON public.classes FOR INSERT TO authenticated
WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Class teachers can update classes"
ON public.classes FOR UPDATE TO authenticated
USING (public.is_class_teacher(id, auth.uid()))
WITH CHECK (public.is_class_teacher(id, auth.uid()));

CREATE POLICY "Class teachers can delete classes"
ON public.classes FOR DELETE TO authenticated
USING (public.is_class_teacher(id, auth.uid()));

-- Content tables that previously checked only the creator's teacher_id.
DROP POLICY IF EXISTS "Class teachers can manage class lessons" ON public.lessons;
CREATE POLICY "Class teachers can manage class lessons"
ON public.lessons FOR ALL TO authenticated
USING (class_id IS NOT NULL AND public.is_class_teacher(class_id, auth.uid()))
WITH CHECK (class_id IS NOT NULL AND public.is_class_teacher(class_id, auth.uid()));

DROP POLICY IF EXISTS "Class teachers can manage class exercises" ON public.exercises;
CREATE POLICY "Class teachers can manage class exercises"
ON public.exercises FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.lessons l
  WHERE l.id = exercises.lesson_id AND l.class_id IS NOT NULL
    AND public.is_class_teacher(l.class_id, auth.uid())
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.lessons l
  WHERE l.id = exercises.lesson_id AND l.class_id IS NOT NULL
    AND public.is_class_teacher(l.class_id, auth.uid())
));

DROP POLICY IF EXISTS "Class teachers can manage class vocabulary" ON public.vocabulary;
CREATE POLICY "Class teachers can manage class vocabulary"
ON public.vocabulary FOR ALL TO authenticated
USING (class_id IS NOT NULL AND public.is_class_teacher(class_id, auth.uid()))
WITH CHECK (class_id IS NOT NULL AND public.is_class_teacher(class_id, auth.uid()));

DROP POLICY IF EXISTS "Class teachers can manage class exams" ON public.exams;
CREATE POLICY "Class teachers can manage class exams"
ON public.exams FOR ALL TO authenticated
USING (class_id IS NOT NULL AND public.is_class_teacher(class_id, auth.uid()))
WITH CHECK (class_id IS NOT NULL AND public.is_class_teacher(class_id, auth.uid()));

DROP POLICY IF EXISTS "Class teachers can manage exam registrations" ON public.exam_registrations;
CREATE POLICY "Class teachers can manage exam registrations"
ON public.exam_registrations FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.exams e
  WHERE e.id = exam_registrations.exam_id AND e.class_id IS NOT NULL
    AND public.is_class_teacher(e.class_id, auth.uid())
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.exams e
  WHERE e.id = exam_registrations.exam_id AND e.class_id IS NOT NULL
    AND public.is_class_teacher(e.class_id, auth.uid())
));

DROP POLICY IF EXISTS "Class teachers can view lesson submissions" ON public.student_submissions;
CREATE POLICY "Class teachers can view lesson submissions"
ON public.student_submissions FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.exercises e
  JOIN public.lessons l ON l.id = e.lesson_id
  WHERE e.id = student_submissions.exercise_id AND l.class_id IS NOT NULL
    AND public.is_class_teacher(l.class_id, auth.uid())
));

DROP POLICY IF EXISTS "Class teachers can grade lesson submissions" ON public.student_submissions;
CREATE POLICY "Class teachers can grade lesson submissions"
ON public.student_submissions FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.exercises e
  JOIN public.lessons l ON l.id = e.lesson_id
  WHERE e.id = student_submissions.exercise_id AND l.class_id IS NOT NULL
    AND public.is_class_teacher(l.class_id, auth.uid())
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.exercises e
  JOIN public.lessons l ON l.id = e.lesson_id
  WHERE e.id = student_submissions.exercise_id AND l.class_id IS NOT NULL
    AND public.is_class_teacher(l.class_id, auth.uid())
));

DROP POLICY IF EXISTS "Teachers & Admins can manage class email settings" ON public.class_email_settings;
CREATE POLICY "Class teachers and admins manage class email settings"
ON public.class_email_settings FOR ALL TO authenticated
USING (
  public.is_class_teacher(class_id, auth.uid())
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
)
WITH CHECK (
  public.is_class_teacher(class_id, auth.uid())
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE OR REPLACE FUNCTION public.teacher_has_student(_teacher_id uuid, _student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.class_students cs
    WHERE cs.student_id = _student_id
      AND public.is_class_teacher(cs.class_id, _teacher_id)
  );
$$;

REVOKE EXECUTE ON FUNCTION public.teacher_has_student(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.teacher_has_student(uuid, uuid) TO authenticated;
