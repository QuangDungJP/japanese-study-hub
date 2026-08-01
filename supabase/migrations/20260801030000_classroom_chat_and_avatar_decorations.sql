-- Migration: Avatar Decorations and Real-time Classroom Chat
-- Date: 2026-08-01

-- 1. Add equipped_frame_code to profiles table
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS equipped_frame_code TEXT DEFAULT NULL;

-- 2. Create Real-time Classroom Chat Messages Table
CREATE TABLE IF NOT EXISTS public.class_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message_text TEXT NOT NULL,
  reply_to_id UUID REFERENCES public.class_messages(id) ON DELETE SET NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  reactions JSONB DEFAULT '{}'::jsonb,
  is_edited BOOLEAN NOT NULL DEFAULT false,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for class_messages
ALTER TABLE public.class_messages ENABLE ROW LEVEL SECURITY;

-- Policies for class_messages: Students enrolled in class & teachers/admins can view and insert
CREATE POLICY "Class members can view class messages" ON public.class_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.class_students cs WHERE cs.class_id = class_messages.class_id AND cs.student_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.classes c WHERE c.id = class_messages.class_id AND c.teacher_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

CREATE POLICY "Class members can insert class messages" ON public.class_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND (
      EXISTS (
        SELECT 1 FROM public.class_students cs WHERE cs.class_id = class_messages.class_id AND cs.student_id = auth.uid()
      ) OR EXISTS (
        SELECT 1 FROM public.classes c WHERE c.id = class_messages.class_id AND c.teacher_id = auth.uid()
      ) OR EXISTS (
        SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
      )
    )
  );

CREATE POLICY "Users can update own class messages" ON public.class_messages
  FOR UPDATE USING (
    auth.uid() = sender_id OR EXISTS (
      SELECT 1 FROM public.classes c WHERE c.id = class_messages.class_id AND c.teacher_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

CREATE POLICY "Users can delete own class messages" ON public.class_messages
  FOR DELETE USING (
    auth.uid() = sender_id OR EXISTS (
      SELECT 1 FROM public.classes c WHERE c.id = class_messages.class_id AND c.teacher_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- Enable Supabase Realtime publication on class_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.class_messages;
