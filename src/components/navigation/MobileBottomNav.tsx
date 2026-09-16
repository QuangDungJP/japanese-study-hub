import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  Home,
  BookOpen,
  Sparkles,
  Users,
  User,
  LayoutDashboard,
  GraduationCap,
  Calendar,
  FileText
} from "lucide-react";

export const MobileBottomNav = () => {
  const location = useLocation();
  const { user } = useAuth();
  const pathname = location.pathname;

  // Don't show bottom navigation inside fullscreen test runners or live meeting rooms
  const isHiddenRoute =
    pathname.includes("/mock-exams/") ||
    pathname.includes("/exams/") ||
    pathname.startsWith("/phong-hoc") ||
    pathname.startsWith("/admin");

  if (isHiddenRoute) return null;

  const isLearningArea = pathname.startsWith("/learn");

  // Tabs for Student Portal
  const studentTabs = [
    {
      label: "Tổng quan",
      href: "/learn",
      icon: LayoutDashboard,
      isActive: pathname === "/learn",
    },
    {
      label: "Lớp học",
      href: "/learn/my-classes",
      icon: GraduationCap,
      isActive: pathname.startsWith("/learn/my-classes"),
    },
    {
      label: "Thi JLPT",
      href: "/learn/mock-exams",
      icon: Sparkles,
      isActive: pathname.startsWith("/learn/mock-exams") || pathname.startsWith("/learn/exams"),
      isCenter: true,
    },
    {
      label: "Lịch học",
      href: "/learn/calendar",
      icon: Calendar,
      isActive: pathname === "/learn/calendar",
    },
    {
      label: "Hồ sơ",
      href: "/learn/profile",
      icon: User,
      isActive: pathname === "/learn/profile" || pathname === "/learn/settings",
    },
  ];

  // Tabs for Public Website
  const publicTabs = [
    {
      label: "Trang chủ",
      href: "/",
      icon: Home,
      isActive: pathname === "/",
    },
    {
      label: "Khóa học",
      href: "/khoa-hoc",
      icon: BookOpen,
      isActive: pathname.startsWith("/khoa-hoc"),
    },
    {
      label: "Thi thử",
      href: user ? "/learn/mock-exams" : "/auth",
      icon: Sparkles,
      isActive: pathname === "/learn/mock-exams",
      isCenter: true,
    },
    {
      label: "Giáo viên",
      href: "/giao-vien",
      icon: Users,
      isActive: pathname.startsWith("/giao-vien"),
    },
    {
      label: user ? "Vào học" : "Tài khoản",
      href: user ? "/learn" : "/auth",
      icon: User,
      isActive: pathname === "/auth" || pathname.startsWith("/learn"),
    },
  ];

  const currentTabs = isLearningArea ? studentTabs : publicTabs;

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 lg:hidden",
        "bg-background/90 dark:bg-card/90 backdrop-blur-xl",
        "border-t border-border/80 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.3)]",
        "transition-all duration-300"
      )}
      style={{
        paddingBottom: "max(env(safe-area-inset-bottom, 0px), 8px)",
      }}
    >
      <nav className="flex items-center justify-around px-2 pt-1.5 h-14">
        {currentTabs.map((tab) => {
          const Icon = tab.icon;

          if (tab.isCenter) {
            return (
              <Link
                key={tab.label}
                to={tab.href}
                className="relative -top-3.5 flex flex-col items-center group active:scale-90 transition-transform"
              >
                <div
                  className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300",
                    "bg-gradient-to-tr from-rose-500 via-amber-500 to-rose-600 text-white",
                    "border-2 border-background shadow-rose-500/30 group-hover:shadow-rose-500/50 group-hover:scale-105"
                  )}
                >
                  <Icon className="w-5 h-5 animate-pulse" />
                </div>
                <span className="text-[10px] font-extrabold text-foreground mt-0.5 tracking-tight">
                  {tab.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={tab.label}
              to={tab.href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-1 relative min-w-0 active:scale-90 transition-all",
                tab.isActive
                  ? "text-primary dark:text-primary font-bold"
                  : "text-muted-foreground hover:text-foreground font-medium"
              )}
            >
              {/* Active Indicator Background Glow */}
              {tab.isActive && (
                <div className="absolute top-0 w-8 h-1 bg-primary rounded-full shadow-xs" />
              )}
              
              <div className="relative">
                <Icon className={cn("w-5 h-5 transition-transform", tab.isActive && "scale-110")} />
              </div>

              <span
                className={cn(
                  "text-[10px] mt-0.5 truncate max-w-[64px] text-center transition-colors",
                  tab.isActive ? "text-primary dark:text-primary font-bold" : "text-muted-foreground"
                )}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default MobileBottomNav;
