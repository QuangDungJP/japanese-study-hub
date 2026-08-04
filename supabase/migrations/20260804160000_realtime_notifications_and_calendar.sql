-- ============================================================================
-- MIGRATION: Realtime Notifications, Exam Attempt Sync, and Calendar Tables
-- Target: Supabase Postgres SQL Editor (100% Syntax Compatible)
-- ============================================================================

-- 1. Safely Add Tables to Supabase Realtime Publication
DO $$
BEGIN
  -- Notifications
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;

  -- Exam Attempts
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'exam_attempts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.exam_attempts;
  END IF;

  -- Student Submissions
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'student_submissions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.student_submissions;
  END IF;

  -- Class Sessions
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'class_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.class_sessions;
  END IF;

  -- Class Messages
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'class_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.class_messages;
  END IF;

  -- Meetings
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'meetings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.meetings;
  END IF;

  -- Bookings
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'bookings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
  END IF;

  -- Calendar Events
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'calendar_events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.calendar_events;
  END IF;
END $$;

-- 2. Performance Indexes for faster Realtime & Calendar queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_student_id ON public.exam_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_exam_id ON public.exam_attempts(exam_id);
CREATE INDEX IF NOT EXISTS idx_student_submissions_user_id ON public.student_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_class_sessions_class_id ON public.class_sessions(class_id);
CREATE INDEX IF NOT EXISTS idx_class_messages_class_id ON public.class_messages(class_id);

-- 3. Ensure Notification RLS policy allows insertions for authenticated users
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Enable insert for authenticated users'
  ) THEN
    CREATE POLICY "Enable insert for authenticated users" ON public.notifications
      FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can view own notifications'
  ) THEN
    CREATE POLICY "Users can view own notifications" ON public.notifications
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;
