-- Migration: Attendance System & Teacher Timesheet / Payroll Tracking
-- Date: 2026-07-28
-- Description: Adds teacher_timesheets table, rate columns in teacher_profiles, and enhances attendance table.

-- 1. Upgrade public.attendance table if needed
ALTER TABLE public.attendance
ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES public.class_sessions(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS check_in_time TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS marked_by UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL;

-- 2. Upgrade public.teacher_profiles table for hourly & per-session pay rate
ALTER TABLE public.teacher_profiles
ADD COLUMN IF NOT EXISTS per_session_rate NUMERIC DEFAULT 250000,
ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC DEFAULT 180000;

-- 3. Create public.teacher_timesheets table for Monthly Work Log & Payroll
CREATE TABLE IF NOT EXISTS public.teacher_timesheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  month_year VARCHAR(10) NOT NULL, -- Format: YYYY-MM
  total_sessions INTEGER DEFAULT 0,
  total_hours NUMERIC(6,2) DEFAULT 0.00,
  rate_per_session NUMERIC DEFAULT 250000,
  total_earnings NUMERIC DEFAULT 0,
  bonus NUMERIC DEFAULT 0,
  deduction NUMERIC DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'draft', -- 'draft', 'submitted', 'approved', 'paid'
  notes TEXT,
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_teacher_month UNIQUE (teacher_id, month_year)
);

-- 4. Enable RLS and policies for teacher_timesheets
ALTER TABLE public.teacher_timesheets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers view and insert own timesheets"
ON public.teacher_timesheets FOR ALL
USING (auth.uid() = teacher_id OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() = teacher_id OR public.has_role(auth.uid(), 'admin'));

-- 5. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_attendance_session ON public.attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_class_date ON public.attendance(class_id, session_date);
CREATE INDEX IF NOT EXISTS idx_timesheets_teacher_month ON public.teacher_timesheets(teacher_id, month_year);
