import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  BookOpen, Mic, PenTool, Headphones, LayoutDashboard,
  BookText, Trophy, Video, GraduationCap, Calendar,
  ChevronDown, ChevronRight, Dumbbell, Settings, User, Building
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Logo from '@/components/Logo';
import { useLearning } from '@/contexts/LearningContext';
import { usePageVisibility } from '@/hooks/usePageVisibility';
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import DarkModeToggle from '@/components/theme/DarkModeToggle';

const allNavigation = [
  { name: 'Bảng điều khiển', href: '/learn', icon: LayoutDashboard, key: 'dashboard' },
  { name: 'Lớp học của tôi', href: '/learn/my-classes', icon: Building, key: 'my_classes' },
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

      <div className="p-4 border-t border-border space-y-4">
        <div className="flex items-center justify-between px-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">Chế độ hiển thị</span>
          <DarkModeToggle variant="compact" />
        </div>
        <div className="p-4 rounded-xl bg-gradient-primary text-primary-foreground">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm opacity-90">Mục tiêu hôm nay</span>
            <span className="text-sm font-bold">{userProgress.dailyProgress}/{userProgress.dailyGoal} XP</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${(userProgress.dailyProgress / userProgress.dailyGoal) * 100}%` }} />
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
