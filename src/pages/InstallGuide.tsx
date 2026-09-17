import { Monitor, Smartphone, Apple, Share2, MoreVertical, PlusSquare, ArrowLeft, Download, CheckCircle2, ChevronRight, Wifi, Zap, Shield, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useEffect, useState } from "react";

// Detect user platform for auto-tab selection
const detectPlatform = (): 'ios' | 'android' | 'pc' => {
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
  if (/android/i.test(ua)) return 'android';
  return 'pc';
};

// Step Card Component
const StepCard = ({
  step,
  icon,
  title,
  description,
}: {
  step: number;
  icon: React.ReactNode;
  title: string;
  description: React.ReactNode;
}) => (
  <div className="group relative flex gap-4 md:gap-6 p-5 md:p-6 rounded-2xl bg-card border border-border hover:border-primary/50 hover:bg-muted/50 transition-all duration-300 shadow-sm">
    <div className="flex flex-col items-center gap-2 flex-shrink-0">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-bold text-lg shadow-lg shadow-primary/30">
        {step}
      </div>
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-primary">{icon}</span>
        <h3 className="font-semibold text-foreground text-base md:text-lg">{title}</h3>
      </div>
      <div className="text-muted-foreground text-sm md:text-base leading-relaxed">{description}</div>
    </div>
  </div>
);

// Phone Mockup Component
const PhoneMockup = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`relative mx-auto w-[200px] md:w-[240px] ${className}`}>
    <div className="relative bg-gray-900 rounded-[2.5rem] p-2.5 shadow-2xl border-2 border-gray-700 ring-4 ring-black/20">
      <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-20 h-5 bg-black rounded-full z-10" />
      <div className="relative bg-gray-950 rounded-[2rem] overflow-hidden aspect-[9/19]">
        {children}
      </div>
      <div className="flex justify-center mt-2">
        <div className="w-20 h-1 bg-gray-600 rounded-full" />
      </div>
    </div>
  </div>
);

// Desktop Mockup Component
const DesktopMockup = ({ children }: { children: React.ReactNode }) => (
  <div className="relative mx-auto w-full max-w-md">
    <div className="bg-gray-800 rounded-xl overflow-hidden shadow-2xl border border-gray-600">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-700 border-b border-gray-600">
        <div className="w-3 h-3 rounded-full bg-red-400" />
        <div className="w-3 h-3 rounded-full bg-yellow-400" />
        <div className="w-3 h-3 rounded-full bg-green-400" />
        <div className="flex-1 mx-3 bg-gray-600 rounded-full h-5 flex items-center px-3">
          <span className="text-gray-300 text-xs truncate">https://quangdungnihongo.com</span>
        </div>
        <div className="flex items-center gap-1 text-blue-400">
          <Download className="w-4 h-4" />
        </div>
      </div>
      <div className="bg-gray-900 p-3">
        {children}
      </div>
    </div>
  </div>
);

// iOS Visual mockup screens
const IOSShareScreen = () => (
  <PhoneMockup>
    <div className="h-full flex flex-col bg-gray-950 text-white text-[10px]">
      <div className="flex justify-between px-4 pt-7 pb-1 text-[9px] text-gray-400">
        <span>9:41</span>
        <span>●●●</span>
      </div>
      <div className="flex items-center gap-1 px-2 py-1.5 bg-gray-800 mx-2 rounded-lg">
        <div className="flex-1 bg-gray-700 rounded h-4 flex items-center px-2">
          <span className="text-gray-400 text-[8px] truncate">quangdungnihongo.com</span>
        </div>
      </div>
      <div className="flex-1 bg-[#0f0f1e] mx-2 my-1 rounded-lg overflow-hidden">
        <div className="p-2 space-y-1.5">
          <img src="/pwa-192x192.png" alt="Logo" className="w-8 h-8 rounded-full mx-auto" />
          <div className="h-2 bg-muted-foreground/20 rounded mx-4" />
          <div className="h-1.5 bg-muted-foreground/10 rounded mx-6" />
          <div className="grid grid-cols-2 gap-1 mt-2">
            <div className="h-8 bg-blue-500/20 rounded" />
            <div className="h-8 bg-indigo-500/20 rounded" />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-around px-4 py-2 bg-gray-800 mx-2 mb-2 rounded-xl">
        <div className="text-gray-500 text-[8px] flex flex-col items-center gap-0.5">
          <div className="w-3 h-3 border border-gray-500 rounded-sm" />
          <span>←</span>
        </div>
        <div className="text-gray-500 text-[8px] flex flex-col items-center gap-0.5">
          <div className="w-3 h-3 border border-gray-500 rounded-sm" />
          <span>→</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 animate-pulse">
          <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center">
            <Share2 className="w-2.5 h-2.5 text-white" />
          </div>
          <span className="text-blue-400 text-[7px] font-bold">Share</span>
        </div>
        <div className="text-gray-500 text-[8px] flex flex-col items-center gap-0.5">
          <div className="w-3 h-3 border border-gray-500 rounded-sm" />
          <span>⊡</span>
        </div>
        <div className="text-gray-500 text-[8px] flex flex-col items-center gap-0.5">
          <div className="w-3 h-3 border border-gray-500 rounded-sm" />
          <span>≡</span>
        </div>
      </div>
    </div>
  </PhoneMockup>
);

