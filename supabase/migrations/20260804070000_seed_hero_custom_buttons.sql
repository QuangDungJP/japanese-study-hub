-- Migration: Seed Hero Custom Buttons & Layout Modes for Website CMS
-- File: supabase/migrations/20260804070000_seed_hero_custom_buttons.sql

INSERT INTO public.website_content (
  section_key,
  title_vi,
  subtitle_vi,
  description_vi,
  image_url,
  is_active,
  order_index,
  content
)
VALUES (
  'hero',
  'Chinh phục Tiếng Nhật cùng TNQDO',
  '🌸 Nền tảng học Tiếng Nhật #1 cho người Việt',
  'Phương pháp học toàn diện 4 kỹ năng: Đọc - Nói - Viết - Nghe. Từ N5 đến N1, luyện thi JLPT với giáo viên bản ngữ qua Meeting.',
  '/img/qd-team-hero.png',
  true,
  10,
  '{
    "hero_mode": "center_poster",
    "buttons_placement": "below",
    "show_stats": true,
    "tagline": "Mở cánh cửa tương lai Nhật Bản, kết nối toàn cầu.",
    "students": "50K+",
    "teachers": "200+",
    "lessons": "1000+",
    "custom_buttons": [
      {
        "id": "btn_1",
        "text": "✨ Học miễn phí ngay",
        "url": "/auth",
        "variant": "primary",
        "enabled": true
      },
      {
        "id": "btn_2",
        "text": "▷ Xem khóa học",
        "url": "/khoa-hoc",
        "variant": "outline",
        "enabled": true
      }
    ],
    "primary_btn": {
      "enabled": true,
      "text": "Học miễn phí ngay",
      "url": "/auth"
    },
    "secondary_btn": {
      "enabled": true,
      "text": "Xem khóa học",
      "url": "/khoa-hoc"
    }
  }'::jsonb
)
ON CONFLICT (section_key) DO UPDATE SET
  title_vi = EXCLUDED.title_vi,
  subtitle_vi = EXCLUDED.subtitle_vi,
  description_vi = EXCLUDED.description_vi,
  image_url = EXCLUDED.image_url,
  content = EXCLUDED.content,
  updated_at = NOW();
