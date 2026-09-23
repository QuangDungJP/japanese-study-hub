-- Migration for Question Bank and Difficulty scoring

CREATE TABLE IF NOT EXISTS public.question_bank (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    skill TEXT NOT NULL,
    text TEXT NOT NULL,
    options JSONB,
    correct_index INTEGER,
    points NUMERIC DEFAULT 5,
    difficulty TEXT DEFAULT 'medium', -- 'easy', 'medium', 'hard'
    tags TEXT[],
    is_passage BOOLEAN DEFAULT false,
    sub_questions JSONB,
    audio_url TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.question_bank ENABLE ROW LEVEL SECURITY;

-- Allow read access for everyone (or just authenticated, assuming teachers need it)
CREATE POLICY "Allow public read access to question bank"
ON public.question_bank FOR SELECT
USING (true);

-- Allow all access to admin/teachers (simple RLS bypass or based on role, for now allow all authenticated for simplicity in this migration, or adjust to existing policy standard)
CREATE POLICY "Allow all actions for authenticated users"
ON public.question_bank FOR ALL
TO authenticated
USING (true);
