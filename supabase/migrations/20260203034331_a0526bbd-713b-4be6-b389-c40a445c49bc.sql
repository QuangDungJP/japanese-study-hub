-- Create enum for leave request status
DO $$ BEGIN
  CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create enum for exam type
DO $$ BEGIN
  CREATE TYPE exam_type AS ENUM ('quiz', 'midterm', 'final', 'placement');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Leave requests table
CREATE TABLE public.leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  request_type TEXT NOT NULL DEFAULT 'leave', -- 'leave', 'reschedule'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  reviewer_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Exams/Tests table
CREATE TABLE public.exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  title_vi TEXT NOT NULL,
  description TEXT,
  description_vi TEXT,
  exam_type TEXT NOT NULL DEFAULT 'quiz',
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL,
  exam_date DATE NOT NULL,
  start_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  location TEXT, -- room or online link
  meet_link TEXT,
  max_score INTEGER DEFAULT 100,
  passing_score INTEGER DEFAULT 50,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Exam registrations (students registered for an exam)
CREATE TABLE public.exam_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'registered', -- registered, attended, absent, completed
  score INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Calendar events (unified view of all events)
CREATE TABLE public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL, -- 'booking', 'exam', 'leave', 'reminder'
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN DEFAULT false,
  color TEXT,
  reference_id UUID, -- booking_id, exam_id, or leave_request_id
  reference_type TEXT, -- 'booking', 'exam', 'leave_request'
  meet_link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add unique constraint for exam registrations
ALTER TABLE public.exam_registrations ADD CONSTRAINT unique_exam_student UNIQUE (exam_id, student_id);

-- Enable RLS
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- RLS for leave_requests
CREATE POLICY "Users can view own leave requests"
ON public.leave_requests FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own leave requests"
ON public.leave_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending leave requests"
ON public.leave_requests FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can manage all leave_requests"
ON public.leave_requests FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can view leave requests for their students"
ON public.leave_requests FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM class_students cs
    JOIN classes c ON c.id = cs.class_id
    WHERE cs.student_id = leave_requests.user_id
    AND c.teacher_id = auth.uid()
  )
);

CREATE POLICY "Teachers can review leave requests"
ON public.leave_requests FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM class_students cs
    JOIN classes c ON c.id = cs.class_id
    WHERE cs.student_id = leave_requests.user_id
    AND c.teacher_id = auth.uid()
  )
);

-- RLS for exams
CREATE POLICY "Teachers can manage own exams"
ON public.exams FOR ALL
USING (teacher_id = auth.uid());

CREATE POLICY "Students can view published exams for their classes"
ON public.exams FOR SELECT
USING (
  is_published = true AND
  EXISTS (
    SELECT 1 FROM class_students cs
    WHERE cs.class_id = exams.class_id
    AND cs.student_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all exams"
ON public.exams FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- RLS for exam_registrations
CREATE POLICY "Students can view own registrations"
ON public.exam_registrations FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "Students can register for exams"
ON public.exam_registrations FOR INSERT
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Teachers can manage registrations for their exams"
ON public.exam_registrations FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM exams e
    WHERE e.id = exam_registrations.exam_id
    AND e.teacher_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all exam_registrations"
ON public.exam_registrations FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- RLS for calendar_events
CREATE POLICY "Users can view own calendar events"
ON public.calendar_events FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own calendar events"
ON public.calendar_events FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all calendar_events"
ON public.calendar_events FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Triggers for updated_at
CREATE TRIGGER update_leave_requests_updated_at
BEFORE UPDATE ON public.leave_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_exams_updated_at
BEFORE UPDATE ON public.exams
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();