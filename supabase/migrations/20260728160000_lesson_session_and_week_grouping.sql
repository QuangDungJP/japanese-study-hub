-- Migration: Categorize & Group Lessons by Session and Week
-- Date: 2026-07-28
-- Description: Adds session_number, week_number, topic_group, order_index to lessons and class_sessions for full Session/Week grouping support.

-- 1. Upgrade public.lessons table
ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES public.class_sessions(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS session_number INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS week_number INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS topic_group VARCHAR(255) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'session',
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- 2. Upgrade public.class_sessions table
ALTER TABLE public.class_sessions
ADD COLUMN IF NOT EXISTS week_number INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS topic_group VARCHAR(255) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- 3. Upgrade public.lesson_materials table
ALTER TABLE public.lesson_materials
ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES public.class_sessions(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS week_number INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- 4. Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_lessons_session_id ON public.lessons(session_id);
CREATE INDEX IF NOT EXISTS idx_lessons_week_number ON public.lessons(week_number);
CREATE INDEX IF NOT EXISTS idx_lessons_order_index ON public.lessons(order_index);
CREATE INDEX IF NOT EXISTS idx_class_sessions_week_number ON public.class_sessions(week_number);