const IOSAddScreen = () => (
  <PhoneMockup>
    <div className="h-full flex flex-col bg-gray-950 text-white">
      <div className="flex-1 bg-black/40" />
      <div className="bg-gray-800 rounded-t-2xl p-3">
        <div className="w-8 h-0.5 bg-gray-500 rounded-full mx-auto mb-3" />
        <p className="text-white text-[9px] font-medium mb-2 px-1">quangdungnihongo.com</p>
        <div className="grid grid-cols-4 gap-2 mb-3">
          {['AirDrop','Message','Mail','Note'].map((l) => (
            <div key={l} className="flex flex-col items-center gap-1">
              <div className="w-9 h-9 rounded-xl bg-gray-700 flex items-center justify-center">
                <div className="w-4 h-4 bg-gray-500 rounded" />
              </div>
              <span className="text-[7px] text-gray-400">{l}</span>
            </div>
          ))}
        </div>
        <div className="space-y-0.5">
          <div className="flex items-center gap-2.5 p-2 bg-blue-500/20 border border-blue-400/40 rounded-xl animate-pulse">
            <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <PlusSquare className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <p className="text-[9px] font-semibold text-blue-300">Add to Home Screen</p>
              <p className="text-[7px] text-gray-400">Thêm vào MH chính</p>
            </div>
          </div>
          {['Copy','Find on Page','Print'].map((l) => (
            <div key={l} className="flex items-center gap-2.5 p-1.5">
              <div className="w-6 h-6 bg-gray-700 rounded-md flex-shrink-0" />
              <span className="text-[8px] text-gray-300">{l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </PhoneMockup>
);

const IOSConfirmScreen = () => (
  <PhoneMockup>
    <div className="h-full flex flex-col bg-gray-950 text-white">
      <div className="flex items-center justify-between px-3 pt-7 pb-2 bg-gray-800">
        <span className="text-blue-400 text-[9px]">Huỷ</span>
        <span className="text-white text-[10px] font-semibold">Thêm vào MH chính</span>
        <span className="text-blue-400 text-[9px] font-bold animate-pulse">Thêm ✓</span>
      </div>
      <div className="flex-1 bg-gray-900 p-4 flex flex-col items-center">
        <img src="/pwa-192x192.png" alt="Logo" className="mt-4 w-14 h-14 rounded-2xl shadow-lg" />
        <p className="text-white text-[11px] font-medium mt-2">Quang Dũng Nihongo</p>
        <p className="text-gray-400 text-[9px] mt-0.5">quangdungnihongo.com</p>
        <div className="mt-4 w-full p-3 bg-gray-800 rounded-xl">
          <div className="flex items-center gap-2">
            <img src="/pwa-192x192.png" alt="Logo" className="w-6 h-6 rounded-lg" />
            <div className="flex-1">
              <p className="text-[9px] text-white">Quang Dũng Nihongo</p>
              <p className="text-[8px] text-gray-400">quangdungnihongo.com</p>
            </div>
          </div>
        </div>
        <p className="text-gray-400 text-[8px] text-center mt-3 leading-relaxed">
          Ứng dụng sẽ được thêm vào màn hình chính để truy cập dễ dàng.
        </p>
      </div>
    </div>
  </PhoneMockup>
);

const AndroidMenuScreen = () => (
  <PhoneMockup>
    <div className="h-full flex flex-col bg-gray-950">
      <div className="flex justify-between px-3 pt-7 pb-1">
        <span className="text-gray-400 text-[9px]">9:41</span>
        <span className="text-gray-400 text-[9px]">●●● 📶</span>
      </div>
      <div className="flex items-center gap-1.5 px-2 py-1.5 bg-gray-800">
        <div className="flex-1 bg-gray-700 rounded-full h-5 flex items-center px-2">
          <span className="text-gray-400 text-[8px]">🔒 quangdungnihongo.com</span>
        </div>
        <div className="w-6 h-6 bg-blue-500/20 border border-blue-400/60 rounded flex items-center justify-center animate-pulse">
          <MoreVertical className="w-3 h-3 text-blue-400" />
        </div>
      </div>
      <div className="flex-1 bg-[#0f0f1e] p-2 space-y-1">
        <img src="/pwa-192x192.png" alt="Logo" className="w-8 h-8 rounded-full mx-auto mt-1 shadow-sm" />
        <div className="h-2 bg-white/20 rounded mx-4" />
        <div className="h-1.5 bg-white/10 rounded mx-6" />
      </div>
    </div>
  </PhoneMockup>
);

const AndroidInstallScreen = () => (
  <PhoneMockup>
    <div className="h-full flex flex-col bg-gray-950 relative">
      <div className="flex justify-between px-3 pt-7 pb-1">
        <span className="text-gray-400 text-[9px]">9:41</span>
        <span className="text-gray-400 text-[9px]">●●● 📶</span>
      </div>
      <div className="flex items-center gap-1.5 px-2 py-1.5 bg-gray-800">
        <div className="flex-1 bg-gray-700 rounded-full h-5" />
        <MoreVertical className="w-3 h-3 text-gray-400" />
      </div>
      <div className="absolute top-[52px] right-2 w-[130px] bg-gray-700 rounded-xl shadow-xl border border-gray-600 z-10 overflow-hidden">
        {['Thẻ mới','Duyệt riêng tư','Lịch sử'].map((l) => (
          <div key={l} className="px-3 py-1.5 text-[9px] text-gray-300 border-b border-gray-600">{l}</div>
        ))}
        <div className="px-3 py-2 bg-green-500/20 border border-green-400/40 animate-pulse">
          <div className="flex items-center gap-1.5">
            <Download className="w-3 h-3 text-green-400" />
            <span className="text-[9px] font-semibold text-green-300">Cài đặt ứng dụng</span>
          </div>
        </div>
        {['Chia sẻ','Tìm trên trang'].map((l) => (
          <div key={l} className="px-3 py-1.5 text-[9px] text-gray-300">{l}</div>
        ))}
      </div>
      <div className="flex-1 bg-[#0f0f1e] p-2" />
    </div>
  </PhoneMockup>
);

const AndroidConfirmScreen = () => (
  <PhoneMockup>
    <div className="h-full flex flex-col bg-gray-950">
      <div className="flex justify-between px-3 pt-7 pb-1">
        <span className="text-gray-400 text-[9px]">9:41</span>
        <span className="text-gray-400 text-[9px]">●●● 📶</span>
      </div>
      <div className="flex-1 bg-[#0f0f1e] relative">
        <div className="absolute bottom-0 left-0 right-0 bg-gray-800 rounded-t-2xl p-4 border-t border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <img src="/pwa-192x192.png" alt="Logo" className="w-10 h-10 rounded-xl shadow-md" />
            <div>
              <p className="text-white text-[11px] font-semibold">Cài đặt ứng dụng?</p>
              <p className="text-gray-400 text-[9px]">Quang Dũng Nihongo</p>
            </div>
          </div>
          <p className="text-gray-400 text-[9px] mb-3 leading-relaxed">
            Ứng dụng sẽ được thêm vào màn hình chính và hoạt động như ứng dụng gốc.
          </p>
          <div className="flex gap-2">
            <button className="flex-1 py-1.5 rounded-lg bg-gray-700 text-gray-300 text-[9px]">Huỷ</button>
            <button className="flex-1 py-1.5 rounded-lg bg-blue-600 text-white text-[9px] font-semibold animate-pulse">Cài đặt ✓</button>
          </div>
        </div>
      </div>
    </div>
  </PhoneMockup>
);

const PCInstallScreen = () => (
  <DesktopMockup>
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 bg-gray-800 rounded-lg px-2 py-1.5 border border-blue-500/40">
        <div className="flex-1 text-gray-400 text-xs">https://quangdungnihongo.com</div>
        <div className="flex items-center gap-1 bg-blue-500/20 border border-blue-400/60 rounded px-1.5 py-0.5 animate-pulse">
          <Download className="w-3 h-3 text-blue-400" />
          <span className="text-blue-300 text-[10px] font-medium">Cài đặt</span>
        </div>
        <Star className="w-3 h-3 text-gray-500" />
      </div>
      <div className="bg-gray-700 rounded-xl p-3 border border-gray-600 shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <img src="/pwa-192x192.png" alt="Logo" className="w-8 h-8 rounded-xl shadow-md" />
          <div>
            <p className="text-white text-xs font-semibold">Cài đặt Quang Dũng Nihongo</p>
            <p className="text-gray-400 text-[10px]">quangdungnihongo.com</p>
          </div>
        </div>
        <p className="text-gray-300 text-[10px] mb-2 leading-relaxed">
          Trang web này có thể được cài đặt như một ứng dụng để truy cập dễ dàng hơn.
        </p>
        <div className="flex gap-1.5">
          <button className="flex-1 py-1 rounded-lg bg-gray-600 text-gray-300 text-[10px]">Không phải bây giờ</button>
          <button className="flex-1 py-1 rounded-lg bg-blue-600 text-white text-[10px] font-semibold">Cài đặt</button>
        </div>
      </div>
    </div>
  </DesktopMockup>
);

const InstallGuide = () => {
  const [activeTab, setActiveTab] = useState<string>('ios');
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    setActiveTab(detectPlatform());

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handlePrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const handleInstalled = () => setIsInstalled(true);

    window.addEventListener('beforeinstallprompt', handlePrompt);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handlePrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const handleInstallNow = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setIsInstalled(true);
      setDeferredPrompt(null);
    }
  };

  const benefits = [
    { icon: <Zap className="w-5 h-5" />, title: 'Tốc độ siêu nhanh', desc: 'Khởi động tức thì, không cần đợi tải trang', color: 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30 text-yellow-400' },
    { icon: <Wifi className="w-5 h-5" />, title: 'Hoạt động offline', desc: 'Học bài kể cả khi mất mạng internet', color: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-400' },
    { icon: <Shield className="w-5 h-5" />, title: 'An toàn & bảo mật', desc: 'Dữ liệu được mã hóa, bảo vệ tài khoản', color: 'from-green-500/20 to-emerald-500/20 border-green-500/30 text-green-400' },
    { icon: <Star className="w-5 h-5" />, title: 'Trải nghiệm như app gốc', desc: 'Toàn màn hình, không thanh địa chỉ', color: 'from-purple-500/20 to-violet-500/20 border-purple-500/30 text-purple-400' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-16 px-4">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-10 w-64 h-64 bg-purple-600/8 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto max-w-5xl relative">
          <Link
            to="/"
            className="inline-flex items-center text-sm text-white/50 hover:text-white transition-colors mb-8 group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Trở về trang chủ
          </Link>

          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 text-blue-300 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <Download className="w-4 h-4" />
              Ứng dụng PWA miễn phí — Không cần App Store
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-5 leading-tight">
              Tải ứng dụng{' '}
              <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Quang Dũng Nihongo
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Cài đặt ứng dụng miễn phí ngay trên thiết bị của bạn — không cần App Store hay Google Play. Nhanh, gọn, dễ dàng trên mọi thiết bị.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
              {isInstalled ? (
                <div className="flex items-center gap-2 bg-green-500/20 border border-green-500/40 text-green-300 px-6 py-3 rounded-2xl font-semibold">
                  <CheckCircle2 className="w-5 h-5" />
                  Ứng dụng đã được cài đặt thành công!
                </div>
              ) : deferredPrompt ? (
                <button
                  onClick={handleInstallNow}
                  className="group flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-xl shadow-blue-500/30 transition-all duration-300 hover:scale-105"
                >
                  <Download className="w-5 h-5 group-hover:animate-bounce" />
                  Cài đặt ngay (1 bấm)
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <p className="flex items-center gap-2 text-white/40 text-sm">
                  <Download className="w-4 h-4" />
                  Xem hướng dẫn bên dưới để cài đặt thủ công theo từng thiết bị
                </p>
              )}
            </div>
          </div>

          {/* Benefits grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
            {benefits.map((b, i) => (
              <div key={i} className={`bg-gradient-to-br ${b.color} border rounded-2xl p-4 text-center hover:scale-105 transition-all duration-300`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3 ${b.color}`}>
                  {b.icon}
                </div>
                <p className="text-white font-semibold text-sm mb-1">{b.title}</p>
                <p className="text-white/50 text-xs leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Installation Guide Tabs */}
      <section className="flex-1 px-4 pb-20">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">Hướng dẫn cài đặt chi tiết</h2>
            <p className="text-muted-foreground">Chọn thiết bị của bạn để xem hướng dẫn phù hợp — tự động nhận diện thiết bị của bạn</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-10 h-14 bg-muted/50 border border-border rounded-2xl p-1.5 gap-1">
              <TabsTrigger
                value="ios"
                className="flex items-center gap-2 h-full rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-white/60 transition-all"
              >
                <Apple className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                <span className="hidden sm:inline font-medium">iPhone / iPad</span>
                <span className="sm:hidden font-medium">iOS</span>
              </TabsTrigger>
              <TabsTrigger
                value="android"
                className="flex items-center gap-2 h-full rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-white/60 transition-all"
              >
                <Smartphone className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                <span className="font-medium">Android</span>
              </TabsTrigger>
              <TabsTrigger
                value="pc"
                className="flex items-center gap-2 h-full rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-foreground/60 transition-all"
              >
                <Monitor className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                <span className="hidden sm:inline font-medium">Máy tính</span>
                <span className="sm:hidden font-medium">PC/Mac</span>
              </TabsTrigger>
            </TabsList>

            {/* === iOS Tab === */}
            <TabsContent value="ios" className="mt-0">
              <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-2xl flex items-start gap-3">
                <Apple className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-blue-700 dark:text-blue-300 font-semibold text-sm mb-1">Dành cho iPhone & iPad (iOS Safari)</p>
                  <p className="text-blue-600 dark:text-blue-200/80 text-sm">
                    Yêu cầu trình duyệt <strong className="text-blue-700 dark:text-blue-200">Safari</strong>.
                    Nếu đang dùng Chrome/Firefox trên iOS, hãy sao chép URL và dán vào Safari.
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-4">
                  <StepCard
                    step={1}
                    icon={<Share2 className="w-4 h-4" />}
                    title="Nhấn nút Chia sẻ (Share)"
                    description={
                      <span>
                        Mở trang <strong className="text-foreground">quangdungnihongo.com</strong> bằng Safari.
                        Nhấn vào biểu tượng{' '}
                        <span className="inline-flex items-center gap-1 bg-blue-500/20 border border-blue-400/30 px-2 py-0.5 rounded-lg mx-1 text-blue-700 dark:text-blue-300">
                          <Share2 className="w-3 h-3" /> Share
                        </span>{' '}
                        ở <strong className="text-foreground">thanh công cụ phía dưới cùng</strong> của Safari.
                      </span>
                    }
                  />
                  <StepCard
                    step={2}
                    icon={<PlusSquare className="w-4 h-4" />}
                    title="Chọn &quot;Thêm vào Màn hình chính&quot;"
                    description={
                      <span>
                        Bảng tùy chọn xuất hiện từ dưới lên. Cuộn xuống và nhấn{' '}
                        <strong className="text-foreground">「Add to Home Screen」</strong>{' '}
                        (Thêm vào Màn hình chính).
                      </span>
                    }
                  />
                  <StepCard
                    step={3}
                    icon={<CheckCircle2 className="w-4 h-4" />}
                    title="Xác nhận và hoàn tất"
                    description={
                      <span>
                        Đổi tên ứng dụng nếu muốn, sau đó nhấn{' '}
                        <strong className="text-foreground">「Thêm」(Add)</strong>{' '}
                        ở góc trên bên phải. Icon ứng dụng xuất hiện ngay trên màn hình chính!
                      </span>
                    }
                  />
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl flex items-start gap-3">
                    <span className="text-xl flex-shrink-0">💡</span>
                    <div>
                      <p className="text-yellow-700 dark:text-yellow-300 font-semibold text-sm mb-1">Sau khi cài đặt</p>
                      <p className="text-yellow-600 dark:text-yellow-200/80 text-sm">Ứng dụng sẽ mở toàn màn hình như app gốc, không có thanh địa chỉ Safari. Hoạt động offline cho các bài đã học!</p>
                    </div>
                  </div>
                </div>

                {/* Visual mockups */}
                <div className="flex flex-row md:flex-col items-start justify-center gap-8 overflow-x-auto md:overflow-visible pb-4 md:pb-0">
                  <div className="flex flex-col items-center gap-2 flex-shrink-0">
                    <IOSShareScreen />
                    <p className="text-white/40 text-xs text-center">Bước 1: Nhấn nút Share ↑</p>
                  </div>
                  <div className="flex flex-col items-center gap-2 flex-shrink-0">
                    <IOSAddScreen />
                    <p className="text-white/40 text-xs text-center">Bước 2: Add to Home Screen</p>
                  </div>
                  <div className="flex flex-col items-center gap-2 flex-shrink-0">
                    <IOSConfirmScreen />
                    <p className="text-white/40 text-xs text-center">Bước 3: Nhấn "Thêm"</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* === Android Tab === */}
            <TabsContent value="android" className="mt-0">
              <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-2xl flex items-start gap-3">
                <Smartphone className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-green-700 dark:text-green-300 font-semibold text-sm mb-1">Dành cho điện thoại & máy tính bảng Android</p>
                  <p className="text-green-600 dark:text-green-200/80 text-sm">
                    Hoạt động tốt nhất với <strong className="text-green-700 dark:text-green-200">Google Chrome</strong>.
                    Samsung Internet và các trình duyệt khác cũng hỗ trợ với các bước tương tự.
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-4">
                  <StepCard
                    step={1}
                    icon={<MoreVertical className="w-4 h-4" />}
                    title="Nhấn menu 3 chấm dọc (⋮)"
                    description={
                      <span>
                        Mở <strong className="text-foreground">Chrome</strong> và vào trang web. Nhấn vào biểu tượng{' '}
                        <span className="inline-flex items-center gap-1 bg-green-500/20 border border-green-400/30 px-2 py-0.5 rounded-lg mx-1 text-green-700 dark:text-green-300">
                          <MoreVertical className="w-3 h-3" /> Menu
                        </span>{' '}
                        ở <strong className="text-foreground">góc trên bên phải</strong> màn hình.
                      </span>
                    }
                  />
                  <StepCard
                    step={2}
                    icon={<Download className="w-4 h-4" />}
                    title="Chọn &quot;Cài đặt ứng dụng&quot;"
                    description={
                      <span>
                        Trong menu xổ xuống, tìm và nhấn{' '}
                        <strong className="text-foreground">「Cài đặt ứng dụng」</strong> hoặc{' '}
                        <strong className="text-foreground">「Thêm vào màn hình chính」</strong>.
                        Tùy phiên bản Chrome tên có thể khác nhau.
                      </span>
                    }
                  />
                  <StepCard
                    step={3}
                    icon={<CheckCircle2 className="w-4 h-4" />}
                    title="Xác nhận cài đặt"
                    description={
                      <span>
                        Bảng thông báo hiện lên từ dưới màn hình. Nhấn{' '}
                        <strong className="text-foreground">「Cài đặt」</strong>{' '}
                        để hoàn tất. Ứng dụng xuất hiện ngay trên màn hình chính!
                      </span>
                    }
                  />
                  <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-2xl flex items-start gap-3">
                    <span className="text-xl flex-shrink-0">🤖</span>
                    <div>
                      <p className="text-green-700 dark:text-green-300 font-semibold text-sm mb-1">Chrome tự động gợi ý</p>
                      <p className="text-green-600 dark:text-green-200/80 text-sm">
                        Nếu bạn thường xuyên truy cập, Chrome sẽ tự động hiện banner{' '}
                        <strong className="text-green-700 dark:text-green-200">「Thêm vào màn hình chính」</strong>{' '}
                        ở dưới màn hình — nhấn để cài ngay!
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-row md:flex-col items-start justify-center gap-8 overflow-x-auto md:overflow-visible pb-4 md:pb-0">
                  <div className="flex flex-col items-center gap-2 flex-shrink-0">
                    <AndroidMenuScreen />
                    <p className="text-white/40 text-xs text-center">Bước 1: Menu (⋮) góc phải</p>
                  </div>
                  <div className="flex flex-col items-center gap-2 flex-shrink-0">
                    <AndroidInstallScreen />
                    <p className="text-white/40 text-xs text-center">Bước 2: Cài đặt ứng dụng</p>
                  </div>
                  <div className="flex flex-col items-center gap-2 flex-shrink-0">
                    <AndroidConfirmScreen />
                    <p className="text-white/40 text-xs text-center">Bước 3: Nhấn "Cài đặt"</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* === PC Tab === */}
            <TabsContent value="pc" className="mt-0">
              <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-2xl flex items-start gap-3">
                <Monitor className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-purple-700 dark:text-purple-300 font-semibold text-sm mb-1">Dành cho máy tính PC & Mac</p>
                  <p className="text-purple-600 dark:text-purple-200/80 text-sm">
                    Hỗ trợ trên <strong className="text-purple-700 dark:text-purple-200">Chrome, Edge, Cốc Cốc, Brave</strong>.
                    Safari macOS cũng hỗ trợ từ phiên bản 17+.
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <StepCard
                    step={1}
                    icon={<Download className="w-4 h-4" />}
                    title="Tìm biểu tượng cài đặt trên thanh địa chỉ"
                    description={
                      <span>
                        Mở Chrome và vào trang web. Nhìn vào{' '}
                        <strong className="text-foreground">thanh địa chỉ (URL bar)</strong> — bên phải sẽ có biểu tượng{' '}
                        <span className="inline-flex items-center gap-1 bg-purple-500/20 border border-purple-400/30 px-2 py-0.5 rounded-lg mx-1 text-purple-700 dark:text-purple-300">
                          <Download className="w-3 h-3" /> Cài đặt
                        </span>.
                      </span>
                    }
                  />
                  <StepCard
                    step={2}
                    icon={<PlusSquare className="w-4 h-4" />}
                    title="Nhấn &quot;Cài đặt&quot; trong popup"
                    description={
                      <span>
                        Nhấn vào biểu tượng đó. Popup nhỏ hiện lên —
                        nhấn <strong className="text-foreground">「Cài đặt」</strong> để tiếp tục.
                      </span>
                    }
                  />
                  <StepCard
                    step={3}
                    icon={<CheckCircle2 className="w-4 h-4" />}
                    title="Ứng dụng mở như phần mềm độc lập"
                    description={
                      <span>
                        Ứng dụng mở trong cửa sổ riêng, không có thanh địa chỉ trình duyệt.
                        Shortcut cũng được tạo trên <strong className="text-foreground">Desktop và Start Menu</strong>!
                      </span>
                    }
                  />
                  <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-2xl">
                    <p className="text-purple-700 dark:text-purple-300 font-semibold text-sm mb-2">🔄 Không thấy biểu tượng? Dùng menu:</p>
                    <ol className="text-purple-600 dark:text-purple-200/80 text-sm space-y-1.5">
                      <li className="flex gap-2"><span className="text-purple-700 dark:text-purple-400 font-bold flex-shrink-0">1.</span>Nhấn menu <strong className="text-purple-700 dark:text-purple-200">⋮ (3 chấm)</strong> góc phải</li>
                      <li className="flex gap-2"><span className="text-purple-700 dark:text-purple-400 font-bold flex-shrink-0">2.</span>Chọn <strong className="text-purple-700 dark:text-purple-200">「Truyền, lưu và chia sẻ」</strong></li>
                      <li className="flex gap-2"><span className="text-purple-700 dark:text-purple-400 font-bold flex-shrink-0">3.</span>Chọn <strong className="text-purple-700 dark:text-purple-200">「Cài đặt trang này như ứng dụng」</strong></li>
                    </ol>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center gap-6">
                  <div className="flex flex-col items-center gap-3 w-full">
                    <PCInstallScreen />
                    <p className="text-muted-foreground text-xs text-center">Nhấn biểu tượng tải xuống trong thanh địa chỉ Chrome</p>
                  </div>
                  <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-5 text-center shadow-md">
                    <img src="/pwa-192x192.png" alt="Logo" className="w-16 h-16 rounded-2xl mx-auto mb-3 shadow-lg" />
                    <p className="text-foreground font-semibold">Quang Dũng Nihongo</p>
                    <p className="text-muted-foreground text-sm mt-1">Ứng dụng Desktop độc lập</p>
                    <div className="mt-3 flex items-center justify-center gap-2 text-green-400 text-sm">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Sẵn sàng sử dụng!</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* FAQ Section */}
          <div className="mt-16 border-t border-border pt-12">
            <h2 className="text-2xl font-bold text-foreground text-center mb-8">Câu hỏi thường gặp</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { q: 'PWA có tốn dung lượng không?', a: 'Rất nhẹ! Chỉ khoảng 1-5MB so với hàng chục MB của app gốc trên App Store/Play Store.' },
                { q: 'Có cần tài khoản để cài không?', a: 'Không. Bạn cài đặt ứng dụng trước, sau đó đăng nhập tài khoản học như bình thường.' },
                { q: 'Có thể gỡ cài đặt không?', a: 'Có. Nhấn giữ icon trên màn hình chính rồi chọn "Xoá" hoặc "Gỡ cài đặt" như mọi ứng dụng khác.' },
                { q: 'Dữ liệu học có bị mất khi cài lại không?', a: 'Không. Tất cả dữ liệu được lưu trên cloud. Cài đặt hay xoá app đều không ảnh hưởng đến tài khoản của bạn.' },
                { q: 'PWA có nhận thông báo push không?', a: 'Có trên Android Chrome và Desktop. iOS Safari cũng đã hỗ trợ từ phiên bản 16.4 trở lên.' },
                { q: 'Có thể cài trên nhiều thiết bị không?', a: 'Hoàn toàn có thể! Cài trên điện thoại, máy tính bảng và máy tính — tài khoản đồng bộ trên tất cả thiết bị.' },
              ].map((faq, i) => (
                <div key={i} className="bg-card border border-border rounded-2xl p-5 hover:bg-muted/50 hover:border-primary/30 transition-all duration-300 shadow-sm">
                  <p className="text-foreground font-semibold mb-2 flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5 flex-shrink-0 font-bold">Q.</span>
                    {faq.q}
                  </p>
                  <p className="text-muted-foreground text-sm leading-relaxed pl-5">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Bottom */}
          <div className="mt-12 text-center p-8 md:p-12 bg-gradient-to-br from-blue-900/40 to-indigo-900/40 border border-blue-500/20 rounded-3xl relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl" />
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl" />
            </div>
            <div className="relative">
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">Sẵn sàng học tiếng Nhật? 🚀</h3>
              <p className="text-white/50 mb-8 max-w-lg mx-auto">Làm theo hướng dẫn ở trên. Nếu cần giúp đỡ, đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/lien-he"
                  className="flex items-center gap-2 border border-white/20 text-white/70 hover:text-white hover:border-white/40 px-6 py-3 rounded-2xl transition-all"
                >
                  Liên hệ hỗ trợ
                </Link>
                <Link
                  to="/"
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-8 py-3 rounded-2xl font-semibold shadow-lg shadow-blue-500/30 transition-all hover:scale-105"
                >
                  Khám phá các khóa học
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default InstallGuide;
