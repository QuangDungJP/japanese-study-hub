
ALTER TABLE public.teacher_profiles
  ADD COLUMN IF NOT EXISTS gallery_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS videos jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS custom_sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS section_visibility jsonb NOT NULL DEFAULT '{"hero":true,"stats":true,"bio":true,"specializations":true,"certifications":true,"languages":true,"gallery":true,"videos":true,"custom":true,"extra":true,"social":true,"cta":true}'::jsonb,
  ADD COLUMN IF NOT EXISTS subtitle text,
  ADD COLUMN IF NOT EXISTS achievements jsonb NOT NULL DEFAULT '[]'::jsonb;
