## Mục tiêu

Hoàn thiện khu vực `/teacher` với 3 nhóm tính năng lớn, UI đồng bộ với "Không gian giảng dạy" hiện tại:

1. **Quản lý tài liệu (PDF / DOCX / Slide)** – upload, preview trực tiếp trên trang, gán vào bài học / lớp.
2. **Bài học & bài giảng nâng cấp** – nhúng video URL (YouTube/Vimeo/MP4), gắn tài liệu, preview đẹp.
3. **Bài kiểm tra trực tiếp** – timer đếm ngược, tự nộp khi hết giờ, khóa nộp sau deadline, kết quả chấm tự động.

## Phạm vi thay đổi

### Database (migration mới)
- `lesson_materials` (lesson_id, title, file_url, file_type pdf/docx/pptx/other, size, order_index) + RLS: teacher sở hữu lesson quản lý, học viên đã đăng ký xem.
- `exams`: bổ sung `duration_minutes`, `starts_at`, `ends_at`, `lock_after_end`, `shuffle_questions`, `max_attempts`, `passing_score` (chỉ thêm cột thiếu).
- `exam_attempts` (exam_id, student_id, started_at, submitted_at, time_spent_seconds, score, total, answers jsonb, status: in_progress/submitted/auto_submitted/locked) + RLS: học viên xem của mình, giáo viên xem của lớp mình.
- `lessons`: đảm bảo có `video_url`, `materials` ref (đã có `video_url`).
- Bucket `lesson-materials` (public) cho PDF/DOCX/PPTX.

### UI giáo viên (`src/pages/teacher` + `src/components/teacher`)
- **TeacherLessons.tsx**: thêm tab "Tài liệu" – list/upload PDF/DOCX/PPTX, drag-drop, hiển thị icon theo loại, nút preview mở dialog PDF viewer (iframe / `<embed>`), DOCX/PPTX dùng Office Online viewer URL.
- **LessonEditor.tsx**: thêm field "Video URL" (YouTube/Vimeo/MP4 auto-embed), section "Tài liệu đính kèm" chọn từ thư viện.
- **ExamManager.tsx**: form tạo bài kiểm tra với timer (`duration_minutes`), thời gian bắt đầu/kết thúc, toggle khóa nộp sau hạn, shuffle, max attempts; danh sách bài kiểm tra với badge trạng thái (Sắp diễn ra / Đang mở / Đã khóa); xem danh sách lượt làm bài + điểm.
- Component mới `DocumentViewer.tsx` – render PDF (iframe), DOCX/PPTX (Office viewer), fallback download.
- Component mới `ExamRunner.tsx` (dùng chung học viên) – đồng hồ đếm ngược cố định, tự submit khi 0s, lưu `exam_attempts`.

### UI học viên (tối thiểu để chạy được)
- `src/pages/learn` thêm route `/learn/exams/:id` mở `ExamRunner` với timer, khóa nộp.
- Trang chi tiết bài học (`StudentClassDetail` hoặc Lesson view) hiển thị video nhúng + danh sách tài liệu có nút Xem.

### UX
- Toàn bộ tab và card dùng cùng pattern Card + Tabs đã chuẩn hóa ở `TeacherLessons`.
- Trạng thái màu sắc nhất quán (xanh = mở, vàng = nháp, đỏ = đã khóa).
- Empty state có icon + CTA tạo mới.

## Ngoài phạm vi (để khỏi phình to)
- Không làm chat realtime trong phòng thi.
- Không làm proctoring/giám sát camera.
- Không build trình soạn PPTX trong app – chỉ upload + preview.

## Thứ tự thực hiện
1. Migration DB + bucket.
2. Backend types regen → cập nhật code.
3. UI giáo viên: tài liệu → lesson editor → exam manager.
4. UI học viên: viewer + exam runner.
5. QA: kiểm tra timer auto-submit, khóa sau deadline, preview PDF/DOCX.

Bạn duyệt plan này thì mình bắt đầu chạy migration và code luôn.