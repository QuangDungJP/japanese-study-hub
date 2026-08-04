-- Migration for Class Email Settings table

CREATE TABLE IF NOT EXISTS public.class_email_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL UNIQUE,
  enable_student_emails BOOLEAN DEFAULT true,
  enable_teacher_emails BOOLEAN DEFAULT true,
  lead_time_hours INTEGER DEFAULT 24,
  email_subject_template TEXT DEFAULT '🔔 [Thắc mắc & Lịch học] Thông báo lịch học mới lớp {class_name}',
  email_body_template TEXT DEFAULT 'Xin chào {student_name},\n\nLớp học {class_name} của bạn có lịch học mới vào ngày {session_date} lúc {start_time}.\n\nLink phòng học Google Meet: {meet_link}\n\nTrân trọng,\nĐội ngũ giảng viên {teacher_name}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.class_email_settings ENABLE ROW LEVEL SECURITY;

-- Teachers and Admins can view and update settings for their classes
CREATE POLICY "Teachers & Admins can manage class email settings" ON public.class_email_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = class_email_settings.class_id
      AND (c.teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role))
    )
  );

-- Trigger for updated_at
CREATE OR REPLACE TRIGGER update_class_email_settings_updated_at
  BEFORE UPDATE ON public.class_email_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
