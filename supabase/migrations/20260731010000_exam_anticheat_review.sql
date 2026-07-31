-- Migration: Add anti-cheat penalty mode and review columns
-- Date: 2026-07-31

-- Add anti_cheat settings to exams
ALTER TABLE public.exams
  ADD COLUMN IF NOT EXISTS anti_cheat BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS anti_cheat_max_violations INTEGER NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS anti_cheat_penalty TEXT NOT NULL DEFAULT 'auto_submit'
    CHECK (anti_cheat_penalty IN ('warn_only', 'auto_submit', 'reset_answers', 'deduct_points')),
  ADD COLUMN IF NOT EXISTS anti_cheat_deduct_per_violation INTEGER NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS show_answers_after BOOLEAN NOT NULL DEFAULT true;

-- Track violations per attempt
ALTER TABLE public.exam_attempts
  ADD COLUMN IF NOT EXISTS violations INTEGER NOT NULL DEFAULT 0;
