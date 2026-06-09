import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContactFormSection from "@/components/ContactFormSection";
import { Mail, Phone, Sparkles } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import { usePageSetting } from "@/hooks/usePageSettings";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Contact = () => {
  const { data: pageCfg } = usePageSetting('contact');
  const heroBadge = pageCfg?.hero_badge_vi || 'Tư vấn nhanh chóng • Hỗ trợ tận tâm';
  const heroTitle = pageCfg?.hero_title_vi;
  const heroSubtitle = pageCfg?.hero_subtitle_vi;
  const heroImage = pageCfg?.hero_image_url;
  const heroOverlay = Math.max(0, Math.min(100, Number(pageCfg?.hero_overlay ?? 50))) / 100;
  return (
    <main className="min-h-screen overflow-hidden bg-background">
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative pt-28 md:pt-36 pb-20 md:pb-28 overflow-hidden">
        {heroImage ? (
          <>
            <img src={heroImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-background" style={{ opacity: heroOverlay }} />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-amber-100 via-orange-50 to-background" />
        )}

        {/* Glow Effects */}
        <div className="absolute top-0 left-[-10%] w-[420px] h-[420px] bg-primary/15 rounded-full blur-3xl opacity-60" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-orange-300/20 rounded-full blur-3xl opacity-70" />

        {/* Floating Blur */}
        <div className="absolute top-1/3 right-1/4 w-24 h-24 bg-yellow-200/40 rounded-full blur-2xl animate-pulse" />

        <div className="container relative z-10 mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 xl:gap-24 items-center max-w-7xl mx-auto">
            {/* LEFT */}
            <ScrollReveal direction="left">
              <div className="text-center lg:text-left">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-white/70 backdrop-blur-sm shadow-md mb-6">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">
                    {heroBadge}
                  </span>
                </div>

                {/* Mascot */}
                <div className="flex justify-center lg:justify-start mb-8">
                  <div className="relative group">
                    {/* Glow */}
                    <div className="absolute inset-0 bg-primary/20 blur-3xl scale-90 opacity-70 group-hover:scale-100 transition-all duration-500" />

                    <img
                      src="/img/DungChibi_Writing.png"
                      alt="Dung Chibi Writing"
                      className="
                        relative
                        w-60
                        sm:w-72
                        md:w-80
                        lg:w-[340px]
                        h-auto
                        object-contain
                        drop-shadow-[0_20px_40px_rgba(0,0,0,0.18)]
                        hover:scale-105
                        transition-transform
                        duration-500
                        select-none
                        pointer-events-none
                      "
                    />
                  </div>
                </div>

                {/* Title */}
                <h1
                  className="
                    text-4xl
                    sm:text-5xl
                    xl:text-6xl
                    font-black
                    leading-[1.1]
                    tracking-tight
                    text-foreground
                  "
                >
                  {heroTitle ? (
                    heroTitle
                  ) : (
                    <>
                      Để lại thông tin
                      <br />
                      đăng kí dịch vụ tại
                      <br />
                      <span className="text-primary">TNQDO Education</span>
                    </>
                  )}
                </h1>

                {/* Description */}
                <p
                  className="
                    mt-6
                    text-base
                    sm:text-lg
                    text-muted-foreground
                    leading-relaxed
                    max-w-xl
                    mx-auto
                    lg:mx-0
                  "
                >
                  {heroSubtitle || 'Bạn vui lòng để lại số điện thoại hoặc Zalo để đội ngũ CSKH bên mình hỗ trợ tư vấn nhanh nhất nha ✨'}
                </p>
                {(pageCfg?.hero_cta_primary_label || pageCfg?.hero_cta_secondary_label) && (
                  <div className="flex flex-wrap gap-3 mt-6 justify-center lg:justify-start">
                    {pageCfg?.hero_cta_primary_label && (
                      <Button variant="hero" size="lg" asChild>
                        <Link to={pageCfg.hero_cta_primary_url || '#'}>{pageCfg.hero_cta_primary_label}</Link>
                      </Button>
                    )}
                    {pageCfg?.hero_cta_secondary_label && (
                      <Button variant="outline" size="lg" asChild>
                        <Link to={pageCfg.hero_cta_secondary_url || '#'}>{pageCfg.hero_cta_secondary_label}</Link>
                      </Button>
                    )}
                  </div>
                )}

                {/* Quick Stats */}
                <div className="flex flex-wrap justify-center lg:justify-start gap-4 mt-8">
                  <div className="px-5 py-3 rounded-2xl bg-white/70 backdrop-blur-md border border-border shadow-lg">
                    <p className="text-xl font-black text-primary">24/7</p>
                    <p className="text-xs text-muted-foreground">
                      Hỗ trợ tư vấn
                    </p>
                  </div>

                  <div className="px-5 py-3 rounded-2xl bg-white/70 backdrop-blur-md border border-border shadow-lg">
                    <p className="text-xl font-black text-primary">1000+</p>
                    <p className="text-xs text-muted-foreground">
                      Học viên đồng hành
                    </p>
                  </div>

                  <div className="px-5 py-3 rounded-2xl bg-white/70 backdrop-blur-md border border-border shadow-lg">
                    <p className="text-xl font-black text-primary">5★</p>
                    <p className="text-xs text-muted-foreground">
                      Đánh giá dịch vụ
                    </p>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* RIGHT */}
            <ScrollReveal direction="right">
              <div className="relative">
                {/* Glow */}
                <div className="absolute inset-0 bg-emerald-300/20 blur-3xl rounded-[40px]" />

                {/* Form Card */}
                <div
                  className="
                    relative
                    rounded-[32px]
                    border
                    border-white/40
                    bg-gradient-to-br
                    from-emerald-200/90
                    via-teal-100/80
                    to-cyan-100/80
                    backdrop-blur-xl
                    shadow-[0_20px_60px_rgba(0,0,0,0.12)]
                    p-5
                    sm:p-8
                    lg:p-10
                  "
                >
                  {/* Header */}
                  <div className="mb-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 border border-white/50 shadow-sm">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold text-primary">
                        Đăng kí nhanh
                      </span>
                    </div>

                    <h2 className="mt-5 text-2xl sm:text-3xl font-black text-foreground">
                      Nhận tư vấn miễn phí
                    </h2>

                    <p className="mt-3 text-muted-foreground leading-relaxed">
                      Điền thông tin bên dưới để đội ngũ TNQDO liên hệ hỗ trợ
                      bạn sớm nhất nhé.
                    </p>
                  </div>

                  <ContactFormSection variant="compact" />
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* CONTACT INFO */}
      <section className="relative py-16 border-y border-border bg-card overflow-hidden">
        {/* Background Glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-orange-200/10" />

        <div className="container relative z-10 mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* HOTLINE */}
              <ScrollReveal delay={0} direction="up">
                <div
                  className="
                    h-full
                    rounded-3xl
                    border
                    border-border
                    bg-background/80
                    backdrop-blur-xl
                    p-6
                    sm:p-8
                    shadow-lg
                    hover:shadow-2xl
                    transition-all
                    duration-300
                    hover:-translate-y-1
                  "
                >
                  <div className="flex items-start gap-5">
                    <div
                      className="
                        w-14 h-14
                        rounded-2xl
                        bg-primary/10
                        flex
                        items-center
                        justify-center
                        shrink-0
                      "
                    >
                      <Phone className="w-7 h-7 text-primary" />
                    </div>

                    <div className="flex-1">
                      <h3 className="text-xl font-black text-foreground mb-4">
                        Hotline hỗ trợ
                      </h3>

                      <div className="space-y-3">
                        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                          <p className="text-lg font-bold text-foreground">
                            (+84) 901 189 399
                          </p>
                          <span className="text-sm text-muted-foreground">
                            Mr. Triệu
                          </span>
                        </div>

                        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                          <p className="text-lg font-bold text-foreground">
                            (+84) 939 734 210
                          </p>
                          <span className="text-sm text-muted-foreground">
                            Mr. Hưng
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>

              {/* EMAIL */}
              <ScrollReveal delay={150} direction="up">
                <div
                  className="
                    h-full
                    rounded-3xl
                    border
                    border-border
                    bg-background/80
                    backdrop-blur-xl
                    p-6
                    sm:p-8
                    shadow-lg
                    hover:shadow-2xl
                    transition-all
                    duration-300
                    hover:-translate-y-1
                  "
                >
                  <div className="flex items-start gap-5">
                    <div
                      className="
                        w-14 h-14
                        rounded-2xl
                        bg-primary/10
                        flex
                        items-center
                        justify-center
                        shrink-0
                      "
                    >
                      <Mail className="w-7 h-7 text-primary" />
                    </div>

                    <div className="flex-1">
                      <h3 className="text-xl font-black text-foreground mb-4">
                        Email liên hệ
                      </h3>

                      <div className="space-y-3">
                        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                          <p className="text-foreground font-semibold break-all">
                            quangdungonline.education@gmail.com
                          </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                          <p className="text-foreground font-semibold break-all">
                            quangdungonline.nihongo@edu.vn
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default Contact;