import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="container mx-auto px-6 flex items-center justify-between h-16">
        <a href="/" className="text-xl font-bold font-heading text-foreground">🌸 NihonGo!</a>
        
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
          <a href="#jlpt" className="hover:text-foreground transition-colors">JLPT</a>
          <a href="#kana" className="hover:text-foreground transition-colors">Bảng chữ cái</a>
          <a href="#resources" className="hover:text-foreground transition-colors">Tài nguyên</a>
        </div>

        <Button size="sm" className="hidden md:flex bg-accent text-accent-foreground hover:bg-accent/90 rounded-full font-heading">
          Đăng ký miễn phí
        </Button>

        <button className="md:hidden text-foreground" onClick={() => setOpen(!open)}>
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-background border-b border-border px-6 py-4 space-y-3">
          <a href="#jlpt" className="block text-sm text-muted-foreground hover:text-foreground">JLPT</a>
          <a href="#kana" className="block text-sm text-muted-foreground hover:text-foreground">Bảng chữ cái</a>
          <a href="#resources" className="block text-sm text-muted-foreground hover:text-foreground">Tài nguyên</a>
          <Button size="sm" className="w-full bg-accent text-accent-foreground rounded-full font-heading">Đăng ký miễn phí</Button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
