-- ============================================================
-- Lesson Builder v2 (đợt 3D)
-- Fixes /admin/lessons: lessons could not be saved because the
-- original CHECK constraints only allowed English-course values.
-- Also adds proper course/class linking so we can show and filter
-- "which class / which course" a lesson belongs to.
-- ============================================================

-- 1. Drop the legacy CHECK constraints. This is a Japanese-learning
--    platform, so skill/level/language are free-form (Kanji, N5, japanese...).
ALTER TABLE public.lessons DROP CONSTRAINT IF EXISTS lessons_skill_check;
ALTER TABLE public.lessons DROP CONSTRAINT IF EXISTS lessons_level_check;
ALTER TABLE public.lessons DROP CONSTRAINT IF EXISTS lessons_language_check;

-- 2. Make classification columns tolerant (optional / free text).
ALTER TABLE public.lessons ALTER COLUMN skill DROP NOT NULL;
ALTER TABLE public.lessons ALTER COLUMN level DROP NOT NULL;
ALTER TABLE public.lessons ALTER COLUMN language DROP NOT NULL;
ALTER TABLE public.lessons ALTER COLUMN language SET DEFAULT 'japanese';

-- 3. Course assignment: a lesson may target an entire course directly
--    (class_id already exists for per-class assignment).
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS course_id uuid;

-- 4. Clean up any orphaned class references before adding the FK,
--    otherwise the constraint would fail to validate.
UPDATE public.lessons l
SET class_id = NULL
WHERE class_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.classes c WHERE c.id = l.class_id);

-- 5. Proper foreign keys so PostgREST/joins can resolve names and
--    lessons get cleaned up when a class/course is deleted.
ALTER TABLE public.lessons DROP CONSTRAINT IF EXISTS lessons_class_id_fkey;
ALTER TABLE public.lessons
  ADD CONSTRAINT lessons_class_id_fkey
  FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE SET NULL;

ALTER TABLE public.lessons DROP CONSTRAINT IF EXISTS lessons_course_id_fkey;
ALTER TABLE public.lessons
  ADD CONSTRAINT lessons_course_id_fkey
  FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_lessons_course_id ON public.lessons(course_id);
