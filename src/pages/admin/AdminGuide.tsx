import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  GraduationCap, 
  Users, 
  CheckCircle2, 
  Building,
  Globe,
  DollarSign,
  Sparkles,
  Calendar,
  BookOpen,
  FileText,
  CreditCard,
  UserCheck,
  Settings,
  HelpCircle
} from 'lucide-react';

const AdminGuide = () => {
  const [roleTab, setRoleTab] = useState('admin');

  const adminSteps = [
    {
      step: '01',
      badge: 'Quản trị Tài khoản & Phân quyền',
      icon: UserCheck,
      title: 'Quản lý Người dùng & Phân quyền Giảng viên',
      description: 'Điều hành toàn bộ cơ sở dữ liệu người dùng, phân cấp vai trò và bảo mật hệ thống.',
      details: [
        '👥 Quản lý danh sách Người dùng: Xem thông tin chi tiết từng học viên (Email, Lớp tham gia, XP, Streak, Điểm số).',
        '🛡️ Cấp quyền Giảng viên: Chuyển đổi quyền người dùng thành Giảng viên (Teacher / Senior Teacher) an toàn.',
        '🔒 Bảo mật Quyền Admin: Khóa tính năng chỉnh sửa vai trò Admin để chống chiếm quyền hệ thống.',
        '👨‍🏫 Hồ sơ Giảng viên: Cập nhật thông tin kinh nghiệm, chứng chỉ N1/N2, avatar và video giới thiệu.'
      ]
    },
    {
      step: '02',
      badge: 'Quản lý Đặt lịch Meeting 1:1',
      icon: Calendar,
      title: 'Quản lý Đặt lịch Hẹn Meeting 1:1 (Admin Bookings)',
      description: 'Điều phối toàn bộ lịch hẹn luyện giao tiếp 1:1 giữa Học viên và Giảng viên.',
      details: [
        '📅 Xem danh sách Lịch hẹn: Theo dõi các yêu cầu đặt lịch hẹn luyện nói 1:1 phát sinh.',
        '🔗 Cấp link Google Meet: Cung cấp hoặc tự động tạo link Google Meet và gửi thông báo tới 2 bên.',
        '✔️ Phê duyệt & Hủy lịch: Phê duyệt ca học hoặc hỗ trợ hoàn trả ca học khi có sự cố kỹ thuật.'
      ]
    },
    {
      step: '03',
      badge: 'Quản lý Khóa học & Bài học',
      icon: BookOpen,
      title: 'Quản lý Khóa học, Lớp học & Ngân hàng Bài giảng',
      description: 'Xây dựng chương trình đào tạo Tiếng Nhật chất lượng cao từ N5 đến N1.',
      details: [
        '🏫 Tạo Lớp học mới: Tạo lớp học mới, gán khóa học tương ứng và phân công Giảng viên phụ trách.',
        '📚 Ngân hàng Bài giảng mẫu: Thêm/Sửa/Xóa các bài giảng 4 kỹ năng (Đọc, Nghe, Nói, Viết) chuẩn JLPT.',
        '📝 Ngân hàng Bài tập: Tạo ngân hàng câu hỏi trắc nghiệm và đề thi thử cho từng cấp độ.'
      ]
    },
    {
      step: '04',
      badge: 'Website CMS & Blog',
      icon: Globe,
      title: 'Quản trị CMS Website, Blog & Footer Chân trang',
      description: 'Tùy chỉnh nội dung trang chủ, bài viết truyền thông và giao diện thương hiệu.',
      details: [
        '🌐 Quản lý CMS Website: Chỉnh sửa Banner Hero, Khẩu hiệu, Giới thiệu trung tâm và Thông tin Chân trang (Footer).',
        '📰 Quản lý Bài viết Blog: Viết bài chia sẻ kinh nghiệm học, ghim bài viết nổi bật.',
        '✨ Cấu hình 3 bài Trang chủ: Tùy chọn 3 bài viết nổi bật hiển thị ở khối Blog trang chủ khách hàng.',
        '🎉 Quản lý Sự kiện Workshop: Đăng tin các buổi Workshop luyện thi JLPT và miễn phí quà tặng.'
      ]
    },
    {
      step: '05',
      badge: 'Tài chính & Đơn hàng',
      icon: DollarSign,
      title: 'Quản lý Đơn hàng, Chuyển khoản & Tài chính',
      description: 'Xác nhận giao dịch học phí và theo dõi doanh thu tổng quan real-time.',
      details: [
        '💳 Duyệt Đơn hàng Mua khóa học: Kiểm tra thông tin đăng ký và ảnh chụp minh chứng chuyển khoản ngân hàng.',
        '✅ Tự động kích hoạt Khóa học: Nhấp "Xác nhận đã thanh toán" để cấp quyền mở khóa học lập tức cho học viên.',
        '📊 Báo cáo Doanh thu: Xem biểu đồ thống kê doanh thu theo ngày, tuần, tháng và từng khóa học.'
      ]
    }
  ];

  const adminNavs = [
    { label: 'Quản lý Người dùng', link: '/admin/users', icon: UserCheck },
    { label: 'Quản lý Lịch Bookings', link: '/admin/bookings', icon: Calendar },
    { label: 'Quản lý Khóa học', link: '/admin/courses', icon: BookOpen },
    { label: 'CMS Website & Footer', link: '/admin/website', icon: Globe },
    { label: 'Quản lý Blog bài viết', link: '/admin/blog', icon: FileText },
    { label: 'Đơn hàng & Tài chính', link: '/admin/orders', icon: CreditCard },
  ];

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-purple-800 via-indigo-900 to-slate-900 p-6 md:p-8 text-white shadow-2xl overflow-hidden border border-white/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 text-xs font-bold backdrop-blur-md border border-white/20">
              <Shield className="w-3.5 h-3.5 text-purple-300" /> Quản trị viên (Toàn quyền Hệ thống)
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Trung tâm Hướng dẫn & Điều hành Hệ thống 🛡️
            </h1>
            <p className="text-white/90 text-sm md:text-base max-w-2xl font-medium leading-relaxed">
              Quản trị viên có toàn quyền kiểm soát người dùng, phân công giảng viên, quản lý đơn hàng tài chính, duyệt lịch meeting và tùy biến CMS website.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" className="font-bold gap-2 shadow-lg hover:scale-105 transition-transform shrink-0" asChild>
              <Link to="/admin/users">
                <Building className="w-4 h-4 text-purple-900" /> Quản lý Người dùng
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Nav Links */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {adminNavs.map((nav, i) => {
          const Icon = nav.icon;
          return (
            <Button key={i} variant="outline" className="h-auto py-3 px-3 flex items-center justify-start gap-2.5 rounded-2xl border-border bg-card hover:border-purple-500/50 hover:bg-purple-500/5 transition-all text-left" asChild>
              <Link to={nav.link}>
                <div className="w-7 h-7 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="font-bold text-[11px] text-foreground truncate">{nav.label}</span>
              </Link>
            </Button>
          );
        })}
      </div>

      {/* Role Selection Tabs for Admin */}
      <Tabs value={roleTab} onValueChange={setRoleTab} className="space-y-6">
        <TabsList className="p-1.5 bg-card border border-border rounded-2xl shadow-sm grid grid-cols-3 max-w-md">
          <TabsTrigger value="admin" className="rounded-xl gap-2 font-bold py-2.5 text-xs">
            <Shield className="w-4 h-4" /> Admin
          </TabsTrigger>
          <TabsTrigger value="teacher" className="rounded-xl gap-2 font-bold py-2.5 text-xs">
            <Users className="w-4 h-4" /> Giảng viên
          </TabsTrigger>
          <TabsTrigger value="student" className="rounded-xl gap-2 font-bold py-2.5 text-xs">
            <GraduationCap className="w-4 h-4" /> Học viên
          </TabsTrigger>
        </TabsList>

        <TabsContent value="admin" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {adminSteps.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.step} className="border-border/80 shadow-soft hover:shadow-xl transition-all rounded-3xl overflow-hidden bg-card border group">
                  <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs font-bold text-purple-600 border-purple-500/30 gap-1">
                        <Icon className="w-3.5 h-3.5 text-purple-600" /> {item.badge}
                      </Badge>
                      <span className="text-2xl font-extrabold text-purple-600/40 font-mono">
                        #{item.step}
                      </span>
                    </div>
                    <CardTitle className="text-lg font-bold text-foreground pt-2 group-hover:text-purple-600 transition-colors">
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
        </TabsContent>

        <TabsContent value="teacher">
          <Card className="border-border rounded-3xl p-6 bg-card">
            <h3 className="font-bold text-lg text-foreground mb-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" /> Quy trình vận hành dành cho Giảng viên
            </h3>
            <p className="text-xs text-muted-foreground mb-4">Dưới đây là các tính năng Giảng viên sử dụng trên hệ thống mà Admin có quyền xem và hỗ trợ:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-muted/30 rounded-2xl border space-y-1">
                <p className="font-bold text-foreground">1. Quản lý Lớp học 5 Tab</p>
                <p className="text-muted-foreground">Stream thông báo, Bài học, Trình chiếu slide, Bài kiểm tra & Bài nộp, Danh sách Học viên.</p>
              </div>
              <div className="p-4 bg-muted/30 rounded-2xl border space-y-1">
                <p className="font-bold text-foreground">2. Trình chiếu Slide Bài giảng</p>
                <p className="text-muted-foreground">Bật chế độ trình chiếu Full màn hình tối ưu máy chiếu và chia sẻ màn hình qua Google Meet.</p>
              </div>
              <div className="p-4 bg-muted/30 rounded-2xl border space-y-1">
                <p className="font-bold text-foreground">3. Chấm bài nộp & Nhận xét</p>
                <p className="text-muted-foreground">Chấm bài thu âm phát âm, bài làm văn, cho điểm (0-100) và viết lời nhận xét chi tiết.</p>
              </div>
              <div className="p-4 bg-muted/30 rounded-2xl border space-y-1">
                <p className="font-bold text-foreground">4. Điểm danh & Bảng chấm công</p>
                <p className="text-muted-foreground">Điểm danh chuyên cần học viên, quản lý lịch dạy 1:1 và xem tổng số buổi dạy trong tháng.</p>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="student">
          <Card className="border-border rounded-3xl p-6 bg-card">
            <h3 className="font-bold text-lg text-foreground mb-3 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" /> Quy trình trải nghiệm dành cho Học viên
            </h3>
            <p className="text-xs text-muted-foreground mb-4">Các tính năng chính của Học viên giúp Admin nắm bắt để hỗ trợ kỹ thuật:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-muted/30 rounded-2xl border space-y-1">
                <p className="font-bold text-foreground">1. Tham gia Lớp học Classroom</p>
                <p className="text-muted-foreground">Xem bài giảng, tài liệu, làm bài tập và nhận link học trực tuyến Google Meet.</p>
              </div>
              <div className="p-4 bg-muted/30 rounded-2xl border space-y-1">
                <p className="font-bold text-foreground">2. Luyện 4 Kỹ năng Tiếng Nhật</p>
                <p className="text-muted-foreground">Luyện Đọc hiểu, Luyện nghe audio chuẩn giọng Nhật, Luyện nói thu âm và Luyện viết Kanji.</p>
              </div>
              <div className="p-4 bg-muted/30 rounded-2xl border space-y-1">
                <p className="font-bold text-foreground">3. Tích lũy XP & Chuỗi Streak 🔥</p>
                <p className="text-muted-foreground">Tích điểm kinh nghiệm XP, duy trì ngọn lửa Streak học hàng ngày và đua Top Bảng xếp hạng.</p>
              </div>
              <div className="p-4 bg-muted/30 rounded-2xl border space-y-1">
                <p className="font-bold text-foreground">4. Đặt lịch Meeting 1:1</p>
                <p className="text-muted-foreground">Đặt lịch luyện giao tiếp Kaiwa 1:1 trực tiếp cùng giảng viên theo ca học tự chọn.</p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminGuide;
