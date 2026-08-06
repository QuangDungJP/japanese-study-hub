# 📋 TÀI LIỆU BÁN HÀNG - HỆ THỐNG TNQDO
## Nền tảng Quản lý & Đào tạo Ngoại ngữ Trực tuyến #1 Việt Nam
### *Dành cho Đội ngũ Kinh doanh (Sales Team)*

> **Phiên bản**: v3.0 — Cập nhật: 06/08/2026
> **Bảo mật**: TÀI LIỆU NỘI BỘ — Không chia sẻ bên ngoài khi chưa được phê duyệt

---

# MỤC LỤC

1. [TỔNG QUAN HỆ THỐNG](#1-tổng-quan-hệ-thống)
2. [KIẾN TRÚC CÔNG NGHỆ](#2-kiến-trúc-công-nghệ)
3. [TÍNH NĂNG CHI TIẾT TOÀN HỆ THỐNG](#3-tính-năng-chi-tiết-toàn-hệ-thống)
4. [12 ĐIỂM VƯỢT TRỘI SO VỚI ĐỐI THỦ](#4-12-điểm-vượt-trội-so-với-đối-thủ)
5. [SO SÁNH VỚI ĐỐI THỦ CẠNH TRANH](#5-so-sánh-với-đối-thủ-cạnh-tranh)
6. [ĐỐI TƯỢNG KHÁCH HÀNG MỤC TIÊU](#6-đối-tượng-khách-hàng-mục-tiêu)
7. [KẾ HOẠCH TUYỂN SINH & KỊCH BẢN BÁN HÀNG](#7-kế-hoạch-tuyển-sinh--kịch-bản-bán-hàng)
8. [BẢNG GIÁ & GÓI DỊCH VỤ](#8-bảng-giá--gói-dịch-vụ)
9. [LỘ TRÌNH MỞ RỘNG SAAS MULTI-TENANT](#9-lộ-trình-mở-rộng-saas-multi-tenant)
10. [FAQ — CÂU HỎI THƯỜNG GẶP KHI ĐI SALE](#10-faq--câu-hỏi-thường-gặp-khi-đi-sale)
11. [PHỤ LỤC — TÀI LIỆU HỖ TRỢ](#11-phụ-lục--tài-liệu-hỗ-trợ)

---

# 1. TỔNG QUAN HỆ THỐNG

## 1.1. TNQDO là gì?

**TNQDO (Tiếng Nhật Quang Dũng Online)** là nền tảng **LMS (Learning Management System)** kết hợp **EdTech Gamification** — một hệ thống quản lý và đào tạo ngoại ngữ trực tuyến **all-in-one** được thiết kế riêng cho thị trường Việt Nam.

> **Một câu tóm tắt cho khách hàng:**
> *"TNQDO là Google Classroom + Duolingo + Zoom kết hợp trong MỘT nền tảng duy nhất, được tùy biến hoàn toàn cho trung tâm ngoại ngữ tại Việt Nam."*

## 1.2. Tầm nhìn & Sứ mệnh

| Tầm nhìn | Sứ mệnh |
|-----------|----------|
| Trở thành nền tảng EdTech #1 khu vực Đông Nam Á cho đào tạo ngoại ngữ | Giúp mọi trung tâm ngoại ngữ tại Việt Nam có thể chuyển đổi số trong 48 giờ với chi phí hợp lý nhất |

## 1.3. Số liệu ấn tượng

| Chỉ số | Giá trị |
|--------|---------|
| Học viên đã phục vụ | **50,000+** |
| Giảng viên trên hệ thống | **200+** |
| Bài học có sẵn | **1,000+** |
| Đánh giá trung bình | **4.9/5** (2,500+ đánh giá) |
| Responsive 100% | PC, Tablet, Mobile |
| Dark Mode | Có sẵn |
| Lo-Fi Music Hub | Tích hợp sẵn |

## 1.4. Ai dùng hệ thống?

Hệ thống phục vụ **4 vai trò (roles)** với phân quyền riêng biệt:

- **SUPER ADMIN**: Quản trị tối cao toàn hệ thống, cấp quyền, Audit Log, Multi-tenant SaaS
- **ADMIN**: CMS Website, Quản lý nội dung, Tài chính, Khóa học, Sự kiện, Blog, Đơn hàng, Người dùng
- **TEACHER**: Quản lý lớp, Điểm danh, Bài học, Chấm điểm, Giao bài, Zoom/Meet live, Email lịch học tự động
- **STUDENT**: Học tập, Thi JLPT, Luyện kỹ năng, Gamification, XP & Streak, Store đổi quà, Bảng xếp hạng

---

# 2. KIẾN TRÚC CÔNG NGHỆ

## 2.1. Tech Stack

| Lớp | Công nghệ | Lợi ích cho khách hàng |
|-----|-----------|----------------------|
| **Frontend** | React 18 + TypeScript + Vite | Tốc độ mở trang dưới 1 giây, mượt mà, không giật |
| **UI Framework** | Tailwind CSS + Shadcn UI + Framer Motion | Giao diện sang trọng, responsive 100%, hiệu ứng cinema-level |
| **Backend** | Supabase (PostgreSQL) | Cơ sở dữ liệu mạnh mẽ, scale được hàng triệu bản ghi |
| **Realtime** | Supabase Realtime | Chat lớp học, thông báo tức thì, dashboard live |
| **Bảo mật** | Row Level Security (RLS) | Dữ liệu tuyệt đối an toàn giữa các trung tâm |
| **File Storage** | Supabase Storage Buckets | Upload tài liệu, ảnh, video không giới hạn |
| **Hosting** | Vercel (Edge Network) | CDN toàn cầu, uptime 99.99% |
| **Email** | Tích hợp SMTP tự động | Gửi email nhắc lịch, thông báo chấm bài |
| **Charts** | Recharts | Biểu đồ tài chính, thống kê trực quan |

---

# 3. TÍNH NĂNG CHI TIẾT TOÀN HỆ THỐNG

## 3.1. WEBSITE CÔNG KHAI (Public Pages) — 10 Trang

### Trang chủ (Homepage)
- **Hero Banner** động với animation mượt mà, call-to-action nổi bật
- **4 Kỹ năng cốt lõi**: Đọc, Nói, Viết, Nghe — hiển thị card tương tác
- **Lộ trình JLPT** từ N5 đến N1 trực quan
- **Đội ngũ giảng viên** nổi bật với rating 5 sao
- **Phòng Meeting Online** — quảng bá lớp trực tuyến 1-1 / nhóm max 6 người
- **Blog & Tin tức** — bài viết SEO tự động cập nhật
- **Sự kiện & Workshop** — hiển thị sự kiện sắp tới
- **Testimonials** — đánh giá từ học viên thực
- **Lo-Fi Music Hub** — widget nhạc học tập tích hợp góc phải

### Trang Giới thiệu (About)
- Câu chuyện thương hiệu, sứ mệnh
- Thống kê ấn tượng: 50K+ học viên, 1000+ bài học, 95% tỷ lệ đậu JLPT

### Trang Khóa học (Courses)
- Danh sách khóa học với filter theo level (N5-N1)
- Card khóa học premium: giá, giảm giá, rating, giảng viên

### Trang Giảng viên, Blog, Sự kiện, Liên hệ, Đăng nhập, Chính sách & Điều khoản
- Đầy đủ chuyên nghiệp, SEO optimized, responsive

---

## 3.2. HỆ THỐNG HỌC TẬP (Student Portal) — 21 Module

### Dashboard Học viên
- Tổng quan tiến độ: XP, Streak, Level, 4 kỹ năng progress
- Buổi live sắp tới, bài học gần đây, thông báo, danh ngôn Nhật Bản

### Bài học (Lessons)
- Lesson Viewer premium: HTML rich-text, slide PDF, tài liệu tải về
- XP reward khi hoàn thành

### Bài tập Tương tác — 5 Loại
1. **Flashcard** — Lật thẻ từ vựng thông minh
2. **Matching Game** — Nối từ vựng với nghĩa
3. **Quiz** — Câu hỏi nhiều lựa chọn
4. **Fill in the Blank** — Điền từ vào chỗ trống
5. **Sentence Order** — Sắp xếp câu đúng thứ tự

### Hệ thống Thi JLPT (Exam Engine) — ĐỘC QUYỀN
- Mô phỏng thi JLPT chân thực cấp N5 đến N1
- 4 dạng câu hỏi: Multiple choice, True/False, Short answer, Essay
- Timer Mode: Countdown / Stopwatch / Không giới hạn
- Shuffle Questions, Max Attempts, Passing Score, Auto-grading
- **Proctoring (Giám sát thi)**: Gaze Detection, Head Detection, Multi-face Detection, Dual monitor detection
- Review Mode, Retry Wrong, XP Reward

### Lớp học của tôi (My Classes)
- Chi tiết lớp học đầy đủ: giáo viên, lịch học, sessions, bài tập
- Classroom Chat real-time, Trình chiếu bài giảng, Xin nghỉ phép, Video buổi học
- 1-click tham gia Meeting Zoom/Meet

### 4 Kỹ năng: Đọc, Nói, Viết, Nghe
- Từ vựng, Flashcard, Audio player tùy chỉnh tốc độ

### Gamification — SIÊU KHÁC BIỆT
- XP, Streak, Level & Rank, Leaderboard, Badge Showcase, Avatar Frame Customizer

### Cửa hàng (Store) — ĐỘC QUYỀN
- 5 danh mục: Nhạc, Khung Avatar, Theme, Boost, Quà Vật Lý
- Mua bằng XP hoặc VNĐ, yêu cầu Streak

### Lịch học, Thông báo, Profile, Theme, Settings, Hướng dẫn

---

## 3.3. HỆ THỐNG GIÁO VIÊN (Teacher Portal) — 14 Module

### Quản lý Lớp học — SIÊU MẠNH (3,000+ dòng code)
- Tạo & quản lý lớp, Sessions, Quản lý học viên
- Chấm điểm & Phản hồi + Email thông báo tự động
- Điểm danh, Classroom Chat, Trình chiếu PDF/Slide
- Giao bài tập, Gradebook, Class Analytics, Timesheet
- Gửi email lịch học HTML, Export Google Sheets CSV

### Chấm bài (Submissions)
- Bài tập thường + Bài thi, Student Submission Analysis Modal
- Chấm điểm + feedback + gửi email thông báo

### Zoom/Meeting, Lịch giảng dạy, Thông báo, Báo lỗi

---

## 3.4. HỆ THỐNG QUẢN TRỊ (Admin Portal) — 25 Module

### Admin Dashboard
- KPI Cards live, Activity Chart real-time, Skill Distribution, Top Learners

### Website CMS — SIÊU MẠNH (1,890 dòng code)
- 10+ Section trang chủ, Drag & Drop, Bật/tắt, WYSIWYG Editor
- Banner mùa/lễ tết, Footer, SEO, Preview

### Quản lý: Khóa học, Giáo viên, Bài học, Từ vựng, Lớp học

### Tài chính (Finance) — SIÊU MẠNH
- KPI Dashboard, Biểu đồ doanh thu, PieChart, Bảng đơn hàng, Refund

### Quản lý: Đơn hàng, Booking, Sự kiện, Blog, Form Liên hệ, FAQ, Badge, Store, Popup, Người dùng, Cài đặt

---

# 4. 12 ĐIỂM VƯỢT TRỘI SO VỚI ĐỐI THỦ

### 1. ALL-IN-ONE — Không cần mua thêm gì
> *"Một nền tảng duy nhất thay thế 5-7 công cụ riêng lẻ"*

### 2. GAMIFICATION ĐỈNH CAO — Giữ chân 90%+ học viên
> *"Học viên nghiện học như chơi game — XP, Streak, Level, Store đổi quà"*

### 3. THI JLPT CHÂN THỰC — Engine thi chuẩn quốc tế
> *"Engine thi mạnh nhất thị trường — có cả Proctoring giám sát gian lận"*

### 4. VIRTUAL CLASSROOM HOÀN CHỈNH
> *"Lớp học online không khác gì offline — có chat, trình chiếu, điểm danh, chấm bài"*

### 5. CMS WEBSITE CHUYÊN NGHIỆP
> *"Website landing page đẹp như công ty lớn — không cần thuê designer"*

### 6. TÀI CHÍNH & DOANH THU MINH BẠCH
> *"Biết rõ từng đồng doanh thu, từng đơn hàng — chart trực quan"*

### 7. EMAIL TỰ ĐỘNG
> *"Hệ thống tự gửi email nhắc lịch, thông báo chấm bài"*

### 8. RESPONSIVE 100% + DARK MODE + 10+ THEMES

### 9. LO-FI MUSIC HUB — Trải nghiệm học premium

### 10. BẢO MẬT CẤP ENTERPRISE — PostgreSQL + RLS

### 11. SCALABLE — TỪ 10 ĐẾN 100,000 HỌC VIÊN

### 12. SẴN SÀNG MULTI-LANGUAGE (Nhật/Trung/Hàn/Anh)

---

# 5. SO SÁNH VỚI ĐỐI THỦ CẠNH TRANH

| Tính năng | **TNQDO** | Google Classroom | Zoom + LMS | Duolingo | Topica |
|-----------|-----------|-----------------|------------|----------|--------|
| LMS quản lý lớp | ✅ Đầy đủ | ✅ Cơ bản | ❌ Riêng lẻ | ❌ | ✅ |
| Thi mô phỏng JLPT | ✅ **Full engine** | ❌ | ❌ | ❌ | Hạn chế |
| Gamification | ✅ **Đỉnh cao** | ❌ | ❌ | ✅ Cơ bản | ❌ |
| Website CMS | ✅ **10+ sections** | ❌ | ❌ | ❌ | ❌ |
| Classroom Chat | ✅ Real-time | ✅ | ✅ | ❌ | Hạn chế |
| Tài chính | ✅ **Dashboard full** | ❌ | ❌ | ❌ | Riêng lẻ |
| Proctoring thi | ✅ **Multi-detection** | ❌ | ❌ | ❌ | ❌ |
| Lo-Fi Music Hub | ✅ **Độc quyền** | ❌ | ❌ | ❌ | ❌ |
| Store đổi quà | ✅ **Full** | ❌ | ❌ | ❌ | ❌ |
| **Chi phí** | Cạnh tranh | Miễn phí nhưng thiếu | $$$ | $$$ | $$$$ |

---

# 6. ĐỐI TƯỢNG KHÁCH HÀNG MỤC TIÊU

### Segment A: Trung tâm Ngoại ngữ (50-5,000 học viên)
- Pain: Quản lý thủ công, nhiều tool rời rạc
- Value: All-in-one, tiết kiệm 70%

### Segment B: Giáo viên Freelance (5-100 học viên)
- Pain: Không có website, không có hệ thống
- Value: Website + quản lý lớp trong 1 gói

### Segment C: Trường ĐH/CĐ (500-20,000 sinh viên)
- Pain: Cần hệ thống thi chuẩn, bảo mật
- Value: Enterprise-grade + Proctoring

### Segment D: Doanh nghiệp đào tạo Nhật ngữ (20-500 nhân viên)
- Pain: Training tracking, báo cáo HR
- Value: Tracking tiến độ, thi chuẩn

---

# 7. KẾ HOẠCH TUYỂN SINH & KỊCH BẢN BÁN HÀNG

## 7.1. Chiến lược 4 Giai đoạn

**Giai đoạn 1 (Tháng 1-2):** Demo account, video demo, slide pitch, landing page B2B, 20 bài blog SEO

**Giai đoạn 2 (Tháng 2-4):** 500 cold contacts, 10 webinar, partnership, dùng thử 30 ngày

**Giai đoạn 3 (Tháng 4-6):** SEO top 3, Ads targeting, Referral program, Case study

**Giai đoạn 4 (Tháng 6-12):** Multi-language, Multi-tenant SaaS, 50 trung tâm, mở rộng ĐNA

## 7.2. Kịch bản Sale

**Cold Call:** "Em muốn giới thiệu giải pháp giúp tiết kiệm 70% thời gian quản lý và tăng 30% giữ chân học viên"

**Demo Flow (15 phút):** Website (3p) → Student Portal (5p) → Teacher Portal (4p) → Admin Portal (3p)

**Xử lý từ chối:**
- "Đắt quá" → So thuê developer riêng 20-50 triệu/tháng, tiết kiệm 80%+
- "Dùng Google Classroom rồi" → Không có thi, gamification, CMS, tài chính
- "Không rành công nghệ" → Hướng dẫn chi tiết, setup 30 phút
- "Cần suy nghĩ" → Dùng thử miễn phí 30 ngày

---

# 8. BẢNG GIÁ & GÓI DỊCH VỤ

## B2B cho Trung tâm

| | STARTER | PRO | ENTERPRISE |
|---|---|---|---|
| Giá/tháng | 2.990.000đ | 6.990.000đ | Liên hệ |
| Giá/năm (giảm 20%) | 28.700.000đ | 67.100.000đ | Liên hệ |
| Học viên | 100 | 500 | Không giới hạn |
| Giáo viên | 5 | 25 | Không giới hạn |
| Lưu trữ | 10 GB | 50 GB | 500 GB |
| Custom Domain | ❌ | ✅ | ✅ |
| Zoom/Meet | ❌ | ✅ | ✅ |
| Email tự động | ❌ | ✅ | ✅ |
| Proctoring | ❌ | ✅ | ✅ |
| Support | Email | Priority | VIP 24/7 |

## Gói Cá nhân

| | BASIC | PREMIUM |
|---|---|---|
| Giá/tháng | 990.000đ | 1.990.000đ |
| Học viên | 30 | 100 |

## Chính sách đặc biệt
- Dùng thử miễn phí 30 ngày
- Giảm 20% thanh toán năm
- Giảm 30% cho 10 khách đầu tiên
- Referral: giảm 20% phí 6 tháng
- Giảm 50% cho tổ chức phi lợi nhuận

---

# 9. LỘ TRÌNH MỞ RỘNG SAAS MULTI-TENANT

- Multi-Tenant với RLS data isolation
- Custom domain & white-label branding
- Language Packs: Japanese (done), Chinese (developing), Korean & English (2027)

---

# 10. FAQ — CÂU HỎI THƯỜNG GẶP KHI ĐI SALE

**Q1: "Cần thuê hosting?"** → Không. Vercel + Supabase Cloud. Uptime 99.99%

**Q2: "Setup mất bao lâu?"** → 30 phút. Custom branding 1-2 ngày

**Q3: "Dữ liệu an toàn?"** → Supabase enterprise, RLS, backup hàng ngày, SSL/TLS

**Q4: "Hết hợp đồng?"** → Export toàn bộ CSV/JSON, giữ thêm 30 ngày

**Q5: "Có API?"** → Có. RESTful API tự động cho mọi bảng dữ liệu

**Q6: "Dùng điện thoại?"** → 100% responsive, không cần cài app

**Q7: "Thi gian lận?"** → Proctoring multi-detection + shuffle + time limit

**Q8: "Khác Google Classroom?"** → GC không có thi JLPT, gamification, CMS, finance, proctoring, music, blog

**Q9: "Hỗ trợ tiếng Trung/Hàn/Anh?"** → Kiến trúc sẵn sàng, đang phát triển

**Q10: "Giáo viên không biết công nghệ?"** → Hướng dẫn chi tiết, giao diện trực quan, training online

---

# 11. PHỤ LỤC

## Sơ đồ Module: 10 trang Public + 21 module Student + 14 module Teacher + 25 module Admin

## Checklist trước khi đi Sale
- Có tài khoản demo (Student + Teacher + Admin)
- Slide pitch deck PDF
- Video demo 5 phút
- Bảng giá in sẵn
- Biết rõ 12 điểm vượt trội
- Chuẩn bị 10 câu xử lý từ chối
- Laptop/tablet để demo live
- Internet ổn định

---

> **Ghi nhớ cho Saler:** *"Đừng bán tính năng — hãy bán GIẢI PHÁP cho NỖI ĐAU của khách hàng."*

*Copyright 2026 TNQDO — Tài liệu nội bộ Sales Team. Cập nhật: 06/08/2026*
