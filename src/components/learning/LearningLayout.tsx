import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import DarkModeToggle from '@/components/theme/DarkModeToggle';

const LearningLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 bg-card border-r border-border flex-col z-40">
        <Sidebar />
      </aside>

      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-card border-b border-border flex items-center px-4 z-40">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 flex flex-col">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2 ml-2">
          <div className="w-7 h-7 rounded-md bg-gradient-primary flex items-center justify-center">
            <img src="/logo.jpg" alt="TNQDO" className="w-4 h-4 rounded-md object-cover" />
          </div>
          <span className="text-sm font-bold text-foreground">TNQDO Learn</span>
        </div>
        <div className="ml-auto">
          <DarkModeToggle variant="compact" />
        </div>
      </header>

      <div className="lg:ml-64">
        <div className="hidden lg:block">
          <TopBar />
        </div>
        <main className="p-4 pt-18 lg:pt-0 lg:p-6">
          <div className="lg:hidden mb-0" />
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default LearningLayout;
