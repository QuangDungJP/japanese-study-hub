
-- 1. Enable RLS on teacher_portfolios
ALTER TABLE public.teacher_portfolios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view teacher portfolios"
  ON public.teacher_portfolios FOR SELECT USING (true);

CREATE POLICY "Admins manage all portfolios"
  ON public.teacher_portfolios FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers manage own portfolio"
  ON public.teacher_portfolios FOR ALL
  USING (teacher_id IN (
    SELECT id FROM public.teacher_profiles WHERE user_id = auth.uid()
  ));

-- 2. Enable RLS on teacher_events
ALTER TABLE public.teacher_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view teacher events"
  ON public.teacher_events FOR SELECT USING (true);

CREATE POLICY "Admins manage all teacher events"
  ON public.teacher_events FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers manage own events"
  ON public.teacher_events FOR ALL
  USING (teacher_id IN (
    SELECT id FROM public.teacher_profiles WHERE user_id = auth.uid()
  ));

-- 3. Enable RLS on teacher_reviews (also missing)
ALTER TABLE public.teacher_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view teacher reviews"
  ON public.teacher_reviews FOR SELECT USING (true);

CREATE POLICY "Admins manage all reviews"
  ON public.teacher_reviews FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students can create own reviews"
  ON public.teacher_reviews FOR INSERT
  WITH CHECK (student_id = auth.uid());

-- 4. Fix website-assets storage: drop overly permissive policies, add admin-only
DROP POLICY IF EXISTS "Auth upload website-assets" ON storage.objects;
DROP POLICY IF EXISTS "Auth update website-assets" ON storage.objects;
DROP POLICY IF EXISTS "Auth delete website-assets" ON storage.objects;

CREATE POLICY "Admins upload website-assets"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'website-assets' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update website-assets"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'website-assets' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete website-assets"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'website-assets' AND has_role(auth.uid(), 'admin'::app_role));

-- 5. Fix lesson-assets storage: restrict to admin/teacher roles
DROP POLICY IF EXISTS "Auth upload lesson-assets" ON storage.objects;
DROP POLICY IF EXISTS "Auth update lesson-assets" ON storage.objects;
DROP POLICY IF EXISTS "Auth delete lesson-assets" ON storage.objects;

CREATE POLICY "Teachers upload lesson-assets"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'lesson-assets' AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role) OR has_role(auth.uid(), 'senior_teacher'::app_role)));

CREATE POLICY "Teachers update lesson-assets"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'lesson-assets' AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role) OR has_role(auth.uid(), 'senior_teacher'::app_role)));

CREATE POLICY "Teachers delete lesson-assets"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'lesson-assets' AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role) OR has_role(auth.uid(), 'senior_teacher'::app_role)));
