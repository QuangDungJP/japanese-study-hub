import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  GraduationCap, 
  CheckCircle2, 
  ArrowRight,
  Building,
  Flame,
  Trophy,
  Video,
  BookOpen
} from 'lucide-react';

const StudentGuide = () => {
  const steps = [
    {
      step: '01',
      title: 'Vào Lớp học Google Classroom',
      description: 'Truy cập mục "Lớp học của tôi" để xem toàn bộ các lớp bạn đang theo học tại TNQDO.',
      details: [
        'Bảng tin Stream: Xem thông báo, trao đổi và nhận link Zoom học trực tuyến',
        'Tab Bài học: Xem bài giảng slide tương tác trực quan được sắp xếp theo lộ trình',
        'Tab Bài tập & Thi: Làm bài tập rèn luyện và nộp bài trực tiếp cho thầy cô'
      ]
    },
    {
      step: '02',
      title: 'Học tập 4 Kỹ năng Tiếng Nhật',
      description: 'Luyện tập theo các chuyên đề Đọc hiểu, Luyện nghe, Luyện nói và Luyện viết.',
      details: [
        'Bài học Đọc hiểu: Bài đọc dịch nghĩa chi tiết kèm từ vựng',
        'Bài học Luyện nghe: Audio chuẩn giọng bản xứ Nhật Bản',
        'Bài học Luyện nói & Viết: Nộp file âm thanh hoặc bài luận để thầy cô chấm'
      ]
    },
    {
      step: '03',
      title: 'Tích lũy Streak & Điểm XP',
      description: 'Duy trì thói quen học tập hàng ngày để nâng hạng trên Bảng xếp hạng.',
      details: [
        'Mỗi bài học hoàn thành được cộng ngay điểm XP tương ứng',
        'Học liên tục mỗi ngày để duy trì Chuỗi Streak ngọn lửa 🔥',
        'Nhận các huy hiệu thành tích độc quyền từ TNQDO'
      ]
    },
    {
      step: '04',
      title: 'Tham gia Phòng học Zoom 1:1',
      description: 'Tham gia học trực tuyến cùng giảng viên qua Zoom / Google Meet.',
      details: [
        'Truy cập mục "Phòng học Zoom" để xem lịch học sắp diễn ra',
        'Nhấp nút "Vào phòng học Zoom" trước 5 phút để chuẩn bị',
        'Gửi đơn xin nghỉ phép nếu có lý do đột xuất'
      ]
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-primary via-primary/90 to-accent p-6 md:p-8 text-white shadow-xl overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <Badge className="bg-white/20 text-white hover:bg-white/30 border-none font-bold">
              <GraduationCap className="w-3.5 h-3.5 mr-1" /> Dành riêng cho Học viên
            </Badge>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Hướng dẫn Sử dụng Hệ thống TNQDO
            </h1>
            <p className="text-white/80 text-sm max-w-2xl">
              Cẩm nang chi tiết từng bước giúp bạn sử dụng Lớp học Classroom, học tập 4 kỹ năng và tích lũy XP hiệu quả.
            </p>
          </div>
          <Button variant="secondary" className="font-bold gap-2 shadow-md shrink-0" asChild>
            <Link to="/learn/my-classes">
              <Building className="w-4 h-4" /> Vào Lớp học ngay
            </Link>
          </Button>
        </div>
      </div>

      {/* 4 Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {steps.map((item) => (
          <Card key={item.step} className="border-border shadow-soft hover:shadow-lg transition-all rounded-3xl overflow-hidden">
            <CardHeader className="pb-3 flex flex-row items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary font-black text-xl flex items-center justify-center shrink-0 border border-primary/20">
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

export default StudentGuide;
