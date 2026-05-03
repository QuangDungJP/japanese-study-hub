
-- Add approval workflow and custom fields to classes
ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS custom_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by UUID;

-- Existing classes are auto-approved
UPDATE public.classes SET approval_status = 'approved', approved_at = now() WHERE approval_status = 'pending' AND created_at < now();

-- Restrict student visibility to approved classes only
DROP POLICY IF EXISTS "Students can view their enrolled classes" ON public.classes;
CREATE POLICY "Students can view their enrolled classes"
ON public.classes FOR SELECT
USING (
  approval_status = 'approved' AND EXISTS (
    SELECT 1 FROM public.class_students
    WHERE class_students.class_id = classes.id
      AND class_students.student_id = auth.uid()
  )
);
