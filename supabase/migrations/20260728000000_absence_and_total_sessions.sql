-- Migration SQL cho Tổng số buổi học, Báo vắng & Realtime Thông báo
-- Bạn hãy copy toàn bộ đoạn mã này và dán vào Supabase SQL Editor -> Run

-- 1. Thêm cột total_sessions (Tổng số buổi học) vào bảng classes
ALTER TABLE public.classes 
ADD COLUMN IF NOT EXISTS total_sessions INTEGER DEFAULT 24;

-- 2. Thêm cột custom_fields vào bảng classes (nếu chưa có)
ALTER TABLE public.classes 
ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb;

-- 3. Thêm đánh dấu cờ is_makeup (Buổi học bù) vào bảng class_sessions
ALTER TABLE public.class_sessions 
ADD COLUMN IF NOT EXISTS is_makeup BOOLEAN DEFAULT false;

-- 4. Tạo bảng absence_requests (Đơn xin vắng học)
CREATE TABLE IF NOT EXISTS public.absence_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL,
    session_date DATE NOT NULL,
    reason TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    makeup_session_id UUID REFERENCES public.class_sessions(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bật RLS và cấp quyền cho bảng absence_requests
ALTER TABLE public.absence_requests ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'absence_requests' 
    AND policyname = 'Allow authenticated users full access to absence_requests'
  ) THEN
    CREATE POLICY "Allow authenticated users full access to absence_requests"
    ON public.absence_requests FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;

-- 5. Kích hoạt Supabase Realtime cho bảng notifications (thông báo thời gian thực)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;
