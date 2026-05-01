import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";
import { usePageVisibility } from "@/hooks/usePageVisibility";
import { usePageSettings } from "@/hooks/usePageSettings";
import DarkModeToggle from "@/components/theme/DarkModeToggle";

const defaultNavLinks = [
  { name: "Giới thiệu", href: "/gioi-thieu", key: "about" },
  { name: "Khóa học", href: "/khoa-hoc", key: "courses" },
  { name: "Giáo viên", href: "/giao-vien", key: "teachers" },
  { name: "Google Meet", href: "/zoom", key: "zoom" },
  { name: "Blog", href: "/blog", key: "blog" },
  { name: "Sự kiện", href: "/su-kien", key: "events" },
  { name: "Liên hệ", href: "/lien-he", key: "contact" },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { settings } = usePageVisibility();
  const { data: pageSettings } = usePageSettings();

  const navLinks = defaultNavLinks
    .filter(link => settings.navbar_items[link.key] !== false)
    .map(link => {
      const ps = pageSettings?.[link.key];
      return { ...link, name: ps?.nav_label_vi || ps?.display_name_vi || link.name };
    });

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
            <Button variant="ghost" asChild><Link to="/auth">Đăng nhập</Link></Button>
            <Button asChild><Link to="/auth">Bắt đầu miễn phí</Link></Button>
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
                <Button variant="ghost" className="w-full" asChild><Link to="/auth" onClick={() => setIsOpen(false)}>Đăng nhập</Link></Button>
                <Button className="w-full" asChild><Link to="/auth" onClick={() => setIsOpen(false)}>Bắt đầu miễn phí</Link></Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
