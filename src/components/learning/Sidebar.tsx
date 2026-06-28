import { useMemo } from 'react';
import {
  BookOpen, LayoutDashboard,
  Trophy, Video, GraduationCap, Calendar,
  Dumbbell, Settings, User, Users
} from 'lucide-react';
import Logo from '@/components/Logo';
import { useLearning } from '@/contexts/LearningContext';
import { usePageVisibility } from '@/hooks/usePageVisibility';
import { useAuth } from '@/hooks/useAuth';
import SidebarModule, { SidebarSection, SidebarItem } from '@/components/shared/SidebarModule';

interface SidebarProps {
  onNavigate?: () => void;
}

const Sidebar = ({ onNavigate }: SidebarProps) => {
  useAuth();
  const { currentLanguage } = useLearning();
  const { settings } = usePageVisibility();

  const languageFlags: Record<string, string> = { japanese: '🇯🇵' };
  const languageNames: Record<string, string> = { japanese: 'Tiếng Nhật' };

  const allItems: SidebarItem[] = [
    { name: 'Dashboard', href: '/learn', icon: LayoutDashboard, description: 'Xem tổng quan học tập' },
    { name: 'Lớp học của tôi', href: '/learn/classes', icon: Users, description: 'Quản lý lớp học' },
    { name: 'Bài học', href: '/learn/lessons', icon: BookOpen, description: 'Truy cập bài học' },
    { name: 'Bài tập', href: '/learn/exercises', icon: Dumbbell, description: 'Thực hành kỹ năng' },
    { name: 'Bài kiểm tra', href: '/learn/exams', icon: GraduationCap, description: 'Tham gia bài kiểm tra' },
    { name: 'Đặt lịch học', href: '/learn/zoom', icon: Video, description: 'Lớp học trực tuyến' },
    { name: 'Lịch học', href: '/learn/calendar', icon: Calendar, description: 'Xem lịch học' },
    { name: 'Thành tích', href: '/learn/achievements', icon: Trophy, description: 'Xem huy hiệu' },
    { name: 'Hồ sơ', href: '/learn/profile', icon: User, description: 'Quản lý hồ sơ' },
    { name: 'Cài đặt', href: '/learn/settings', icon: Settings, description: 'Tùy chỉnh ứng dụng' },
  ];

  const filteredItems = allItems.filter(item =>
    settings.learn_sidebar[
      item.name.toLowerCase().replace(/\s+/g, '_')
    ] !== false
  );

  const sections: SidebarSection[] = [
    {
      label: 'Học tập',
      items: filteredItems.filter(item =>
        ['Dashboard', 'Lớp học của tôi', 'Bài học', 'Bài tập', 'Bài kiểm tra'].includes(item.name)
      ),
      collapsible: false,
    },
    {
      label: 'Lịch trình',
      items: filteredItems.filter(item =>
        ['Đặt lịch học', 'Lịch học'].includes(item.name)
      ),
      collapsible: false,
    },
    {
      label: 'Tiến độ',
      items: filteredItems.filter(item =>
        ['Thành tích'].includes(item.name)
      ),
      collapsible: false,
    },
    {
      label: 'Cá nhân',
      items: filteredItems.filter(item =>
        ['Hồ sơ', 'Cài đặt'].includes(item.name)
      ),
      collapsible: false,
    },
  ];

  const headerContent = (
    <div className="flex items-center gap-3 p-3 rounded-2xl bg-sidebar-primary/10 border border-sidebar-primary/20 backdrop-blur-sm">
      <span className="text-2xl">{languageFlags[currentLanguage]}</span>
      <div>
        <p className="text-xs text-sidebar-foreground/70">Đang học</p>
        <p className="font-semibold text-sidebar-foreground">{languageNames[currentLanguage] || 'Tiếng Nhật'}</p>
      </div>
    </div>
  );

  const logoContent = (
    <Logo
      className="flex items-center gap-2"
      imgClassName="w-10 h-10 rounded-xl object-cover"
      onClick={onNavigate}
    />
  );

  return (
    <SidebarModule
      sections={sections}
      logo={logoContent}
      header={headerContent}
      onNavigate={onNavigate}
      showDarkMode={true}
      showLogout={true}
      userRole="user"
    />
  );
};

export default Sidebar;
