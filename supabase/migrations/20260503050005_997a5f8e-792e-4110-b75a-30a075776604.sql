
-- 1. EXERCISES: Hide correct_answers & explanation from clients
REVOKE SELECT (correct_answers, explanation) ON public.exercises FROM anon, authenticated;

-- RPC for teachers/admins to get answers (server-side)
CREATE OR REPLACE FUNCTION public.get_exercise_answers(_exercise_id uuid)
RETURNS TABLE (correct_answers jsonb, explanation jsonb)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') 
       OR public.has_role(auth.uid(), 'teacher') 
       OR public.has_role(auth.uid(), 'senior_teacher')) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  RETURN QUERY 
    SELECT e.correct_answers, e.explanation 
    FROM public.exercises e WHERE e.id = _exercise_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.get_exercise_answers(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_exercise_answers(uuid) TO authenticated;

-- RPC to grade a student's answers server-side and return score + explanation
CREATE OR REPLACE FUNCTION public.grade_exercise(_exercise_id uuid, _answers jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ex RECORD;
  correct jsonb;
  expl jsonb;
  score int := 0;
  total int := 0;
  i int;
  results jsonb := '[]'::jsonb;
  is_correct boolean;
BEGIN
  SELECT id, exercise_type, correct_answers, explanation 
    INTO ex 
    FROM public.exercises 
    WHERE id = _exercise_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'exercise not found';
  END IF;
  correct := COALESCE(ex.correct_answers, '[]'::jsonb);
  expl := COALESCE(ex.explanation, '[]'::jsonb);
  total := jsonb_array_length(correct);
  FOR i IN 0..GREATEST(total - 1, 0) LOOP
    is_correct := (correct -> i) = (_answers -> i);
    IF is_correct THEN score := score + 1; END IF;
    results := results || jsonb_build_object(
      'index', i,
      'correct', is_correct,
      'expected', correct -> i,
      'explanation', CASE WHEN jsonb_typeof(expl) = 'array' THEN expl -> i ELSE NULL END
    );
  END LOOP;
  RETURN jsonb_build_object('score', score, 'total', total, 'results', results);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.grade_exercise(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.grade_exercise(uuid, jsonb) TO authenticated;

-- 2. USER_PROGRESS: stop public exposure of user_ids; create anon leaderboard view
DROP POLICY IF EXISTS "Anyone can view progress for leaderboard" ON public.user_progress;

CREATE OR REPLACE VIEW public.leaderboard_view 
WITH (security_invoker = true) AS
SELECT 
  COALESCE(p.full_name, 'Học viên') AS display_name,
  LEFT(COALESCE(p.full_name, ''), 1) AS initial,
  up.total_xp,
  up.streak,
  up.lessons_completed,
  ROW_NUMBER() OVER (ORDER BY up.total_xp DESC) AS rank
FROM public.user_progress up
LEFT JOIN public.profiles p ON p.user_id = up.user_id
ORDER BY up.total_xp DESC
LIMIT 100;

-- View needs its own access; underlying user_progress RLS would block anon.
-- Provide a SECURITY DEFINER function instead for public leaderboard access:
CREATE OR REPLACE FUNCTION public.get_leaderboard(_limit int DEFAULT 10)
RETURNS TABLE (
  display_name text,
  initial text,
  total_xp int,
  streak int,
  lessons_completed int,
  rank bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COALESCE(p.full_name, 'Học viên') AS display_name,
    UPPER(LEFT(COALESCE(p.full_name, '?'), 1)) AS initial,
    up.total_xp,
    up.streak,
    up.lessons_completed,
    ROW_NUMBER() OVER (ORDER BY up.total_xp DESC) AS rank
  FROM public.user_progress up
  LEFT JOIN public.profiles p ON p.user_id = up.user_id
  ORDER BY up.total_xp DESC
  LIMIT GREATEST(LEAST(_limit, 100), 1);
$$;
REVOKE EXECUTE ON FUNCTION public.get_leaderboard(int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_leaderboard(int) TO anon, authenticated;

-- 3. EVENT_REGISTRATIONS: prevent impersonation
DROP POLICY IF EXISTS "Anyone can register for events" ON public.event_registrations;
CREATE POLICY "Anyone can register for events"
ON public.event_registrations
FOR INSERT
TO public
WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- 4. LOGO bucket policies
CREATE POLICY "Public read logo"
ON storage.objects FOR SELECT
USING (bucket_id = 'logo');

CREATE POLICY "Admins upload logo"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'logo' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update logo"
ON storage.objects FOR UPDATE
USING (bucket_id = 'logo' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete logo"
ON storage.objects FOR DELETE
USING (bucket_id = 'logo' AND public.has_role(auth.uid(), 'admin'));
