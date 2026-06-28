import { useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, LogOut, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import DarkModeToggle from '@/components/theme/DarkModeToggle';
import { useAuth } from '@/hooks/useAuth';

export interface SidebarSection {
  label: string;
  items: SidebarItem[];
  collapsible?: boolean;
  defaultOpen?: boolean;
}

export interface SidebarItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  description?: string;
}

interface SidebarModuleProps {
  sections: SidebarSection[];
  logo?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  onNavigate?: () => void;
  showDarkMode?: boolean;
  showLogout?: boolean;
  onLogout?: () => void;
  userRole?: string;
  userName?: string;
}

const SidebarContent = ({
  sections,
  logo,
  header,
  footer,
  onNavigate,
  showDarkMode = true,
  showLogout = true,
  onLogout,
  userRole,
  userName,
}: SidebarModuleProps) => {
  const location = useLocation();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    sections.forEach((s) => {
      init[s.label] = s.defaultOpen !== false;
    });
    return init;
  });

  const toggleSection = (label: string) => {
    setOpenSections((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const handleNavigate = () => {
    onNavigate?.();
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-sidebar via-sidebar to-sidebar/95">
      {/* Header Section */}
      {logo && (
        <div className="px-4 py-6 border-b border-sidebar-border/50">
          <div onClick={handleNavigate} className="cursor-pointer hover:opacity-80 transition-opacity">
            {logo}
          </div>
        </div>
      )}

      {/* Custom Header */}
      {header && (
        <div className="px-4 py-4 border-b border-sidebar-border/50">
          {header}
        </div>
      )}

      {/* User Info Card */}
      {(userName || userRole) && (
        <div className="mx-4 mt-4 p-4 rounded-2xl bg-sidebar-primary/10 border border-sidebar-primary/20 backdrop-blur-sm">
          {userName && (
            <p className="text-sm font-semibold text-sidebar-foreground truncate">
              {userName}
            </p>
          )}
          {userRole && (
            <p className="text-xs text-sidebar-foreground/60 mt-1">
              {userRole === 'admin'
                ? '👑 Quản trị viên'
                : userRole === 'moderator'
                ? '🔧 Kiểm duyệt viên'
                : userRole === 'teacher'
                ? '👨‍🏫 Giáo viên'
                : userRole === 'senior_teacher'
                ? '⭐ Giáo viên cao cấp'
                : '📚 Học viên'}
            </p>
          )}
        </div>
      )}

      {/* Navigation Sections */}
      <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-2 scrollbar-hide">
        {sections.map((section, sectionIdx) => (
          <div key={`${section.label}-${sectionIdx}`} className="space-y-1">
            {section.collapsible ? (
              <Collapsible
                open={openSections[section.label]}
                onOpenChange={() => toggleSection(section.label)}
              >
                <CollapsibleTrigger asChild>
                  <button
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider',
                      'text-sidebar-foreground/60 hover:text-sidebar-foreground/80',
                      'hover:bg-sidebar-primary/10 transition-colors duration-200',
                      openSections[section.label] && 'text-sidebar-primary'
                    )}
                  >
                    <span>{section.label}</span>
                    <ChevronDown
                      className={cn(
                        'w-4 h-4 transition-transform duration-200',
                        openSections[section.label] && 'rotate-180'
                      )}
                    />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1 mt-1">
                  {section.items.map((item) => {
                    const isActive =
                      location.pathname === item.href ||
                      location.pathname.startsWith(item.href + '/');
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        onClick={handleNavigate}
                        className={cn(
                          'group relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium',
                          'transition-all duration-200 overflow-hidden',
                          isActive
                            ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md scale-98'
                            : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-primary/5'
                        )}
                      >
                        <div
                          className={cn(
                            'w-5 h-5 flex items-center justify-center transition-transform duration-200',
                            'group-hover:scale-110'
                          )}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="flex-1">{item.name}</span>
                        {item.badge && (
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-full text-xs font-bold',
                              isActive
                                ? 'bg-sidebar-primary-foreground/20 text-sidebar-primary-foreground'
                                : 'bg-sidebar-primary/20 text-sidebar-primary'
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                        {isActive && (
                          <div className="absolute left-0 top-0 h-full w-1 bg-sidebar-primary-foreground rounded-r-full" />
                        )}
                      </Link>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            ) : (
              <>
                {section.label && (
                  <h3
                    className={cn(
                      'px-3 py-2 text-xs font-semibold uppercase tracking-wider',
                      'text-sidebar-foreground/50'
                    )}
                  >
                    {section.label}
                  </h3>
                )}
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive =
                      location.pathname === item.href ||
                      location.pathname.startsWith(item.href + '/');
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        onClick={handleNavigate}
                        className={cn(
                          'group relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium',
                          'transition-all duration-200 overflow-hidden',
                          isActive
                            ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md'
                            : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-primary/5'
                        )}
                        title={item.description}
                      >
                        <div
                          className={cn(
                            'w-5 h-5 flex items-center justify-center transition-transform duration-200',
                            'group-hover:scale-110'
                          )}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="flex-1">{item.name}</span>
                        {item.badge && (
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-full text-xs font-bold',
                              isActive
                                ? 'bg-sidebar-primary-foreground/20 text-sidebar-primary-foreground'
                                : 'bg-sidebar-primary/20 text-sidebar-primary'
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                        {isActive && (
                          <div className="absolute left-0 top-0 h-full w-1 bg-sidebar-primary-foreground rounded-r-full" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        ))}
      </nav>

      {/* Footer Section */}
      <div className="border-t border-sidebar-border/50 p-4 space-y-3">
        {footer && <div>{footer}</div>}

        <div className="flex items-center justify-between gap-2 pt-2">
          {showDarkMode && <DarkModeToggle variant="compact" />}
          {showLogout && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="w-full flex items-center gap-2 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-primary/10"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-xs font-medium">Đăng xuất</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

const SidebarModule = (props: SidebarModuleProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavigate = () => {
    setMobileOpen(false);
    props.onNavigate?.();
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-sidebar h-screen border-r border-sidebar-border sticky top-0 z-40 overflow-hidden">
        <SidebarContent {...props} onNavigate={handleNavigate} />
      </aside>

      {/* Mobile Sidebar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b border-border h-16 flex items-center px-4 gap-2">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <SidebarContent {...props} onNavigate={handleNavigate} />
          </SheetContent>
        </Sheet>

        <div className="flex-1">
          {props.header && <div className="text-sm font-semibold">{props.header}</div>}
        </div>
      </div>

      {/* Mobile Content Offset */}
      <div className="lg:hidden h-16" />
    </>
  );
};

export default SidebarModule;
export { SidebarContent };
