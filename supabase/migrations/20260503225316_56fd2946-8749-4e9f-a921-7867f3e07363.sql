
-- Fix infinite recursion between classes <-> class_students policies
-- by introducing SECURITY DEFINER helper functions.

CREATE OR REPLACE FUNCTION public.is_class_teacher(_class_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.classes WHERE id = _class_id AND teacher_id = _user_id);
$$;

CREATE OR REPLACE FUNCTION public.is_class_student(_class_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.class_students WHERE class_id = _class_id AND student_id = _user_id);
$$;

-- Classes policies
DROP POLICY IF EXISTS "Students can view their enrolled classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers can manage own classes" ON public.classes;
DROP POLICY IF EXISTS "Admins can manage all classes" ON public.classes;

CREATE POLICY "Admins can manage all classes" ON public.classes
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can manage own classes" ON public.classes
  FOR ALL USING (teacher_id = auth.uid());

CREATE POLICY "Students can view enrolled classes" ON public.classes
  FOR SELECT USING (approval_status = 'approved' AND public.is_class_student(id, auth.uid()));

-- class_students policies
DROP POLICY IF EXISTS "Students can view own enrollments" ON public.class_students;
DROP POLICY IF EXISTS "Teachers can manage their class students" ON public.class_students;
DROP POLICY IF EXISTS "Admins can manage all class_students" ON public.class_students;

CREATE POLICY "Admins manage class_students" ON public.class_students
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Students view own enrollments" ON public.class_students
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Teachers manage their class students" ON public.class_students
  FOR ALL USING (public.is_class_teacher(class_id, auth.uid()));

-- exams policies (also reference class_students)
DROP POLICY IF EXISTS "Students can view published exams for their classes" ON public.exams;
CREATE POLICY "Students view published exams for their classes" ON public.exams
  FOR SELECT USING (is_published = true AND class_id IS NOT NULL AND public.is_class_student(class_id, auth.uid()));

-- attendance policies (reference classes)
DROP POLICY IF EXISTS "Teachers can manage attendance for their classes" ON public.attendance;
CREATE POLICY "Teachers manage attendance for their classes" ON public.attendance
  FOR ALL USING (
    (class_id IS NOT NULL AND public.is_class_teacher(class_id, auth.uid()))
    OR EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = attendance.booking_id AND b.teacher_id = auth.uid())
  );

-- leave_requests teacher policies (reference class_students+classes)
DROP POLICY IF EXISTS "Teachers can view leave requests for their students" ON public.leave_requests;
DROP POLICY IF EXISTS "Teachers can review leave requests" ON public.leave_requests;

CREATE OR REPLACE FUNCTION public.teacher_has_student(_teacher_id uuid, _student_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.class_students cs
    JOIN public.classes c ON c.id = cs.class_id
    WHERE cs.student_id = _student_id AND c.teacher_id = _teacher_id
  );
$$;

CREATE POLICY "Teachers view leave requests for their students" ON public.leave_requests
  FOR SELECT USING (public.teacher_has_student(auth.uid(), user_id));

CREATE POLICY "Teachers review leave requests" ON public.leave_requests
  FOR UPDATE USING (public.teacher_has_student(auth.uid(), user_id));
