ALTER TABLE public.teacher_profiles ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE public.teacher_profiles ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.teacher_profiles ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;