import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Sparkles, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useAllWebsiteContent } from "@/hooks/useWebsiteContent";
import { Skeleton } from "@/components/ui/skeleton";

export interface HeroSlide {
  id?: string;
  image_url: string;
  title_vi?: string;
  subtitle_vi?: string;
  description_vi?: string;
  button_text_vi?: string;
  button_url?: string;
}

const HeroSection = () => {
  const { data: content, isLoading } = useAllWebsiteContent();
  const heroContent = content?.hero;
  const statsContent = heroContent?.content as {
    hero_mode?: 'standard' | 'single_cover' | 'carousel' | 'center_full' | 'center_poster' | 'full_screen';
    carousel_slides?: HeroSlide[];
    primary_btn?: { text?: string; url?: string; enabled?: boolean };
    secondary_btn?: { text?: string; url?: string; enabled?: boolean };
    custom_buttons?: any[];
    show_stats?: boolean;
    banner_style?: Record<string, any>;
    students?: string;
    teachers?: string;
    lessons?: string;
    tagline?: string;
    features?: string[];
    rating?: string;
    reviews?: string;
  } | null;

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Default values
  const heroMode = statsContent?.hero_mode || 'standard';
  const slides = statsContent?.carousel_slides || [];

  const title = heroContent?.title_vi || "Chinh phục Tiếng Nhật cùng chúng tôi";
  const subtitle = heroContent?.subtitle_vi || "Nền tảng học Tiếng Nhật #1 cho người Việt";
  const description = heroContent?.description_vi || 
    "Phương pháp học toàn diện 4 kỹ năng: Đọc - Nói - Viết - Nghe. Từ N5 đến N1, luyện thi JLPT với giáo viên bản ngữ qua Meeting.";
  
  const students = statsContent?.students || "50K+";
  const teachers = statsContent?.teachers || "200+";
  const lessons = statsContent?.lessons || "1000+";
  const features = statsContent?.features || [
    "Lộ trình JLPT chuẩn",
    "Kanji & Hiragana từ cơ bản",
    "Giáo viên bản ngữ Nhật"
  ];
  const rating = statsContent?.rating || "4.9";
  const reviews = statsContent?.reviews || "2.5k đánh giá";

  const primaryBtn = {
    enabled: statsContent?.primary_btn?.enabled !== false,
    text: statsContent?.primary_btn?.text || "Học miễn phí ngay",
    url: statsContent?.primary_btn?.url || "/auth"
  };

  const secondaryBtn = {
    enabled: statsContent?.secondary_btn?.enabled !== false,
    text: statsContent?.secondary_btn?.text || "Xem khóa học",
    url: statsContent?.secondary_btn?.url || "/giao-vien"
  };

  const customButtons = (statsContent?.custom_buttons as any[]) || [
    { id: '1', text: primaryBtn.text, url: primaryBtn.url, variant: 'primary', enabled: primaryBtn.enabled },
    { id: '2', text: secondaryBtn.text, url: secondaryBtn.url, variant: 'outline', enabled: secondaryBtn.enabled }
  ];
  const activeButtons = customButtons.filter((b: any) => b.enabled !== false);

  // Carousel Auto Play
  useEffect(() => {
    if (heroMode === 'carousel' && slides.length > 1) {
      const timer = setInterval(() => {
        setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [heroMode, slides.length]);

  if (isLoading) {
    return (
      <section className="relative min-h-[500px] lg:min-h-screen bg-gradient-hero pt-20 overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12 py-16">
            <div className="flex-1 max-w-2xl space-y-6">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-24 w-full" />
              <div className="flex gap-4">
                <Skeleton className="h-12 w-40" />
                <Skeleton className="h-12 w-32" />
              </div>
            </div>
            <div className="flex-1">
              <Skeleton className="h-96 w-full max-w-md rounded-3xl" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  // MODE 1: CAROUSEL SLIDER MODE
  if (heroMode === 'carousel' && slides.length > 0) {
    const activeSlide = slides[currentSlideIndex] || slides[0];

    return (
      <section className="relative min-h-[520px] md:min-h-[620px] lg:min-h-screen pt-20 overflow-hidden bg-foreground text-background">
        {/* Carousel Background Images with Fade Transition */}
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentSlideIndex ? 'opacity-100 z-0' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            <img
              src={slide.image_url}
              alt={slide.title_vi || `Banner slide ${index + 1}`}
              className="w-full h-full object-cover"
            />
            {/* Dark Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />
          </div>
        ))}

        {/* Carousel Slide Content */}
        <div className="container mx-auto px-4 relative z-10 h-full min-h-[440px] md:min-h-[520px] lg:min-h-[600px] flex items-center">
          <div className="max-w-3xl space-y-6 text-white text-center md:text-left py-12">
            {activeSlide.subtitle_vi && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary border border-primary/30 backdrop-blur-md text-sm font-bold">
                <Sparkles className="w-4 h-4" />
                <span>{activeSlide.subtitle_vi}</span>
              </div>
            )}

            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black leading-tight drop-shadow-lg">
              {activeSlide.title_vi || title}
            </h1>

            <p className="text-base md:text-xl text-gray-200 line-clamp-3 leading-relaxed drop-shadow-md">
              {activeSlide.description_vi || description}
            </p>

            <div className="flex flex-wrap gap-4 justify-center md:justify-start pt-2">
              {activeSlide.button_text_vi && (
                <Button size="xl" className="font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl rounded-2xl gap-2" asChild>
                  <Link to={activeSlide.button_url || "/auth"}>
                    <Sparkles className="w-5 h-5" />
                    {activeSlide.button_text_vi}
                  </Link>
                </Button>
              )}
              {secondaryBtn.enabled && (
                <Button variant="outline" size="xl" className="font-bold bg-white/10 backdrop-blur-md border-white/30 text-white hover:bg-white/20 rounded-2xl" asChild>
                  <Link to={secondaryBtn.url}>
                    <Play className="w-5 h-5" />
                    {secondaryBtn.text}
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Arrows */}
        {slides.length > 1 && (
          <>
            <button
              onClick={() => setCurrentSlideIndex((prev) => (prev - 1 + slides.length) % slides.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-md border border-white/20 transition-all shadow-lg"
              title="Slide trước"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => setCurrentSlideIndex((prev) => (prev + 1) % slides.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-md border border-white/20 transition-all shadow-lg"
              title="Slide tiếp theo"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Dots Indicator */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlideIndex(idx)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    idx === currentSlideIndex ? 'w-8 bg-primary' : 'w-2.5 bg-white/50 hover:bg-white/80'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </section>
    );
  }

  // MODE 2: SINGLE FULL-WIDTH COVER BANNER MODE (Background Image Overlay)
  if (heroMode === 'single_cover') {
    const bgUrl = heroContent?.image_url || "/img/qd-team-hero.png";
    return (
      <section className="relative min-h-[500px] md:min-h-[620px] pt-20 overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0">
          <img
            src={bgUrl}
            alt={title}
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/30" />
        </div>

        <div className="container mx-auto px-4 relative z-10 min-h-[460px] md:min-h-[540px] flex items-center">
          <div className="max-w-3xl space-y-6 text-white py-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-500/30 text-rose-200 border border-rose-400/40 backdrop-blur-md text-sm font-bold">
              <Sparkles className="w-4 h-4 text-rose-300 animate-pulse" />
              <span>{subtitle}</span>
            </div>

            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black leading-tight text-white drop-shadow-lg">
              {title}
            </h1>

            <p className="text-base md:text-xl text-gray-200 leading-relaxed max-w-2xl">
              {description}
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              {activeButtons.map((btn: any, idx: number) => (
                <Button
                  key={btn.id || idx}
                  size="lg"
                  className={`h-12 px-6 text-sm font-bold rounded-xl shadow-lg gap-2 ${
                    btn.variant === 'outline'
                      ? 'bg-white/10 backdrop-blur-md border border-white/40 text-white hover:bg-white/20'
                      : btn.variant === 'rose'
                      ? 'bg-rose-600 hover:bg-rose-700 text-white'
                      : btn.variant === 'gold'
                      ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                      : 'bg-primary hover:bg-primary/90 text-white'
                  }`}
                  asChild
                >
                  <Link to={btn.url || "#"}>
                    <Sparkles className="w-4 h-4" />
                    {btn.text}
                  </Link>
                </Button>
              ))}
            </div>

            {statsContent?.show_stats !== false && (
              <div className="pt-8 border-t border-white/20 flex items-center justify-start gap-8 sm:gap-12">
                <div className="flex items-center gap-3">
                  <div className="text-2xl sm:text-3xl font-black text-white">{students}</div>
                  <div className="text-xs font-bold text-gray-300">👥 Học viên</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-2xl sm:text-3xl font-black text-white">{teachers}</div>
                  <div className="text-xs font-bold text-gray-300">👨‍🏫 Giáo viên</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-2xl sm:text-3xl font-black text-white">{lessons}</div>
                  <div className="text-xs font-bold text-gray-300">📚 Bài học</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  // MODE: CENTER POSTER FULL SCREEN 100% EDGE-TO-EDGE
  if (heroMode === 'center_full' || heroMode === 'full_screen') {
    return (
      <section className="relative min-h-[90vh] bg-gradient-to-b from-background via-background to-primary/5 pt-24 pb-16 overflow-hidden w-full">
        {/* Top Centered Pill Badge */}
        <div className="text-center mb-6 px-4">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-rose-50 text-rose-600 border border-rose-200 shadow-xs">
            <Sparkles className="w-4 h-4 text-rose-500 animate-pulse" />
            <span className="text-xs sm:text-sm font-bold">{subtitle}</span>
          </div>
        </div>

        {/* Top Centered Main Headline */}
        <div className="text-center mb-8 px-4">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-foreground leading-[1.12] tracking-tight">
            {title.includes("Tiếng Nhật") ? (
              <>
                {title.split("Tiếng Nhật")[0]}
                <span className="relative inline-block text-rose-600 px-2">
                  Tiếng Nhật
                  <svg className="absolute -bottom-2 left-0 w-full h-3 text-rose-600" viewBox="0 0 300 12" fill="none">
                    <path d="M2 10C50 4 100 2 150 6C200 10 250 4 298 8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                </span>
                {title.split("Tiếng Nhật")[1]}
              </>
            ) : (
              title
            )}
          </h1>
        </div>

        {/* Center Team Image Poster - 100% Full Screen Width */}
        <div className="w-full px-2 sm:px-6 lg:px-12 mb-10">
          <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl border-2 sm:border-4 border-background bg-card">
            <img
              src={heroContent?.image_url || "/img/qd-team-hero.png"}
              alt="TNQDO Teachers Team Full"
              className="w-full h-auto max-h-[720px] object-cover bg-muted/20"
            />
          </div>
        </div>

        <div className="container mx-auto px-4 max-w-6xl">
          {/* Bottom Details & CTA Buttons Row */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-4">
            <div className="flex-1 text-center md:text-left space-y-2">
              <h3 className="text-lg sm:text-xl font-bold text-foreground">
                {statsContent?.tagline || "Mở cánh cửa tương lai Nhật Bản, kết nối toàn cầu."}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
                {description}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {activeButtons.map((btn: any, idx: number) => (
                <Button
                  key={btn.id || idx}
                  size="lg"
                  className={`h-12 px-6 text-sm font-bold rounded-xl shadow-lg gap-2 ${
                    btn.variant === 'outline'
                      ? 'bg-white text-foreground border-2 border-slate-900 hover:bg-slate-50'
                      : btn.variant === 'rose'
                      ? 'bg-rose-600 hover:bg-rose-700 text-white'
                      : btn.variant === 'gold'
                      ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                      : 'bg-[#1e293b] hover:bg-[#0f172a] text-white'
                  }`}
                  asChild
                >
                  <Link to={btn.url || "#"}>
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    {btn.text}
                  </Link>
                </Button>
              ))}
            </div>
          </div>

          {/* Bottom KPI Metrics Row */}
          {statsContent?.show_stats !== false && (
            <div className="mt-8 pt-8 border-t border-border/60 flex items-center justify-start gap-12 sm:gap-16">
              <div className="flex items-center gap-3">
                <div className="text-3xl font-black text-foreground">{students}</div>
                <div className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                  <span className="text-indigo-600">👥</span> Học viên
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-3xl font-black text-foreground">{teachers}</div>
                <div className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                  <span className="text-amber-600">👨‍🏫</span> Giáo viên
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-3xl font-black text-foreground">{lessons}</div>
                <div className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                  <span className="text-emerald-600">📚</span> Bài học
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    );
  }

  // MODE 3: CENTER POSTER MODE (Matching Exact Latest User Screenshot)
  if (heroMode === 'center_poster') {
    return (
      <section className="relative min-h-[85vh] bg-gradient-to-b from-background via-background to-primary/5 pt-24 pb-16 overflow-hidden">
        <div className="container mx-auto px-4 relative z-10 max-w-5xl">
          {/* Top Centered Pill Badge */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-rose-50 text-rose-600 border border-rose-200 shadow-xs">
              <Sparkles className="w-4 h-4 text-rose-500 animate-pulse" />
              <span className="text-xs sm:text-sm font-bold">{subtitle}</span>
            </div>
          </div>

          {/* Top Centered Main Headline */}
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-foreground leading-[1.12] tracking-tight">
              {title.includes("Tiếng Nhật") ? (
                <>
                  {title.split("Tiếng Nhật")[0]}
                  <span className="relative inline-block text-rose-600 px-2">
                    Tiếng Nhật
                    <svg className="absolute -bottom-2 left-0 w-full h-3 text-rose-600" viewBox="0 0 300 12" fill="none">
                      <path d="M2 10C50 4 100 2 150 6C200 10 250 4 298 8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                    </svg>
                  </span>
                  {title.split("Tiếng Nhật")[1]}
                </>
              ) : (
                title
              )}
            </h1>
          </div>

          {/* Center Team Image Poster - Full un-cropped display */}
          <div className="relative w-full max-w-5xl mx-auto mb-10 group">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-background bg-card">
              <img
                src={heroContent?.image_url || "/img/qd-team-hero.png"}
                alt="TNQDO Teachers Team"
                className="w-full h-auto max-h-[580px] object-contain bg-muted/20 transition-transform duration-700 group-hover:scale-[1.005]"
              />
            </div>
          </div>

          {/* Bottom Details & CTA Buttons Row */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-4">
            <div className="flex-1 text-center md:text-left space-y-2">
              <h3 className="text-lg sm:text-xl font-bold text-foreground">
                {statsContent?.tagline || "Mở cánh cửa tương lai Nhật Bản, kết nối toàn cầu."}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
                {description}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {primaryBtn.enabled && (
                <Button size="lg" className="h-12 px-6 text-sm font-bold bg-[#1e293b] hover:bg-[#0f172a] text-white rounded-xl shadow-lg gap-2" asChild>
                  <Link to={primaryBtn.url}>
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    {primaryBtn.text}
                  </Link>
                </Button>
              )}
              {secondaryBtn.enabled && (
                <Button variant="outline" size="lg" className="h-12 px-6 text-sm font-bold bg-white text-foreground border-2 border-slate-900 hover:bg-slate-50 rounded-xl gap-2" asChild>
                  <Link to={secondaryBtn.url}>
                    <Play className="w-4 h-4 text-foreground" />
                    {secondaryBtn.text}
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* Bottom KPI Metrics Row */}
          <div className="mt-8 pt-8 border-t border-border/60 flex items-center justify-start gap-12 sm:gap-16">
            <div className="flex items-center gap-3">
              <div className="text-3xl font-black text-foreground">{students}</div>
              <div className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                <span className="text-indigo-600">👥</span> Học viên
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-3xl font-black text-foreground">{teachers}</div>
              <div className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                <span className="text-amber-600">👨‍🏫</span> Giáo viên
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-3xl font-black text-foreground">{lessons}</div>
              <div className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                <span className="text-emerald-600">📚</span> Bài học
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // MODE 4: STANDARD DELUXE SPLIT MODE (Text Left + Media Card Right)
  return (
    <section className="relative min-h-[90vh] bg-gradient-to-br from-background via-background to-primary/5 pt-20 pb-16 overflow-hidden">
      {/* Parallax ambient background graphics */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-96 h-96 bg-japanese/8 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-primary/8 rounded-full blur-3xl animate-float animation-delay-300" />
        <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:32px_32px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16 py-12 lg:py-20">
          {/* Left Column Content */}
          <div className="flex-1 text-center lg:text-left max-w-2xl">
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-japanese/10 text-japanese border border-japanese/20 mb-6 animate-slide-up shadow-xs">
              <Sparkles className="w-4 h-4 text-japanese animate-pulse" />
              <span className="text-xs sm:text-sm font-bold tracking-wide">{subtitle}</span>
            </div>
            
            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-foreground leading-[1.12] mb-5 animate-slide-up animation-delay-100 tracking-tight">
              {title.includes("Tiếng Nhật") ? (
                <>
                  {title.split("Tiếng Nhật")[0]}
                  <span className="relative inline-block text-japanese px-1">
                    Tiếng Nhật
                    <svg className="absolute -bottom-2 left-0 w-full h-3 text-japanese" viewBox="0 0 300 12" fill="none">
                      <path d="M2 10C50 4 100 2 150 6C200 10 250 4 298 8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                    </svg>
                  </span>
                  {title.split("Tiếng Nhật")[1]}
                </>
              ) : (
                title
              )}
            </h1>

            {/* Tagline / Subtitle */}
            <p className="text-xl sm:text-2xl font-bold text-foreground/80 mb-4 animate-slide-up animation-delay-150">
              {statsContent?.tagline || "Mở cánh cửa tương lai Nhật Bản, kết nối toàn cầu."}
            </p>
            
            {/* Main Description */}
            <p className="text-base sm:text-lg text-muted-foreground mb-8 animate-slide-up animation-delay-200 leading-relaxed">
              {description}
            </p>

            {/* CTA Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-slide-up animation-delay-300">
              {primaryBtn.enabled && (
                <Button size="xl" className="h-14 px-8 text-base font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all bg-primary text-primary-foreground hover:bg-primary/90 gap-2" asChild>
                  <Link to={primaryBtn.url}>
                    <Sparkles className="w-5 h-5" />
                    {primaryBtn.text}
                  </Link>
                </Button>
              )}
              {secondaryBtn.enabled && (
                <Button variant="outline" size="xl" className="h-14 px-8 text-base font-bold rounded-2xl border-2 hover:bg-muted/60 transition-all gap-2" asChild>
                  <Link to={secondaryBtn.url}>
                    <Play className="w-5 h-5 text-primary" />
                    {secondaryBtn.text}
                  </Link>
                </Button>
              )}
            </div>

            {/* Top KPI Metrics Row */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-8 sm:gap-12 mt-12 pt-8 border-t border-border/60 animate-slide-up animation-delay-400">
              <div className="text-center lg:text-left">
                <div className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">{students}</div>
                <div className="text-xs sm:text-sm font-semibold text-muted-foreground mt-1 flex items-center gap-1 justify-center lg:justify-start">
                  <span>👥 Học viên</span>
                </div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">{teachers}</div>
                <div className="text-xs sm:text-sm font-semibold text-muted-foreground mt-1 flex items-center gap-1 justify-center lg:justify-start">
                  <span>👨‍🏫 Giáo viên</span>
                </div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">{lessons}</div>
                <div className="text-sm font-semibold text-muted-foreground mt-1 flex items-center gap-1 justify-center lg:justify-start">
                  <span>📚 Bài học</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Team Photo & Floating Japanese Learning Badges */}
          <div className="flex-1 relative w-full max-w-xl">
            <div className="relative">
              {/* Main Teacher Team Image Box */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-background bg-card group">
                <img 
                  src={heroContent?.image_url || "/img/qd-team-hero.png"} 
                  alt="Đội ngũ Giảng viên TNQDO" 
                  className="w-full h-[320px] sm:h-[400px] lg:h-[440px] object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <p className="text-xs font-semibold uppercase tracking-wider text-japanese">TNQDO Japanese Hub</p>
                  <p className="text-sm font-bold truncate">Đội ngũ Giảng viên Bản ngữ & N1 Tiếng Nhật xuất sắc</p>
                </div>
              </div>

              {/* Floating Card: JLPT Learning Features */}
              <div className="absolute -bottom-8 -right-2 sm:-right-6 w-72 sm:w-80 bg-card/95 backdrop-blur-xl rounded-2xl p-5 shadow-2xl border border-border/80 animate-float">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-japanese/10 flex items-center justify-center text-japanese font-bold text-xl shrink-0">
                    🌸
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-foreground line-clamp-1">Luyện thật JLPT...</h4>
                    <p className="text-[11px] text-muted-foreground">JLPT N5 - N1 • Giao tiếp • Thương mại</p>
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  {features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs font-medium text-foreground">
                      <span className="text-japanese">📚</span>
                      <span className="truncate">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2 border-t text-xs font-bold text-foreground">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    ))}
                    <span className="ml-1">{rating}</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">({reviews})</span>
                </div>
              </div>

              {/* Floating Decorative Elements */}
              <div className="absolute -top-6 -left-6 bg-card rounded-2xl p-3 shadow-xl border border-border flex items-center gap-2 animate-float animation-delay-200">
                <span className="text-2xl">📖</span>
                <div>
                  <p className="text-[11px] font-bold text-foreground">Sách Giáo trình</p>
                  <p className="text-[9px] font-bold text-japanese">Luyện thi JLPT N5</p>
                </div>
              </div>

              <div className="absolute top-1/2 -left-8 -translate-y-1/2 hidden sm:flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-xl animate-pulse">
                🎧
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
