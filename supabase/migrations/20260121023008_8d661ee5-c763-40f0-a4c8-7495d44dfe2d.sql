-- Add RLS policies for teachers to view and grade submissions for their lessons
CREATE POLICY "Teachers can view submissions for their lessons" 
ON public.student_submissions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM exercises e
    JOIN lessons l ON l.id = e.lesson_id
    WHERE e.id = student_submissions.exercise_id
    AND l.teacher_id = auth.uid()
  )
);

CREATE POLICY "Teachers can grade submissions for their lessons" 
ON public.student_submissions 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM exercises e
    JOIN lessons l ON l.id = e.lesson_id
    WHERE e.id = student_submissions.exercise_id
    AND l.teacher_id = auth.uid()
  )
);