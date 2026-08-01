-- Migration: Comprehensive XP & Badge System
-- Date: 2026-08-01

-- 1. Create badges table
CREATE TABLE IF NOT EXISTS public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  title_vi TEXT NOT NULL,
  description TEXT,
  description_vi TEXT,
  icon_url TEXT,
  badge_type TEXT NOT NULL DEFAULT 'achievement'
    CHECK (badge_type IN ('achievement', 'milestone', 'streak', 'role_badge', 'special')),
  target_role TEXT NOT NULL DEFAULT 'all'
    CHECK (target_role IN ('all', 'student', 'teacher')),
  req_type TEXT NOT NULL DEFAULT 'total_xp'
    CHECK (req_type IN ('total_xp', 'streak_days', 'exams_completed', 'lessons_completed', 'exercises_completed', 'custom')),
  req_value INTEGER NOT NULL DEFAULT 100,
  bonus_xp INTEGER NOT NULL DEFAULT 50,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Create user_badges table
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  badge_id UUID REFERENCES public.badges(id) ON DELETE CASCADE NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  unlocked_by TEXT DEFAULT 'system',
  UNIQUE (user_id, badge_id)
);

-- 3. Create daily_checkins table
CREATE TABLE IF NOT EXISTS public.daily_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  checkin_date DATE DEFAULT CURRENT_DATE,
  xp_earned INTEGER DEFAULT 10,
  streak INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, checkin_date)
);

-- 4. Add xp_reward column to content tables
ALTER TABLE public.exams
  ADD COLUMN IF NOT EXISTS xp_reward INTEGER DEFAULT 50;

ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS xp_reward INTEGER DEFAULT 20;

ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS xp_reward INTEGER DEFAULT 25;

ALTER TABLE public.class_sessions
  ADD COLUMN IF NOT EXISTS xp_reward INTEGER DEFAULT 30;

-- Enable RLS
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;

-- Policies for Badges
CREATE POLICY "Anyone can view active badges" ON public.badges
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage badges" ON public.badges
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policies for User Badges
CREATE POLICY "Anyone can view user badges" ON public.user_badges
  FOR SELECT USING (true);

CREATE POLICY "Users or Admins can unlock user badges" ON public.user_badges
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policies for Daily Checkins
CREATE POLICY "Users can manage own checkins" ON public.daily_checkins
  FOR ALL USING (auth.uid() = user_id);

-- 5. Seed default badges
INSERT INTO public.badges (code, title, title_vi, description_vi, icon_url, badge_type, target_role, req_type, req_value, bonus_xp)
VALUES
  ('welcome_beginner', 'Tân Binh Tiếng Nhật', 'Tân Binh Tiếng Nhật', 'Hoàn thành bài học đầu tiên trên hệ thống', '🔰', 'milestone', 'student', 'lessons_completed', 1, 20),
  ('streak_7_days', 'Kiên Trì 7 Ngày', 'Kiên Trì 7 Ngày', 'Đăng nhập liên tục 7 ngày học tập', '🔥', 'streak', 'student', 'streak_days', 7, 50),
  ('streak_30_days', 'Chiến Binh Chăm Chỉ', 'Chiến Binh Chăm Chỉ', 'Đăng nhập liên tục 30 ngày học tập', '⚡', 'streak', 'student', 'streak_days', 30, 200),
  ('xp_master_500', 'Cao Thủ Học Hỏi (500 XP)', 'Cao Thủ Học Hỏi', 'Tích lũy đạt mốc 500 điểm XP kinh nghiệm', '⭐', 'milestone', 'all', 'total_xp', 500, 100),
  ('xp_legend_2000', 'Huyền Thoại Trí Tuệ (2000 XP)', 'Huyền Thoại Trí Tuệ', 'Tích lũy đạt mốc 2000 điểm XP kinh nghiệm', '👑', 'milestone', 'all', 'total_xp', 2000, 300),
  ('exam_conqueror_5', 'Vua Thi Thử (5 Bài)', 'Vua Thi Thử', 'Hoàn thành 5 bài kiểm tra đạt điểm số cao', '🏆', 'achievement', 'student', 'exams_completed', 5, 100),
  ('teacher_star', 'Giảng Viên Ưu Tú', 'Giảng Viên Ưu Tú', 'Danh hiệu dành cho giảng viên cống hiến xuất sắc', '🎓', 'role_badge', 'teacher', 'custom', 1, 500),
  ('speaking_pro', 'Thần Thoại Kaiwa (Nói)', 'Thần Thoại Kaiwa', 'Hoàn thành các bài thi đối thoại Kaiwa phát âm xuất sắc', '🎙️', 'achievement', 'student', 'custom', 1, 150)
ON CONFLICT (code) DO NOTHING;
