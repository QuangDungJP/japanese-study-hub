import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  GraduationCap, 
  CheckCircle2, 
  ArrowRight,
  Building,
  Flame,
  Zap,
  Trophy,
  Video,
  BookOpen,
  Calendar,
  Sparkles,
  Award,
  HelpCircle,
  FileCheck,
  Headphones,
  Mic,
  PenTool,
  BookMarked
} from 'lucide-react';

const StudentGuide = () => {
  const [activeCategory, setActiveCategory] = useState('all');

  const steps = [
    {
      step: '01',
      category: 'classroom',
      badge: 'Lớp học Trực tuyến',
      icon: Building,
      title: 'Tham gia Lớp học Google Classroom',
      description: 'Không gian học tập chính của bạn tại TNQDO với đầy đủ 5 Tab chức năng chuyên nghiệp.',
      details: [
        '📌 Bảng tin Stream: Nơi thầy cô đăng thông báo lớp, tài liệu tải về và link Google Meet học trực tuyến.',
        '📚 Tab Bài học: Xem danh sách slide bài giảng tương tác visual chuẩn máy chiếu được sắp xếp theo từng tuần.',
        '📝 Tab Bài tập & Thi: Làm bài tập rèn luyện trắc nghiệm, nộp bài phát âm/bài luận và theo dõi điểm số.',
        '👥 Tab Học viên: Xem danh sách các bạn học cùng lớp và sĩ số hiện tại.',
        '💬 Thảo luận: Đặt câu hỏi trực tiếp dưới mỗi bài học để được giáo viên giải đáp.'
      ]
    },
    {
      step: '02',
      category: 'skills',
      badge: '4 Kỹ năng Nhật ngữ',
      icon: BookOpen,
      title: 'Rèn luyện 4 Kỹ năng chuẩn JLPT',
      description: 'Luyện tập chuyên sâu từ trình độ N5 đến N1 với phương pháp tương tác hiện đại.',
      details: [
        '📖 Đọc hiểu (Reading): Đọc văn bản JLPT, tra cứu nghĩa từng câu, xem cấu trúc ngữ pháp và từ vựng chi tiết.',
        '🎧 Luyện nghe (Listening): Nghe audio chuẩn giọng bản xứ Nhật Bản, làm bài tập điền từ và chọn đáp án.',
        '🗣️ Luyện nói (Speaking): Luyện phản xạ Kaiwa, thu âm câu nói và nộp file ghi âm cho thầy cô chấm.',
        '✍️ Luyện viết (Writing): Tập viết Kanji, viết đoạn văn ngắn theo chủ đề và nhận xét sửa lỗi chi tiết.'
      ]
    },
    {
      step: '03',
      category: 'gamification',
      badge: 'Điểm thưởng & Ranking',
      icon: Flame,
      title: 'Tích lũy Điểm XP & Chuỗi Streak 🔥',
      description: 'Học tập vui vẻ như chơi game, duy trì động lực học liên tục mỗi ngày.',
      details: [
        '⚡ Tích lũy XP: Mỗi bài học hoặc bài tập hoàn thành sẽ giúp bạn nhận điểm XP tương ứng.',
        '🔥 Chuỗi Streak ngọn lửa: Học ít nhất 1 bài mỗi ngày để không bị đứt chuỗi ngọn lửa Streak.',
        '🎖️ Thăng cấp Level: Cứ 500 XP tích lũy sẽ thăng 1 Cấp độ (Level) học tập.',
        '🏆 Bảng xếp hạng: Đua Top XP hàng tuần cùng hàng ngàn học viên trên toàn quốc.'
      ]
    },
    {
      step: '04',
      category: 'booking',
      badge: 'Học 1-on-1 Meeting',
      icon: Video,
      title: 'Đặt lịch học Meeting 1:1 với Giảng viên',
      description: 'Luyện giao tiếp trực tiếp 1:1 cùng đội ngũ Giảng viên trình độ N1/Bản xứ.',
      details: [
        '📅 Xem Lịch trống: Chọn giảng viên yêu thích và chọn khung giờ rảnh phù hợp với bạn.',
        '📹 Vào phòng Google Meet: Đến giờ hẹn, vào mục "Lịch học của tôi" và bấm "Vào phòng Meeting".',
        '📩 Đơn xin nghỉ phép: Nếu bận đột xuất, bạn có thể gửi đơn xin nghỉ phép/dời lịch trực tiếp trên hệ thống.'
      ]
    }
  ];

  const quickTips = [
    { title: 'Tải ứng dụng & Bật thông báo', desc: 'Đăng nhập hàng ngày để không bỏ lỡ thông báo bài tập mới từ thầy cô.' },
    { title: 'Mục tiêu XP hôm nay', desc: 'Đặt mục tiêu hoàn thành tối thiểu 50 XP/ngày để duy trì phong độ.' },
    { title: 'Nộp bài đúng hạn', desc: 'Kiểm tra Hạn nộp bài tập trong Tab Bài tập Lớp học để nhận trọn điểm thưởng.' },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Welcome Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-primary via-indigo-600 to-accent p-6 md:p-8 text-white shadow-2xl overflow-hidden border border-white/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 text-xs font-bold backdrop-blur-md border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" /> Hướng dẫn Học viên TNQDO Hub
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Cẩm nang Học tập & Chinh phục JLPT 🎓
            </h1>
            <p className="text-white/90 text-sm md:text-base max-w-2xl font-medium leading-relaxed">
              Hướng dẫn toàn diện giúp bạn làm quen Lớp học trực tuyến Classroom, phương pháp luyện 4 kỹ năng và quy trình tích lũy điểm XP hiệu quả.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" className="font-bold gap-2 shadow-lg hover:scale-105 transition-transform shrink-0" asChild>
              <Link to="/learn/my-classes">
                <Building className="w-4 h-4 text-primary" /> Vào Lớp học ngay
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Tips Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickTips.map((tip, i) => (
          <Card key={i} className="border border-border/80 shadow-soft bg-card">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 text-sm">
                {i + 1}
              </div>
              <div>
                <h4 className="font-bold text-sm text-foreground">{tip.title}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">{tip.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main 4 Steps Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Quy trình 4 Bước Học tập Hiệu quả</h2>
            <p className="text-xs text-muted-foreground">Theo dõi lộ trình chuẩn giúp bạn đạt kết quả JLPT cao nhất</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {steps.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.step} className="border-border/80 shadow-soft hover:shadow-xl transition-all rounded-3xl overflow-hidden bg-card border group">
                <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs font-bold text-primary border-primary/30 gap-1">
                      <Icon className="w-3.5 h-3.5 text-primary" /> {item.badge}
                    </Badge>
                    <span className="text-2xl font-extrabold text-primary/40 font-mono">
                      #{item.step}
                    </span>
                  </div>
                  <CardTitle className="text-lg font-bold text-foreground pt-2 group-hover:text-primary transition-colors">
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

      {/* Feature Showcase Box */}
      <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 via-indigo-50/10 to-accent/5 p-6 md:p-8 space-y-4">
        <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" /> Hệ thống Gamification & Đua Top XP
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Mỗi bài học bạn hoàn thành không chỉ giúp bạn giỏi tiếng Nhật hơn mà còn tích lũy điểm kinh nghiệm (XP) để đua Top trên Bảng xếp hạng Học viên toàn quốc.
        </p>
        <div className="flex gap-4 pt-2">
          <Button size="sm" variant="hero" className="font-bold gap-1 text-xs" asChild>
            <Link to="/learn/achievements">
              <Award className="w-3.5 h-3.5" /> Xem Bảng Thành Tích
            </Link>
          </Button>
          <Button size="sm" variant="outline" className="font-bold gap-1 text-xs" asChild>
            <Link to="/learn/lessons">
              <BookOpen className="w-3.5 h-3.5" /> Làm bài học ngay
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StudentGuide;

