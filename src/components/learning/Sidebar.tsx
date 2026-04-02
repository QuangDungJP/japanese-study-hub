import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  BookOpen, Mic, PenTool, Headphones, LayoutDashboard,
  BookText, Trophy, Video, GraduationCap, Calendar,
  ChevronDown, ChevronRight, Dumbbell, Settings, User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Logo from '@/components/Logo';
import { useLearning } from '@/contexts/LearningContext';
import { usePageVisibility } from '@/hooks/usePageVisibility';
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";

const skillItems = [
  { name: 'Đọc hiểu', href: '/learn/reading', icon: BookOpen },
  { name: 'Nói', href: '/learn/speaking', icon: Mic },
  { name: 'Viết', href: '/learn/writing', icon: PenTool },
  { name: 'Nghe', href: '/learn/listening', icon: Headphones },
  { name: 'Từ vựng', href: '/learn/vocabulary', icon: BookText },
];

const allNavigation = [
  { name: 'Dashboard', href: '/learn', icon: LayoutDashboard, key: 'dashboard' },
  { name: 'Bài học', icon: GraduationCap, isDropdown: true, children: skillItems, key: 'lessons' },
  { name: 'Bài tập', href: '/learn/exercises', icon: Dumbbell, key: 'exercises' },
  { name: 'Zoom Class', href: '/learn/zoom', icon: Video, key: 'zoom' },
  { name: 'Lịch học', href: '/learn/calendar', icon: Calendar, key: 'calendar' },
  { name: 'Thành tích', href: '/learn/achievements', icon: Trophy, key: 'achievements' },
  { name: 'Hồ sơ', href: '/learn/profile', icon: User, key: 'profile' },
  { name: 'Cài đặt', href: '/learn/settings', icon: Settings, key: 'settings' },
];

interface SidebarProps {
  onNavigate?: () => void;
}

const Sidebar = ({ onNavigate }: SidebarProps) => {
  const location = useLocation();
  const { userProgress, currentLanguage } = useLearning();
  const { settings } = usePageVisibility();
  const [lessonsOpen, setLessonsOpen] = useState(
    skillItems.some(item => location.pathname === item.href)
  );

  const languageFlags: Record<string, string> = { japanese: '🇯🇵' };
  const languageNames: Record<string, string> = { japanese: 'Tiếng Nhật' };

  const navigation = allNavigation.filter(item => settings.learn_sidebar[item.key] !== false);
  const isLessonActive = skillItems.some(item => location.pathname === item.href);

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
          if (item.isDropdown && item.children) {
            return (
              <Collapsible key={item.name} open={lessonsOpen} onOpenChange={setLessonsOpen}>
                <CollapsibleTrigger asChild>
                  <button className={cn(
                    'w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                    isLessonActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}>
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5" />{item.name}
                    </div>
                    {lessonsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-4 mt-1 space-y-1">
                  {item.children.map((child) => {
                    const isActive = location.pathname === child.href;
                    return (
                      <Link key={child.name} to={child.href} onClick={onNavigate} className={cn(
                        'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                        isActive ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}>
                        <child.icon className="w-4 h-4" />{child.name}
                      </Link>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            );
          }

          const isActive = location.pathname === item.href;
          return (
            <Link key={item.name} to={item.href!} onClick={onNavigate} className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
              isActive ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}>
              <item.icon className="w-5 h-5" />{item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
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
