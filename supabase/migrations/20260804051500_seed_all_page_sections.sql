-- Migration: Seed & Sync default sections for all pages with TNQDO Team Banner
-- Upsert to ensure website_content uses local images & syncs perfectly

INSERT INTO public.website_content (section_key, title_vi, subtitle_vi, description_vi, image_url, is_active, order_index, content)
VALUES
  (
    'hero',
    'Chinh phục Tiếng Nhật cùng TNQDO',
    'Nền tảng học Tiếng Nhật #1 cho người Việt',
    'Phương pháp học toàn diện 4 kỹ năng: Đọc - Nói - Viết - Nghe. Từ N5 đến N1, luyện thi JLPT với giáo viên bản ngữ qua Meeting.',
    '/img/qd-team-hero.png',
    true,
    1,
    '{}'::jsonb
  ),
  (
    'about_hero',
    'Về Chúng Tôi - Trung Tâm Tiếng Nhật TNQDO',
    'Câu chuyện & Sứ mệnh',
    'Đội ngũ tận tâm, phương pháp học toàn diện 4 kỹ năng giúp hàng ngàn học viên chinh phục JLPT và giao tiếp tự tin.',
    '/img/qd-team-hero.png',
    true,
    10,
    '{}'::jsonb
  ),
  (
    'about_story',
    'Hành trình xây dựng thương hiệu TNQDO',
    'Câu chuyện thành lập',
    'Khởi đầu từ khát khao giúp người Việt học Tiếng Nhật thực chiến, không áp lực thuộc vẹt.',
    '/img/qd-team-hero.png',
    true,
    11,
    '{}'::jsonb
  ),
  (
    'courses_hero',
    'Lộ trình đào tạo Tiếng Nhật Toàn diện',
    'Từ N5 đến N1',
    'Chương trình thiết kế theo chuẩn JLPT Nhật Bản, linh hoạt thời gian học 1-on-1 hoặc lớp nhóm.',
    '/img/qd-team-hero.png',
    true,
    20,
    '{}'::jsonb
  ),
  (
    'courses_discount',
    '🎉 Ưu đãi Học phí Mùa này',
    'Giảm đến 30% khi đăng ký sớm',
    'Tặng gói Luyện thi JLPT & Bộ sách Kanji độc quyền khi đăng ký khóa học tháng này.',
    '/img/qd-team-hero.png',
    true,
    21,
    '{}'::jsonb
  ),
  (
    'teachers_page_hero',
    'Đội ngũ Giáo viên Nhật - Việt Chất lượng cao',
    'Giảng viên tâm huyết TNQDO',
    '100% giáo viên có bằng N1/N2 hoặc bản ngữ Nhật, trên 5 năm kinh nghiệm giảng dạy.',
    '/img/qd-team-hero.png',
    true,
    30,
    '{}'::jsonb
  ),
  (
    'teachers_recruitment',
    'Trở thành Giảng viên Tiếng Nhật cùng TNQDO',
    'Tuyển dụng Giảng viên',
    'Gia nhập môi trường đào tạo hiện đại, chế độ đãi ngộ hấp dẫn và thời gian giảng dạy linh hoạt.',
    '/img/qd-team-hero.png',
    true,
    31,
    '{}'::jsonb
  ),
  (
    'meeting_hero',
    'Lớp Học Trực Tuyến Live Meeting 1-on-1',
    'Học mọi lúc mọi nơi',
    'Tương tác trực tiếp với giáo viên qua Meeting, sửa lỗi phát âm và luyện phản xạ tức thì.',
    '/img/zoom-meeting.png',
    true,
    40,
    '{}'::jsonb
  ),
  (
    'meeting_guide',
    'Hướng dẫn Tham gia Phòng học Online',
    'Đơn giản & Nhanh chóng',
    'Chỉ với 1 click từ lịch học, bạn có thể tham gia ngay lớp học Google Meet / Zoom chất lượng cao.',
    '/img/zoom-meeting.png',
    true,
    41,
    '{}'::jsonb
  ),
  (
    'blog_hero',
    'Tin tức, Phương pháp & Văn hóa Nhật Bản',
    'Góc kiến thức',
    'Cập nhật bài viết hướng dẫn học Kanji, kinh nghiệm thi JLPT và nét đẹp văn hóa Nhật.',
    '/img/qd-team-hero.png',
    true,
    50,
    '{}'::jsonb
  ),
  (
    'events_hero',
    'Sự kiện & Workshop Tiếng Nhật Hàng tuần',
    'Giao lưu & Trải nghiệm',
    'Tham gia các buổi trò chuyện với người bản ngữ, giao lưu văn hóa và thi thử JLPT miễn phí.',
    '/img/qd-team-hero.png',
    true,
    60,
    '{}'::jsonb
  ),
  (
    'contact_hero',
    'Liên hệ với Trung tâm Tiếng Nhật TNQDO',
    'Hỗ trợ 24/7',
    'Chúng tôi luôn sẵn sàng tư vấn lộ trình học phù hợp nhất cho bạn.',
    '/img/qd-team-hero.png',
    true,
    70,
    '{}'::jsonb
  ),
  (
    'seasonal_tet',
    '🌸 Mừng Xuân Mới - Khai Xuân Đón Lộc Học Tiếng Nhật',
    'Khuyến mãi Tết Nguyên Đán',
    'Nhận ngay Lì Xì học phí đến 35% + Bộ quà tặng sách JLPT cao cấp khi đăng ký khóa học Xuân này.',
    '/img/qd-team-hero.png',
    true,
    80,
    '{}'::jsonb
  )
ON CONFLICT (section_key) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  updated_at = NOW();
