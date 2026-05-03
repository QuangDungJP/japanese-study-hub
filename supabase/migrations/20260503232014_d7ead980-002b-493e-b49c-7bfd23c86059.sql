
CREATE TABLE public.class_assignment_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL,
  student_id uuid NOT NULL,
  content text,
  file_url text,
  link_url text,
  status text NOT NULL DEFAULT 'submitted',
  score integer,
  feedback text,
  graded_by uuid,
  graded_at timestamptz,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(assignment_id, student_id)
);

ALTER TABLE public.class_assignment_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students manage own assignment submissions"
ON public.class_assignment_submissions FOR ALL
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

CREATE POLICY "Teachers view submissions for their class assignments"
ON public.class_assignment_submissions FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.class_assignments a
  WHERE a.id = class_assignment_submissions.assignment_id
    AND public.is_class_teacher(a.class_id, auth.uid())
));

CREATE POLICY "Teachers grade submissions for their class assignments"
ON public.class_assignment_submissions FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.class_assignments a
  WHERE a.id = class_assignment_submissions.assignment_id
    AND public.is_class_teacher(a.class_id, auth.uid())
));

CREATE POLICY "Admins manage all assignment submissions"
ON public.class_assignment_submissions FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_cas_updated_at
BEFORE UPDATE ON public.class_assignment_submissions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage policies for student submissions in class-assignments bucket
CREATE POLICY "Students upload own submission files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'class-assignments'
  AND (storage.foldername(name))[1] = 'submissions'
  AND auth.uid()::text = (storage.foldername(name))[2]
);

CREATE POLICY "Students read own submission files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'class-assignments'
  AND (storage.foldername(name))[1] = 'submissions'
  AND auth.uid()::text = (storage.foldername(name))[2]
);
