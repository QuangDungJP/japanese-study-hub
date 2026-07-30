import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  Users, 
  CheckCircle2, 
  ArrowRight,
  BookOpen,
  Video,
  ClipboardCheck,
  Calendar,
  Sparkles,
  Award,
  Clock,
  CheckSquare,
  Presentation,
  FileSpreadsheet
} from 'lucide-react';

const TeacherGuide = () => {
  const steps = [
    {
      step: '01',
      badge: 'Quản lý Lớp học 5 Tab',
      icon: Users,
      title: 'Quản lý Google Classroom & 5 Tab Giảng dạy',
      description: 'Không gian điều hành lớp học toàn diện cho Giảng viên TNQDO.',
      details: [
        '📌 Tab Stream (Bảng tin): Đăng thông báo quan trọng, dán link phòng học Google Meet/Zoom và thảo luận với học viên.',
        '📚 Tab Bài học: Xem ngân hàng bài giảng 4 kỹ năng và đưa bài vào lớp cho học viên luyện tập.',
        '🖥️ Tab Trình chiếu Slide: Bật Chế độ Trình chiếu máy chiếu full màn hình chuẩn trực quan khi dạy học.',
        '📝 Tab Bài kiểm tra & Bài nộp: Chấm bài tập âm thanh/luận văn, cho điểm (0-100) và viết nhận xét chi tiết.',
        '👥 Tab Học viên: Quản lý danh sách học viên trong lớp, kiểm tra sĩ số và lịch sử vắng mặt.'
      ]
    },
    {
      step: '02',
      badge: 'Chế độ Trình chiếu Máy chiếu',
      icon: Presentation,
      title: 'Trình chiếu Bài giảng Slide Tương tác',
      description: 'Công cụ hỗ trợ giảng dạy trực tiếp trên lớp hoặc chia sẻ màn hình qua Google Meet.',
      details: [
        '🎬 Nhấp nút "Trình chiếu" tại bất kỳ bài học nào để kích hoạt chế độ xem Full màn hình tối ưu.',
        '🔤 Chữ hiển thị to rõ chuẩn máy chiếu, font chữ Nhật dễ đọc kèm bản dịch nghĩa ẩn/hiện linh hoạt.',
        '🔊 Tích hợp sẵn bộ phát Audio thu âm chuẩn bản xứ để bật âm thanh cho cả lớp cùng nghe.',
        '⚡ Chuyển slide bằng phím mũi tên nhanh chóng, tạo không khí học tập chuyên nghiệp.'
      ]
    },
    {
      step: '03',
      badge: 'Chấm bài & Viết nhận xét',
      icon: ClipboardCheck,
      title: 'Chấm bài nộp & Phản hồi cho Học viên',
      description: 'Theo dõi sự tiến bộ và đưa ra định hướng học tập cho từng học viên.',
      details: [
        '🔔 Nhận thông báo tự động khi học viên nộp bài phát âm (audio) hoặc bài làm văn.',
        '🎯 So sánh bài làm của học viên với Đáp án tham khảo tiêu chuẩn do hệ thống đề xuất.',
        '💯 Nhập điểm số (thang điểm 0 - 100) và viết Lời nhận xét (Feedback) tư vấn chi tiết.',
        '✨ Học viên nhận được phản hồi ngay lập tức để rút kinh nghiệm bài tiếp theo.'
      ]
    },
    {
      step: '04',
      badge: 'Điểm danh & Lịch dạy',
      icon: Calendar,
      title: 'Điểm danh Lớp học & Quản lý Lịch dạy',
      description: 'Quản lý tỷ lệ chuyên cần và lịch trình dạy học chuyên nghiệp.',
      details: [
        '✅ Điểm danh 1-Click: Đánh dấu trạng thái Có mặt (Present), Vắng mặt (Absent), Đi muộn (Late), Có lý do (Excused).',
        '📊 Tự động thống kê: Thống kê tỷ lệ đi học chuyên cần của từng học viên trong toàn bộ khóa.',
        '📅 Quản lý Lịch dạy & Meeting 1:1: Xem danh sách các ca dạy trực tuyến và xét duyệt đơn xin nghỉ phép.',
        '💼 Bảng chấm công Timesheet: Theo dõi tổng số buổi dạy, tổng số giờ giảng và thù lao tháng.'
      ]
    }
  ];

  const quickActions = [
    { label: 'Danh sách Lớp học', link: '/teacher/classes', icon: Users },
    { label: 'Chấm bài nộp', link: '/teacher/submissions', icon: ClipboardCheck },
    { label: 'Điểm danh lớp', link: '/teacher/attendance', icon: CheckSquare },
    { label: 'Lịch dạy & Meeting', link: '/teacher/calendar', icon: Calendar },
  ];

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-800 p-6 md:p-8 text-white shadow-2xl overflow-hidden border border-white/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 text-xs font-bold backdrop-blur-md border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" /> Dành riêng cho Giảng viên
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Cẩm nang Giảng dạy & Quản lý Lớp 👩‍🏫
            </h1>
            <p className="text-white/90 text-sm md:text-base max-w-2xl font-medium leading-relaxed">
              Hướng dẫn toàn diện quy trình giảng dạy 5 Tab Classroom, Chế độ trình chiếu máy chiếu, chấm điểm nhận xét bài nộp và quản lý chuyên cần.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" className="font-bold gap-2 shadow-lg hover:scale-105 transition-transform shrink-0" asChild>
              <Link to="/teacher/classes">
                <Users className="w-4 h-4 text-emerald-700" /> Quản lý Lớp học ngay
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {quickActions.map((act, i) => {
          const Icon = act.icon;
          return (
            <Button key={i} variant="outline" className="h-auto py-3 px-4 flex items-center justify-start gap-3 rounded-2xl border-border bg-card hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all text-left" asChild>
              <Link to={act.link}>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="font-bold text-xs text-foreground truncate">{act.label}</span>
              </Link>
            </Button>
          );
        })}
      </div>

      {/* 4 Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {steps.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.step} className="border-border/80 shadow-soft hover:shadow-xl transition-all rounded-3xl overflow-hidden bg-card border group">
              <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs font-bold text-emerald-600 border-emerald-500/30 gap-1">
                    <Icon className="w-3.5 h-3.5 text-emerald-600" /> {item.badge}
                  </Badge>
                  <span className="text-2xl font-extrabold text-emerald-600/40 font-mono">
                    #{item.step}
                  </span>
                </div>
                <CardTitle className="text-lg font-bold text-foreground pt-2 group-hover:text-emerald-600 transition-colors">
                  {item.title}
                </CardTitle>
                <CardDescription className="text-xs">{item.description}</CardDescription>
              </CardHeader>
              <CardContent className="p-5 pt-4">
                <ul className="space-y-3">
                  {item.details.map((detail, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-muted-foreground font-medium leading-relaxed">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default TeacherGuide;
