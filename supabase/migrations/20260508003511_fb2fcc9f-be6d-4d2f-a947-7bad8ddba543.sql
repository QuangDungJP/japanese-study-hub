
-- 1) Revoke column-level access to answer keys from client roles
REVOKE SELECT (correct_answers, explanation) ON public.exercises FROM anon, authenticated;

-- 2) Tighten class-assignments storage policies to enrolled class only
DROP POLICY IF EXISTS "Teachers manage class-assignments files" ON storage.objects;
DROP POLICY IF EXISTS "Class members read class-assignments" ON storage.objects;

CREATE POLICY "Admins manage class-assignments files"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'class-assignments' AND has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'class-assignments' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Class teachers manage own class assignment files"
ON storage.objects FOR ALL TO authenticated
USING (
  bucket_id = 'class-assignments'
  AND (storage.foldername(name))[1] IS DISTINCT FROM 'submissions'
  AND EXISTS (
    SELECT 1 FROM public.classes c
    WHERE c.teacher_id = auth.uid()
      AND c.id::text = (storage.foldername(name))[1]
  )
)
WITH CHECK (
  bucket_id = 'class-assignments'
  AND (storage.foldername(name))[1] IS DISTINCT FROM 'submissions'
  AND EXISTS (
    SELECT 1 FROM public.classes c
    WHERE c.teacher_id = auth.uid()
      AND c.id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Class teachers read own class submissions"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'class-assignments'
  AND (storage.foldername(name))[1] = 'submissions'
  AND EXISTS (
    SELECT 1 FROM public.class_students cs
    JOIN public.classes c ON c.id = cs.class_id
    WHERE c.teacher_id = auth.uid()
      AND cs.student_id::text = (storage.foldername(name))[2]
  )
);

CREATE POLICY "Students read own class assignment files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'class-assignments'
  AND (
    -- own submission folder
    ((storage.foldername(name))[1] = 'submissions' AND (storage.foldername(name))[2] = auth.uid()::text)
    OR
    -- assignment files for classes they are enrolled in
    ((storage.foldername(name))[1] IS DISTINCT FROM 'submissions'
     AND EXISTS (
       SELECT 1 FROM public.class_students cs
       WHERE cs.student_id = auth.uid()
         AND cs.class_id::text = (storage.foldername(name))[1]
     ))
  )
);

CREATE POLICY "Students upload own submissions"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'class-assignments'
  AND (storage.foldername(name))[1] = 'submissions'
  AND (storage.foldername(name))[2] = auth.uid()::text
);
