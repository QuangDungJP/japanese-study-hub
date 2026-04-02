-- Create update_updated_at_column function first
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create classes table for managing student groups
CREATE TABLE public.classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_vi TEXT NOT NULL,
  description TEXT,
  description_vi TEXT,
  teacher_id UUID NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  max_students INTEGER DEFAULT 30,
  start_date DATE,
  end_date DATE,
  schedule JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create class_students junction table
CREATE TABLE public.class_students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'active',
  UNIQUE(class_id, student_id)
);

-- Create teacher_profiles for extended teacher info
CREATE TABLE public.teacher_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  bio TEXT,
  bio_vi TEXT,
  specializations JSONB DEFAULT '[]'::jsonb,
  experience_years INTEGER DEFAULT 0,
  certifications JSONB DEFAULT '[]'::jsonb,
  hourly_rate NUMERIC DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  rating NUMERIC DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bug_reports table
CREATE TABLE public.bug_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'open',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add teacher_id column to lessons table
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS teacher_id UUID;

-- Add teacher_id column to bookings table  
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS teacher_id UUID;

-- Enable RLS
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for classes
CREATE POLICY "Admins can manage all classes" ON public.classes
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can manage own classes" ON public.classes
  FOR ALL USING (teacher_id = auth.uid());

CREATE POLICY "Students can view their enrolled classes" ON public.classes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM class_students 
      WHERE class_students.class_id = classes.id 
      AND class_students.student_id = auth.uid()
    )
  );

-- RLS Policies for class_students
CREATE POLICY "Admins can manage all class_students" ON public.class_students
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can manage their class students" ON public.class_students
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM classes 
      WHERE classes.id = class_students.class_id 
      AND classes.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can view own enrollments" ON public.class_students
  FOR SELECT USING (student_id = auth.uid());

-- RLS Policies for teacher_profiles
CREATE POLICY "Admins can manage all teacher_profiles" ON public.teacher_profiles
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can manage own profile" ON public.teacher_profiles
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Anyone can view teacher profiles" ON public.teacher_profiles
  FOR SELECT USING (true);

-- RLS Policies for bug_reports
CREATE POLICY "Admins can manage all bug_reports" ON public.bug_reports
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can create own bug reports" ON public.bug_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own bug reports" ON public.bug_reports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own bug reports" ON public.bug_reports
  FOR UPDATE USING (auth.uid() = user_id);

-- Update lessons RLS for teachers
CREATE POLICY "Teachers can manage own lessons" ON public.lessons
  FOR ALL USING (teacher_id = auth.uid());

-- Update bookings RLS for teachers  
CREATE POLICY "Teachers can view assigned bookings" ON public.bookings
  FOR SELECT USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can update assigned bookings" ON public.bookings
  FOR UPDATE USING (teacher_id = auth.uid());

-- Create triggers
CREATE TRIGGER update_classes_updated_at
  BEFORE UPDATE ON public.classes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_teacher_profiles_updated_at
  BEFORE UPDATE ON public.teacher_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bug_reports_updated_at
  BEFORE UPDATE ON public.bug_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create helper functions
CREATE OR REPLACE FUNCTION public.is_teacher(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = user_uuid 
    AND role IN ('teacher', 'senior_teacher')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_senior_teacher(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = user_uuid 
    AND role = 'senior_teacher'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;