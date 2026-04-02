-- Create attendance tracking table
CREATE TABLE public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  session_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'absent' CHECK (status IN ('present', 'absent', 'late', 'excused')),
  check_in_time TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  marked_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Teachers can manage attendance for their classes"
ON public.attendance FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM classes c 
    WHERE c.id = attendance.class_id 
    AND c.teacher_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM bookings b 
    WHERE b.id = attendance.booking_id 
    AND b.teacher_id = auth.uid()
  )
);

CREATE POLICY "Students can view own attendance"
ON public.attendance FOR SELECT
USING (student_id = auth.uid());

CREATE POLICY "Admins can manage all attendance"
ON public.attendance FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_attendance_updated_at
  BEFORE UPDATE ON public.attendance
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_attendance_class_id ON public.attendance(class_id);
CREATE INDEX idx_attendance_student_id ON public.attendance(student_id);
CREATE INDEX idx_attendance_session_date ON public.attendance(session_date);