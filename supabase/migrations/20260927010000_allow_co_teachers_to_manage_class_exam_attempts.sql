-- Co-teachers have the same CRUD access to assessments inside an assigned class.
-- Teacher membership itself remains controlled by the admin-only class_teachers policy.

DROP POLICY IF EXISTS "Class teachers can manage class exams" ON public.exams;
CREATE POLICY "Class teachers can manage class exams"
ON public.exams FOR ALL TO authenticated
USING (
  class_id IS NOT NULL
  AND public.is_class_teacher(class_id, auth.uid())
)
WITH CHECK (
  class_id IS NOT NULL
  AND public.is_class_teacher(class_id, auth.uid())
);

DROP POLICY IF EXISTS "Class teachers can manage exam registrations" ON public.exam_registrations;
CREATE POLICY "Class teachers can manage exam registrations"
ON public.exam_registrations FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.exams e
    WHERE e.id = exam_registrations.exam_id
      AND e.class_id IS NOT NULL
      AND public.is_class_teacher(e.class_id, auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.exams e
    WHERE e.id = exam_registrations.exam_id
      AND e.class_id IS NOT NULL
      AND public.is_class_teacher(e.class_id, auth.uid())
  )
);

DROP POLICY IF EXISTS "teacher view attempts of own exams" ON public.exam_attempts;
DROP POLICY IF EXISTS "Class teachers manage class exam attempts" ON public.exam_attempts;
CREATE POLICY "Class teachers manage class exam attempts"
ON public.exam_attempts FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.exams e
    WHERE e.id = exam_attempts.exam_id
      AND e.class_id IS NOT NULL
      AND public.is_class_teacher(e.class_id, auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.exams e
    WHERE e.id = exam_attempts.exam_id
      AND e.class_id IS NOT NULL
      AND public.is_class_teacher(e.class_id, auth.uid())
  )
);
