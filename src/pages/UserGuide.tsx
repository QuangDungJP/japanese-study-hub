import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ScrollReveal from '@/components/ScrollReveal';
import { 
  BookOpen, 
  GraduationCap, 
  Shield, 
  Video, 
  FileText, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  Users,
  Search,
  ChevronDown,
  ChevronUp,
  Building,
  Target,
  Flame,
  Award,
  BookMarked,
  MessageSquare
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const UserGuide = () => {
  const [activeRole, setActiveRole] = useState('student');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const studentSteps = [
    {
      step: '01',
      title: 'Tham gia Lớp học Google Classroom',
      description: 'Truy cập mục "Lớp học của tôi" để xem toàn bộ các lớp bạn đang theo học tại TNQDO.',
      details: [
        'Xem Thông báo, lịch học Zoom và tài liệu tại Bảng tin Stream',
        'Theo dõi tiến độ bài học và xem slide giảng dạy trực quan',
        'Làm bài tập rèn luyện và nộp bài trực tiếp cho giảng viên'
      ]
    },
    {
      step: '02',
      title: 'Rèn luyện 4 Kỹ năng Tiếng Nhật',
      description: 'Luyện tập chuyên sâu từng kỹ năng (Đọc hiểu, Luyện nghe, Luyện nói, Luyện viết).',
      details: [
        'Đọc hiểu: Bài đọc chuẩn JLPT kèm từ vựng dịch nghĩa',
        'Luyện nghe: File âm thanh chuẩn giọng bản xứ Nhật Bản',
        'Luyện nói & Viết: Thực hành đặt câu và luyện phản xạ'
      ]
    },
    {
      step: '03',
      title: 'Tích lũy Streak & Điểm thưởng XP',
      description: 'Duy trì thói quen học tập hàng ngày để thăng hạng trên Bảng xếp hạng.',
      details: [
        'Mỗi bài học hoàn thành sẽ cộng ngay điểm XP tương ứng',
        'Học liên tục mỗi ngày để duy trì Chuỗi Streak ngọn lửa 🔥',
        'Hoàn thành chỉ tiêu mục tiêu XP trong ngày'
      ]
    },
    {
      step: '04',
      title: 'Đặt lịch học Zoom 1:1 với Giảng viên',
      description: 'Chọn khung giờ rảnh và đặt lịch luyện nói trực tiếp cùng thầy cô.',
      details: [
        'Xem danh sách giảng viên chất lượng tại mục Giảng viên',
        'Chọn ngày và khung giờ học Zoom 1:1',
        'Tham gia phòng học Zoom khi đến giờ hẹn'
      ]
    }
  ];

  const teacherSteps = [
    {
      step: '01',
      title: 'Quản lý Lớp học Google Classroom',
      description: 'Không gian quản lý lớp học toàn diện 5 Tab chuyên nghiệp cho giảng viên.',
      details: [
        'Bảng tin: Đăng thông báo, lịch Zoom và thảo luận với lớp',
        'Bài học: Đưa bài giảng vào lớp và kích hoạt Chế độ Trình chiếu slide',
        'Bài kiểm tra & Bài nộp: Chấm điểm bài làm học viên trực tiếp'
      ]
    },
    {
      step: '02',
      title: 'Sử dụng Chế độ Trình chiếu bài giảng',
      description: 'Trình chiếu slide tương tác trực quan khi dạy học trên lớp hoặc qua Zoom.',
      details: [
        'Nhấp nút "Trình chiếu" tại bất kỳ bài học nào trong Lớp học',
        'Màn hình hiển thị chữ to rõ, chuẩn máy chiếu và chia sẻ màn hình Zoom',
        'Hỗ trợ công cụ chuyển slide mượt mà'
      ]
    },
    {
      step: '03',
      title: 'Chấm điểm & Gửi nhận xét Bài nộp',
      description: 'Theo dõi bài làm học viên gửi lên và cho điểm chi tiết.',
      details: [
        'Nhận thông báo khi có bài tập mới học viên nộp',
        'Xem đáp án tham khảo và bài làm của từng học viên',
        'Nhập điểm số (0-100) và viết nhận xét chi tiết gửi cho học viên'
      ]
    },
    {
      step: '04',
      title: 'Điểm danh & Theo dõi lịch Zoom',
      description: 'Quản lý sĩ số lớp học và tạo liên kết phòng học Zoom.',
      details: [
        'Điểm danh nhanh học viên có mặt, vắng mặt hoặc đi muộn',
        'Tạo lịch học Zoom và gửi link cho học viên trong lớp',
        'Phê duyệt các yêu cầu xin nghỉ phép của học viên'
      ]
    }
  ];

  const adminSteps = [
    {
      step: '01',
      title: 'Quản trị Người dùng & Giảng viên',
      description: 'Quản lý toàn bộ danh sách học viên, phân quyền giảng viên và xét duyệt tài khoản.',
      details: [
        'Xem danh sách người dùng và tiến độ học tập',
        'Cấp quyền Giảng viên (Teacher / Senior Teacher)',
        'Cập nhật hồ sơ chuyên môn và chứng chỉ cho giáo viên'
      ]
    },
    {
      step: '02',
      title: 'Quản lý Lớp học & Bài học',
      description: 'Tạo mới các lớp học, tạo ngân hàng bài giảng mẫu chuẩn JLPT.',
      details: [
        'Tạo lớp học mới và phân công giảng viên phụ trách',
        'Tạo và phê duyệt các bài học mới cho 4 kỹ năng',
        'Liên kết bài học và tài liệu vào từng khóa học'
      ]
    },
    {
      step: '03',
      title: 'Quản trị Website CMS & Tin tức Blog',
      description: 'Cập nhật giao diện trang chủ, bài viết blog và các sự kiện workshop.',
      details: [
        'Chỉnh sửa Banner trang chủ, khẩu hiệu và các phần giới thiệu',
        'Đăng bài viết chia sẻ kinh nghiệm học và ghim bài nổi bật',
        'Tạo sự kiện workshop luyện thi JLPT'
      ]
    },
    {
      step: '04',
      title: 'Theo dõi Đơn hàng & Tài chính',
      description: 'Xác nhận giao dịch thanh toán mua khóa học của học viên.',
      details: [
        'Xem danh sách đơn hàng đăng ký mua khóa học',
        'Xác nhận thông tin chuyển khoản qua ngân hàng',
        'Theo dõi báo cáo doanh thu tổng quan'
      ]
    }
  ];

  const faqs = [
    {
      q: 'TNQDO Japanese Study Hub hỗ trợ những cấp độ tiếng Nhật nào?',
      a: 'Hệ thống cung cấp đầy đủ giáo trình và bài tập luyện thi từ trình độ N5 căn bản đến N1 cao cấp, bao gồm đầy đủ 4 kỹ năng Đọc, Nghe, Nói, Viết.'
    },
    {
      q: 'Làm thế nào để học viên vào Lớp học Google Classroom?',
      a: 'Sau khi đăng ký lớp, học viên truy cập vào mục "Lớp học của tôi" trên menu chính. Tại đây bạn sẽ thấy danh sách tất cả các lớp học mình đã đăng ký và có thể bấm "Vào lớp học" để xem bài giảng, bài tập và lịch Zoom.'
    },
    {
      q: 'Giảng viên sử dụng Chế độ Trình chiếu slide như thế nào?',
      a: 'Trong trang chi tiết Lớp học của giảng viên, tại Tab "Bài học", giảng viên nhấp vào nút "Trình chiếu" bên cạnh bài giảng. Màn hình trình chiếu sẽ mở ra với giao diện tối ưu hóa cho màn hình máy chiếu hoặc chia sẻ qua Zoom.'
    },
    {
      q: 'Điểm XP và Chuỗi Streak được tính như thế nào?',
      a: 'Khi bạn hoàn thành 1 bài học hoặc bài tập, hệ thống sẽ cộng điểm XP tương ứng vào tài khoản. Chuỗi Streak ghi nhận số ngày bạn học liên tục không ngắt quãng.'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Header with TNQDO Logo */}
      <section className="relative pt-28 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10">
          <div className="absolute top-20 left-10 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float animation-delay-200" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <ScrollReveal>
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-card border border-border/80 shadow-sm mb-6 backdrop-blur-md">
                <img src="/logo.jpg" alt="TNQDO Logo" className="w-7 h-7 rounded-lg object-cover" />
                <span className="text-sm font-bold text-foreground">TNQDO Japanese Study Hub</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-4 tracking-tight leading-tight">
                Cẩm nang & <span className="text-primary bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Hướng dẫn sử dụng</span>
              </h1>
              <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto font-medium">
                Hướng dẫn chi tiết từng tính năng dành cho Học viên, Giảng viên và Quản trị viên trên hệ thống học tiếng Nhật TNQDO.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Main Guide Tabs */}
      <section className="pb-20">
        <div className="container mx-auto px-4">
          <Tabs value={activeRole} onValueChange={setActiveRole} className="space-y-10">
            <div className="flex justify-center">
              <TabsList className="p-1.5 bg-card border border-border/80 rounded-2xl shadow-sm grid grid-cols-3 w-full max-w-xl">
                <TabsTrigger value="student" className="rounded-xl gap-2 font-bold py-3 text-sm">
                  <GraduationCap className="w-4 h-4" /> Học viên
                </TabsTrigger>
                <TabsTrigger value="teacher" className="rounded-xl gap-2 font-bold py-3 text-sm">
                  <Users className="w-4 h-4" /> Giảng viên
                </TabsTrigger>
                <TabsTrigger value="admin" className="rounded-xl gap-2 font-bold py-3 text-sm">
                  <Shield className="w-4 h-4" /> Quản trị viên
                </TabsTrigger>
              </TabsList>
            </div>

            {/* STUDENT GUIDE CONTENT */}
            <TabsContent value="student" className="space-y-8">
              <div className="text-center max-w-2xl mx-auto mb-8">
                <Badge className="bg-primary/10 text-primary border-primary/20 mb-2 px-3 py-1 font-bold">
                  Dành cho Học viên
                </Badge>
                <h2 className="text-2xl font-bold text-foreground">Quy trình học tập hiệu quả tại TNQDO</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {studentSteps.map((item) => (
                  <Card key={item.step} className="border-border shadow-soft hover:shadow-xl transition-all rounded-3xl overflow-hidden group">
                    <CardHeader className="pb-3 flex flex-row items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary font-black text-xl flex items-center justify-center shrink-0 border border-primary/20">
                        {item.step}
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
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
            </TabsContent>

            {/* TEACHER GUIDE CONTENT */}
            <TabsContent value="teacher" className="space-y-8">
              <div className="text-center max-w-2xl mx-auto mb-8">
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 mb-2 px-3 py-1 font-bold">
                  Dành cho Giảng viên
                </Badge>
                <h2 className="text-2xl font-bold text-foreground">Hướng dẫn công cụ giảng dạy & Quản lý lớp</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {teacherSteps.map((item) => (
                  <Card key={item.step} className="border-border shadow-soft hover:shadow-xl transition-all rounded-3xl overflow-hidden group">
                    <CardHeader className="pb-3 flex flex-row items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 font-black text-xl flex items-center justify-center shrink-0 border border-emerald-500/20">
                        {item.step}
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold text-foreground group-hover:text-emerald-600 transition-colors">
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
            </TabsContent>

            {/* ADMIN GUIDE CONTENT */}
            <TabsContent value="admin" className="space-y-8">
              <div className="text-center max-w-2xl mx-auto mb-8">
                <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20 mb-2 px-3 py-1 font-bold">
                  Dành cho Quản trị viên
                </Badge>
                <h2 className="text-2xl font-bold text-foreground">Hướng dẫn vận hành & Quản trị hệ thống</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {adminSteps.map((item) => (
                  <Card key={item.step} className="border-border shadow-soft hover:shadow-xl transition-all rounded-3xl overflow-hidden group">
                    <CardHeader className="pb-3 flex flex-row items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 font-black text-xl flex items-center justify-center shrink-0 border border-purple-500/20">
                        {item.step}
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold text-foreground group-hover:text-purple-600 transition-colors">
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
            </TabsContent>
          </Tabs>

          {/* FAQ Section */}
          <div className="max-w-3xl mx-auto mt-20">
            <div className="text-center mb-10">
              <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 mb-2 px-3 py-1 font-bold">
                Câu hỏi thường gặp
              </Badge>
              <h2 className="text-3xl font-extrabold text-foreground">Giải đáp thắc mắc người dùng</h2>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, index) => (
                <div key={index} className="bg-card border border-border/80 rounded-2xl overflow-hidden transition-all shadow-sm">
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-foreground hover:text-primary transition-colors"
                  >
                    <span className="text-base">{faq.q}</span>
                    {openFaqIndex === index ? (
                      <ChevronUp className="w-5 h-5 text-primary shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
                    )}
                  </button>
                  {openFaqIndex === index && (
                    <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border/50 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* CTA Banner */}
          <div className="mt-16 text-center max-w-2xl mx-auto bg-gradient-to-r from-primary/10 via-background to-accent/10 p-8 rounded-3xl border border-primary/20">
            <h3 className="text-2xl font-extrabold text-foreground mb-2">Bạn đã sẵn sàng học cùng TNQDO?</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Đăng ký tài khoản ngay hôm nay để trải nghiệm môi trường học tiếng Nhật hiệu quả và chuyên nghiệp.
            </p>
            <Button size="lg" className="font-bold gap-2 shadow-md" asChild>
              <Link to="/auth">
                Bắt đầu học ngay <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default UserGuide;
