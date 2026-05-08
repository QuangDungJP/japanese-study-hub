import { Facebook, Youtube, Instagram, Mail, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import Logo from "@/components/Logo";

const Footer = () => {
  return (
    <footer className="bg-foreground text-primary-foreground py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <Logo className="flex items-center gap-2 mb-4" imgClassName="w-10 h-10 rounded-xl object-cover" />
            <p className="text-primary-foreground/70 mb-6">
              Trung tâm đào tạo Tiếng Nhật hàng đầu. Chinh phục JLPT N5-N1 với phương pháp hiện đại và giáo viên bản ngữ.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Pages */}
          <div>
            <h4 className="font-bold text-lg mb-4">Trang</h4>
            <ul className="space-y-3">
              <li><Link to="/gioi-thieu" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">Giới thiệu</Link></li>
              <li><Link to="/khoa-hoc" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">Khóa học</Link></li>
              <li><Link to="/giao-vien" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">Giáo viên</Link></li>
              <li><Link to="/gioi-thieu#zoom" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">Học qua Zoom</Link></li>
              <li><Link to="/blog" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">Blog</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-bold text-lg mb-4">Hỗ trợ</h4>
            <ul className="space-y-3">
              <li><Link to="/faq" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">Hỏi & Đáp</Link></li>
              <li><Link to="/lien-he" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">Liên hệ</Link></li>
              <li><Link to="/huong-dan" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">Hướng dẫn sử dụng</Link></li>
              <li><Link to="/chinh-sach-bao-mat" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">Chính sách bảo mật</Link></li>
              <li><Link to="/dieu-khoan" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">Điều khoản sử dụng</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-lg mb-4">Liên hệ</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-accent mt-0.5" />
                <span className="text-primary-foreground/70">123 Nguyễn Huệ, Q.1, TP.HCM</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-accent" />
                <span className="text-primary-foreground/70">1900 1234</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-accent" />
                <span className="text-primary-foreground/70">hello@tnqdo.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-primary-foreground/60 text-sm">
            © 2024 TNQDO. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link to="/chinh-sach-bao-mat" className="text-primary-foreground/60 hover:text-primary-foreground text-sm transition-colors">
              Privacy Policy
            </Link>
            <Link to="/dieu-khoan" className="text-primary-foreground/60 hover:text-primary-foreground text-sm transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
