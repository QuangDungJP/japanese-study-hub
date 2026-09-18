-- Create class_teachers table
CREATE TABLE IF NOT EXISTS public.class_teachers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
    teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(class_id, teacher_id)
);

-- Enable RLS
ALTER TABLE public.class_teachers ENABLE ROW LEVEL SECURITY;

-- Policies for class_teachers
CREATE POLICY "Admins can manage class_teachers"
    ON public.class_teachers
    FOR ALL
    USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Teachers can view their class_teachers"
    ON public.class_teachers
    FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM public.classes WHERE id = class_teachers.class_id AND teacher_id = auth.uid())
        OR teacher_id = auth.uid()
    );

CREATE POLICY "Primary teachers can insert/delete class_teachers"
    ON public.class_teachers
    FOR ALL
    USING (
        EXISTS (SELECT 1 FROM public.classes WHERE id = class_teachers.class_id AND teacher_id = auth.uid())
    );

-- Note: To fully support co-teachers managing content, you might want to update existing policies on 
-- class_assignments, class_students, lessons, etc. to include:
-- OR EXISTS (SELECT 1 FROM class_teachers ct WHERE ct.class_id = class_id AND ct.teacher_id = auth.uid())
