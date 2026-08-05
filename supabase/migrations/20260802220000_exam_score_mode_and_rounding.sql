-- Migration: Add score_mode, score_rounding to exams table
-- And raw_score, raw_total to exam_attempts table
-- This supports the new score scaling feature

-- Add score_mode to exams (null = 'raw' for backward compat)
ALTER TABLE public.exams
  ADD COLUMN IF NOT EXISTS score_mode TEXT DEFAULT 'scaled' CHECK (score_mode IN ('raw', 'scaled')),
  ADD COLUMN IF NOT EXISTS score_rounding TEXT DEFAULT 'round' CHECK (score_rounding IN ('round', 'floor', 'ceil', 'none'));

-- Add raw score fields to exam_attempts (preserve original scores before scaling)
ALTER TABLE public.exam_attempts
  ADD COLUMN IF NOT EXISTS raw_score NUMERIC,
  ADD COLUMN IF NOT EXISTS raw_total NUMERIC;

-- Backfill score_mode for existing exams
UPDATE public.exams
SET score_mode = 'raw'
WHERE score_mode IS NULL;

-- Comment
COMMENT ON COLUMN public.exams.score_mode IS 'How to compute student final score: raw (direct points) or scaled (mapped to max_score range)';
COMMENT ON COLUMN public.exams.score_rounding IS 'Rounding method when score_mode=scaled: round, floor, ceil, or none (keep decimal)';
COMMENT ON COLUMN public.exam_attempts.raw_score IS 'Original score before scaling/rounding';
COMMENT ON COLUMN public.exam_attempts.raw_total IS 'Original total points before scaling';


