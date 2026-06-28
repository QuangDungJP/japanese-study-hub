import { Outlet, Link, Navigate } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Users, Settings,
  FileText, Bell,
  Library, ShoppingCart, Globe, Newspaper, MessageSquareText, GraduationCap,
  HelpCircle, DollarSign, CalendarDays
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import SidebarModule, { SidebarSection } from '@/components/shared/SidebarModule';
import { BRAND } from '@/config/brand';

const buildNavSections = (isAdmin: boolean): SidebarSection[] => {
  const adminSections: SidebarSection[] = [
    {
      label: 'Tổng quan',
      items: [
        { name: 'Dashboard', href: '/admin', icon: LayoutDashboard, description: 'Xem tổng quan hệ thống' },
      ],
      collapsible: true,
      defaultOpen: true,
    },
    {
      label: 'Nội dung',
      items: [
        { name: 'Website CMS', href: '/admin/website', icon: Globe, description: 'Quản lý nội dung trang' },
        { name: 'Blog', href: '/admin/blog', icon: Newspaper, description: 'Quản lý bài viết blog' },
        { name: 'Hỏi & Đáp', href: '/admin/faq', icon: HelpCircle, description: 'Quản lý FAQ' },
      ],
      collapsible: true,
      defaultOpen: true,
    },
    {
      label: 'Đào tạo',
      items: [
        { name: 'Giáo viên', href: '/admin/teachers', icon: GraduationCap, description: 'Quản lý giáo viên' },
        { name: 'Khóa học', href: '/admin/courses', icon: Library, description: 'Quản lý khóa học' },
        { name: 'Lớp học', href: '/admin/classes', icon: Users, description: 'Quản lý lớp học' },
        { name: 'Bài học', href: '/admin/lessons', icon: BookOpen, description: 'Duyệt bài học' },
        { name: 'Bài kiểm tra', href: '/admin/exams', icon: GraduationCap, description: 'Quản lý bài kiểm tra' },
        { name: 'Bài nộp', href: '/admin/submissions', icon: FileText, description: 'Xem bài nộp' },
      ],
      collapsible: true,
      defaultOpen: true,
    },
  ];

  if (isAdmin) {
    adminSections.push(
      {
        label: 'Kinh doanh',
        items: [
          { name: 'Tài chính', href: '/admin/finance', icon: DollarSign, description: 'Xem báo cáo tài chính' },
          { name: 'Đơn hàng', href: '/admin/orders', icon: ShoppingCart, description: 'Quản lý đơn hàng' },
          { name: 'Đặt lịch', href: '/admin/bookings', icon: CalendarDays, description: 'Quản lý lịch đặt' },
        ],
        collapsible: true,
        defaultOpen: false,
      },
      {
        label: 'Sự kiện & Liên hệ',
        items: [
          { name: 'Sự kiện', href: '/admin/events', icon: CalendarDays, description: 'Quản lý sự kiện' },
          { name: 'Form liên hệ', href: '/admin/contact', icon: MessageSquareText, description: 'Xem form liên hệ' },
        ],
        collapsible: true,
        defaultOpen: false,
      },
      {
        label: 'Hệ thống',
        items: [
          { name: 'Thông báo', href: '/admin/notifications', icon: Bell, description: 'Gửi thông báo' },
          { name: 'Người dùng', href: '/admin/users', icon: Users, description: 'Quản lý người dùng' },
          { name: 'Cài đặt', href: '/admin/settings', icon: Settings, description: 'Cấu hình hệ thống' },
        ],
        collapsible: true,
        defaultOpen: false,
      }
    );
  }

  return adminSections;
};

const AdminLayout = () => {
  const { user, isAdmin, isModeratorOrAdmin, loading, signOut } = useAuth();

  const roleDisplay = isAdmin ? 'Quản trị viên' : 'Kiểm duyệt viên';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (!isModeratorOrAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Không có quyền truy cập</h1>
          <p className="text-muted-foreground mb-6">Bạn không có quyền truy cập trang quản trị.</p>
          <Button asChild><Link to="/learn">Quay lại học</Link></Button>
        </div>
      </div>
    );
  }

  const sections = buildNavSections(isAdmin);

  const logoContent = (
    <Link to="/admin" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
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
      <Link 
        to="/teacher" 
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-primary/10 transition-all w-full"
      >
        <GraduationCap className="w-4 h-4" />
        Teacher Panel
      </Link>
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
        onNavigate={() => {}}
        showDarkMode={true}
        showLogout={true}
        onLogout={() => signOut()}
        userRole={isAdmin ? 'admin' : 'moderator'}
        userName={user?.user_metadata?.full_name || 'Quản trị viên'}
      />

      <main className="flex-1 p-4 pt-24 lg:pt-6 lg:p-6 xl:p-8 relative z-10">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
