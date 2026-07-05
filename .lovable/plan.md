## Đợt 3 – Nâng cấp trình tạo & trải nghiệm học

Phạm vi lớn: gói thành **4 đợt nhỏ**, đợt này (3A) làm nền tảng + LessonEditor. Các đợt sau xây tiếp theo cùng design system.

### Đợt 3A – Ẩn XP + LessonEditor "Notion-style" (làm ngay)

**1. Ẩn XP khỏi UI (giữ DB)**
- Ẩn cột/badge XP ở: `TopBar`, `Sidebar`, `Dashboard`, `Profile`, `TopLearnersCard`, `AdminSettings` (form config), `Leaderboard` (đã xong), `Achievements` (đã xong).
- Không xóa cột DB, không sửa function `get_leaderboard`.

**2. LessonEditor mới – `/teacher/lessons/:id/edit`**
- Layout 3 cột: **Outline (trái) · Canvas block-based (giữa) · Inspector + AI Copilot (phải)**.
- Block types: Heading, Paragraph (rich), Callout, Image, Video/YouTube, Audio, PDF/Slide embed, Vocabulary card, Quiz inline, Fill-blank, Matching, Divider, Code, Table.
- Kéo-thả sắp xếp (dnd-kit), duplicate, template "Bài học chuẩn A1".
- **AI Copilot panel**: nhập chủ đề/level → sinh outline, sinh từ vựng, sinh quiz, dịch VI↔EN, viết lại đơn giản hơn – gọi edge `classroom-ai` action mới `lesson_*`.
- Auto-save 2s debounce, preview realtime kiểu Student view (toggle).
- Lưu vào `lessons.content` (jsonb) theo schema block array.

**3. Student Lesson Viewer đẹp hơn**
- Renderer block-based tương ứng, progress dạng scroll-linked, sticky mini-outline, đánh dấu đã đọc, nộp inline exercise không rời trang.

### Đợt 3B – AssignmentComposer v2 (đợt sau)
Wizard 3 bước · thư viện đính kèm · giao nhiều lớp · AI sinh đề + rubric · schedule.

### Đợt 3C – Exam Builder v2 (đợt sau)
Ngân hàng câu hỏi (`question_bank`), tag/độ khó, tạo đề = kéo câu hoặc AI sinh, trộn đề, timer, anti-cheat (blur/tab-switch cảnh báo), auto-grade + rubric cho tự luận.

### Đợt 3D – Realtime & Analytics (đợt sau)
Live comment trên bài học, presence "đang xem", heatmap tiến độ lớp, cảnh báo học viên tụt.

### Kỹ thuật đợt 3A
- Thêm `edge/classroom-ai` action: `lesson_outline`, `lesson_vocab`, `lesson_quiz`, `lesson_rewrite`, `lesson_translate` – dùng AI SDK + Gemini Flash.
- Không migration mới (dùng `lessons.content` sẵn có). Nếu chưa có, migration nhẹ thêm cột `content jsonb` + `schema_version int`.
- File mới: `src/pages/teacher/LessonEditorPro.tsx`, `src/components/lesson-editor/{Canvas,Outline,Inspector,AICopilot,blocks/*}.tsx`, `src/components/lesson-viewer/BlockRenderer.tsx`.
- Route mới thay `LessonEditor` cũ (giữ file cũ để rollback).

Xác nhận đi vào **Đợt 3A** ngay?