import { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, Bell, Flame } from 'lucide-react';
import DarkModeToggle from '@/components/theme/DarkModeToggle';
import { useAuth } from '@/hooks/useAuth';
import AvatarWithDecoration from '@/components/shared/AvatarWithDecoration';

const LearningLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const displayName = user?.user_metadata?.full_name || user?.email || '';

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 bg-card border-r border-border flex-col z-40">
        <Sidebar />
      </aside>

      {/* Mobile App Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-card/90 backdrop-blur-xl border-b border-border/80 flex items-center justify-between px-3 z-40">
        <div className="flex items-center gap-2">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0 h-9 w-9 rounded-xl active:scale-95">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 flex flex-col">
              <SheetHeader className="sr-only">
                <SheetTitle>Menu học viên</SheetTitle>
                <SheetDescription>Bảng điều hướng học tập</SheetDescription>
              </SheetHeader>
              <Sidebar onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>
          <Link to="/learn" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-primary flex items-center justify-center shadow-xs">
              <img src="/pwa-192x192.png" alt="TNQDO" className="w-4 h-4 rounded-md object-cover" />
            </div>
            <span className="text-sm font-extrabold text-foreground">Quang Dũng Nihongo</span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/learn/notifications"
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors relative"
            title="Thông báo"
          >
            <Bell className="w-4 h-4" />
          </Link>
          <DarkModeToggle variant="compact" />
          {user && (
            <Link to="/learn/profile" className="shrink-0 ml-1">
              <AvatarWithDecoration userId={user.id} name={displayName} size="sm" />
            </Link>
          )}
        </div>
      </header>

      <div className="lg:ml-64">
        <div className="hidden lg:block">
          <TopBar />
        </div>
        <main className="p-3 pt-18 pb-24 lg:pt-0 lg:p-6 lg:pb-6">
          <div className="lg:hidden mb-0" />
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default LearningLayout;
