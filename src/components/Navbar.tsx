import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, User as UserIcon, LogOut, LayoutDashboard, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";
import { usePageVisibility } from "@/hooks/usePageVisibility";
import { usePageSettings } from "@/hooks/usePageSettings";
import DarkModeToggle from "@/components/theme/DarkModeToggle";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AvatarWithDecoration from "@/components/shared/AvatarWithDecoration";

const defaultNavLinks = [
  { name: "Giới thiệu", href: "/gioi-thieu", key: "about" },
  { name: "Khóa học", href: "/khoa-hoc", key: "courses" },
  { name: "Thi thử JLPT", href: "/thi-thu", key: "mock_exams" },
  { name: "Giáo viên", href: "/giao-vien", key: "teachers" },
  { name: "Google Meet", href: "/meeting", key: "zoom" },
  { name: "Blog", href: "/blog", key: "blog" },
  { name: "Sự kiện", href: "/su-kien", key: "events" },
  { name: "Liên hệ", href: "/lien-he", key: "contact" },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { settings } = usePageVisibility();
  const { data: pageSettings } = usePageSettings();
  const { user, signOut, isModeratorOrAdmin, isAdmin, isTeacherOrAbove } = useAuth();

  // Query store system settings to check if Store is enabled by Admin
  const { data: isStoreEnabled = false } = useQuery({
    queryKey: ['store-system-enabled'],
    queryFn: async () => {
      const { data } = await supabase
        .from('website_content')
        .select('content')
        .eq('section_key', 'store_system_settings')
        .maybeSingle();
      return Boolean((data?.content as any)?.is_store_enabled);
    },
    staleTime: 30_000,
  });

  // Query Announcement Bar content
  const { data: announcementBar } = useQuery({
    queryKey: ['announcement-bar-content'],
    queryFn: async () => {
      const { data } = await supabase
        .from('website_content')
        .select('content')
        .eq('section_key', 'announcement_bar')
        .maybeSingle();
      return (data?.content as { enabled?: boolean; text_vi?: string; button_text_vi?: string; button_url?: string }) || null;
    },
    staleTime: 30_000,
  });

  const baseNavLinks = defaultNavLinks;

  const navLinks = baseNavLinks
    .filter(link => settings.navbar_items[link.key] !== false)
    .map(link => {
      const ps = pageSettings?.[link.key];
      return { ...link, name: ps?.nav_label_vi || ps?.display_name_vi || link.name };
    });

  const initial = (user?.user_metadata?.full_name || user?.email || 'U').charAt(0).toUpperCase();
  const displayName = user?.user_metadata?.full_name || user?.email || '';

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const [isDismissed, setIsDismissed] = useState(false);

  const isAnnouncementActive = announcementBar?.enabled !== false && Boolean(announcementBar?.text_vi) && !isDismissed;

  return (
    <>
      {/* Live Announcement Bar Banner */}
      {isAnnouncementActive && (
        <div className="fixed top-0 left-0 right-0 z-50 h-9 bg-gradient-to-r from-rose-600 via-amber-500 to-rose-600 text-white text-[11px] sm:text-xs font-bold px-3 flex items-center justify-between gap-2 shadow-md">
          <div className="flex items-center gap-1.5 min-w-0 flex-1 justify-center sm:justify-start">
            <span className="hidden sm:inline-block bg-white/25 text-white px-2 py-0.5 rounded-full text-[10px] uppercase font-mono tracking-wider shrink-0">🔥 Khuyến Mãi</span>
            <span className="truncate">{announcementBar?.text_vi}</span>
            {announcementBar?.button_text_vi && (
              <Link to={announcementBar.button_url || "/auth"} className="ml-1 underline hover:text-amber-100 shrink-0 font-extrabold flex items-center bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded-md transition-all text-[10px] sm:text-xs">
                {announcementBar.button_text_vi} →
              </Link>
            )}
          </div>
          
          {/* Nút Đóng [X] */}
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="p-1 rounded-full hover:bg-white/20 text-white/90 hover:text-white transition-colors shrink-0"
            title="Đóng thông báo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <nav className={cn("fixed left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-b shadow-xs transition-all duration-300",
        isAnnouncementActive ? "top-9" : "top-0"
      )}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Logo className="flex items-center gap-2" imgClassName="w-10 h-10 rounded-xl object-cover shadow-md" />

          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                  location.pathname === link.href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <DarkModeToggle />
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 p-1 rounded-xl hover:bg-white/40 transition-colors">
                    <AvatarWithDecoration userId={user.id} name={displayName} size="sm" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="p-3 border-b border-border">
                    <p className="font-medium text-foreground truncate">{displayName}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <DropdownMenuItem onClick={() => navigate('/learn/profile')}>
                    <UserIcon className="w-4 h-4 mr-2" /> Hồ sơ của tôi
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/learn')}>
                    <LayoutDashboard className="w-4 h-4 mr-2" /> Vào trang học
                  </DropdownMenuItem>
                  {isTeacherOrAbove && (
                    <DropdownMenuItem onClick={() => navigate('/teacher')}>
                      <Settings className="w-4 h-4 mr-2" /> Khu giáo viên
                    </DropdownMenuItem>
                  )}
                  {isModeratorOrAdmin && (
                    <DropdownMenuItem onClick={() => navigate('/admin')}>
                      <Settings className="w-4 h-4 mr-2" />
                      {isAdmin ? 'Quản trị viên' : 'Quản lý nội dung'}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                    <LogOut className="w-4 h-4 mr-2" /> Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" asChild><Link to="/auth">Đăng nhập</Link></Button>
                <Button asChild><Link to="/auth">Bắt đầu miễn phí</Link></Button>
              </>
            )}
          </div>

          <div className="flex items-center gap-1 lg:hidden">
            <DarkModeToggle variant="compact" />
            <button
              className="p-2 rounded-xl hover:bg-muted text-foreground transition-colors active:scale-95"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Mở menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="lg:hidden py-4 border-t border-border animate-slide-up max-h-[80vh] overflow-y-auto">
            {/* User Profile Card or Welcome Banner */}
            {user ? (
              <div className="p-3.5 rounded-2xl bg-muted/60 border border-border/80 mb-3 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <AvatarWithDecoration userId={user.id} name={displayName} size="md" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{displayName}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>
                <Link
                  to="/learn"
                  onClick={() => setIsOpen(false)}
                  className="shrink-0 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs active:scale-95"
                >
                  Vào học →
                </Link>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-primary/10 via-japanese/5 to-accent/10 border border-primary/20 mb-3">
                <p className="text-xs font-bold text-foreground mb-1">👋 Chào mừng bạn đến với Quang Dũng Nihongo!</p>
                <p className="text-[11px] text-muted-foreground mb-2.5">Đăng ký tài khoản để học thử miễn phí và làm bài thi thử JLPT.</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" variant="outline" className="h-8 text-xs rounded-xl font-bold" asChild>
                    <Link to="/auth" onClick={() => setIsOpen(false)}>Đăng nhập</Link>
                  </Button>
                  <Button size="sm" className="h-8 text-xs rounded-xl font-bold bg-primary" asChild>
                    <Link to="/auth" onClick={() => setIsOpen(false)}>Bắt đầu ngay</Link>
                  </Button>
                </div>
              </div>
            )}

            {/* PWA App Install Shortcut Card */}
            <Link
              to="/huong-dan-cai-dat"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between p-3 rounded-2xl bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/20 mb-3 active:scale-98 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center text-sm shadow-xs">
                  📲
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">Cài đặt App lên điện thoại</p>
                  <p className="text-[10px] text-muted-foreground">Trải nghiệm như ứng dụng thật không thanh địa chỉ</p>
                </div>
              </div>
              <span className="text-xs font-bold text-rose-600">Xem →</span>
            </Link>

            {/* Navigation Links */}
            <div className="flex flex-col gap-1">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-between",
                    location.pathname === link.href
                      ? "bg-primary/10 text-primary font-bold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <span>{link.name}</span>
                  <span className="text-xs opacity-50">›</span>
                </Link>
              ))}

              {/* Student Portal Shortcuts */}
              {user && (
                <div className="flex flex-col gap-1 pt-2 border-t border-border mt-2">
                  <Link
                    to="/learn"
                    onClick={() => setIsOpen(false)}
                    className="px-3.5 py-2.5 rounded-xl text-sm font-bold text-primary hover:bg-primary/10 transition-colors flex items-center gap-2"
                  >
                    <LayoutDashboard className="w-4 h-4" /> Bàn học cá nhân
                  </Link>
                  <Link
                    to="/learn/profile"
                    onClick={() => setIsOpen(false)}
                    className="px-3.5 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors flex items-center gap-2"
                  >
                    <UserIcon className="w-4 h-4" /> Hồ sơ & Bảng vàng
                  </Link>
                  {isTeacherOrAbove && (
                    <Link
                      to="/teacher"
                      onClick={() => setIsOpen(false)}
                      className="px-3.5 py-2.5 rounded-xl text-sm font-medium text-amber-600 hover:bg-amber-500/10 transition-colors flex items-center gap-2"
                    >
                      <Settings className="w-4 h-4" /> Khu vực Giáo viên
                    </Link>
                  )}
                  {isModeratorOrAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setIsOpen(false)}
                      className="px-3.5 py-2.5 rounded-xl text-sm font-medium text-purple-600 hover:bg-purple-500/10 transition-colors flex items-center gap-2"
                    >
                      <Settings className="w-4 h-4" /> Quản trị Admin
                    </Link>
                  )}
                  <button
                    onClick={() => { setIsOpen(false); handleSignOut(); }}
                    className="px-3.5 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-2 text-left"
                  >
                    <LogOut className="w-4 h-4" /> Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  </>
);
};

export default Navbar;
