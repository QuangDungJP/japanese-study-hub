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

  // Fetch real published courses for homepage
  const { data: realCourses } = useQuery({
    queryKey: ['home-real-courses'],
    queryFn: async () => {
      const { data } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .order('order_index', { ascending: true })
        .limit(6);
      return data || [];
    },
  });

  const coursesSection = (
      <section key="courses" className="py-24 bg-muted/30 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-japanese/5 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <ScrollReveal>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold mb-3 border border-primary/20">
                <BookOpen className="w-4 h-4" /> Các Khóa Học Thực Tế Tại Trung Tâm
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4">
                Lộ trình học Tiếng Nhật chuyên sâu
              </h2>
              <p className="text-base text-muted-foreground">
                Học trực tiếp với đội ngũ giảng viên giàu kinh nghiệm, cam kết đầu ra JLPT N5 - N1
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-12">
            {(realCourses && realCourses.length > 0) ? (
              realCourses.map((c, i) => (
                <ScrollReveal key={c.id} delay={i * 100} direction="up">
                  <div className="group bg-card rounded-3xl overflow-hidden border border-border hover:shadow-2xl transition-all duration-500 hover:-translate-y-1.5 flex flex-col justify-between h-full">
                    <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                      <img
                        src={c.thumbnail_url || c.cover_image_url || 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&auto=format&fit=crop&q=80'}
                        alt={c.title_vi || c.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3">
                        <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-amber-300 font-black text-xs border border-white/20">
                          {c.level || 'JLPT'}
                        </span>
                      </div>
                    </div>

                    <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
                      <div className="space-y-2">
                        <h3 className="font-extrabold text-lg text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                          {c.title_vi || c.title}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {c.description_vi || c.description || 'Chương trình đào tạo Tiếng Nhật chất lượng cao.'}
                        </p>
                      </div>

                      <div className="pt-3 border-t flex items-center justify-between">
                        <div>
                          <span className="text-xs text-muted-foreground block font-medium">Học phí:</span>
                          <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400 text-base">
                            {c.price ? `${c.price.toLocaleString()}đ` : 'Liên hệ'}
                          </span>
                        </div>
                        <Button size="sm" className="rounded-xl font-bold gap-1" asChild>
                          <Link to={`/khoa-hoc/${c.slug || c.id}`}>
                            Chi tiết <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              ))
            ) : (
              [
                { level: "N5", name: "Khóa Học JLPT N5 Sơ Cấp", price: "2,500,000đ", img: "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600" },
                { level: "N4", name: "Khóa Học JLPT N4 Sơ Trung Cấp", price: "3,200,000đ", img: "https://images.unsplash.com/photo-1528164344705-47542687990d?w=600" },
                { level: "N3", name: "Khóa Học JLPT N3 Trung Cấp", price: "4,500,000đ", img: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=600" },
              ].map((c, i) => (
                <ScrollReveal key={c.level} delay={i * 100} direction="up">
                  <div className="bg-card rounded-3xl p-6 border border-border space-y-3">
                    <img src={c.img} alt={c.name} className="w-full h-36 object-cover rounded-2xl" />
                    <h3 className="font-extrabold text-base">{c.name}</h3>
                    <p className="text-emerald-600 font-bold font-mono text-sm">{c.price}</p>
                  </div>
                </ScrollReveal>
              ))
            )}
          </div>

          <ScrollReveal delay={300}>
            <div className="text-center">
              <Button size="lg" className="rounded-2xl h-14 px-10 text-base font-bold shadow-lg" asChild>
                <Link to="/khoa-hoc">
                  Xem Tất Cả Khóa Học Thực Tế <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>
          </ScrollReveal>
        </div>
      </section>
  );

  const featuresSection = (
      <section key="features" className="py-24 bg-background overflow-hidden">
        <div className="container mx-auto px-4">
          {/* Header Banner - Công nghệ học tập tân tiến */}
          <ScrollReveal>
            <div className="text-center max-w-4xl mx-auto mb-16 space-y-3">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold border border-indigo-200">
                quangdungnihongo.com
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight leading-tight">
                Công Nghệ Học Tập Tân Tiến <br className="hidden md:block" />
                <span className="text-primary">Phục Vụ Bạn Học Và Giáo Viên</span>
              </h2>
              <p className="text-base text-muted-foreground max-w-2xl mx-auto">
                Hệ thống phần mềm tương tác bài giảng trực tiếp, giao diện Classroom hiện đại chuẩn Nhật Bản và theo dõi tiến độ thời gian thực.
              </p>
            </div>
          </ScrollReveal>

          {/* Real Photo Grid Showcase */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch mb-12">
            {/* Left Column: Classroom UI Screenshot */}
            <ScrollReveal direction="left" className="h-full">
              <div className="bg-card rounded-3xl overflow-hidden border border-border shadow-xl hover:shadow-2xl transition-all duration-300 h-full flex flex-col justify-between group">
                <div className="p-6 space-y-2">
                  <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 text-xs font-bold">📚 Giáo Trình & Bài Học</span>
                  <h3 className="font-extrabold text-lg text-foreground">Giáo Trình & Bài Học Theo Buổi / Tuần</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Phân loại bài học, slide trình chiếu và tài liệu Ebook trực quan như Google Classroom.
                  </p>
                </div>
                <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                  <img
                    src="/img/DungChibi_Writing.png"
                    alt="Giáo trình bài học"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLElement).src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                </div>
              </div>
            </ScrollReveal>

            {/* Center Column: Teacher & Student 1-on-1 Interaction */}
            <ScrollReveal direction="up" delay={200} className="h-full">
              <div className="bg-card rounded-3xl overflow-hidden border border-border shadow-xl hover:shadow-2xl transition-all duration-500 h-full flex flex-col justify-between group">
                <div className="p-6 space-y-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-bold">👨‍🏫 Kèm Trực Tiếp 1-1</span>
                  <h3 className="font-extrabold text-lg text-foreground">Giảng Viên Hướng Dẫn Tận Tụy</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Giáo viên trực tiếp giải đáp thắc mắc, chỉnh sửa ngữ pháp và kèm từng học viên.
                  </p>
                </div>
                <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&auto=format&fit=crop&q=80"
                    alt="Giảng viên hướng dẫn"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                </div>
              </div>
            </ScrollReveal>

            {/* Right Column: Code & Interactive App Study */}
            <ScrollReveal direction="right" delay={400} className="h-full">
              <div className="bg-card rounded-3xl overflow-hidden border border-border shadow-xl hover:shadow-2xl transition-all duration-500 h-full flex flex-col justify-between group">
                <div className="p-6 space-y-2">
                  <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 text-xs font-bold">💻 Công Nghệ Web Live</span>
                  <h3 className="font-extrabold text-lg text-foreground">Học Trực Tuyến Mọi Lúc Mọi Nơi</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Giao diện học tập tối ưu trên PC, Laptop và Smartphone mượt mà không độ trễ.
                  </p>
                </div>
                <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=80"
                    alt="Học trực tuyến"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                </div>
              </div>
            </ScrollReveal>
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

  const partnersSection = (
    <div key="partners">
      <PartnersSection />
    </div>
  );

  const sectionMap: Record<string, React.ReactNode> = {
    hero: heroSection,
    skills: skillsSection,
    courses: coursesSection,
    features: featuresSection,
    zoom: zoomSection,
    teachers: teachersSection,
    partners: partnersSection,
    blog: blogSection,
    events: eventsSection,
    testimonials: testimonialsSection,
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
