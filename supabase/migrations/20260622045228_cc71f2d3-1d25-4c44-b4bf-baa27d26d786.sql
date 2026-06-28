
-- Revoke public execute from all SECURITY DEFINER functions, then grant narrowly

-- Internal RLS / trigger helpers: revoke from anon, keep authenticated (needed for RLS evaluation)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_teacher(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_senior_teacher(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_class_teacher(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_class_student(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.teacher_has_student(uuid, uuid) FROM PUBLIC, anon;

-- Client RPCs: restrict to signed-in users
REVOKE EXECUTE ON FUNCTION public.grade_exercise(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.grade_exercise(uuid, jsonb) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_exercise_answers(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_exercise_answers(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_lesson_exercises(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_lesson_exercises(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_leaderboard(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_leaderboard(integer) TO authenticated;

-- Trigger-only functions: should never be called by clients
REVOKE EXECUTE ON FUNCTION public.set_course_slug() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_event_slug() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_class_slug() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_contact_submission() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
