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

const defaultNavLinks = [
  { name: "Giới thiệu", href: "/gioi-thieu", key: "about" },
  { name: "Khóa học", href: "/khoa-hoc", key: "courses" },
  { name: "Giáo viên", href: "/giao-vien", key: "teachers" },
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

  const navLinks = defaultNavLinks
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

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-green-200 via-teal-200 to-blue-200 shadow-md">
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
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold shadow-md">
                      {initial}
                    </div>
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

          <button className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {isOpen && (
          <div className="lg:hidden py-4 border-t border-border animate-slide-up">
            <div className="flex flex-col gap-1">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "px-4 py-3 rounded-xl text-sm font-medium transition-all",
                    location.pathname === link.href
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {link.name}
                </Link>
              ))}
              <div className="flex flex-col gap-2 pt-4 border-t border-border mt-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-sm font-medium text-muted-foreground">Chế độ hiển thị</span>
                  <DarkModeToggle variant="compact" />
                </div>
                {user ? (
                  <>
                    <div className="px-1 pb-1">
                      <p className="text-sm font-medium truncate">{displayName}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <Button variant="ghost" className="w-full justify-start" asChild>
                      <Link to="/learn/profile" onClick={() => setIsOpen(false)}>
                        <UserIcon className="w-4 h-4 mr-2" /> Hồ sơ của tôi
                      </Link>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start" asChild>
                      <Link to="/learn" onClick={() => setIsOpen(false)}>
                        <LayoutDashboard className="w-4 h-4 mr-2" /> Vào trang học
                      </Link>
                    </Button>
                    {isModeratorOrAdmin && (
                      <Button variant="ghost" className="w-full justify-start" asChild>
                        <Link to="/admin" onClick={() => setIsOpen(false)}>
                          <Settings className="w-4 h-4 mr-2" /> {isAdmin ? 'Quản trị viên' : 'Quản lý'}
                        </Link>
                      </Button>
                    )}
                    <Button variant="ghost" className="w-full justify-start text-destructive" onClick={() => { setIsOpen(false); handleSignOut(); }}>
                      <LogOut className="w-4 h-4 mr-2" /> Đăng xuất
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" className="w-full" asChild><Link to="/auth" onClick={() => setIsOpen(false)}>Đăng nhập</Link></Button>
                    <Button className="w-full" asChild><Link to="/auth" onClick={() => setIsOpen(false)}>Bắt đầu miễn phí</Link></Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
