import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SkillsSection from "@/components/SkillsSection";
import FeaturesSection from "@/components/FeaturesSection";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import {
  Sparkles,
  Users,
  BookOpen,
  Trophy,
  Target,
  ArrowRight,
  GraduationCap,
  Heart,
  Star,
  Zap,
  Globe,
  HelpCircle,
  Search,
  Volume2,
  VolumeX,
} from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import ThreeCValues from "@/components/about/ThreeCValues";
import AboutZoomSection from "@/components/about/AboutZoomSection";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePageSetting } from "@/hooks/usePageSettings";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  order_index: number;
}

const About = () => {
  const [faqSearch, setFaqSearch] = useState("");
  const [muted, setMuted] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const { data: pageCfg } = usePageSetting('about');
  const heroBadge = pageCfg?.hero_badge_vi || 'Về TNQDO Education';
  const heroTitle = pageCfg?.hero_title_vi;
  const heroSubtitle = pageCfg?.hero_subtitle_vi || 'Kết hợp giáo dục hiện đại, công nghệ AI và phương pháp học tập Nhật Bản để giúp người Việt chinh phục tiếng Nhật nhanh hơn, sâu hơn và thực tế hơn.';
  const heroImage = pageCfg?.hero_image_url;
  const ctaPrimaryLabel = pageCfg?.hero_cta_primary_label || 'Bắt đầu miễn phí';
  const ctaPrimaryUrl = pageCfg?.hero_cta_primary_url || '/auth';
  const ctaSecondaryLabel = pageCfg?.hero_cta_secondary_label || 'Khám phá khóa học';
  const ctaSecondaryUrl = pageCfg?.hero_cta_secondary_url || '/khoa-hoc';

  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace("#", "");

      setTimeout(() => {
        const el = document.getElementById(id);

        if (el) {
          el.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 300);
    }
  }, [location.hash]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = muted;
    }
  }, [muted]);

  const { data: faqs = [] } = useQuery({
    queryKey: ["faqs-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faqs")
        .select("*")
        .eq("is_active", true)
        .order("order_index", { ascending: true });

      if (error) throw error;

      return data as FAQ[];
    },
  });

  const filteredFaqs = faqSearch
    ? faqs.filter(
        (faq) =>
          faq.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
          faq.answer.toLowerCase().includes(faqSearch.toLowerCase())
      )
    : faqs;

  return (
    <main className="min-h-screen bg-background overflow-hidden">
      <Navbar />

      {/* HERO */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* BACKGROUND (admin image overrides video) */}
        {heroImage ? (
          <img src={heroImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src="/videos/about-hero.mp4" type="video/mp4" />
          </video>
        )}

        {/* OVERLAY */}
        <div className="absolute inset-0 bg-black/60" />

        {/* GLOW */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-japanese/20 rounded-full blur-3xl" />

        {/* SOUND BUTTON */}
        <button
          onClick={() => setMuted(!muted)}
          className="
            absolute
            bottom-6
            right-6
            z-30
            w-14
            h-14
            rounded-full
            bg-white/10
            backdrop-blur-xl
            border
            border-white/20
            flex
            items-center
            justify-center
            text-white
            hover:bg-white/20
            transition-all
          "
        >
          {muted ? (
            <VolumeX className="w-6 h-6" />
          ) : (
            <Volume2 className="w-6 h-6" />
          )}
        </button>

        {/* CONTENT */}
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            <ScrollReveal>
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white text-sm font-semibold mb-8">
                <GraduationCap className="w-4 h-4" />
                {heroBadge}
              </div>

              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white leading-[1.05] tracking-tight">
                {heroTitle ? (
                  heroTitle
                ) : (
                  <>
                    Nền tảng học
                    <br />
                    <span className="bg-gradient-to-r from-white via-orange-200 to-primary bg-clip-text text-transparent">
                      Tiếng Nhật
                    </span>
                    <br />
                    thế hệ mới
                  </>
                )}
              </h1>

              <p className="text-lg md:text-2xl text-white/80 max-w-3xl mx-auto mt-8 leading-relaxed">
                {heroSubtitle}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
                <Button
                  size="lg"
                  className="h-14 px-10 rounded-2xl text-base bg-white text-primary hover:bg-white/90 shadow-2xl"
                  asChild
                >
                  <Link to={ctaPrimaryUrl}>
                    {ctaPrimaryLabel}
                    <Sparkles className="w-5 h-5 ml-2" />
                  </Link>
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 px-10 rounded-2xl text-base border-white/20 bg-white/10 backdrop-blur-xl text-white hover:bg-white/20"
                  asChild
                >
                  <Link to={ctaSecondaryUrl}>{ctaSecondaryLabel}</Link>
                </Button>
              </div>
            </ScrollReveal>

            {/* STATS */}
            <ScrollReveal delay={200}>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-20">
                {[
                  {
                    icon: Users,
                    value: "50,000+",
                    label: "Học viên",
                  },
                  {
                    icon: BookOpen,
                    value: "1,000+",
                    label: "Bài học",
                  },
                  {
                    icon: Trophy,
                    value: "95%",
                    label: "Tỷ lệ đỗ JLPT",
                  },
                  {
                    icon: Target,
                    value: "200+",
                    label: "Giảng viên",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="
                      rounded-3xl
                      border
                      border-white/10
                      bg-white/10
                      backdrop-blur-xl
                      p-6
                      text-white
                    "
                  >
                    <item.icon className="w-8 h-8 mx-auto mb-4 text-orange-200" />

                    <div className="text-3xl font-black mb-2">
                      {item.value}
                    </div>

                    <div className="text-white/70 text-sm">{item.label}</div>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* STORY */}
<section className="py-24 md:py-32 bg-background relative overflow-hidden">
  {/* Background Effects */}
  <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
  <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-japanese/5 rounded-full blur-3xl" />

  <div className="container mx-auto px-4 relative z-10">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center max-w-7xl mx-auto">
      
      {/* LEFT */}
      <ScrollReveal direction="left">
        <div>
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary/10 text-primary border border-primary/20 mb-6 backdrop-blur-sm shadow-sm">
            <Heart className="w-4 h-4" />
            Câu chuyện TNQDO
          </div>

          {/* Title */}
          <h2 className="text-4xl md:text-6xl xl:text-7xl font-black leading-[1.1] text-foreground mb-8 tracking-tight">
            Học tiếng Nhật
            <br />
            không còn
            <span className="text-primary"> khó khăn</span>
          </h2>

          {/* Description */}
          <div className="space-y-5 text-muted-foreground text-lg leading-relaxed">
            <p>
              TNQDO được xây dựng với khát vọng tạo nên nền tảng học tiếng Nhật
              hiện đại dành riêng cho người Việt.
            </p>

            <p>
              Chúng tôi ứng dụng AI, phương pháp ghi nhớ khoa học và đội ngũ
              giáo viên chất lượng cao để tối ưu toàn bộ trải nghiệm học tập.
            </p>

            <p>
              Không chỉ là học ngôn ngữ, TNQDO còn giúp học viên hiểu văn hóa,
              mở rộng cơ hội nghề nghiệp và phát triển bản thân.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-10">
            <Button
              className="
                rounded-2xl
                h-12
                px-8
                shadow-lg
                hover:scale-[1.02]
                transition-all
              "
              asChild
            >
              <Link to="/khoa-hoc">
                Xem khóa học
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>

            <Button
              variant="outline"
              className="
                rounded-2xl
                h-12
                px-8
                border-border/60
                hover:bg-muted/50
                transition-all
              "
              asChild
            >
              <Link to="/lien-he">Liên hệ tư vấn</Link>
            </Button>
          </div>
        </div>
      </ScrollReveal>

      {/* RIGHT */}
      <ScrollReveal direction="right">
        <div className="relative group">
          
          {/* Glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-japanese/10 to-accent/10 blur-3xl rounded-[40px]" />

          {/* Video Card */}
          <div
            className="
              relative
              overflow-hidden
              rounded-[32px]
              border
              border-border/50
              bg-card
              backdrop-blur-xl
              shadow-[0_30px_80px_rgba(0,0,0,0.18)]
            "
          >
           <div className="relative overflow-hidden rounded-[32px] shadow-2xl border border-border">
  <div className="aspect-video">
    <iframe
      className="w-full h-full"
      src="https://www.youtube.com/embed/8sEAdplNYeA?autoplay=1&mute=1&loop=1&playlist=8sEAdplNYeA&controls=1&rel=0"
      title="TNQDO Video"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  </div>
</div>

            {/* Overlay Gradient */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

            {/* Floating Label */}
            <div
              className="
                absolute
                bottom-5
                left-5
                z-20
                px-4
                py-2
                rounded-full
                bg-black/40
                backdrop-blur-md
                border
                border-white/10
                text-white
                text-sm
                font-medium
                shadow-lg
              "
            >
              TNQDO Education
            </div>
          </div>

          {/* Floating Decoration */}
          <div className="absolute -top-5 -right-5 w-24 h-24 bg-primary/10 rounded-3xl rotate-12 blur-2xl" />
          <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-japanese/10 rounded-full blur-2xl" />
        </div>
      </ScrollReveal>
    </div>
  </div>
</section>

      {/* VALUES */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <ScrollReveal>
            <div className="text-center max-w-3xl mx-auto mb-20">
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary/10 text-primary border border-primary/20 mb-5">
                <Star className="w-4 h-4" />
                Giá trị cốt lõi
              </div>

              <h2 className="text-4xl md:text-6xl font-black text-foreground mb-6">
                Phương pháp
                <span className="text-primary"> 3C</span>
              </h2>

              <p className="text-lg text-muted-foreground">
                Tư duy giáo dục hiện đại giúp học viên phát triển toàn diện
              </p>
            </div>
          </ScrollReveal>

          <ThreeCValues />
        </div>
      </section>

      <SkillsSection />
      <FeaturesSection />
      <AboutZoomSection />

      {/* FAQ */}
      <section className="py-24 bg-background relative overflow-hidden">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-sakura/5 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto">
            <ScrollReveal>
              <div className="text-center mb-14">
                <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-sakura/10 text-sakura border border-sakura/20 mb-5">
                  <HelpCircle className="w-4 h-4" />
                  FAQ
                </div>

                <h2 className="text-4xl md:text-6xl font-black text-foreground mb-5">
                  Câu hỏi thường gặp
                </h2>

                <p className="text-muted-foreground text-lg">
                  Giải đáp các thắc mắc phổ biến từ học viên
                </p>

                <div className="relative max-w-xl mx-auto mt-8">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />

                  <Input
                    type="text"
                    placeholder="Tìm kiếm câu hỏi..."
                    value={faqSearch}
                    onChange={(e) => setFaqSearch(e.target.value)}
                    className="pl-12 h-14 rounded-2xl"
                  />
                </div>
              </div>
            </ScrollReveal>

            <Accordion type="single" collapsible className="space-y-4">
              {filteredFaqs.map((faq, i) => (
                <ScrollReveal key={faq.id} delay={i * 50} direction="up">
                  <AccordionItem value={faq.id} className="border-none">
                    <AccordionTrigger
                      className="
                        px-6
                        py-5
                        rounded-2xl
                        bg-card
                        border
                        border-border
                        hover:no-underline
                        text-left
                        font-bold
                        shadow-sm
                      "
                    >
                      {faq.question}
                    </AccordionTrigger>

                    <AccordionContent
                      className="
                        px-6
                        py-5
                        bg-muted/40
                        rounded-b-2xl
                        text-muted-foreground
                        leading-relaxed
                      "
                    >
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                </ScrollReveal>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/90" />

        <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-white/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 border border-white/20 text-white mb-6">
              <Sparkles className="w-4 h-4" />
              Hành trình mới bắt đầu
            </div>

            <h2 className="text-4xl md:text-6xl font-black text-white leading-tight mb-6">
              Sẵn sàng chinh phục
              <br />
              Tiếng Nhật?
            </h2>

            <p className="text-white/80 text-lg md:text-xl leading-relaxed mb-10">
              Tham gia cùng hơn 50,000 học viên đang học tập và phát triển cùng
              TNQDO Education
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="h-14 px-10 rounded-2xl bg-white text-primary hover:bg-white/90"
                asChild
              >
                <Link to="/auth">
                  Bắt đầu miễn phí
                  <Sparkles className="w-5 h-5 ml-2" />
                </Link>
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="h-14 px-10 rounded-2xl border-white/20 bg-white/10 text-white hover:bg-white/20"
                asChild
              >
                <Link to="/khoa-hoc">Khám phá khóa học</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default About;