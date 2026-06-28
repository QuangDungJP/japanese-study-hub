import { Search } from 'lucide-react';
import { useLearning } from '@/contexts/LearningContext';
import NotificationDropdown from './NotificationDropdown';
import UserDropdown from './UserDropdown';
import DarkModeToggle from '@/components/theme/DarkModeToggle';

const TopBar = () => {
  const { currentLanguage } = useLearning();
  void currentLanguage;

  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-30">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Search */}
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm kiếm bài học, từ vựng..."
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-muted/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Dark Mode Toggle */}
          <DarkModeToggle />
          
          {/* Japanese Badge */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-japanese/10 border border-japanese/20">
            <span className="text-xl">🇯🇵</span>
            <span className="font-semibold text-foreground">Tiếng Nhật</span>
          </div>

          {/* Notifications */}
          <NotificationDropdown />

          {/* User Menu */}
          <UserDropdown />
        </div>
      </div>
    </header>
  );
};

export default TopBar;
