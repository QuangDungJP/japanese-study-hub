import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Calendar
} from 'lucide-react';

const TeacherGuide = () => {
  const steps = [
    {
      step: '01',
      title: 'Quản lý Lớp học Google Classroom',
      description: 'Không gian quản lý lớp học toàn diện 5 Tab chuyên nghiệp cho giảng viên.',
      details: [
        'Bảng tin Stream: Đăng thông báo, link Meeting và trao đổi trực tiếp với học viên',
        'Tab Bài học: Thêm bài giảng vào lớp và kích hoạt Chế độ Trình chiếu slide',
        'Tab Bài kiểm tra & Bài nộp: Xem danh sách bài làm và chấm điểm cho học viên',
        'Tab Học viên: Quản lý danh sách học viên và sĩ số lớp'
      ]
    },
    {
      step: '02',
      title: 'Sử dụng Chế độ Trình chiếu bài giảng',
      description: 'Trình chiếu slide tương tác trực quan khi đứng lớp hoặc học qua Meeting.',
      details: [
        'Nhấp nút "Trình chiếu" tại bất kỳ bài học nào trong Lớp học',
        'Màn hình hiển thị chữ to rõ, chuẩn máy chiếu và chia sẻ màn hình Meeting',
        'Chuyển slide mượt mà kèm phần dịch nghĩa và âm thanh bài đọc'
      ]
    },
    {
      step: '03',
      title: 'Chấm điểm & Viết nhận xét Bài nộp',
      description: 'Theo dõi bài làm học viên gửi lên và cho điểm chi tiết.',
      details: [
        'Nhận thông báo khi có bài tập mới học viên nộp',
        'Xem bài làm của từng học viên và so sánh với đáp án chuẩn',
        'Nhập điểm số (0-100) và viết nhận xét chi tiết gửi cho học viên'
      ]
    },
    {
      step: '04',
      title: 'Điểm danh & Tạo phòng học Meeting',
      description: 'Quản lý sĩ số lớp học và lên lịch giảng dạy trực tuyến.',
      details: [
        'Điểm danh nhanh học viên có mặt, vắng mặt hoặc đi muộn',
        'Cập nhật link phòng học Meeting cho các buổi dạy tiếp theo',
        'Phê duyệt các yêu cầu xin nghỉ phép của học viên trong lớp'
      ]
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-6 md:p-8 text-white shadow-xl overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <Badge className="bg-white/20 text-white hover:bg-white/30 border-none font-bold">
              <Users className="w-3.5 h-3.5 mr-1" /> Dành riêng cho Giảng viên
            </Badge>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Hướng dẫn Giảng dạy & Quản lý Lớp học
            </h1>
            <p className="text-white/80 text-sm max-w-2xl">
              Cẩm nang chi tiết công cụ giảng dạy, trình chiếu slide, chấm bài tập và điểm danh lớp học cho Giảng viên.
            </p>
          </div>
          <Button variant="secondary" className="font-bold gap-2 shadow-md shrink-0" asChild>
            <Link to="/teacher/classes">
              <Users className="w-4 h-4" /> Quản lý Lớp học ngay
            </Link>
          </Button>
        </div>
      </div>

      {/* 4 Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {steps.map((item) => (
          <Card key={item.step} className="border-border shadow-soft hover:shadow-lg transition-all rounded-3xl overflow-hidden">
            <CardHeader className="pb-3 flex flex-row items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 font-black text-xl flex items-center justify-center shrink-0 border border-emerald-500/20">
                {item.step}
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-foreground">
                  {item.title}
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <ul className="space-y-2.5">
                {item.details.map((detail, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm text-muted-foreground font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TeacherGuide;
