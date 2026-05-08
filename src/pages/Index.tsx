import { useEffect, useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  Sparkles, Star, Play, BookOpen, Mic, PenTool, Headphones, 
  ArrowRight, Users, Video, Trophy, Brain, Target, Shield, 
  Zap, Award, ChevronRight
} from "lucide-react";
import { useTeacherProfiles } from "@/hooks/useTeachers";
import ScrollReveal from "@/components/ScrollReveal";
import { useHomepageSections } from "@/hooks/useHomepageSections";

const Index = () => {
  const { data: teachers, isLoading: isTeachersLoading } = useTeacherProfiles();
  const { data: sectionOrder } = useHomepageSections();
  const heroContent = null;
  const statsContent = {
    students: "50K+",
    teachers: teachers?.length ? `${teachers.length}` : "200+",
    lessons: "1000+",
    rating: "4.9",
    reviews: "2.5k đánh giá",
  };

  const featuredTeachers = (teachers || []).filter((t) => t.is_featured).slice(0, 4);
  const teacherList = (featuredTeachers.length ? featuredTeachers : teachers || []).map((t) => ({
    id: t.id,
    name: t.display_name || t.profile?.full_name || "Giảng viên",
    headline: t.headline || "Giảng viên",
    avatar_url: t.image_url || t.profile?.avatar_url || "",
    rating: t.rating || 0,
  }));

  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const visibleSections = useMemo(() => {
    if (!sectionOrder) return ['hero', 'skills', 'courses', 'features', 'zoom', 'teachers', 'cta'];
    return sectionOrder.filter(s => s.visible).map(s => s.id);
  }, [sectionOrder]);

  const heroSection = (
      <section key="hero" className="relative min-h-[90vh] pt-20 overflow-hidden">
        {/* Parallax animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5">
          <div
            className="absolute top-20 left-10 w-72 h-72 bg-japanese/8 rounded-full blur-3xl animate-float"
            style={{ transform: `translateY(${scrollY * 0.15}px)` }}
          />
          <div
            className="absolute bottom-20 right-10 w-96 h-96 bg-primary/8 rounded-full blur-3xl animate-float animation-delay-200"
            style={{ transform: `translateY(${scrollY * -0.1}px)` }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/3 rounded-full blur-3xl"
            style={{ transform: `translate(-50%, -50%) scale(${1 + scrollY * 0.0003})` }}
          />
          <div className="absolute inset-0 opacity-[0.015]" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
            backgroundSize: '40px 40px',
            transform: `translateY(${scrollY * 0.05}px)`,
          }} />
        </div>

        <div
          className="container mx-auto px-4 relative z-10"
          style={{ transform: `translateY(${scrollY * 0.08}px)`, opacity: Math.max(0, 1 - scrollY * 0.0015) }}
        >
          <div className="flex flex-col lg:flex-row items-center justify-between gap-16 py-20">
            <div className="flex-1 text-center lg:text-left max-w-2xl">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-japanese/10 text-japanese mb-8 animate-slide-up border border-japanese/20">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-semibold">Nền tảng học Tiếng Nhật #1 cho người Việt</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-foreground leading-[1.1] mb-8 animate-slide-up animation-delay-100">
                Chinh phục{" "}
                <span className="relative">
                  <span className="text-japanese">Tiếng Nhật</span>
                  <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                    <path d="M2 10C50 4 100 2 150 6C200 10 250 4 298 8" stroke="hsl(0, 76%, 50%)" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                </span>
                {" "}cùng TNQDO
              </h1>
              
              <p className="text-xl text-muted-foreground mb-10 animate-slide-up animation-delay-200 leading-relaxed">
                Phương pháp học toàn diện 4 kỹ năng: Đọc - Nói - Viết - Nghe.
                <br className="hidden md:block" />
                Từ N5 đến N1, luyện thi JLPT với giáo viên bản ngữ qua Zoom.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-slide-up animation-delay-300">
                <Button size="lg" className="h-14 px-8 text-base rounded-2xl shadow-lg hover:shadow-xl transition-all" asChild>
                  <Link to="/auth">
                    <Sparkles className="w-5 h-5 mr-2" />
                    Học miễn phí ngay
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="h-14 px-8 text-base rounded-2xl" asChild>
                  <Link to="/gioi-thieu">
                    <Play className="w-5 h-5 mr-2" />
                    Tìm hiểu thêm
                  </Link>
                </Button>
              </div>

              <div className="flex flex-wrap justify-center lg:justify-start gap-10 mt-14 animate-slide-up animation-delay-400">
                {[
                  { value: statsContent?.students || "50K+", label: "Học viên" },
                  { value: statsContent?.teachers || "200+", label: "Giáo viên" },
                  { value: statsContent?.lessons || "1000+", label: "Bài học" },
                ].map(stat => (
                  <div key={stat.label} className="text-center">
                    <div className="text-4xl font-extrabold text-foreground">{stat.value}</div>
                    <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 relative animate-scale-in animation-delay-200" style={{ transform: `translateY(${scrollY * -0.05}px)` }}>
              <div className="relative w-full max-w-lg mx-auto">
                <div className="bg-card rounded-3xl p-10 shadow-2xl border border-border/50 backdrop-blur-sm">
                  <div className="w-20 h-20 rounded-2xl bg-japanese/10 flex items-center justify-center mb-8">
                    <span className="text-5xl">🇯🇵</span>
                  </div>
                  <h3 className="text-3xl font-bold text-foreground mb-3">Tiếng Nhật</h3>
                  <p className="text-muted-foreground mb-6 text-lg">JLPT N5 - N1 • Giao tiếp • Thương mại</p>
                  
                  <div className="space-y-4 mb-8">
                    {["Lộ trình JLPT chuẩn", "Kanji & Hiragana từ cơ bản", "Giáo viên bản ngữ Nhật"].map(f => (
                      <div key={f} className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-japanese/10 flex items-center justify-center">
                          <Star className="w-3.5 h-3.5 text-japanese" />
                        </div>
                        <span className="text-foreground">{f}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 mb-8">
                    <div className="flex">{[1,2,3,4,5].map(s => <Star key={s} className="w-5 h-5 text-accent fill-accent" />)}</div>
                    <span className="font-bold text-foreground">{statsContent?.rating || "4.9"}</span>
                    <span className="text-muted-foreground">({statsContent?.reviews || "2.5k đánh giá"})</span>
                  </div>

                  <Button className="w-full h-12 rounded-xl text-base" asChild>
                    <Link to="/khoa-hoc">Xem khóa học <ArrowRight className="w-4 h-4 ml-2" /></Link>
                  </Button>
                </div>

                <div className="absolute -top-6 -right-6 w-28 h-28 bg-japanese/10 rounded-3xl rotate-12 animate-float animation-delay-200" style={{ transform: `rotate(12deg) translateY(${scrollY * -0.12}px)` }} />
                <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-accent/10 rounded-2xl -rotate-12 animate-float animation-delay-400" style={{ transform: `rotate(-12deg) translateY(${scrollY * 0.1}px)` }} />
              </div>
            </div>
          </div>
        </div>
      </section>
  );

  const skillsSection = (
      <section key="skills" className="py-24 bg-background relative">
        <div className="container mx-auto px-4">
          <ScrollReveal>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="inline-block px-5 py-2.5 rounded-full bg-accent/10 text-accent text-sm font-semibold mb-4 border border-accent/20">
                4 Kỹ năng cốt lõi
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-5">
                Phát triển toàn diện ngôn ngữ
              </h2>
              <p className="text-lg text-muted-foreground">
                Hệ thống bài học khoa học, giúp bạn tiến bộ nhanh chóng
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: BookOpen, title: "Đọc hiểu", titleEn: "Reading", color: "text-blue-500", bg: "bg-blue-500/10", desc: "Hàng ngàn bài viết từ cơ bản đến nâng cao" },
              { icon: Mic, title: "Nói", titleEn: "Speaking", color: "text-green-500", bg: "bg-green-500/10", desc: "Luyện phát âm với AI và giáo viên bản ngữ" },
              { icon: PenTool, title: "Viết", titleEn: "Writing", color: "text-purple-500", bg: "bg-purple-500/10", desc: "AI chấm điểm và giáo viên review chi tiết" },
              { icon: Headphones, title: "Nghe", titleEn: "Listening", color: "text-orange-500", bg: "bg-orange-500/10", desc: "Audio chất lượng cao với transcript song ngữ" },
            ].map((skill, i) => (
              <ScrollReveal key={skill.title} delay={i * 100} direction="up">
                <div className="group bg-card rounded-2xl p-8 border border-border hover:border-primary/20 hover:shadow-xl transition-all duration-500 hover:-translate-y-2 h-full">
                  <div className={`w-16 h-16 rounded-2xl ${skill.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <skill.icon className={`w-8 h-8 ${skill.color}`} />
                  </div>
                  <div className="flex items-baseline gap-2 mb-3">
                    <h3 className="text-xl font-bold text-foreground">{skill.title}</h3>
                    <span className="text-xs text-muted-foreground font-medium">{skill.titleEn}</span>
                  </div>
                  <p className="text-muted-foreground text-sm">{skill.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal delay={400}>
            <div className="text-center mt-12">
              <Button variant="outline" size="lg" className="rounded-2xl h-12 px-8" asChild>
                <Link to="/gioi-thieu">
                  Tìm hiểu chi tiết <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </ScrollReveal>
        </div>
      </section>
  );

  const coursesSection = (
      <section key="courses" className="py-24 bg-muted/30 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-japanese/5 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <ScrollReveal>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-japanese/10 text-japanese text-sm font-semibold mb-4 border border-japanese/20">
                <span className="text-xl">🇯🇵</span> Khóa học JLPT
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-5">
                Lộ trình học Tiếng Nhật toàn diện
              </h2>
              <p className="text-lg text-muted-foreground">
                Từ N5 đến N1, phương pháp chuẩn JLPT thiết kế riêng cho người Việt
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
            {[
              { level: "N5", name: "Sơ cấp", color: "from-green-500 to-green-600" },
              { level: "N4", name: "Sơ trung cấp", color: "from-blue-500 to-blue-600" },
              { level: "N3", name: "Trung cấp", color: "from-purple-500 to-purple-600" },
              { level: "N2", name: "Cao cấp", color: "from-orange-500 to-orange-600" },
              { level: "N1", name: "Thành thạo", color: "from-red-500 to-red-600" },
            ].map((c, i) => (
              <ScrollReveal key={c.level} delay={i * 100} direction="up">
                <div className="group bg-card rounded-2xl p-6 border border-border hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-center">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                    <span className="text-white font-extrabold">{c.level}</span>
                  </div>
                  <h4 className="font-bold text-foreground">{c.name}</h4>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal delay={500}>
            <div className="text-center">
              <Button size="lg" className="rounded-2xl h-14 px-10 text-base" asChild>
                <Link to="/khoa-hoc">
                  Xem tất cả khóa học <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>
          </ScrollReveal>
        </div>
      </section>
  );

  const featuresSection = (
      <section key="features" className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <ScrollReveal direction="left">
              <div>
                <span className="inline-block px-5 py-2.5 rounded-full bg-accent/10 text-accent text-sm font-semibold mb-6 border border-accent/20">
                  Tại sao chọn TNQDO?
                </span>
                <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
                  Công nghệ học tập{" "}
                  <span className="text-primary">tiên tiến</span>
                </h2>
                <p className="text-lg text-muted-foreground mb-10">
                  Kết hợp AI và phương pháp giảng dạy hiện đại để mang đến trải nghiệm học tập tốt nhất
                </p>
                <Button size="lg" className="rounded-2xl h-12 px-8" asChild>
                  <Link to="/gioi-thieu">Khám phá thêm <ArrowRight className="w-4 h-4 ml-2" /></Link>
                </Button>
              </div>
            </ScrollReveal>
            <div className="grid grid-cols-2 gap-5">
              {[
                { icon: Brain, title: "AI Cá nhân hóa", desc: "Phân tích điểm mạnh/yếu tự động" },
                { icon: Target, title: "Lộ trình rõ ràng", desc: "Mục tiêu cụ thể theo tuần/tháng" },
                { icon: Zap, title: "Học nhanh 3x", desc: "Phương pháp Spaced Repetition" },
                { icon: Shield, title: "Cam kết hoàn tiền", desc: "100% hoàn tiền trong 30 ngày" },
              ].map((f, i) => (
                <ScrollReveal key={f.title} delay={i * 100} direction="right">
                  <div className="bg-card rounded-2xl p-6 border border-border hover:shadow-lg transition-all duration-300 group h-full">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md">
                      <f.icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <h3 className="font-bold text-foreground mb-1">{f.title}</h3>
                    <p className="text-sm text-muted-foreground">{f.desc}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </section>
  );

  const zoomSection = (
    <ScrollReveal key="zoom">
      <section className="py-24 bg-muted/30 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="bg-gradient-to-br from-primary to-primary/90 rounded-3xl p-12 md:p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent rounded-full blur-3xl" />
            </div>
            <div className="relative z-10 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/15 text-white mb-8 border border-white/20">
                <Video className="w-4 h-4" />
                <span className="text-sm font-semibold">Học Online qua Zoom</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                Kết nối trực tiếp với giáo viên bản ngữ
              </h2>
              <p className="text-lg text-white/80 mb-10">
                Lớp học trực tuyến chất lượng cao, tương tác 1-1 hoặc nhóm nhỏ tối đa 6 học viên
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="h-14 px-8 bg-white text-primary hover:bg-white/90 rounded-2xl text-base" asChild>
                  <Link to="/gioi-thieu#zoom">
                    <Video className="w-5 h-5 mr-2" />
                    Đăng ký học thử
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="h-14 px-8 rounded-2xl text-base border-white/30 text-white hover:bg-white/10" asChild>
                  <Link to="/giao-vien">
                    Xem giáo viên <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </ScrollReveal>
  );

  const teachersSection = (
      <section key="teachers" className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <ScrollReveal>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-japanese/10 text-japanese text-sm font-semibold mb-4 border border-japanese/20">
                <Award className="w-4 h-4" />
                Đội ngũ giảng viên
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-5">
                Giảng viên xuất sắc, tận tâm
              </h2>
              <p className="text-lg text-muted-foreground">
                Giáo viên bản ngữ và giáo viên Việt Nam giàu kinh nghiệm
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            {teacherList.length === 0 ? (
              <div className="col-span-full py-14 text-center text-muted-foreground">
                Đang cập nhật danh sách giảng viên. Vui lòng quay lại sau.
              </div>
            ) : (
              teacherList.map((t, i) => (
                <ScrollReveal key={t.id} delay={i * 100} direction="up">
                  <div className="group bg-card rounded-2xl overflow-hidden border border-border hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div className="aspect-[4/3] bg-gradient-to-br from-japanese/20 to-primary/20 flex items-center justify-center">
                      {t.avatar_url ? (
                        <img src={t.avatar_url} alt={t.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-card shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                          <span className="text-3xl">👩‍🏫</span>
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <p className="text-xs text-japanese font-medium mb-0.5">{t.headline}</p>
                      <h3 className="font-bold text-foreground">{t.name}</h3>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-4 h-4 text-accent fill-accent" />
                        <span className="text-sm font-semibold">{t.rating}</span>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              ))
            )}
          </div>

          <ScrollReveal delay={400}>
            <div className="text-center">
              <Button variant="outline" size="lg" className="rounded-2xl h-12 px-8" asChild>
                <Link to="/giao-vien">
                  Xem tất cả giáo viên <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </ScrollReveal>
        </div>
      </section>
  );

  const ctaSection = (
    <ScrollReveal key="cta">
      <section className="py-24 bg-gradient-to-br from-primary via-primary to-primary/90 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 text-white mb-8 border border-white/20">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-semibold">Ưu đãi đặc biệt - Giảm 50% khoá học đầu tiên</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Bắt đầu hành trình chinh phục Tiếng Nhật ngay hôm nay
            </h2>
            <p className="text-lg text-white/80 mb-10">
              Tham gia cùng hơn 50,000 học viên đã thành công. Đăng ký miễn phí và nhận 7 ngày Premium!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="h-14 px-10 bg-white text-primary hover:bg-white/90 rounded-2xl text-base shadow-lg" asChild>
                <Link to="/auth">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Đăng ký miễn phí ngay
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="h-14 px-10 rounded-2xl text-base border-white/30 text-white hover:bg-white/10" asChild>
                <Link to="/lien-he">
                  Liên hệ tư vấn <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </ScrollReveal>
  );

  const sectionMap: Record<string, React.ReactNode> = {
    hero: heroSection,
    skills: skillsSection,
    courses: coursesSection,
    features: featuresSection,
    zoom: zoomSection,
    teachers: teachersSection,
    cta: ctaSection,
  };

  return (
    <main className="min-h-screen">
      <Navbar />
      {visibleSections.map(id => sectionMap[id] || null)}
      <Footer />
    </main>
  );
};

export default Index;
