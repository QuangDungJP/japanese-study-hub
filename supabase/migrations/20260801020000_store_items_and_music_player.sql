-- Migration: Store System, Custom Categories, Media Assets, and Background Music Player
-- Date: 2026-08-01

-- 1. Store Items Table (Dynamic Categories)
CREATE TABLE IF NOT EXISTS public.store_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  title_vi TEXT NOT NULL,
  description_vi TEXT,
  category TEXT NOT NULL DEFAULT 'music',
  price_vnd INTEGER NOT NULL DEFAULT 0,
  price_jpy INTEGER NOT NULL DEFAULT 0,
  price_xp INTEGER NOT NULL DEFAULT 0,
  req_streak INTEGER NOT NULL DEFAULT 0,
  cover_image TEXT,
  audio_url TEXT,
  content_data JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. User Inventory Table
CREATE TABLE IF NOT EXISTS public.user_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES public.store_items(id) ON DELETE CASCADE,
  item_code TEXT NOT NULL,
  purchased_with TEXT DEFAULT 'xp' CHECK (purchased_with IN ('xp', 'vnd', 'jpy', 'streak', 'system_gift')),
  amount_paid INTEGER DEFAULT 0,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, item_code)
);

-- 3. Music Tracks Table (Background Study Music Player)
CREATE TABLE IF NOT EXISTS public.music_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  artist TEXT DEFAULT 'TNQDO Japanese Sound',
  cover_image TEXT,
  audio_url TEXT NOT NULL,
  duration_seconds INTEGER DEFAULT 180,
  is_free BOOLEAN NOT NULL DEFAULT true,
  price_xp INTEGER DEFAULT 0,
  associated_item_code TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.store_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.music_tracks ENABLE ROW LEVEL SECURITY;

-- Policies for store_items
CREATE POLICY "Anyone can view active store items" ON public.store_items
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage store items" ON public.store_items
  FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Policies for user_inventory
CREATE POLICY "Users can view own inventory" ON public.user_inventory
  FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can insert into own inventory" ON public.user_inventory
  FOR INSERT WITH CHECK (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Policies for music_tracks
CREATE POLICY "Anyone can view active music tracks" ON public.music_tracks
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage music tracks" ON public.music_tracks
  FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Rich Sample Seed Data for Store Items (Shopee-Style Mockups)
INSERT INTO public.store_items (code, title_vi, description_vi, category, price_vnd, price_jpy, price_xp, req_streak, cover_image, is_active, is_featured, order_index)
VALUES
  ('book_mimikara_n5', 'Giáo Trình Mimikara Oboeru JLPT N5 Full (Bản Độc Quyền)', 'Trọn bộ N5 gồm Đọc hiểu, Nghe hiểu & Từ vựng có file audio kèm bản dịch Tiếng Việt chuẩn xác.', 'Sách Giáo Trình', 150000, 900, 500, 0, 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80', true, true, 1),
  ('flashcard_kanji_n3', 'Bộ Flashcard Kanji Hack Não N3 (1000 Thẻ In Màu)', '1000 Thẻ Flashcard Kanji ép plastic siêu bền có hình ảnh tưởng tượng âm Hán Việt độc quyền.', 'Thẻ Flashcards', 120000, 750, 400, 3, 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=600&q=80', true, true, 2),
  ('frame_dragon_gold_3d', 'Khung Avatar Rồng Thần 3D Gold (Bản Giới Hạn)', 'Khung viền Avatar phát sáng neon 3D Rồng Thần mạ vàng khẳng định đẳng cấp cao thủ JLPT.', 'Khung Avatar', 0, 0, 350, 7, 'https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&w=600&q=80', true, true, 3),
  ('track_kyoto_lofi', 'Album Nhạc: Kyoto Chill Study (10 Bài Lo-Fi Phát Ngầm)', 'Trọn bộ 10 bản nhạc Lo-Fi thư giãn không lời phát ngầm khi làm bài thi giúp tăng 200% tập trung.', 'Nhạc Học Tập', 0, 0, 200, 0, 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=600&q=80', true, true, 4),
  ('boost_xp_2x_24h', 'Thẻ Boost 2X XP (Hiệu Lực 24 Giờ)', 'Nhân 2 toàn bộ số điểm XP nhận được khi làm bài thi, nộp bài tập và điểm danh mỗi ngày.', 'Thẻ Boost XP', 29000, 180, 250, 0, 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=600&q=80', true, true, 5),
  ('tshirt_tnqdo_official', 'Áo Phông TNQDO Japanese Hub - Cotton 100%', 'Áo phông kỷ niệm phiên bản giới hạn in họa tiết Kanji thủ công, thoáng mát cá tính.', 'Quà Lưu Niệm', 220000, 1300, 1000, 14, 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80', true, false, 6)
ON CONFLICT (code) DO NOTHING;

-- Sample Seed Data for Music Tracks
INSERT INTO public.music_tracks (title, artist, cover_image, audio_url, duration_seconds, is_free, price_xp, order_index)
VALUES
  ('Sakura Rain Lo-Fi (雨の桜)', 'TNQDO Relaxing Chill', 'https://images.unsplash.com/photo-1528164344705-47542687990d?auto=format&fit=crop&w=400&q=80', 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3', 195, true, 0, 1),
  ('Tokyo Midnight Zen (東京の夜)', 'Kyoto Ambient Sound', 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=400&q=80', 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=chill-lofi-song-8444.mp3', 210, true, 0, 2),
  ('Kyoto Chill Study (京都の夜)', 'Nihon Instrumental', 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=400&q=80', 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73b98.mp3?filename=lofi-chill-medium-version-159456.mp3', 180, false, 200, 3)
ON CONFLICT DO NOTHING;
