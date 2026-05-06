
-- 1) Restrict class-assignments bucket reads to admins, class teachers, and enrolled students
DROP POLICY IF EXISTS "Authenticated read class-assignments" ON storage.objects;

CREATE POLICY "Class members read class-assignments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'class-assignments'
  AND (
    -- Admins / teachers / senior teachers can always read
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'teacher')
    OR public.has_role(auth.uid(), 'senior_teacher')
    -- Students can read their own submission files: submissions/<user_id>/...
    OR (
      (storage.foldername(name))[1] = 'submissions'
      AND (storage.foldername(name))[2] = auth.uid()::text
    )
    -- Enrolled students can read assignment files for their classes: <class_id>/...
    OR (
      (storage.foldername(name))[1] IS DISTINCT FROM 'submissions'
      AND EXISTS (
        SELECT 1 FROM public.class_students cs
        WHERE cs.student_id = auth.uid()
          AND cs.class_id::text = (storage.foldername(name))[1]
      )
    )
  )
);

-- 2) Lock down SECURITY DEFINER helper functions that are not meant to be called via PostgREST
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.is_class_student(uuid, uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.is_class_teacher(uuid, uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.is_teacher(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.is_senior_teacher(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.teacher_has_student(uuid, uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;

-- Keep RPC-callable functions executable
GRANT EXECUTE ON FUNCTION public.get_leaderboard(integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_lesson_exercises(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.grade_exercise(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_exercise_answers(uuid) TO authenticated;

-- 3) Exercises: prevent answer key exposure via column privileges, allow enrolled students to read non-answer columns
REVOKE SELECT ON public.exercises FROM anon, authenticated;
GRANT SELECT (
  id, lesson_id, title, title_vi, exercise_type,
  instructions, instructions_vi, content, audio_url,
  requires_grading, order_index, created_at, updated_at
) ON public.exercises TO anon, authenticated;

DROP POLICY IF EXISTS "Enrolled students read exercises" ON public.exercises;
CREATE POLICY "Enrolled students read exercises"
ON public.exercises
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.class_assignments ca
    JOIN public.class_students cs ON cs.class_id = ca.class_id
    WHERE ca.exercise_id = exercises.id
      AND cs.student_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.lessons l
    WHERE l.id = exercises.lesson_id
      AND l.is_published = true
  )
);
