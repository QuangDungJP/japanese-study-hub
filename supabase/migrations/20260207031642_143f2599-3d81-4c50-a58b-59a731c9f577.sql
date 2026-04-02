
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS theme_color text DEFAULT 'blue',
ADD COLUMN IF NOT EXISTS theme_mode text DEFAULT 'system';
