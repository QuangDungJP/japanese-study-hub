
-- Make user_id nullable so admin can add teachers without linking to a user account
ALTER TABLE public.teacher_profiles ALTER COLUMN user_id DROP NOT NULL;
