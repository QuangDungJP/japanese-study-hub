import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, BookOpen, FileText, Video, Bell, Users, Bug, User, LogOut,
  GraduationCap, ChevronRight, Calendar, ClipboardCheck, ChevronDown, Menu
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
    items: [
      { name: 'Dashboard', href: '/teacher', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Giảng dạy',
    items: [
      { name: 'Bài học', href: '/teacher/lessons', icon: BookOpen },
      { name: 'Lớp học', href: '/teacher/classes', icon: Users },
      { name: 'Chấm bài', href: '/teacher/submissions', icon: FileText },
      { name: 'Điểm danh', href: '/teacher/attendance', icon: ClipboardCheck },
    ],
  },
  {
    label: 'Lịch trình',
    items: [
      { name: 'Lịch Zoom', href: '/teacher/zoom', icon: Video },
      { name: 'Lịch & Kiểm tra', href: '/teacher/calendar', icon: Calendar },
    ],
  },
  {
    label: 'Khác',
    items: [
      { name: 'Thông báo', href: '/teacher/notifications', icon: Bell },
      { name: 'Báo lỗi', href: '/teacher/bug-reports', icon: Bug },
      { name: 'Hồ sơ', href: '/teacher/profile', icon: User },
    ],
  },
];

const TeacherLayout = () => {
  const location = useLocation();
  const { user, loading, signOut, isAdmin, isTeacherOrAbove, isTeacher, isSeniorTeacher } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    navSections.forEach(s => { init[s.label] = true; });
    return init;
  });

  const teacherRole = isAdmin ? 'admin' : isSeniorTeacher ? 'senior_teacher' : 'teacher';

  const toggleSection = (label: string) => {
    setOpenSections(prev => ({ ...prev, [label]: !prev[label] }));
  };

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
          <p className="text-muted-foreground mb-6">Bạn không phải là giảng viên.</p>
          <Button asChild><Link to="/learn">Quay lại học</Link></Button>
        </div>
      </div>
    );
  }

  const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      <div className="p-3 border-b border-border">
        <Link to="/teacher" className="flex items-center gap-2" onClick={onNavigate}>
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <img src="/logo.jpg" alt="TNQDO" className="w-5 h-5 rounded-lg object-cover" />
          </div>
          <div>
            <span className="text-base font-bold text-foreground">TNQDO</span>
            <p className="text-[10px] text-muted-foreground leading-none">
              {teacherRole === 'admin' ? 'Admin Mode' : teacherRole === 'senior_teacher' ? 'Senior' : 'Teacher'}
            </p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 py-2 px-2 overflow-y-auto space-y-0.5">
        {navSections.map((section) => {
          const isOpen = openSections[section.label] !== false;
          return (
            <Collapsible key={section.label} open={isOpen} onOpenChange={() => toggleSection(section.label)}>
              <CollapsibleTrigger className="w-full flex items-center justify-between px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 hover:text-muted-foreground transition-colors">
                {section.label}
                <ChevronDown className={cn("w-3 h-3 transition-transform", !isOpen && "-rotate-90")} />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = location.pathname === item.href || 
                    (item.href !== '/teacher' && location.pathname.startsWith(item.href));
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

      <div className="p-2 border-t border-border space-y-0.5">
        {isAdmin && (
          <Link to="/admin" onClick={onNavigate} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all">
            <LayoutDashboard className="w-4 h-4" />Admin Panel
          </Link>
        )}
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
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-60 bg-card border-r border-border flex-col z-50">
        <SidebarContent />
      </aside>

      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-card border-b border-border flex items-center px-4 z-50">
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
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <img src="/logo.jpg" alt="TNQDO" className="w-4 h-4 rounded-md object-cover" />
          </div>
          <span className="text-sm font-bold text-foreground">TNQDO Teacher</span>
        </div>
      </header>

      <main className="flex-1 lg:ml-60 p-4 pt-18 lg:pt-6 lg:p-6 xl:p-8 relative z-10">
        <Outlet context={{ teacherRole }} />
      </main>
    </div>
  );
};

export default TeacherLayout;
