-- Migration for Lesson Drag-and-Drop Reordering, Session Mapping, Curriculum Category, and Unlimited Attempts

-- 1. Add order_index, session_id, and category to lessons
ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES public.class_sessions(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'session';

-- 2. Add max_attempts to class_assignments (0 = unlimited / vô hạn)
ALTER TABLE public.class_assignments
ADD COLUMN IF NOT EXISTS max_attempts INTEGER DEFAULT 1;

-- 3. Create index for fast sorting and querying by session_id & order_index
CREATE INDEX IF NOT EXISTS idx_lessons_session_id ON public.lessons(session_id);
CREATE INDEX IF NOT EXISTS idx_lessons_order_index ON public.lessons(order_index);
