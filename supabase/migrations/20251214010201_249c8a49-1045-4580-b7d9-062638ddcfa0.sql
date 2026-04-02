-- Create storage bucket for lesson audio files
INSERT INTO storage.buckets (id, name, public) VALUES ('lesson-assets', 'lesson-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for lesson-assets bucket
CREATE POLICY "Anyone can view lesson assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'lesson-assets');

CREATE POLICY "Admins can upload lesson assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'lesson-assets' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update lesson assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'lesson-assets' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete lesson assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'lesson-assets' AND has_role(auth.uid(), 'admin'));

-- Create exercises table for different exercise types
CREATE TABLE public.exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  exercise_type TEXT NOT NULL CHECK (exercise_type IN ('reading', 'listening', 'writing', 'vocabulary', 'multiple_choice')),
  title TEXT NOT NULL,
  title_vi TEXT NOT NULL,
  instructions TEXT,
  instructions_vi TEXT,
  content JSONB, -- Flexible content based on type
  audio_url TEXT, -- For listening exercises
  correct_answers JSONB, -- For auto-graded exercises
  explanation JSONB, -- Explanations for vocabulary/auto-graded
  requires_grading BOOLEAN DEFAULT false, -- For writing submissions
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on exercises
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

-- RLS policies for exercises
CREATE POLICY "Anyone can view exercises of published lessons"
ON public.exercises FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.lessons 
    WHERE lessons.id = exercises.lesson_id 
    AND lessons.is_published = true
  )
);

CREATE POLICY "Admins can manage all exercises"
ON public.exercises FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Create student_submissions table for grading
CREATE TABLE public.student_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL, -- Student's answer
  score INTEGER, -- Null until graded
  feedback TEXT, -- Admin feedback
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'graded', 'returned')),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  graded_at TIMESTAMP WITH TIME ZONE,
  graded_by UUID
);

-- Enable RLS on student_submissions
ALTER TABLE public.student_submissions ENABLE ROW LEVEL SECURITY;

-- RLS policies for student_submissions
CREATE POLICY "Users can view own submissions"
ON public.student_submissions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own submissions"
ON public.student_submissions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all submissions"
ON public.student_submissions FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update submissions for grading"
ON public.student_submissions FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'grade', 'achievement')),
  link TEXT, -- Optional link to navigate
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can create notifications for anyone"
ON public.notifications FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all notifications"
ON public.notifications FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at on exercises
CREATE TRIGGER update_exercises_updated_at
BEFORE UPDATE ON public.exercises
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Add trigger for changing our lessson 
 CREATE Trigger upadte_lesson_update_at
 AFTER UPDATE on private.lesson
 for each COLUMN


 -- Create supporting teacher/student