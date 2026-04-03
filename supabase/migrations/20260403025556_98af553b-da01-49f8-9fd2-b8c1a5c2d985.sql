
ALTER TABLE public.teacher_profiles ADD COLUMN IF NOT EXISTS order_index integer DEFAULT 0;
