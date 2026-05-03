
-- 1) Recreate view without SECURITY DEFINER (use security_invoker)
DROP VIEW IF EXISTS public.teacher_public_view;
CREATE VIEW public.teacher_public_view
WITH (security_invoker = true) AS
SELECT tp.id, tp.slug, tp.image_url, tp.cover_image_url, tp.headline, tp.bio,
       tp.experience_years, tp.rating, tp.total_reviews, tp.total_students,
       p.full_name
FROM public.teacher_profiles tp
LEFT JOIN public.profiles p ON tp.user_id = p.user_id
WHERE tp.is_available = true;

-- 2) Drop broad SELECT policies on public buckets (public URL access still works)
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public read lesson-assets" ON storage.objects;
DROP POLICY IF EXISTS "Public read logo" ON storage.objects;
DROP POLICY IF EXISTS "Public read website-assets" ON storage.objects;

-- 3) Tighten lesson-assets update/delete to teacher's own folder
DROP POLICY IF EXISTS "Teachers update lesson-assets" ON storage.objects;
DROP POLICY IF EXISTS "Teachers delete lesson-assets" ON storage.objects;

CREATE POLICY "Teachers update own lesson-assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'lesson-assets'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR (
      (has_role(auth.uid(), 'teacher'::app_role) OR has_role(auth.uid(), 'senior_teacher'::app_role))
      AND (storage.foldername(name))[1] = auth.uid()::text
    )
  )
);

CREATE POLICY "Teachers delete own lesson-assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'lesson-assets'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR (
      (has_role(auth.uid(), 'teacher'::app_role) OR has_role(auth.uid(), 'senior_teacher'::app_role))
      AND (storage.foldername(name))[1] = auth.uid()::text
    )
  )
);

-- Also scope upload to teacher's own folder
DROP POLICY IF EXISTS "Teachers upload lesson-assets" ON storage.objects;
CREATE POLICY "Teachers upload own lesson-assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'lesson-assets'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR (
      (has_role(auth.uid(), 'teacher'::app_role) OR has_role(auth.uid(), 'senior_teacher'::app_role))
      AND (storage.foldername(name))[1] = auth.uid()::text
    )
  )
);

-- 4) Meetings: allow teachers to view meetings for their assigned bookings
CREATE POLICY "Teachers can view meetings for assigned bookings"
ON public.meetings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = meetings.booking_id AND b.teacher_id = auth.uid()
  )
);

-- 5) Contact submissions: validate payload size to prevent abuse
CREATE OR REPLACE FUNCTION public.validate_contact_submission()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.data IS NULL OR jsonb_typeof(NEW.data) <> 'object' THEN
    RAISE EXCEPTION 'Invalid submission payload';
  END IF;
  IF length(NEW.data::text) > 10000 THEN
    RAISE EXCEPTION 'Submission payload too large';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_contact_submission_trg ON public.contact_submissions;
CREATE TRIGGER validate_contact_submission_trg
BEFORE INSERT ON public.contact_submissions
FOR EACH ROW EXECUTE FUNCTION public.validate_contact_submission();

-- 6) Restrict EXECUTE on SECURITY DEFINER helpers
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_teacher(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_teacher(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_senior_teacher(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_senior_teacher(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_exercise_answers(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_exercise_answers(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.grade_exercise(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.grade_exercise(uuid, jsonb) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_lesson_exercises(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_lesson_exercises(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_leaderboard(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_leaderboard(integer) TO authenticated;
