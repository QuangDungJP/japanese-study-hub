import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  DollarSign
} from 'lucide-react';

const AdminGuide = () => {
  const [roleTab, setRoleTab] = useState('admin');

  const adminSteps = [
    {
      step: '01',
      title: 'Quản trị Người dùng & Giảng viên',
      description: 'Quản lý toàn bộ danh sách học viên, phân quyền giảng viên và xét duyệt tài khoản.',
      details: [
        'Xem danh sách người dùng và tiến độ học tập',
        'Cấp quyền Giảng viên (Teacher / Senior Teacher / Admin)',
        'Cập nhật hồ sơ chuyên môn và chứng chỉ cho giáo viên'
      ]
    },
    {
      step: '02',
      title: 'Quản lý Lớp học & Khóa học',
      description: 'Tạo mới các lớp học, phân công giáo viên và quản lý ngân hàng bài giảng mẫu.',
      details: [
        'Tạo lớp học mới và phân công giảng viên phụ trách',
        'Tạo bài giảng mẫu chuẩn JLPT cho 4 kỹ năng',
        'Liên kết các bài giảng mẫu vào từng khóa học'
      ]
    },
    {
      step: '03',
      title: 'Quản trị Website CMS & Blog',
      description: 'Cập nhật giao diện trang chủ, bài viết blog và các sự kiện workshop.',
      details: [
        'Chỉnh sửa Banner trang chủ, khẩu hiệu và các phần giới thiệu',
        'Đăng bài viết chia sẻ kinh nghiệm học và ghim bài nổi bật',
        'Tạo và quản lý sự kiện workshop luyện thi JLPT'
      ]
    },
    {
      step: '04',
      title: 'Theo dõi Tài chính & Đơn hàng',
      description: 'Xác nhận giao dịch thanh toán mua khóa học của học viên.',
      details: [
        'Xem danh sách đơn hàng đăng ký mua khóa học',
        'Xác nhận thông tin chuyển khoản qua ngân hàng',
        'Theo dõi báo cáo doanh thu tổng quan'
      ]
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-purple-700 via-purple-800 to-indigo-900 p-6 md:p-8 text-white shadow-xl overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <Badge className="bg-white/20 text-white hover:bg-white/30 border-none font-bold">
              <Shield className="w-3.5 h-3.5 mr-1" /> Quản trị viên (Toàn quyền hệ thống)
            </Badge>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Trung tâm Hướng dẫn & Vận hành Hệ thống
            </h1>
            <p className="text-white/80 text-sm max-w-2xl">
              Quản trị viên có quyền theo dõi hướng dẫn của toàn bộ 3 Roles (Admin, Giảng viên, Học viên) để hỗ trợ người dùng.
            </p>
          </div>
          <Button variant="secondary" className="font-bold gap-2 shadow-md shrink-0" asChild>
            <Link to="/admin/classes">
              <Building className="w-4 h-4" /> Quản lý Lớp học
            </Link>
          </Button>
        </div>
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
            {adminSteps.map((item) => (
              <Card key={item.step} className="border-border shadow-soft hover:shadow-lg transition-all rounded-3xl overflow-hidden">
                <CardHeader className="pb-3 flex flex-row items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 font-black text-xl flex items-center justify-center shrink-0 border border-purple-500/20">
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
        </TabsContent>

        <TabsContent value="teacher">
          <div className="p-4 bg-card rounded-2xl border border-border">
            <p className="text-sm text-muted-foreground mb-4">Dưới đây là hướng dẫn hiển thị cho tài khoản Giảng viên:</p>
            <div className="space-y-3 text-sm">
              <div className="p-3 bg-muted/40 rounded-xl">1. Quản lý Lớp học 5 Tab (Stream, Bài học, Bài kiểm tra, Bài nộp, Học viên)</div>
              <div className="p-3 bg-muted/40 rounded-xl">2. Sử dụng Chế độ Trình chiếu slide tương tác khi dạy học/Zoom</div>
              <div className="p-3 bg-muted/40 rounded-xl">3. Chấm bài nộp, cho điểm (0-100) và viết nhận xét chi tiết</div>
              <div className="p-3 bg-muted/40 rounded-xl">4. Điểm danh học viên và phê duyệt yêu cầu xin nghỉ phép</div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="student">
          <div className="p-4 bg-card rounded-2xl border border-border">
            <p className="text-sm text-muted-foreground mb-4">Dưới đây là hướng dẫn hiển thị cho tài khoản Học viên:</p>
            <div className="space-y-3 text-sm">
              <div className="p-3 bg-muted/40 rounded-xl">1. Vào Lớp học Google Classroom để xem slide bài giảng, bài tập & link Zoom</div>
              <div className="p-3 bg-muted/40 rounded-xl">2. Học 4 kỹ năng Tiếng Nhật (Đọc hiểu, Luyện nghe, Luyện nói, Luyện viết)</div>
              <div className="p-3 bg-muted/40 rounded-xl">3. Tích lũy điểm XP, duy trì Chuỗi Streak ngọn lửa 🔥 hàng ngày</div>
              <div className="p-3 bg-muted/40 rounded-xl">4. Đặt lịch học Zoom 1:1 và vào phòng học đúng giờ</div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminGuide;
