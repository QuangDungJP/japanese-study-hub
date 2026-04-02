import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, BookOpen, BookText, Users, Settings,
  ChevronRight, LogOut, FileText, Bell,
  Library, ShoppingCart, Globe, Newspaper, MessageSquareText,GraduationCap,
  HelpCircle, DollarSign, CalendarDays, ChevronDown, Menu
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";

const navSections = [
  {
    label: 'Tổng quan',
    roles: ['admin', 'moderator'],
    items: [
      { name: 'Dashboard', href: '/admin', icon: LayoutDashboard, roles: ['admin', 'moderator'] },
    ],
  },
  {
    label: 'Nội dung',
    roles: ['admin', 'moderator'],
    items: [
      { name: 'Website CMS', href: '/admin/website', icon: Globe, roles: ['admin'] },
      { name: 'Blog', href: '/admin/blog', icon: Newspaper, roles: ['admin', 'moderator'] },
      { name: 'Hỏi & Đáp', href: '/admin/faq', icon: HelpCircle, roles: ['admin'] },
    ],
  },
  {
    label: 'Đào tạo',
    roles: ['admin', 'moderator'],
    items: [
      { name: 'Giảng viên', href: '/admin/teachers', icon: GraduationCap, roles: ['admin', 'moderator'] },
      { name: 'Khóa học', href: '/admin/courses', icon: Library, roles: ['admin', 'moderator'] },
      { name: 'Bài học', href: '/admin/lessons', icon: BookOpen, roles: ['admin', 'moderator'] },
      { name: 'Từ vựng', href: '/admin/vocabulary', icon: BookText, roles: ['admin', 'moderator'] },
      { name: 'Bài nộp', href: '/admin/submissions', icon: FileText, roles: ['admin', 'moderator'] },
    ],
  },
  {
    label: 'Kinh doanh',
    roles: ['admin'],
    items: [
      { name: 'Tài chính', href: '/admin/finance', icon: DollarSign, roles: ['admin'] },
      { name: 'Đơn hàng', href: '/admin/orders', icon: ShoppingCart, roles: ['admin'] },
      { name: 'Đặt lịch Zoom', href: '/admin/bookings', icon: CalendarDays, roles: ['admin', 'moderator'] },
    ],
  },
  {
    label: 'Sự kiện & Liên hệ',
    roles: ['admin'],
    items: [
      { name: 'Sự kiện', href: '/admin/events', icon: CalendarDays, roles: ['admin'] },
      { name: 'Form liên hệ', href: '/admin/contact', icon: MessageSquareText, roles: ['admin'] },
    ],
  },
  {
    label: 'Hệ thống',
    roles: ['admin'],
    items: [
      { name: 'Thông báo', href: '/admin/notifications', icon: Bell, roles: ['admin'] },
      { name: 'Người dùng', href: '/admin/users', icon: Users, roles: ['admin'] },
      { name: 'Cài đặt', href: '/admin/settings', icon: Settings, roles: ['admin'] },
    ],
  },
];

const AdminLayout = () => {
  const location = useLocation();
  const { user, isAdmin, isModeratorOrAdmin, loading, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    navSections.forEach(s => { init[s.label] = true; });
    return init;
  });

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

  const userRole = isAdmin ? 'admin' : 'moderator';

  const toggleSection = (label: string) => {
    setOpenSections(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      {/* Logo */}
      <div className="p-3 border-b border-border">
        <Link to="/admin" className="flex items-center gap-2" onClick={onNavigate}>
          <div className="w-9 h-9 rounded-lg bg-gradient-primary flex items-center justify-center">
            <img src="/logo.jpg" alt="TNQDO" className="w-5 h-5 rounded-lg object-cover" />
          </div>
          <div>
            <span className="text-base font-bold text-foreground">TNQDO</span>
            <p className="text-[10px] text-muted-foreground leading-none">{isAdmin ? 'Admin' : 'Moderator'}</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-2 px-2 overflow-y-auto space-y-0.5">
        {navSections
          .filter(section => section.roles.includes(userRole))
          .map((section) => {
            const visibleItems = section.items.filter(item => item.roles.includes(userRole));
            if (visibleItems.length === 0) return null;
            const isOpen = openSections[section.label] !== false;

            return (
              <Collapsible key={section.label} open={isOpen} onOpenChange={() => toggleSection(section.label)}>
                <CollapsibleTrigger className="w-full flex items-center justify-between px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 hover:text-muted-foreground transition-colors">
                  {section.label}
                  <ChevronDown className={cn("w-3 h-3 transition-transform", !isOpen && "-rotate-90")} />
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const isActive = location.pathname === item.href || 
                      (item.href !== '/admin' && location.pathname.startsWith(item.href));
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={onNavigate}
                        className={cn(
                          'flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all',
                          isActive 
                            ? 'bg-primary text-primary-foreground shadow-sm' 
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                      >
                        <item.icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{item.name}</span>
                        {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto shrink-0" />}
                      </Link>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            );
          })}
      </nav>

      {/* Footer links */}
      <div className="p-2 border-t border-border space-y-0.5">
        <Link to="/teacher" onClick={onNavigate} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all">
          <GraduationCap className="w-4 h-4" />Teacher Panel
        </Link>
        <Link to="/learn" onClick={onNavigate} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all">
          <BookOpen className="w-4 h-4" />Về trang học
        </Link>
        <button onClick={() => { onNavigate?.(); signOut(); }} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-destructive hover:bg-destructive/10 transition-all w-full">
          <LogOut className="w-4 h-4" />Đăng xuất
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-60 bg-card border-r border-border flex-col z-40">
        <SidebarContent />
      </aside>

      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-card border-b border-border flex items-center px-4 z-40">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-60 p-0 flex flex-col">
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2 ml-2">
          <div className="w-7 h-7 rounded-md bg-gradient-primary flex items-center justify-center">
            <img src="/logo.jpg" alt="TNQDO" className="w-4 h-4 rounded-md object-cover" />
          </div>
          <span className="text-sm font-bold text-foreground">TNQDO Admin</span>
        </div>
      </header>

      <main className="flex-1 lg:ml-60 p-4 pt-18 lg:pt-6 lg:p-6 xl:p-8"><Outlet /></main>
    </div>
  );
};

export default AdminLayout;
