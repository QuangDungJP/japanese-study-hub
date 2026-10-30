-- Fix: teachers (incl. co-teachers via class_teachers) could not read student profiles -> names showed "N/A" / "Học viên".
-- profiles RLS only allowed own/admin/moderator. Add a teacher-scoped SELECT policy via a SECURITY DEFINER helper.
CREATE OR REPLACE FUNCTION public.can_teacher_view_profile(_target uuid, _viewer uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT _viewer IS NOT NULL AND (
    -- student enrolled in a class the viewer teaches (owner or co-teacher)
    EXISTS (SELECT 1 FROM public.class_students cs
            WHERE cs.student_id = _target AND public.is_class_teacher(cs.class_id, _viewer))
    -- fellow teacher (owner or co-teacher) of a class the viewer teaches
    OR EXISTS (SELECT 1 FROM public.class_teachers ct
               WHERE ct.teacher_id = _target AND public.is_class_teacher(ct.class_id, _viewer))
    OR EXISTS (SELECT 1 FROM public.classes c
               WHERE c.teacher_id = _target AND public.is_class_teacher(c.id, _viewer))
  );
$$;
REVOKE EXECUTE ON FUNCTION public.can_teacher_view_profile(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_teacher_view_profile(uuid, uuid) TO authenticated;

DROP POLICY IF EXISTS "Class teachers can view class member profiles" ON public.profiles;
CREATE POLICY "Class teachers can view class member profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.can_teacher_view_profile(user_id, (SELECT auth.uid())));

CREATE INDEX IF NOT EXISTS idx_class_students_student_id ON public.class_students(student_id);
CREATE INDEX IF NOT EXISTS idx_class_teachers_teacher_id ON public.class_teachers(teacher_id);
