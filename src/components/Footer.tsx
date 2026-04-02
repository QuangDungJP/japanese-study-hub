const Footer = () => (
  <footer className="bg-primary py-12">
    <div className="container mx-auto px-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-2xl font-bold font-heading text-primary-foreground">🌸 NihonGo!</h3>
          <p className="text-primary-foreground/60 text-sm mt-1">Cùng bạn chinh phục tiếng Nhật</p>
        </div>
        <div className="flex gap-8 text-sm text-primary-foreground/60">
          <a href="#" className="hover:text-sakura transition-colors">Về chúng tôi</a>
          <a href="#" className="hover:text-sakura transition-colors">Liên hệ</a>
          <a href="#" className="hover:text-sakura transition-colors">Chính sách</a>
        </div>
      </div>
      <div className="border-t border-primary-foreground/10 mt-8 pt-6 text-center text-xs text-primary-foreground/40">
        © 2026 NihonGo! — Nền tảng học tiếng Nhật cho sinh viên
      </div>
    </div>
  </footer>
);

export default Footer;
