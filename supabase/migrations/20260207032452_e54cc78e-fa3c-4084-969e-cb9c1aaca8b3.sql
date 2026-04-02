
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS theme_font text DEFAULT 'system',
ADD COLUMN IF NOT EXISTS theme_scale text DEFAULT 'medium';
