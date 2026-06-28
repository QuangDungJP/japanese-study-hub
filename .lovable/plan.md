## Mục tiêu

1. **Đồng bộ Lesson** giữa `/teacher/lessons` và `/admin/lessons`: dùng chung 1 schema + payload, không lệch trường khi lưu.
2. **Tách bạch 3 thực thể** trong UI: Bài học (Lesson) – Bài tập (Exercise) – Bài kiểm tra (Exam).
3. **Exam linh hoạt**: gắn được với Class hoặc Lesson (tuỳ chọn khi tạo).
4. **Learner thấy cả hai cách**: shortcut tổng hợp ở sidebar + 3 tab trong từng lớp.

## Phần A — Đồng bộ Lesson (teacher ↔ admin)

- Tạo file mới `src/lib/lessonSchema.ts` chứa:
  - Kiểu `LessonFormData` (đã bao gồm các trường mới: `objectives`, `prerequisites`, `difficulty`, `estimated_minutes`, `tags`, `start_at`, `end_at`, `class_id`, `is_published`, `cover_url`, `attachments`, …).
  - Hàm `buildLessonPayload(form, { autoFillLocale: true })` — auto cross-fill `title/title_vi`, `description/description_vi`, chuẩn hoá `tags`, default `order_index`.
  - Hàm `parseLessonRow(row)` để map row DB → form (dùng chung load/edit).
- Refactor `src/components/teacher/LessonEditor.tsx` để nhận/emit qua schema chung; bỏ logic tự build payload riêng.
- `AdminLessons.tsx` và `TeacherLessons.tsx` cùng dùng `LessonEditor` + `buildLessonPayload`. Cả 2 lưu vào `lessons` với đúng các cột giống nhau.
- Thêm `tags` (text[]) và `estimated_minutes` (int) vào bảng `lessons` nếu chưa có (cần migration nhỏ — sẽ confirm trước khi chạy).

## Phần B — Phân định Lesson / Exercise / Exam

### Thuật ngữ rõ ràng
- **Lesson**: nội dung học (video, slide, đọc hiểu).
- **Exercise**: bài luyện gắn trong Lesson, tự chấm, không tính điểm chính thức.
- **Exam**: bài kiểm tra chính thức, có thời gian, có điểm, có lịch sử attempts.

### Teacher / Admin
- Trong `LessonEditor` xoá tab "Exam" cũ (đang lẫn). Lesson chỉ còn: Thông tin, Media, Nội dung, **Bài tập** (Exercises), Lịch & Lớp.
- Tạo trang/section riêng `ExamManager` đã có — đưa lên top-level menu:
  - Teacher: `/teacher/exams` (mới) — quản lý đề, chấm, xem attempts.
  - Admin: tab "Bài kiểm tra" trong `/admin/lessons` đổi thành route riêng `/admin/exams`.
- Khi tạo Exam: form có chọn "Gắn với" = `Class` | `Lesson` | `Không gắn`. Cột `lesson_id` của `exams` đã nullable, chỉ cần UI.

### Learner
- Sidebar (`src/components/learning/Sidebar.tsx`) thêm 3 mục riêng cấp 1:
  - **Bài học** → `/learn/lessons` (tổng hợp mọi lớp, đã hoàn thành / đang học).
  - **Bài tập** → `/learn/exercises` (đã có, làm gọn).
  - **Bài kiểm tra** → `/learn/exams` (mới — danh sách exam sắp tới, đã làm, điểm).
- `StudentClassDetail.tsx`: thêm 3 tab `Bài học | Bài tập | Bài kiểm tra` trong từng lớp.
- ExamRunner giữ nguyên; thêm trang `/learn/exams` list + entry point.

## Phần C — Bảo toàn dữ liệu cũ

- Không xoá cột nào của `lessons` / `exams`.
- Migration chỉ ADD COLUMN IF NOT EXISTS, có default an toàn.
- Các trang cũ vẫn redirect đúng (giữ `/learn/exercises`, thêm `/learn/lessons`, `/learn/exams`).

## Phần kỹ thuật chi tiết

```text
src/
  lib/lessonSchema.ts                (mới)
  components/teacher/LessonEditor.tsx (refactor: dùng schema chung, bỏ exam tab)
  pages/admin/AdminLessons.tsx       (dùng schema chung; tab Exam → link sang /admin/exams)
  pages/admin/AdminExams.tsx          (mới — wrap ExamManager toàn site)
  pages/teacher/TeacherExams.tsx      (mới — wrap ExamManager phạm vi teacher)
  pages/learn/Lessons.tsx             (mới — danh sách lesson learner)
  pages/learn/Exams.tsx               (mới — danh sách exam learner)
  pages/learn/StudentClassDetail.tsx  (thêm 3 tab Lesson/Exercise/Exam)
  components/learning/Sidebar.tsx     (thêm Bài học, Bài kiểm tra)
  App.tsx                             (route mới)
```

Migration (chờ duyệt):
```sql
ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS estimated_minutes int,
  ADD COLUMN IF NOT EXISTS objectives text,
  ADD COLUMN IF NOT EXISTS prerequisites text,
  ADD COLUMN IF NOT EXISTS difficulty text;
```

## Ngoài phạm vi (làm sau nếu cần)
- Upgrade UI "siêu đẹp + preview real-time" cho LessonEditor.
- Hoàn thiện chấm điểm tự động cho từng loại Exam.

Sau khi bạn duyệt plan này, tôi sẽ chạy migration trước, rồi triển khai phần code theo thứ tự A → B.