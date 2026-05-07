
-- Seed chatbot config row in website_content
INSERT INTO public.website_content (section_key, title_vi, subtitle_vi, description_vi, image_url, is_active, order_index, content)
VALUES (
  'chatbot',
  'Trợ lý AI TNQDO',
  'Xin chào! Mình là Q-Bot 🤖',
  'Mình có thể giúp bạn tìm khóa học, giáo viên, lịch học và trả lời các câu hỏi về tiếng Nhật.',
  NULL,
  true,
  999,
  jsonb_build_object(
    'model', 'google/gemini-3-flash-preview',
    'system_prompt', 'Bạn là Q-Bot, trợ lý AI thân thiện của trung tâm tiếng Nhật TNQDO. Trả lời ngắn gọn bằng tiếng Việt, lịch sự, hỗ trợ học viên về khóa học, lịch học, học phí, giáo viên, phương pháp học tiếng Nhật. Khi cần đăng ký hãy hướng người dùng đến /lien-he hoặc /khoa-hoc.',
    'welcome_message', 'Xin chào 👋 Mình là Q-Bot. Bạn cần hỗ trợ gì hôm nay?',
    'suggestions', jsonb_build_array('Khóa học nào phù hợp cho người mới?', 'Học phí bao nhiêu?', 'Lịch khai giảng tháng này?', 'Cách đăng ký học thử?')
  )
)
ON CONFLICT (section_key) DO NOTHING;

-- Seed about_zoom section
INSERT INTO public.website_content (section_key, title_vi, subtitle_vi, description_vi, is_active, order_index, content)
VALUES (
  'about_zoom',
  'Học Online qua Google Meet',
  'Lớp học trực tuyến',
  'Lớp 1-1 hoặc nhóm nhỏ tối đa 6 học viên với giáo viên bản ngữ',
  true,
  500,
  '{}'::jsonb
)
ON CONFLICT (section_key) DO NOTHING;
