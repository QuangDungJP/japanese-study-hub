import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import TeachersSection from "@/components/TeachersSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { usePageSetting } from "@/hooks/usePageSettings";
import {
  Sparkles, BookOpen, Clock, Users, Star, ArrowRight,
  GraduationCap, Trophy, Target, Zap, CheckCircle2, Flame, Filter
} from "lucide-react";
import courseDefaultImg from "@/assets/course-default-jp.jpg";
import PromotionPolicySection from "@/components/courses/PromotionPolicySection";
import StudentBenefitsSection from "@/components/courses/StudentBenefitsSection";
interface Course {
  id: string;
  title: string;
  title_vi: string;
  description_vi: string | null;
  description: string | null;
  price: number;
  original_price: number | null;
  duration_weeks: number | null;
  level: string;
  language: string;
  thumbnail_url: string | null;
  features: any;
  slug: string | null;
  is_published: boolean | null;
  is_featured?: boolean | null;
}

interface CourseTeacher {
  course_id: string;
  teacher_id: string;
  teacher?: {
    id: string;
    display_name: string | null;
    image_url: string | null;
    slug: string | null;
  };
}

const levelConfig: Record<string, { color: string; gradient: string; label: string; kanji: string; bg: string }> = {
  N5: { color: "text-emerald-600", gradient: "from-emerald-500 to-teal-600", label: "Sơ cấp", kanji: "初", bg: "bg-emerald-500/10" },
  N4: { color: "text-blue-600", gradient: "from-blue-500 to-indigo-600", label: "Sơ trung cấp", kanji: "基", bg: "bg-blue-500/10" },
  N3: { color: "text-violet-600", gradient: "from-violet-500 to-purple-600", label: "Trung cấp", kanji: "中", bg: "bg-violet-500/10" },
  N2: { color: "text-amber-600", gradient: "from-amber-500 to-orange-600", label: "Cao cấp", kanji: "上", bg: "bg-amber-500/10" },
  N1: { color: "text-japanese", gradient: "from-red-500 to-rose-600", label: "Thành thạo", kanji: "極", bg: "bg-red-500/10" },
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(price);

const CoursesPage = () => {
  const { data: page } = usePageSetting("courses");
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseTeachers, setCourseTeachers] = useState<Record<string, CourseTeacher[]>>({});
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState<string>("all");

  useEffect(() => {
    const fetchAll = async () => {
      const { data: courseData } = await supabase
        .from("courses")
        .select("*")
        .eq("is_published", true)
        .order("level", { ascending: true });

      const list = courseData || [];
      setCourses(list);

      if (list.length > 0) {
        const courseIds = list.map((c) => c.id);
        const { data: ctData } = await (supabase as any)
          .from("course_teachers")
          .select("course_id, teacher_id, order_index, role_vi")
          .in("course_id", courseIds);

        const teacherIds = Array.from(
          new Set((ctData || []).map((ct: any) => ct.teacher_id as string))
        );
        let teacherMap: Record<string, any> = {};
        if (teacherIds.length > 0) {
          const { data: teachers } = await supabase
            .from("teacher_profiles")
            .select("id, display_name, image_url, slug")
            .in("id", teacherIds as string[]);
          (teachers || []).forEach((t) => { teacherMap[t.id] = t; });
        }

        const grouped: Record<string, CourseTeacher[]> = {};
        (ctData || []).forEach((ct: any) => {
          if (!grouped[ct.course_id]) grouped[ct.course_id] = [];
          grouped[ct.course_id].push({ ...ct, teacher: teacherMap[ct.teacher_id] });
        });
        setCourseTeachers(grouped);
      }

      setLoading(false);
    };
    fetchAll();
  }, []);

  const filteredCourses = useMemo(() => {
    if (filterLevel === "all") return courses;
    return courses.filter((c) => c.level === filterLevel);
  }, [courses, filterLevel]);

  const featured = courses.find((c) => (c as any).is_featured) || courses[0];
  const heroTitle = page?.hero_title_vi || "Khóa học Tiếng Nhật toàn diện";
  const heroSubtitle = page?.hero_subtitle_vi || "Từ N5 đến N1 — lộ trình chuẩn JLPT, đồng hành cùng giảng viên bản ngữ và Việt Nam giàu kinh nghiệm";
  const displayName = page?.display_name_vi || "Khóa học";

  const levels = ["all", "N5", "N4", "N3", "N2", "N1"];

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      {/* HERO */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-japanese/5 via-background to-primary/5">
          <div className="absolute top-20 left-10 w-72 h-72 bg-japanese/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-japanese/10 text-japanese text-sm font-semibold mb-6 border border-japanese/20">
              <Sparkles className="w-4 h-4" /> {displayName} JLPT N5 → N1
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold text-foreground mb-6 leading-tight">
              {heroTitle.includes("Tiếng Nhật") ? (
                <>
                  {heroTitle.split("Tiếng Nhật")[0]}
                  <span className="bg-gradient-to-r from-japanese to-red-600 bg-clip-text text-transparent">Tiếng Nhật</span>
                  {heroTitle.split("Tiếng Nhật")[1]}
                </>
              ) : heroTitle}
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              {heroSubtitle}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="japanese" size="lg" asChild>
                <Link to="/auth"><GraduationCap className="w-5 h-5 mr-2" /> Học thử miễn phí</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a href="#all-courses">Xem tất cả khóa học</a>
              </Button>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 max-w-3xl mx-auto">
              {[
                { icon: BookOpen, value: "1000+", label: "Bài học" },
                { icon: Users, value: "5000+", label: "Học viên" },
                { icon: Trophy, value: "98%", label: "Đỗ JLPT" },
                { icon: Star, value: "4.9/5", label: "Đánh giá" },
              ].map((s) => (
                <div key={s.label} className="bg-card/60 backdrop-blur rounded-2xl p-4 border border-border">
                  <s.icon className="w-6 h-6 text-japanese mx-auto mb-2" />
                  <div className="text-2xl font-extrabold text-foreground">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED */}
      {featured && (
        <ScrollReveal>
          <section className="py-16">
            <div className="container mx-auto px-4">
              <div className="text-center mb-10">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 text-orange-600 text-xs font-semibold mb-3">
                  <Flame className="w-3.5 h-3.5" /> Khóa học nổi bật
                </span>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground">Bắt đầu ngay hôm nay</h2>
              </div>

              <div className="max-w-6xl mx-auto bg-gradient-to-br from-card via-card to-japanese/5 rounded-3xl border border-border shadow-card-hover overflow-hidden">
                <div className="grid lg:grid-cols-2 gap-0">
                  <div className="relative aspect-video lg:aspect-auto bg-gradient-to-br from-japanese/20 to-primary/20">
                    <img
                      src={featured.thumbnail_url || courseDefaultImg}
                      alt={featured.title_vi}
                      className="absolute inset-0 w-full h-full object-cover"
                      width={1280}
                      height={720}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    <div className="absolute bottom-4 left-4">
                      <span className={`text-7xl font-bold bg-gradient-to-br ${(levelConfig[featured.level] || levelConfig.N5).gradient} bg-clip-text text-transparent drop-shadow-lg`}>
                        {(levelConfig[featured.level] || levelConfig.N5).kanji}
                      </span>
                    </div>
                    <Badge className="absolute top-4 left-4 bg-orange-500 text-white border-0">
                      <Flame className="w-3 h-3 mr-1" /> Hot
                    </Badge>
                  </div>
                  <div className="p-8 lg:p-12 flex flex-col justify-center">
                    <Badge className={`bg-gradient-to-r ${(levelConfig[featured.level] || levelConfig.N5).gradient} text-white border-0 w-fit mb-3`}>
                      JLPT {featured.level}
                    </Badge>
                    <h3 className="text-3xl font-bold text-foreground mb-3">{featured.title_vi}</h3>
                    <p className="text-muted-foreground mb-6 line-clamp-3">
                      {featured.description_vi || featured.description || "Khóa học toàn diện chuẩn JLPT."}
                    </p>
                    <div className="flex items-end gap-3 mb-6">
                      <span className="text-3xl font-extrabold text-foreground">{formatPrice(featured.price)}</span>
                      {featured.original_price && featured.original_price > featured.price && (
                        <span className="text-lg text-muted-foreground line-through pb-1">{formatPrice(featured.original_price)}</span>
                      )}
                    </div>
                    <Button variant="japanese" size="lg" asChild className="w-fit">
                      <Link to={`/khoa-hoc/${featured.slug || featured.id}`}>
                        Xem chi tiết <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </ScrollReveal>
      )}

      {/* ALL COURSES + FILTER */}
      <ScrollReveal>
        <section id="all-courses" className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Tất cả khóa học</h2>
              <p className="text-lg text-muted-foreground">
                Chọn cấp độ phù hợp với bạn và bắt đầu hành trình chinh phục tiếng Nhật
              </p>
            </div>

            {/* Filter pills */}
            <div className="flex flex-wrap justify-center gap-2 mb-10">
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground mr-2">
                <Filter className="w-4 h-4" /> Lọc theo cấp độ:
              </span>
              {levels.map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setFilterLevel(lvl)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    filterLevel === lvl
                      ? "bg-japanese text-white shadow-md"
                      : "bg-card text-muted-foreground hover:text-foreground hover:bg-muted border border-border"
                  }`}
                >
                  {lvl === "all" ? "Tất cả" : lvl}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-[420px] rounded-2xl" />
                ))}
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                Chưa có khóa học nào ở cấp độ này. Vui lòng quay lại sau.
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((course) => {
                  const cfg = levelConfig[course.level] || levelConfig.N5;
                  const features = Array.isArray(course.features) ? (course.features as string[]) : [];
                  const teachers = courseTeachers[course.id] || [];
                  const discount = course.original_price && course.original_price > course.price
                    ? Math.round(((course.original_price - course.price) / course.original_price) * 100)
                    : 0;

                  return (
                    <Link
                      key={course.id}
                      to={`/khoa-hoc/${course.slug || course.id}`}
                      className="group bg-card rounded-2xl border border-border overflow-hidden shadow-soft hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 flex flex-col"
                    >
                      {/* Thumbnail */}
                      <div className={`relative aspect-video ${cfg.bg} overflow-hidden`}>
                        <img
                          src={course.thumbnail_url || courseDefaultImg}
                          alt={course.title_vi}
                          loading="lazy"
                          width={1280}
                          height={720}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                        <span className={`absolute bottom-2 right-3 text-5xl font-bold bg-gradient-to-br ${cfg.gradient} bg-clip-text text-transparent drop-shadow`}>
                          {cfg.kanji}
                        </span>
                        <Badge className={`absolute top-3 left-3 bg-gradient-to-r ${cfg.gradient} text-white border-0`}>
                          JLPT {course.level}
                        </Badge>
                        {discount > 0 && (
                          <Badge variant="destructive" className="absolute top-3 right-3">
                            -{discount}%
                          </Badge>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-5 flex-1 flex flex-col">
                        <h3 className="font-bold text-lg text-foreground mb-2 line-clamp-2 group-hover:text-japanese transition-colors">
                          {course.title_vi}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {course.description_vi || course.description || cfg.label}
                        </p>

                        {/* Meta */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> {course.duration_weeks || 12} tuần
                          </span>
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5" /> {features.length || 6} module
                          </span>
                        </div>

                        {/* Features preview */}
                        {features.length > 0 && (
                          <div className="space-y-1.5 mb-4">
                            {features.slice(0, 2).map((f, i) => (
                              <div key={i} className="flex items-start gap-2 text-xs text-foreground">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                                <span className="line-clamp-1">{f}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Teachers */}
                        {teachers.length > 0 && (
                          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border">
                            <div className="flex -space-x-2">
                              {teachers.slice(0, 3).map((ct) => (
                                <div key={ct.teacher_id} className="w-7 h-7 rounded-full bg-muted border-2 border-card overflow-hidden">
                                  {ct.teacher?.image_url ? (
                                    <img src={ct.teacher.image_url} alt={ct.teacher.display_name || ""} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xs">👩‍🏫</div>
                                  )}
                                </div>
                              ))}
                            </div>
                            <span className="text-xs text-muted-foreground truncate">
                              {teachers[0].teacher?.display_name}
                              {teachers.length > 1 && ` +${teachers.length - 1}`}
                            </span>
                          </div>
                        )}

                        {/* Price + CTA */}
                        <div className="mt-auto flex items-end justify-between gap-2">
                          <div>
                            <div className="text-xl font-extrabold text-foreground">{formatPrice(course.price)}</div>
                            {course.original_price && course.original_price > course.price && (
                              <div className="text-xs text-muted-foreground line-through">{formatPrice(course.original_price)}</div>
                            )}
                          </div>
                          <span className={`inline-flex items-center gap-1 text-sm font-semibold ${cfg.color} group-hover:gap-2 transition-all`}>
                            Chi tiết <ArrowRight className="w-4 h-4" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </ScrollReveal>

      {/* WHY US */}
      <ScrollReveal>
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Vì sao chọn khóa học của chúng tôi?
              </h2>
              <p className="text-lg text-muted-foreground">
                Phương pháp học hiện đại — kết quả thực tế
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {[
                { icon: Target, title: "Lộ trình chuẩn JLPT", desc: "Bám sát đề thi thật, từ N5 lên N1 có hệ thống rõ ràng." },
                { icon: Zap, title: "Học mọi lúc mọi nơi", desc: "Video HD + bài tập tương tác trên web/mobile, học offline được." },
                { icon: Trophy, title: "Cam kết kết quả", desc: "98% học viên đậu JLPT đúng kỳ thi đăng ký, hoàn phí nếu trượt." },
              ].map((b) => (
                <div key={b.title} className="bg-card rounded-2xl p-6 border border-border shadow-soft hover:shadow-card-hover transition-all">
                  <div className="w-12 h-12 rounded-xl bg-japanese/10 flex items-center justify-center mb-4">
                    <b.icon className="w-6 h-6 text-japanese" />
                  </div>
                  <h3 className="font-bold text-foreground mb-2">{b.title}</h3>
                  <p className="text-sm text-muted-foreground">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>
      {/* PROMOTION POLICY */}
      <ScrollReveal>
        <PromotionPolicySection />
      </ScrollReveal>

      {/* STUDENT BENEFITS */}
      <ScrollReveal>
        <StudentBenefitsSection />
      </ScrollReveal>
      {/* TEACHERS */}
      <ScrollReveal>
        <TeachersSection />
      </ScrollReveal>

      {/* CTA */}
      <ScrollReveal>
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto bg-gradient-to-r from-japanese via-red-600 to-rose-600 rounded-3xl p-12 md:p-16 text-center text-white overflow-hidden relative">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-10 right-10 text-[200px] font-bold">日</div>
                <div className="absolute bottom-10 left-10 text-[150px] font-bold">本</div>
              </div>
              <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
                  Sẵn sàng bắt đầu hành trình tiếng Nhật?
                </h2>
                <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
                  Đăng ký học thử miễn phí 7 ngày — không cần thẻ tín dụng
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Button size="lg" className="bg-white text-japanese hover:bg-white/90 text-lg h-14 px-8" asChild>
                    <Link to="/auth"><GraduationCap className="w-5 h-5 mr-2" /> Học thử miễn phí</Link>
                  </Button>
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 text-lg h-14 px-8" asChild>
                    <Link to="/lien-he">Tư vấn lộ trình</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>

      <Footer />
    </main>
  );
};

export default CoursesPage;
