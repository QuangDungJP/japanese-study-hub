-- Migration: Student Attendance View Policy & Total Sessions Enforcement
-- Date: 2026-07-30
-- Description: Ensures total_sessions in classes, session_id in attendance, and adds RLS policy allowing students to view their own attendance records.

-- 1. Ensure total_sessions column exists on public.classes table
ALTER TABLE public.classes 
ADD COLUMN IF NOT EXISTS total_sessions INTEGER DEFAULT 24;

-- 2. Ensure session_id column exists on public.attendance table
ALTER TABLE public.attendance 
ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES public.class_sessions(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS check_in_time TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS marked_by UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL;

-- 3. Add RLS policy for students to view their own attendance records
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'attendance' 
    AND policyname = 'Students view own attendance'
  ) THEN
    CREATE POLICY "Students view own attendance"
    ON public.attendance FOR SELECT
    TO authenticated
    USING (student_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.is_class_teacher(class_id, auth.uid()));
  END IF;
END $$;

-- 4. Enable Supabase Realtime for attendance table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'attendance'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance;
  END IF;
END $$;
