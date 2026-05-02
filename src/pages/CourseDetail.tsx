import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  BookOpen, Clock, Users, Star, CheckCircle2, ArrowLeft,
  Trophy, Target, Zap, GraduationCap, Play, Calendar, ArrowRight, Sparkles
} from "lucide-react";
import courseDefaultImg from "@/assets/course-default-jp.jpg";

interface Course {
  id: string;
  title: string;
  title_vi: string;
  description: string | null;
  description_vi: string | null;
  price: number;
  original_price: number | null;
  duration_weeks: number | null;
  level: string;
  language: string;
  is_published: boolean | null;
  features: any;
  thumbnail_url: string | null;
}

const levelConfig: Record<string, { color: string; gradient: string; label: string; kanji: string }> = {
  N5: { color: "text-emerald-600", gradient: "from-emerald-500 to-teal-600", label: "Sơ cấp", kanji: "初" },
  N4: { color: "text-blue-600", gradient: "from-blue-500 to-indigo-600", label: "Sơ trung cấp", kanji: "基" },
  N3: { color: "text-violet-600", gradient: "from-violet-500 to-purple-600", label: "Trung cấp", kanji: "中" },
  N2: { color: "text-amber-600", gradient: "from-amber-500 to-orange-600", label: "Cao cấp", kanji: "上" },
  N1: { color: "text-japanese", gradient: "from-red-500 to-rose-600", label: "Thành thạo", kanji: "極" },
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

const CourseDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [lessonCount, setLessonCount] = useState(0);
  const [teachers, setTeachers] = useState<Array<{ id: string; display_name: string | null; image_url: string | null; bio_vi: string | null; slug: string | null; experience_years: number | null }>>([]);
  const [related, setRelated] = useState<Course[]>([]);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    const fetchCourse = async () => {
      // Detect if param is UUID or slug
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
      const query = supabase.from("courses").select("*").eq("is_published", true);
      const { data } = isUuid
        ? await query.eq("id", slug).maybeSingle()
        : await query.eq("slug", slug).maybeSingle();
      setCourse(data);

      if (data) {
        const { count } = await supabase
          .from("lessons")
          .select("*", { count: "exact", head: true })
          .eq("level", data.level)
          .eq("is_published", true);
        setLessonCount(count || 0);

        const { data: ct } = await (supabase as any)
          .from("course_teachers")
          .select("teacher_id")
          .eq("course_id", data.id);
        const teacherIds = (ct || []).map((c: any) => c.teacher_id as string);
        if (teacherIds.length > 0) {
          const { data: tData } = await supabase
            .from("teacher_profiles")
            .select("id, display_name, image_url, bio_vi, slug, experience_years")
            .in("id", teacherIds);
          setTeachers(tData || []);
        } else {
          setTeachers([]);
        }

        // Related: same language, exclude current
        const { data: relData } = await supabase
          .from("courses")
          .select("*")
          .eq("is_published", true)
          .eq("language", data.language)
          .neq("id", data.id)
          .limit(3);
        setRelated(relData || []);
      }
      setLoading(false);
    };
    fetchCourse();
  }, [slug]);

  const config = course ? levelConfig[course.level] || levelConfig.N5 : levelConfig.N5;
  const features = Array.isArray(course?.features) ? (course.features as string[]) : [];
  const discount = course?.original_price && course.original_price > course.price
    ? Math.round(((course.original_price - course.price) / course.original_price) * 100)
    : 0;

  if (loading) {
    return (
      <main className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 pt-28 pb-16">
          <Skeleton className="h-[500px] rounded-3xl" />
        </div>
        <Footer />
      </main>
    );
  }

  if (!course) {
    return (
      <main className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 pt-28 pb-16 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-4">Khóa học không tìm thấy</h1>
          <Button asChild><Link to="/khoa-hoc">Quay lại</Link></Button>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-24 pb-0 overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-[0.06]`} />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-japanese/5 blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <Link to="/khoa-hoc" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Tất cả khóa học</span>
          </Link>

          <div className="grid lg:grid-cols-5 gap-12 items-start pb-16">
            {/* Left - Info */}
            <div className="lg:col-span-3 space-y-6">
              <div className="flex items-center gap-3">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg`}>
                  <span className="text-2xl font-bold text-white">{config.kanji}</span>
                </div>
                <div>
                  <Badge className={`bg-gradient-to-r ${config.gradient} text-white border-0 text-sm px-3 py-1`}>
                    JLPT {course.level}
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-1">{config.label}</p>
                </div>
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground leading-tight">
                {course.title_vi}
              </h1>

              <p className="text-lg text-muted-foreground leading-relaxed">
                {course.description_vi || course.description || "Khóa học tiếng Nhật toàn diện, giúp bạn chinh phục kỳ thi JLPT một cách tự tin."}
              </p>

              {/* Stats */}
              <div className="flex flex-wrap gap-6 pt-2">
                {[
                  { icon: Clock, label: `${course.duration_weeks || 12} tuần`, sub: "Thời lượng" },
                  { icon: BookOpen, label: `${lessonCount}+`, sub: "Bài học" },
                  { icon: Star, label: "4.9/5", sub: "Đánh giá" },
                  { icon: Users, label: "500+", sub: "Học viên" },
                ].map((stat) => (
                  <div key={stat.sub} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                      <stat.icon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{stat.label}</p>
                      <p className="text-xs text-muted-foreground">{stat.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right - Pricing Card */}
            <div className="lg:col-span-2">
              <div className="bg-card rounded-3xl border border-border shadow-card-hover p-8 sticky top-28">
                <div className="aspect-video rounded-2xl overflow-hidden mb-6 bg-muted relative">
                  <img
                    src={course.thumbnail_url || courseDefaultImg}
                    alt={course.title_vi}
                    className="w-full h-full object-cover"
                    width={1280}
                    height={720}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                </div>

                <div className="space-y-4">
                  <div className="flex items-end gap-3">
                    <span className="text-4xl font-extrabold text-foreground">{formatPrice(course.price)}</span>
                    {discount > 0 && (
                      <div className="flex items-center gap-2 pb-1">
                        <span className="text-lg text-muted-foreground line-through">{formatPrice(course.original_price!)}</span>
                        <Badge variant="destructive" className="text-xs">-{discount}%</Badge>
                      </div>
                    )}
                  </div>

                  <Button variant="japanese" size="lg" className="w-full text-lg h-14" asChild>
                    <Link to="/auth">
                      <GraduationCap className="w-5 h-5 mr-2" />
                      Đăng ký ngay
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" className="w-full" asChild>
                    <Link to="/auth">
                      <Play className="w-4 h-4 mr-2" />
                      Học thử miễn phí
                    </Link>
                  </Button>

                  <div className="pt-4 space-y-3 border-t border-border">
                    {[
                      "Truy cập trọn đời",
                      "Chứng chỉ hoàn thành",
                      "Hỗ trợ giáo viên 1-1",
                      "Cập nhật nội dung miễn phí",
                    ].map((item) => (
                      <div key={item} className="flex items-center gap-3 text-sm text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features & What you'll learn */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12">
            {/* What you'll learn */}
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-8 flex items-center gap-3">
                <Target className="w-6 h-6 text-japanese" />
                Bạn sẽ học được gì?
              </h2>
              <div className="grid gap-4">
                {(features.length > 0 ? features : [
                  "Nắm vững toàn bộ ngữ pháp cấp độ " + course.level,
                  "Luyện nghe - nói với giáo viên bản ngữ",
                  "Thuộc lòng Kanji & từ vựng cần thiết",
                  "Kỹ năng đọc hiểu văn bản thực tế",
                  "Chuẩn bị tốt nhất cho kỳ thi JLPT",
                  "Giao tiếp tự tin trong môi trường Nhật",
                ]).map((feature, i) => (
                  <div key={i} className="flex items-start gap-3 bg-card rounded-xl p-4 border border-border">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Course highlights */}
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-8 flex items-center gap-3">
                <Zap className="w-6 h-6 text-accent" />
                Điểm nổi bật
              </h2>
              <div className="grid gap-4">
                {[
                  { icon: Trophy, title: "Lộ trình chuẩn JLPT", desc: "Được thiết kế bởi giáo viên bản ngữ, sát đề thi thật" },
                  { icon: Play, title: "Video bài giảng HD", desc: "Xem lại không giới hạn, học mọi lúc mọi nơi" },
                  { icon: Users, title: "Zoom Class 1-1", desc: "Luyện nói trực tiếp với giáo viên Nhật Bản" },
                  { icon: Calendar, title: "Lịch học linh hoạt", desc: "Tự sắp xếp thời gian phù hợp với bạn" },
                  { icon: GraduationCap, title: "Bài tập thực hành", desc: "Hàng trăm bài tập đa dạng theo từng bài" },
                  { icon: Star, title: "Cộng đồng học tập", desc: "Kết nối với hàng nghìn bạn học cùng trình độ" },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-4 bg-card rounded-xl p-4 border border-border group hover:border-japanese/30 transition-colors">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.gradient} bg-opacity-10 flex items-center justify-center flex-shrink-0`}>
                      <item.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TEACHERS */}
      {teachers.length > 0 && (
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-3 flex items-center justify-center gap-3">
                <GraduationCap className="w-7 h-7 text-japanese" /> Giảng viên phụ trách
              </h2>
              <p className="text-muted-foreground">Đội ngũ giảng viên đồng hành cùng bạn trong khóa học này</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {teachers.map((t) => (
                <Link
                  key={t.id}
                  to={`/giao-vien/${t.slug || t.id}`}
                  className="bg-card rounded-2xl border border-border p-6 hover:shadow-card-hover hover:-translate-y-1 transition-all group"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-muted overflow-hidden ring-2 ring-japanese/20 group-hover:ring-japanese/50 transition-all">
                      {t.image_url ? (
                        <img src={t.image_url} alt={t.display_name || ""} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">👩‍🏫</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-foreground truncate">{t.display_name || "Giảng viên"}</h3>
                      {t.experience_years ? (
                        <p className="text-xs text-muted-foreground">{t.experience_years} năm kinh nghiệm</p>
                      ) : null}
                    </div>
                  </div>
                  {t.bio_vi && <p className="text-sm text-muted-foreground line-clamp-3">{t.bio_vi}</p>}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* RELATED COURSES */}
      {related.length > 0 && (
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-japanese/10 text-japanese text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5" /> Có thể bạn cũng thích
              </span>
              <h2 className="text-3xl font-bold text-foreground">Khóa học liên quan</h2>
              <p className="text-muted-foreground mt-2">Tiếp tục nâng trình với các khóa học khác</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {related.map((rc) => {
                const rcCfg = levelConfig[rc.level] || levelConfig.N5;
                return (
                  <Link
                    key={rc.id}
                    to={`/khoa-hoc/${(rc as any).slug || rc.id}`}
                    className="group bg-card rounded-2xl border border-border overflow-hidden shadow-soft hover:shadow-card-hover hover:-translate-y-1 transition-all"
                  >
                    <div className="relative aspect-video overflow-hidden">
                      <img
                        src={rc.thumbnail_url || courseDefaultImg}
                        alt={rc.title_vi}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      <Badge className={`absolute top-3 left-3 bg-gradient-to-r ${rcCfg.gradient} text-white border-0`}>
                        JLPT {rc.level}
                      </Badge>
                    </div>
                    <div className="p-5">
                      <h3 className="font-bold text-foreground line-clamp-2 mb-2 group-hover:text-japanese transition-colors">
                        {rc.title_vi}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {rc.description_vi || rc.description || rcCfg.label}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-foreground">{formatPrice(rc.price)}</span>
                        <span className={`inline-flex items-center gap-1 text-sm font-semibold ${rcCfg.color} group-hover:gap-2 transition-all`}>
                          Xem <ArrowRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <div className={`bg-gradient-to-r ${config.gradient} rounded-3xl p-12 md:p-16 text-white`}>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
              Sẵn sàng chinh phục JLPT {course.level}?
            </h2>
            <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
              Đăng ký ngay hôm nay để bắt đầu hành trình học tiếng Nhật cùng đội ngũ giáo viên hàng đầu
            </p>
            <Button size="lg" className="bg-white text-foreground hover:bg-white/90 text-lg h-14 px-8" asChild>
              <Link to="/auth">
                <GraduationCap className="w-5 h-5 mr-2" />
                Đăng ký khóa học {course.level}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default CourseDetail;