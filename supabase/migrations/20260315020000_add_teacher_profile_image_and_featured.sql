-- Add support for teacher profile images and featured teachers on the homepage

ALTER TABLE public.teacher_profiles
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
