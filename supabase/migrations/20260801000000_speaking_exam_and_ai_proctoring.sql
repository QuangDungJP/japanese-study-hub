-- Migration: Speaking/Meeting Exams & Advanced AI Proctoring
-- Date: 2026-08-01

-- 1. Add speaking and AI proctoring columns to exams table
ALTER TABLE public.exams
  ADD COLUMN IF NOT EXISTS exam_category TEXT NOT NULL DEFAULT 'written'
    CHECK (exam_category IN ('written', 'speaking_meeting', 'speaking_ai')),
  ADD COLUMN IF NOT EXISTS ai_proctoring BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS proctoring_config JSONB DEFAULT '{"detect_gaze": true, "detect_head": true, "detect_multi_face": true, "detect_dual_monitor": true}'::jsonb;

-- 2. Add proctoring logs and speaking recordings to exam_attempts table
ALTER TABLE public.exam_attempts
  ADD COLUMN IF NOT EXISTS proctoring_logs JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS speaking_recordings JSONB DEFAULT '[]'::jsonb;
