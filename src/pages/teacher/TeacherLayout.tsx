import { Outlet, Link, Navigate } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, FileText, Video, Bell, Users, Bug, User,
  GraduationCap, Calendar, ClipboardCheck
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import SidebarModule, { SidebarSection, SidebarItem } from '@/components/shared/SidebarModule';
import { BRAND } from '@/config/brand';

const buildNavSections = (isAdmin: boolean, isSeniorTeacher: boolean): SidebarSection[] => [
  {
    label: 'Tổng quan',
    items: [
      { name: 'Dashboard', href: '/teacher', icon: LayoutDashboard, description: 'Xem tổng quan' },
    ],
    collapsible: true,
    defaultOpen: true,
  },
  {
    label: 'Giảng dạy',
    items: [
      { name: 'Bài học', href: '/teacher/lessons', icon: BookOpen, description: 'Tạo và quản lý bài học' },
      { name: 'Bài kiểm tra', href: '/teacher/exams', icon: GraduationCap, description: 'Tạo bài kiểm tra' },
      { name: 'Lớp học', href: '/teacher/classes', icon: Users, description: 'Quản lý lớp học' },
      { name: 'Chấm bài', href: '/teacher/submissions', icon: FileText, description: 'Chấm bài tập học sinh' },
      { name: 'Điểm danh', href: '/teacher/attendance', icon: ClipboardCheck, description: 'Ghi nhận điểm danh' },
    ],
    collapsible: true,
    defaultOpen: true,
  },
  {
    label: 'Lịch trình',
    items: [
      { name: 'Lịch Zoom', href: '/teacher/zoom', icon: Video, description: 'Lịch lớp trực tuyến' },
      { name: 'Lịch & Nghỉ phép', href: '/teacher/calendar', icon: Calendar, description: 'Quản lý lịch cá nhân' },
    ],
    collapsible: true,
    defaultOpen: true,
  },
  {
    label: 'Khác',
    items: [
      { name: 'Thông báo', href: '/teacher/notifications', icon: Bell, description: 'Gửi thông báo' },
      { name: 'Báo lỗi', href: '/teacher/bug-reports', icon: Bug, description: 'Báo cáo lỗi' },
      { name: 'Hồ sơ', href: '/teacher/profile', icon: User, description: 'Quản lý hồ sơ' },
    ],
    collapsible: true,
    defaultOpen: false,
  },
];

const TeacherLayout = () => {
  const { user, loading, signOut, isAdmin, isTeacherOrAbove, isSeniorTeacher } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const teacherRole = isAdmin ? 'admin' : isSeniorTeacher ? 'senior_teacher' : 'teacher';
  const roleDisplay = teacherRole === 'admin' ? 'Admin Mode' : teacherRole === 'senior_teacher' ? 'Giáo viên cao cấp' : 'Giáo viên';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (!isTeacherOrAbove) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <GraduationCap className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold text-foreground mb-4">Không có quyền truy cập</h1>
          <p className="text-muted-foreground mb-6">Bạn không phải là giáo viên.</p>
          <Button asChild><Link to="/learn">Quay lại học</Link></Button>
        </div>
      </div>
    );
  }

  const sections = buildNavSections(isAdmin, isSeniorTeacher);

  const logoContent = (
    <Link to="/teacher" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
      <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center">
        <img src="/logo.jpg" alt={BRAND.logoAlt} className="w-5 h-5 rounded-lg object-cover" />
      </div>
      <div>
        <span className="text-base font-bold text-sidebar-foreground">{BRAND.name}</span>
        <p className="text-[10px] text-sidebar-foreground/60 leading-none">{roleDisplay}</p>
      </div>
    </Link>
  );

  const footerContent = (
    <div className="space-y-2 w-full">
      {isAdmin && (
        <Link
          to="/admin"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-primary/10 transition-all w-full"
        >
          <LayoutDashboard className="w-4 h-4" />
          Admin Panel
        </Link>
      )}
      <Link
        to="/learn"
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-primary/10 transition-all w-full"
      >
        <BookOpen className="w-4 h-4" />
        Về trang học
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      <SidebarModule
        sections={sections}
        logo={logoContent}
        footer={footerContent}
        onNavigate={() => setMobileOpen(false)}
        showDarkMode={true}
        showLogout={true}
        onLogout={() => signOut()}
        userRole={teacherRole}
        userName={user?.user_metadata?.full_name || 'Giáo viên'}
      />

      <main className="flex-1 p-4 pt-24 lg:pt-6 lg:p-6 xl:p-8 relative z-10">
        <Outlet context={{ teacherRole }} />
      </main>
    </div>
  );
};

export default TeacherLayout;
