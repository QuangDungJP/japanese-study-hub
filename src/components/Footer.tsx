import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Phone, MapPin, Globe, Download, X, Share, MoreVertical } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import Logo from "@/components/Logo";

// Detect platform
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const isAndroid = () => /android/i.test(navigator.userAgent);

const Footer = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [installPlatform, setInstallPlatform] = useState<'ios' | 'android' | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsAppInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Show platform-specific install guide
      if (isIOS()) {
        setInstallPlatform('ios');
        setShowInstallModal(true);
      } else if (isAndroid()) {
        setInstallPlatform('android');
        setShowInstallModal(true);
      } else {
        toast.info('Trình duyệt của bạn không hỗ trợ cài đặt PWA tự động. Hãy dùng Chrome để cài đặt.');
      }
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    setDeferredPrompt(null);
  };

  const { data: footerContent } = useQuery({
    queryKey: ['footer-section-content'],
    queryFn: async () => {
      const { data } = await supabase
        .from('website_content')
        .select('content')
        .eq('section_key', 'footer')
        .maybeSingle();
      return (data?.content as Record<string, any>) || null;
    },
    staleTime: 30_000,
  });

  const brandDescription = footerContent?.brand_description || "Trung tâm đào tạo Tiếng Nhật hàng đầu. Chinh phục JLPT N5-N1 với phương pháp hiện đại và giáo viên bản ngữ.";
  const address = footerContent?.address || "123 Nguyễn Huệ, Q.1, TP.HCM";
  const phone = footerContent?.phone || "1900 1234";
  const email = footerContent?.email || "hello@tnqdo.com";
  const websiteDomain = footerContent?.website_domain || "https://www.quangdungnihongo.com/";
  const facebookUrl = footerContent?.facebook_url || "#";
  const youtubeUrl = footerContent?.youtube_url || "#";
  const instagramUrl = footerContent?.instagram_url || "#";
  const tiktokUrl = footerContent?.tiktok_url || "";
  const zaloUrl = footerContent?.zalo_url || "";
  const copyrightText = footerContent?.copyright_text || "© 2026 TNQDO. All rights reserved.";
  const customPagesLinks: { label: string; url: string }[] = Array.isArray(footerContent?.custom_links_pages) ? footerContent.custom_links_pages : [];
  const customSupportLinks: { label: string; url: string }[] = Array.isArray(footerContent?.custom_links_support) ? footerContent.custom_links_support : [];

  const renderLink = (url: string, label: string, key?: string | number) => {
    const isExternal = url.startsWith('http');
    const cls = "text-primary-foreground/70 hover:text-primary-foreground transition-colors";
    if (isExternal) {
      return <li key={key}><a href={url} target="_blank" rel="noopener noreferrer" className={cls}>{label}</a></li>;
    }
    return <li key={key}><Link to={url} className={cls}>{label}</Link></li>;
  };

  return (
    <>
    {/* PWA Install Guide Modal */}
    {showInstallModal && (
      <div
        className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={() => setShowInstallModal(false)}
      >
        <div
          className="bg-gray-900 text-white rounded-t-2xl sm:rounded-2xl w-full max-w-sm mx-auto p-6 shadow-2xl border border-white/10"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Download className="w-5 h-5 text-blue-400" />
              Cài đặt ứng dụng
            </h3>
            <button
              onClick={() => setShowInstallModal(false)}
              className="p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {installPlatform === 'ios' && (
            <div className="space-y-4 text-sm">
              <p className="text-white/70">Để cài đặt app trên iPhone/iPad, làm theo các bước sau:</p>
              <ol className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold">1</span>
                  <span>Nhấn nút <strong>Chia sẻ</strong> <span className="inline-flex items-center gap-1 bg-white/10 px-1.5 py-0.5 rounded text-xs"><Share className="w-3 h-3" /> Share</span> ở thanh dưới Safari</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold">2</span>
                  <span>Cuộn xuống và chọn <strong>"Thêm vào màn hình chính"</strong> (Add to Home Screen)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold">3</span>
                  <span>Nhấn <strong>"Thêm"</strong> ở góc trên bên phải</span>
                </li>
              </ol>
              <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-300 text-xs">
                ⚠️ Chỉ hoạt động trên trình duyệt <strong>Safari</strong> của iPhone/iPad
              </div>
            </div>
          )}

          {installPlatform === 'android' && (
            <div className="space-y-4 text-sm">
              <p className="text-white/70">Để cài đặt app trên Android, làm theo các bước sau:</p>
              <ol className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 text-white text-xs flex items-center justify-center font-bold">1</span>
                  <span>Mở trang web bằng <strong>Google Chrome</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 text-white text-xs flex items-center justify-center font-bold">2</span>
                  <span>Nhấn dấu <strong>⋮ (3 chấm)</strong> <span className="inline-flex items-center gap-1 bg-white/10 px-1.5 py-0.5 rounded text-xs"><MoreVertical className="w-3 h-3" /></span> ở góc trên bên phải</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 text-white text-xs flex items-center justify-center font-bold">3</span>
                  <span>Chọn <strong>"Thêm vào màn hình chính"</strong> hoặc <strong>"Cài đặt ứng dụng"</strong></span>
                </li>
              </ol>
              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-300 text-xs">
                💡 Nếu bạn đang dùng Samsung Internet hoặc trình duyệt khác, hãy chuyển sang <strong>Chrome</strong> để cài đặt dễ hơn
              </div>
            </div>
          )}

          <button
            onClick={() => setShowInstallModal(false)}
            className="mt-6 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 transition-colors text-sm font-semibold"
          >
            Đã hiểu
          </button>
        </div>
      </div>
    )}
    <footer className="bg-foreground text-primary-foreground py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <Logo className="flex items-center gap-2 mb-4" imgClassName="w-10 h-10 rounded-xl object-cover" />
            <p className="text-primary-foreground/70 mb-6 text-sm leading-relaxed">
              {brandDescription}
            </p>
            <div className="flex gap-3">
              {facebookUrl && facebookUrl !== '#' && (
                <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                </a>
              )}
              {youtubeUrl && youtubeUrl !== '#' && (
                <a href={youtubeUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>
                </a>
              )}
              {instagramUrl && instagramUrl !== '#' && (
                <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                </a>
              )}
              {tiktokUrl && (
                <a href={tiktokUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors" title="TikTok">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.88-2.88 2.89 2.89 0 012.88-2.88c.28 0 .56.04.82.12V9.01a6.37 6.37 0 00-.82-.05A6.34 6.34 0 003.15 15.3 6.34 6.34 0 009.49 21.64a6.34 6.34 0 006.34-6.34V8.7a8.28 8.28 0 004.84 1.55V6.8a4.84 4.84 0 01-1.08-.11z"/></svg>
                </a>
              )}
              {zaloUrl && (
                <a href={zaloUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors text-xs font-bold" title="Zalo">
                  Zalo
                </a>
              )}
            </div>
          </div>

          {/* Pages */}
          <div>
            <h4 className="font-bold text-lg mb-4">Trang</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/gioi-thieu" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">Giới thiệu</Link></li>
              <li><Link to="/khoa-hoc" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">Khóa học</Link></li>
              <li><Link to="/giao-vien" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">Giáo viên</Link></li>
              <li><Link to="/meeting" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">Học qua Meeting</Link></li>
              <li><Link to="/blog" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">Blog</Link></li>
              {customPagesLinks.filter(l => l.label && l.url).map((l, i) => renderLink(l.url, l.label, `cp-${i}`))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-bold text-lg mb-4">Hỗ trợ</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/gioi-thieu#faq" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">Hỏi & Đáp (FAQ)</Link></li>
              <li><Link to="/lien-he" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">Liên hệ</Link></li>
              <li><Link to="/chinh-sach-bao-mat" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">Chính sách bảo mật</Link></li>
              <li><Link to="/dieu-khoan" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">Điều khoản sử dụng</Link></li>
              {customSupportLinks.filter(l => l.label && l.url).map((l, i) => renderLink(l.url, l.label, `cs-${i}`))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-lg mb-4">Liên hệ</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-accent mt-0.5 shrink-0" />
                <span className="text-primary-foreground/70">{address}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-accent shrink-0" />
                <span className="text-primary-foreground/70">{phone}</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-accent shrink-0" />
                <span className="text-primary-foreground/70">{email}</span>
              </li>
              <li className="flex items-center gap-3">
                <Download className="w-5 h-5 text-accent shrink-0" />
                {isAppInstalled ? (
                  <span className="text-primary-foreground/70 truncate">Ứng dụng đã được cài đặt</span>
                ) : (
                  <button 
                    onClick={handleInstallClick} 
                    className="text-primary-foreground/70 hover:text-primary-foreground transition-colors truncate text-left disabled:opacity-50"
                  >
                    Tải app (PWA)
                  </button>
                )}
              </li>
            </ul>
          </div>
        </div>

        {/* Payment & MoIT Certification Section */}
        <div className="border-t border-white/10 mt-10 pt-8 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Payment Gateways */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-primary-foreground/80 uppercase tracking-wider">
              Chấp nhận thanh toán & Giao dịch an toàn
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/15 text-xs font-bold text-white flex items-center gap-1.5">
                <span className="text-rose-400">💳</span> Visa / Mastercard
              </div>
              <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/15 text-xs font-bold text-pink-300 flex items-center gap-1.5">
                <span>💖</span> MoMo QR
              </div>
              <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/15 text-xs font-bold text-blue-300 flex items-center gap-1.5">
                <span>🏦</span> VNPAY / VietQR
              </div>
              <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/15 text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <span>🟢</span> MB Bank / Vietcombank
              </div>
            </div>
          </div>

          {/* Ministry of Industry and Trade (Bộ Công Thương) Badge */}
          <div className="flex items-center md:justify-end gap-3">
            <div className="border border-emerald-500/40 bg-emerald-950/40 p-3 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xl font-bold border border-emerald-400/30">
                🛡️
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-extrabold text-white">ĐÃ ĐĂNG KÝ BỘ CÔNG THƯƠNG</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </div>
                <p className="text-[11px] text-emerald-200/80">Chứng nhận website thương mại điện tử & đào tạo chính thức</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-white/10 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-primary-foreground/60 text-sm">
            {copyrightText}
          </p>
          <div className="flex gap-6">
            <Link to="/chinh-sach-bao-mat" className="text-primary-foreground/60 hover:text-primary-foreground text-sm transition-colors">
              Chính Sách Bảo Mật
            </Link>
            <Link to="/dieu-khoan" className="text-primary-foreground/60 hover:text-primary-foreground text-sm transition-colors">
              Điều Khoản Dịch Vụ
            </Link>
          </div>
        </div>
      </div>
    </footer>
    </>
  );
};

export default Footer;
