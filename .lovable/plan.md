# Nâng cấp Lớp học "Vượt Google Classroom"

Xây dựng trải nghiệm lớp học hoàn chỉnh cho **giáo viên** và **học viên**, tham khảo Google Classroom nhưng nâng cấp UI theo design system hiện có (bo góc lớn, gradient, glass, animation) và bổ sung realtime + AI + analytics.

## 1. Cấu trúc điều hướng

**Giáo viên** – `/teacher/classes/:id` (đã có, rework):
- Banner tùy chỉnh (ảnh + tên + mã lớp + nút copy).
- 4 tab: **Bảng tin** · **Bài tập trên lớp** · **Mọi người** · **Điểm**.

**Học viên** – `/learn/classes/:id` (rework `StudentClassDetail`):
- Cùng banner, 3 tab: **Bảng tin** · **Bài tập** · **Mọi người**.

## 2. Cơ sở dữ liệu (migration mới)

Bổ sung để hỗ trợ Topics, Stream, Comments, Rubric, Realtime:

```
class_topics(id, class_id, name, order_index)
class_stream_posts(id, class_id, author_id, kind, title, body,
                   attachments jsonb, assignment_id, material_id, pinned)
class_stream_comments(id, post_id, author_id, body, parent_id)
class_stream_reactions(id, post_id|comment_id, user_id, emoji)
class_materials(id, class_id, topic_id, title, description,
                attachments jsonb, order_index)
```

Mở rộng `class_assignments`:
`topic_id`, `points`, `rubric jsonb`, `attachments jsonb`, `assigned_to jsonb`, `order_index`.

Mở rộng `class_assignment_submissions`:
`attachments jsonb`, `feedback`, `rubric_scores jsonb`, `returned_at`.

Bật realtime cho `class_stream_posts`, `class_stream_comments`, `class_stream_reactions`, `class_assignment_submissions`. RLS: chỉ thành viên lớp đọc/ghi.

## 3. Trình tạo Bài tập (Assignment Composer)

Dialog toàn màn hình `AssignmentComposer.tsx`:
- Tiêu đề, hướng dẫn (RichTextEditor có sẵn).
- **Đính kèm**: Upload file (`class-assignments` bucket), Link, YouTube (embed), tài liệu Drive (paste URL).
- Cài đặt phải: Chủ đề, Điểm (số), Hạn nộp (datetime), Giao cho (tất cả / chọn học viên).
- **Rubric builder**: nhiều tiêu chí × nhiều mức điểm.
- Nút **✨ AI gợi ý** (Lovable AI Gateway edge function `assignment-ai`): sinh mô tả + rubric mẫu từ tiêu đề.

## 4. Bảng tin (Stream) realtime

- Feed posts theo `class_stream_posts`, realtime qua Supabase channel.
- Bình luận lồng nhau + reaction emoji.
- Pin bài, phân loại: announcement / assignment / material.
- Composer: rich text + đính kèm; ghim (pin) cho giáo viên.

## 5. Bài tập trên lớp (Classwork)

- Nhóm theo **Topic** (kéo thả sắp xếp bằng dnd-kit — đã có).
- Mỗi item: assignment / material / question, icon màu.
- GV: menu Sửa/Sao chép/Xóa, xem danh sách nộp.
- HV: mở chi tiết, nộp bài (upload/link), xem điểm & feedback.

## 6. Chi tiết bài tập + Nộp bài

- Trang/dialog chi tiết: hướng dẫn, đính kèm, rubric, hạn nộp.
- **HV**: khu vực "Bài làm của bạn" – upload nhiều file + link, nút Nộp/Hủy nộp.
- **GV**: danh sách học viên (trạng thái: Đã giao / Đã nộp / Đã trả lại), chấm theo rubric, feedback, nút **✨ AI feedback** (dựa nội dung nộp).
- **Inline viewer**: PDF (`<iframe>` + pdf.js đã có `PdfPresenter`), ảnh, video (native), Office (Office Online viewer URL).

## 7. Sổ điểm (Gradebook)

- Ma trận HV × bài tập, cell hiển thị điểm/trạng thái, click để chấm nhanh.
- Xuất CSV; tổng điểm & % trung bình mỗi HV.

## 8. Analytics lớp học

Card trên tab Bảng tin (GV):
- Tỷ lệ nộp bài (BarChart – recharts đã có).
- Điểm trung bình theo bài tập (LineChart).
- Top học viên tích cực; HV cần chú ý (chưa nộp / điểm thấp).

## 9. Edge function AI

`supabase/functions/classroom-ai/index.ts` – dùng AI SDK + Lovable AI Gateway (`google/gemini-3-flash-preview`), 2 action:
- `suggest_assignment`: input tiêu đề → trả về mô tả + rubric.
- `suggest_feedback`: input rubric + nội dung nộp → trả về nhận xét + đề xuất điểm.

## 10. UI/Design

- Áp dụng token `--gradient-primary`, `--shadow-elegant`, `rounded-2xl`, glass `bg-card/80 backdrop-blur`.
- Motion: fade-up (ScrollReveal đã có), hover-lift trên card.
- Banner lớp gradient theo màu lớp (`classes.color`) + pattern SVG.
- Tab bar dạng pill (đã dùng ở Blog/Events) thay cho underline Material.
- Không dùng màu hardcode; icon lucide.

## Phạm vi thực thi (chia nhỏ, sẽ triển khai theo từng đợt)

**Đợt 1 (đợt này)**: Migration + Assignment Composer + tab Bài tập trên lớp (Topics + list) cho GV + HV, dùng lại dialog nộp bài. Bảng tin realtime cơ bản (posts + comments).

**Đợt 2**: Rubric UI đầy đủ, Gradebook, Analytics, AI feedback, Inline viewer nâng cao.

Bạn duyệt kế hoạch để mình chạy migration + code Đợt 1 nhé.
