
-- Revert column-level revoke
GRANT SELECT (correct_answers, explanation) ON public.exercises TO authenticated;

-- Drop overly-broad public policy
DROP POLICY IF EXISTS "Anyone can view exercises of published lessons" ON public.exercises;

-- Teachers can SELECT exercises of their own lessons (for grading UI)
CREATE POLICY "Teachers can view exercises of own lessons"
ON public.exercises
FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.lessons l WHERE l.id = exercises.lesson_id AND l.teacher_id = auth.uid())
);

-- Public-safe RPC: list exercises for a published lesson WITHOUT correct_answers/explanation
CREATE OR REPLACE FUNCTION public.get_lesson_exercises(_lesson_id uuid)
RETURNS TABLE (
  id uuid,
  lesson_id uuid,
  exercise_type text,
  title text,
  title_vi text,
  instructions text,
  instructions_vi text,
  content jsonb,
  audio_url text,
  requires_grading boolean,
  order_index integer,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    e.id, e.lesson_id, e.exercise_type, e.title, e.title_vi,
    e.instructions, e.instructions_vi, e.content, e.audio_url,
    e.requires_grading, e.order_index, e.created_at, e.updated_at
  FROM public.exercises e
  JOIN public.lessons l ON l.id = e.lesson_id
  WHERE e.lesson_id = _lesson_id
    AND l.is_published = true
  ORDER BY e.order_index ASC;
$$;
REVOKE EXECUTE ON FUNCTION public.get_lesson_exercises(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_lesson_exercises(uuid) TO anon, authenticated;
