-- Give each assigned co-teacher full CRUD access to data belonging to that class.
-- This intentionally excludes class_teachers, user_roles, profiles, and teacher_profiles.
-- Those administrative identities and teaching-team changes remain admin-managed.

CREATE POLICY "Class teachers full access to class students"
ON public.class_students FOR ALL TO authenticated
USING (public.is_class_teacher(class_id, auth.uid()))
WITH CHECK (public.is_class_teacher(class_id, auth.uid()));

CREATE POLICY "Class teachers full access to assignments"
ON public.class_assignments FOR ALL TO authenticated
USING (public.is_class_teacher(class_id, auth.uid()))
WITH CHECK (public.is_class_teacher(class_id, auth.uid()));

CREATE POLICY "Class teachers full access to assignment submissions"
ON public.class_assignment_submissions FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.class_assignments assignment
  WHERE assignment.id = class_assignment_submissions.assignment_id
    AND public.is_class_teacher(assignment.class_id, auth.uid())
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.class_assignments assignment
  WHERE assignment.id = class_assignment_submissions.assignment_id
    AND public.is_class_teacher(assignment.class_id, auth.uid())
));

CREATE POLICY "Class teachers full access to sessions"
ON public.class_sessions FOR ALL TO authenticated
USING (public.is_class_teacher(class_id, auth.uid()))
WITH CHECK (public.is_class_teacher(class_id, auth.uid()));

CREATE POLICY "Class teachers full access to attendance"
ON public.attendance FOR ALL TO authenticated
USING (class_id IS NOT NULL AND public.is_class_teacher(class_id, auth.uid()))
WITH CHECK (class_id IS NOT NULL AND public.is_class_teacher(class_id, auth.uid()));

CREATE POLICY "Class teachers full access to class topics"
ON public.class_topics FOR ALL TO authenticated
USING (public.is_class_teacher(class_id, auth.uid()))
WITH CHECK (public.is_class_teacher(class_id, auth.uid()));

CREATE POLICY "Class teachers full access to class materials"
ON public.class_materials FOR ALL TO authenticated
USING (public.is_class_teacher(class_id, auth.uid()))
WITH CHECK (public.is_class_teacher(class_id, auth.uid()));

CREATE POLICY "Class teachers full access to lesson materials"
ON public.lesson_materials FOR ALL TO authenticated
USING (class_id IS NOT NULL AND public.is_class_teacher(class_id, auth.uid()))
WITH CHECK (class_id IS NOT NULL AND public.is_class_teacher(class_id, auth.uid()));

CREATE POLICY "Class teachers full access to class messages"
ON public.class_messages FOR ALL TO authenticated
USING (public.is_class_teacher(class_id, auth.uid()))
WITH CHECK (public.is_class_teacher(class_id, auth.uid()));

CREATE POLICY "Class teachers full access to stream posts"
ON public.class_stream_posts FOR ALL TO authenticated
USING (public.is_class_teacher(class_id, auth.uid()))
WITH CHECK (public.is_class_teacher(class_id, auth.uid()));

CREATE POLICY "Class teachers full access to stream comments"
ON public.class_stream_comments FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.class_stream_posts post
  WHERE post.id = class_stream_comments.post_id
    AND public.is_class_teacher(post.class_id, auth.uid())
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.class_stream_posts post
  WHERE post.id = class_stream_comments.post_id
    AND public.is_class_teacher(post.class_id, auth.uid())
));

CREATE POLICY "Class teachers full access to stream reactions"
ON public.class_stream_reactions FOR ALL TO authenticated
USING (
  (post_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.class_stream_posts post
    WHERE post.id = class_stream_reactions.post_id
      AND public.is_class_teacher(post.class_id, auth.uid())
  ))
  OR
  (comment_id IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public.class_stream_comments comment
    JOIN public.class_stream_posts post ON post.id = comment.post_id
    WHERE comment.id = class_stream_reactions.comment_id
      AND public.is_class_teacher(post.class_id, auth.uid())
  ))
)
WITH CHECK (
  (post_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.class_stream_posts post
    WHERE post.id = class_stream_reactions.post_id
      AND public.is_class_teacher(post.class_id, auth.uid())
  ))
  OR
  (comment_id IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public.class_stream_comments comment
    JOIN public.class_stream_posts post ON post.id = comment.post_id
    WHERE comment.id = class_stream_reactions.comment_id
      AND public.is_class_teacher(post.class_id, auth.uid())
  ))
);

CREATE POLICY "Class teachers full access to lesson submissions"
ON public.student_submissions FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1
  FROM public.exercises exercise
  JOIN public.lessons lesson ON lesson.id = exercise.lesson_id
  WHERE exercise.id = student_submissions.exercise_id
    AND lesson.class_id IS NOT NULL
    AND public.is_class_teacher(lesson.class_id, auth.uid())
))
WITH CHECK (EXISTS (
  SELECT 1
  FROM public.exercises exercise
  JOIN public.lessons lesson ON lesson.id = exercise.lesson_id
  WHERE exercise.id = student_submissions.exercise_id
    AND lesson.class_id IS NOT NULL
    AND public.is_class_teacher(lesson.class_id, auth.uid())
));
