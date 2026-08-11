import { useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
  Sparkles, Star, Play, BookOpen, Mic, PenTool, Headphones, 
  ArrowRight, Users, Video, Trophy, Brain, Target, Shield, 
  Zap, Award, ChevronRight, Calendar, BookText, MessageSquare
} from "lucide-react";
import { useTeacherProfiles } from "@/hooks/useTeachers";
import ScrollReveal from "@/components/ScrollReveal";
import { useHomepageSections } from "@/hooks/useHomepageSections";
import { useBlogHomeSettings } from "@/hooks/useBlogHomeSettings";
import HeroSection from "@/components/HeroSection";
import TestimonialsSection from "@/components/about/TestimonialsSection";
import PartnersSection from "@/components/PartnersSection";

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
    name: t.display_name || tProfileName(t),
    headline: t.headline || "Giảng viên",
    avatar_url: t.image_url || t.profile?.avatar_url || "",
    rating: t.rating || 0,
  }));

  function tProfileName(t: any) {
    return t.profile?.full_name || "Giảng viên";
  }

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
  const heroSection = <HeroSection key="hero" />;

  const skillsSection = (
      <section key="skills" className="py-24 bg-background relative">
        <div className="container mx-auto px-4">
          <ScrollReveal>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4">
                Phát triển toàn diện ngôn ngữ
              </h2>
              <p className="text-base text-muted-foreground">
                Hệ thống bài học khoa học giúp bạn tiến bộ nhanh chóng và tự tin sử dụng Tiếng Nhật
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
              <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4">
                Lộ trình học Tiếng Nhật toàn diện
              </h2>
              <p className="text-base text-muted-foreground">
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
                <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4 leading-tight">
                  Công nghệ học tập{" "}
                  <span className="text-primary">tiên tiến</span>
                </h2>
                <p className="text-base text-muted-foreground mb-8">
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
            <div className="relative z-10 max-w-3xl mx-auto space-y-4">
              <h2 className="text-3xl md:text-5xl font-bold text-white">
                Kết nối trực tiếp với giáo viên bản ngữ
              </h2>
              <p className="text-base md:text-lg text-white/80 max-w-2xl mx-auto">
                Lớp học trực tuyến chất lượng cao, tương tác 1-1 hoặc nhóm nhỏ tối đa 6 học viên
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button size="lg" className="h-12 px-8 bg-white text-primary hover:bg-white/90 rounded-2xl text-base font-bold" asChild>
                  <Link to="/zoom">
                    <Video className="w-5 h-5 mr-2" />
                    Đăng ký học thử
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="h-12 px-8 rounded-2xl text-base border-white/30 text-white hover:bg-white/10 font-bold" asChild>
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
              <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4">
                Giảng viên xuất sắc, tận tâm
              </h2>
              <p className="text-base text-muted-foreground">
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
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold text-white">
              Bắt đầu hành trình chinh phục Tiếng Nhật ngay hôm nay
            </h2>
            <p className="text-base md:text-lg text-white/80 max-w-2xl mx-auto">
              Tham gia cùng hơn 50,000 học viên đã thành công. Đăng ký miễn phí và nhận 7 ngày Premium!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" className="h-12 px-10 bg-white text-primary hover:bg-white/90 rounded-2xl text-base font-bold shadow-lg" asChild>
                <Link to="/auth">
                  <Sparkles className="w-5 h-5 mr-2 text-amber-500" />
                  Đăng ký miễn phí ngay
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="h-12 px-10 rounded-2xl text-base border-white/30 text-white hover:bg-white/10 font-bold" asChild>
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

  // Dynamic queries for Homepage Blog & Events using pinned settings from /admin/blog
  const { data: blogHomeSettings } = useBlogHomeSettings();

  const { data: blogPosts = [] } = useQuery({
    queryKey: ['homepage-blogs', blogHomeSettings],
    queryFn: async () => {
      const query = supabase.from('blog_posts').select('*').eq('is_published', true);

      const targetIds = [...(blogHomeSettings?.pinned_ids || []), ...(blogHomeSettings?.home_ids || [])];
      if (targetIds.length > 0) {
        const { data: pinnedData } = await supabase
          .from('blog_posts')
          .select('*')
          .in('id', targetIds)
          .eq('is_published', true);

        if (pinnedData && pinnedData.length > 0) {
          return pinnedData;
        }
      }

      const { data } = await query.order('published_at', { ascending: false }).limit(6);
      return data || [];
    },
  });

  const { data: homeEvents = [] } = useQuery({
    queryKey: ['homepage-events'],
    queryFn: async () => {
      const { data } = await supabase
        .from('events')
        .select('*')
        .eq('is_published', true)
        .order('event_date', { ascending: true })
        .limit(3);
      return data || [];
    },
  });

  const blogSection = (
    <ScrollReveal key="blog">
      <section className="py-20 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 text-blue-600 text-xs font-bold mb-3 border border-blue-200">
                <BookText className="w-4 h-4" /> Tin tức & Bài viết
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold">Kinh nghiệm & Bí quyết học Tiếng Nhật</h2>
            </div>
            <Button variant="outline" asChild className="rounded-xl font-bold">
              <Link to="/blog">Xem tất cả bài viết <ArrowRight className="w-4 h-4 ml-1.5" /></Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {blogPosts.length === 0 ? (
              <div className="col-span-full text-center py-10 text-muted-foreground">Đang cập nhật bài viết mới...</div>
            ) : (
              blogPosts.slice(0, 6).map((post) => (
                <div key={post.id} className="bg-card rounded-2xl overflow-hidden border shadow-sm hover:shadow-lg transition-all group flex flex-col">
                  <div className="aspect-[16/9] overflow-hidden bg-muted relative">
                    {post.thumbnail_url ? (
                      <img
                        src={post.thumbnail_url}
                        alt={post.title_vi || post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          // Fallback to placeholder gradient on error
                          (e.target as HTMLElement).style.display = 'none';
                          const parent = (e.target as HTMLElement).parentElement;
                          if (parent) {
                            const fallback = document.createElement('div');
                            fallback.className = 'w-full h-full bg-gradient-to-tr from-primary/20 via-japanese/10 to-accent/20 flex items-center justify-center font-bold text-primary text-sm p-4 text-center';
                            fallback.innerText = post.title_vi || post.title || 'TNQDO Blog';
                            parent.appendChild(fallback);
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-primary/20 via-japanese/10 to-accent/20 flex flex-col items-center justify-center p-4 text-center">
                        <BookText className="w-8 h-8 text-primary opacity-60 mb-1" />
                        <span className="font-bold text-xs text-foreground line-clamp-2">{post.title_vi || post.title}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-5 space-y-2 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-primary uppercase tracking-wider">{post.category || 'Chia sẻ'}</span>
                      <h3 className="font-bold text-base line-clamp-2 text-foreground group-hover:text-primary transition-colors">{post.title_vi || post.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">{post.excerpt_vi || post.excerpt || 'Đọc chi tiết kinh nghiệm học Tiếng Nhật trên TNQDO Japanese Hub'}</p>
                    </div>
                    <Link to={`/blog/${post.slug || post.id}`} className="inline-flex items-center text-xs font-bold text-primary pt-3">
                      Đọc tiếp <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </ScrollReveal>
  );

  const eventsSection = (
    <ScrollReveal key="events">
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/10 text-rose-600 text-xs font-bold mb-3 border border-rose-200">
                <Calendar className="w-4 h-4" /> Sự kiện nổi bật
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold">Hội thảo & Workshop Tiếng Nhật</h2>
            </div>
            <Button variant="outline" asChild className="rounded-xl font-bold">
              <Link to="/su-kien">Xem lịch sự kiện <ArrowRight className="w-4 h-4 ml-1.5" /></Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {homeEvents.length === 0 ? (
              <div className="col-span-full text-center py-10 text-muted-foreground">Chưa có sự kiện nào diễn ra.</div>
            ) : (
              homeEvents.map((evt) => (
                <div key={evt.id} className="bg-card rounded-2xl overflow-hidden border shadow-sm hover:shadow-lg transition-all p-5 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-rose-600">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {evt.event_date || 'Sắp diễn ra'}</span>
                    <span>{(evt as any).location_type === 'online' ? '🌐 Online' : '📍 Offline'}</span>
                  </div>
                  <h3 className="font-bold text-base text-foreground">{evt.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">{evt.description_vi || evt.description}</p>
                  <Button size="sm" variant="secondary" className="w-full text-xs font-bold" asChild>
                    <Link to={`/su-kien/${evt.id}`}>Đăng ký tham gia</Link>
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </ScrollReveal>
  );

  const testimonialsSection = (
    <div key="testimonials">
      <TestimonialsSection homepageOnly={true} />
    </div>
  );

  const sectionMap: Record<string, React.ReactNode> = {
    hero: heroSection,
    skills: skillsSection,
    courses: coursesSection,
    features: featuresSection,
    zoom: zoomSection,
    teachers: teachersSection,
    blog: blogSection,
    events: eventsSection,
    testimonials: testimonialsSection,
    cta: ctaSection,
  };

  return (
    <main className="min-h-screen">
      <Navbar />
      {visibleSections.map(id => sectionMap[id] || null)}
      <PartnersSection />
      <Footer />
    </main>
  );
};

export default Index;
