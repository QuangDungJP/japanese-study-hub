import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  BookOpen, Mic, PenTool, Headphones, LayoutDashboard,
  BookText, Trophy, Video, GraduationCap, Calendar,
  ChevronDown, ChevronRight, Dumbbell, Settings, User, Building, Bell,
  Zap, Target, Sparkles, ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Logo from '@/components/Logo';
import { useLearning } from '@/contexts/LearningContext';
import { usePageVisibility } from '@/hooks/usePageVisibility';
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import DarkModeToggle from '@/components/theme/DarkModeToggle';
import { Badge } from '@/components/ui/badge';
import { getSavedTheme } from '@/lib/themeUtils';

const allNavigation = [
  { name: 'Bảng điều khiển', href: '/learn', icon: LayoutDashboard, key: 'dashboard' },
  { name: 'Lớp học của tôi', href: '/learn/my-classes', icon: Building, key: 'my_classes' },
  { name: 'Thông báo', href: '/learn/notifications', icon: Bell, key: 'notifications' },
  { name: 'Phòng học Meeting', href: '/learn/zoom', icon: Video, key: 'zoom' },
  { name: 'Lịch học', href: '/learn/calendar', icon: Calendar, key: 'calendar' },
  { name: 'Thành tích & BXH', href: '/learn/achievements', icon: Trophy, key: 'achievements' },
  { name: 'Hướng dẫn học viên', href: '/learn/guide', icon: BookOpen, key: 'guide' },
  { name: 'Hồ sơ cá nhân', href: '/learn/profile', icon: User, key: 'profile' },
];

interface SidebarProps {
  onNavigate?: () => void;
}

const Sidebar = ({ onNavigate }: SidebarProps) => {
  const location = useLocation();
  const { userProgress, currentLanguage } = useLearning();
  const { settings } = usePageVisibility();

  const languageFlags: Record<string, string> = { japanese: '🇯🇵' };
  const languageNames: Record<string, string> = { japanese: 'Tiếng Nhật' };

  const navigation = allNavigation.filter(item => settings.learn_sidebar[item.key] !== false);
  const progressPercent = Math.round(Math.min((userProgress.dailyProgress / userProgress.dailyGoal) * 100, 100));

  const [activeTheme, setActiveTheme] = useState(() => getSavedTheme());

  useEffect(() => {
    const handleThemeChange = () => {
      setActiveTheme(getSavedTheme());
    };
    window.addEventListener('tnqdo_theme_changed', handleThemeChange);
    return () => window.removeEventListener('tnqdo_theme_changed', handleThemeChange);
  }, []);

  return (
    <>
      <div className="p-4 border-b border-border">
        <Logo className="flex items-center gap-2" imgClassName="w-10 h-10 rounded-xl object-cover" onClick={onNavigate} />
      </div>

      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
          <span className="text-2xl">{languageFlags[currentLanguage]}</span>
          <div>
            <p className="text-xs text-muted-foreground">Đang học</p>
            <p className="font-semibold text-foreground">{languageNames[currentLanguage] || 'Tiếng Nhật'}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link key={item.name} to={item.href!} onClick={onNavigate} className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
              isActive ? 'bg-primary text-primary-foreground shadow-md font-bold' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}>
              <item.icon className="w-5 h-5" />{item.name}
            </Link>
          );
        })}
      </nav>

      {/* Upgraded Sidebar Footer & Daily XP Goal Widget */}
      <div className="p-4 border-t border-border space-y-4">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">Chế độ hiển thị</span>
          <DarkModeToggle variant="compact" />
        </div>

        {/* Custom Dynamic Theme Daily XP Goal Widget */}
        <div 
          className="relative overflow-hidden rounded-2xl text-white p-4 shadow-md border border-white/20 group transition-all duration-500"
          style={{ background: 'var(--gradient-primary)' }}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
          
          <div className="relative z-10 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Target className="w-4 h-4 text-yellow-400" />
                <span className="text-xs font-bold tracking-wide uppercase text-white/90">Mục tiêu hôm nay</span>
              </div>
              <Badge className="bg-amber-400/20 text-yellow-300 border-amber-300/30 text-[10px] font-extrabold px-2 py-0.5">
                {progressPercent}%
              </Badge>
            </div>

            <div className="flex items-center justify-between bg-black/25 px-3 py-2 rounded-xl border border-white/10 backdrop-blur-sm">
              <div className="flex items-center gap-1.5 text-xs text-yellow-300 font-bold">
                <Zap className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400 animate-pulse" />
                <span>Tiến trình XP</span>
              </div>
              <span className="text-xs font-black tracking-tight text-white">
                <span className="text-yellow-300 text-sm">{userProgress.dailyProgress}</span> / {userProgress.dailyGoal} XP
              </span>
            </div>

            <div className="space-y-1">
              <div className="h-2.5 bg-black/30 rounded-full overflow-hidden p-0.5 border border-white/10">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-400 via-amber-500 to-emerald-400 rounded-full transition-all duration-700 shadow-sm"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <Link 
              to="/learn/my-classes" 
              onClick={onNavigate}
              className="flex items-center justify-between text-[11px] font-bold text-white/80 hover:text-white pt-0.5 transition-colors group-hover:translate-x-0.5"
            >
              <span>{userProgress.dailyProgress >= userProgress.dailyGoal ? '🎉 Đã đạt mục tiêu!' : 'Học bài để nhận XP'}</span>
              <ArrowRight className="w-3 h-3 text-yellow-300" />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
