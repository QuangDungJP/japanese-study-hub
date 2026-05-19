import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Database, Json } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  BookOpen, Clock, Users, Star, CheckCircle2, ArrowLeft,
  Trophy, Target, Zap, GraduationCap, Play, Calendar, ArrowRight,
  Sparkles, MapPin, Award, Quote, HelpCircle, ListChecks, Flame, AlertCircle
} from "lucide-react";
import courseDefaultImg from "@/assets/course-default-jp.webp";
import ScrollReveal from "@/components/ScrollReveal";
import PromotionPolicySection from "@/components/courses/PromotionPolicySection";
import StudentBenefitsSection from "@/components/courses/StudentBenefitsSection";
type Course = Database["public"]["Tables"]["courses"]["Row"];

const levelConfig: Record<string, { color: string; gradient: string; label: string; kanji: string }> = {
  N5: { color: "text-emerald-600", gradient: "from-emerald-500 to-teal-600", label: "Sơ cấp", kanji: "初" },
  N4: { color: "text-blue-600", gradient: "from-blue-500 to-indigo-600", label: "Sơ trung cấp", kanji: "基" },
  N3: { color: "text-violet-600", gradient: "from-violet-500 to-purple-600", label: "Trung cấp", kanji: "中" },
  N2: { color: "text-amber-600", gradient: "from-amber-500 to-orange-600", label: "Cao cấp", kanji: "上" },
  N1: { color: "text-japanese", gradient: "from-red-500 to-rose-600", label: "Thành thạo", kanji: "極" },
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

const enrollmentStatusMap: Record<string, { label: string; color: string }> = {
  open: { label: "🟢 Đang tuyển sinh", color: "bg-emerald-500" },
  almost_full: { label: "🟡 Sắp đầy chỗ", color: "bg-amber-500" },
  full: { label: "🔴 Đã đầy", color: "bg-red-500" },
  upcoming: { label: "⏳ Sắp khai giảng", color: "bg-blue-500" },
  closed: { label: "⚫ Đã đóng đăng ký", color: "bg-gray-500" },
};

const defaultVis = {
  hero: true, highlights: true, outcomes: true, features: true,
  timeline: true, teachers: true, gallery: true, testimonials: true,
  faq: true, related: true, enrollment: true, certificate: true, custom: true,
};

type CourseDetailTeacher = Database["public"]["Tables"]["teacher_profiles"]["Row"];

type CourseTeacherLink = Pick<Database["public"]["Tables"]["course_teachers"]["Row"], "teacher_id">;

type TeacherPreview = Pick<CourseDetailTeacher, "id" | "display_name" | "image_url" | "bio_vi" | "slug" | "experience_years">;

const CourseDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [lessonCount, setLessonCount] = useState(0);
  const [teachers, setTeachers] = useState<TeacherPreview[]>([]);
  const [related, setRelated] = useState<Course[]>([]);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    const fetchCourse = async () => {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
      const q = supabase.from("courses").select("*").eq("is_published", true);
      const { data } = isUuid ? await q.eq("id", slug).maybeSingle() : await q.eq("slug", slug).maybeSingle();
      setCourse(data);

      if (data) {
        const { count } = await supabase.from("lessons").select("*", { count: "exact", head: true }).eq("level", data.level).eq("is_published", true);
        setLessonCount(count || 0);

        const { data: ct } = await supabase.from("course_teachers").select("teacher_id").eq("course_id", data.id) as { data: CourseTeacherLink[] | null };
        const teacherIds = (ct || []).map((c) => c.teacher_id);
        if (teacherIds.length > 0) {
          const { data: tData } = await supabase.from("teacher_profiles").select("id, display_name, image_url, bio_vi, slug, experience_years").in("id", teacherIds) as { data: TeacherPreview[] | null };
          setTeachers(tData || []);
        } else { setTeachers([]); }

        const { data: relData } = await supabase.from("courses").select("*").eq("is_published", true).eq("language", data.language).neq("id", data.id).limit(3);
        setRelated(relData || []);
      }
      setLoading(false);
    };
    fetchCourse();
  }, [slug]);

  const config = course ? levelConfig[course.level] || levelConfig.N5 : levelConfig.N5;
  const features: string[] = Array.isArray(course?.features)
    ? course.features.filter((item): item is string => typeof item === "string")
    : [];
  const highlights: string[] = Array.isArray(course?.highlights)
    ? course.highlights.filter((item): item is string => typeof item === "string")
    : [];
  const outcomes: string[] = Array.isArray(course?.outcomes)
    ? course.outcomes.filter((item): item is string => typeof item === "string")
    : [];
  const requirements: string[] = Array.isArray(course?.requirements)
    ? course.requirements.filter((item): item is string => typeof item === "string")
    : [];
  const timeline: Array<{ week?: string | null; title?: string | null; description?: string | null }> = Array.isArray(course?.timeline)
    ? course.timeline.filter((item): item is { week?: string | null; title?: string | null; description?: string | null } => item !== null && typeof item === "object")
    : [];
  const faq: Array<{ q: string; a: string }> = Array.isArray(course?.faq)
    ? course.faq.filter((item): item is { q: string; a: string } => item !== null && typeof item === "object" && !Array.isArray(item) && typeof (item as Record<string, unknown>).q === "string" && typeof (item as Record<string, unknown>).a === "string")
    : [];
  const testimonials: Array<{ name: string; role: string; content: string; avatar: string }> = Array.isArray(course?.testimonials)
    ? course.testimonials.filter((item): item is { name: string; role: string; content: string; avatar: string } => item !== null && typeof item === "object" && !Array.isArray(item) && typeof (item as Record<string, unknown>).name === "string" && typeof (item as Record<string, unknown>).role === "string" && typeof (item as Record<string, unknown>).content === "string" && typeof (item as Record<string, unknown>).avatar === "string")
    : [];
  const customFields: Array<{ label: string; value: string; icon?: string }> = Array.isArray(course?.custom_fields)
    ? course.custom_fields.filter((item): item is { label: string; value: string; icon?: string } => item !== null && typeof item === "object" && !Array.isArray(item) && typeof (item as Record<string, unknown>).label === "string" && typeof (item as Record<string, unknown>).value === "string")
    : [];
  const gallery: string[] = Array.isArray(course?.gallery_urls)
    ? course.gallery_urls.filter((item): item is string => typeof item === "string")
    : [];
  const vis = {
    ...defaultVis,
    ...(course?.section_visibility && typeof course.section_visibility === "object"
      ? (course.section_visibility as Record<string, boolean>)
      : {}),
  };

  const discount = course?.original_price && course.original_price > course.price
    ? Math.round(((course.original_price - course.price) / course.original_price) * 100) : 0;

  const enrollmentPct = course?.enrollment_capacity
    ? Math.min(100, Math.round((course.enrolled_count / course.enrollment_capacity) * 100)) : 0;
  const seatsLeft = course?.enrollment_capacity ? Math.max(0, course.enrollment_capacity - course.enrolled_count) : null;
  const enrollStatus = course ? enrollmentStatusMap[course.enrollment_status] || enrollmentStatusMap.open : null;

  if (loading) {
    return <main className="min-h-screen"><Navbar /><div className="container mx-auto px-4 pt-28 pb-16"><Skeleton className="h-[500px] rounded-3xl" /></div><Footer /></main>;
  }
  if (!course) {
    return <main className="min-h-screen"><Navbar /><div className="container mx-auto px-4 pt-28 pb-16 text-center">
      <h1 className="text-3xl font-bold text-foreground mb-4">Khóa học không tìm thấy</h1>
      <Button asChild><Link to="/khoa-hoc">Quay lại</Link></Button>
    </div><Footer /></main>;
  }

  // Convert YouTube link to embed
  const getEmbedUrl = (url: string) => {
    const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?]+)/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
    return url;
  };

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      {/* HERO */}
      {vis.hero && (
      <section className="relative pt-24 pb-0 overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-[0.06]`} />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-japanese/5 blur-3xl" />
        <div className="container mx-auto px-4 relative z-10">
          <Link to="/khoa-hoc" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Tất cả khóa học</span>
          </Link>

          <div className="grid lg:grid-cols-5 gap-12 items-start pb-16">
            <div className="lg:col-span-3 space-y-6">
              <div className="flex items-center gap-3">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg`}>
                  <span className="text-2xl font-bold text-white">{config.kanji}</span>
                </div>
                <div>
                  <Badge className={`bg-gradient-to-r ${config.gradient} text-white border-0 text-sm px-3 py-1`}>JLPT {course.level}</Badge>
                  <p className="text-sm text-muted-foreground mt-1">{config.label}</p>
                </div>
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground leading-tight">{course.title_vi}</h1>
              {course.subtitle_vi && <p className="text-xl text-japanese font-medium">{course.subtitle_vi}</p>}
              <p className="text-lg text-muted-foreground leading-relaxed">
                {course.description_vi || course.description || "Khóa học tiếng Nhật toàn diện."}
              </p>

              {/* Stats */}
              <div className="flex flex-wrap gap-6 pt-2">
                {[
                  { icon: Clock, label: `${course.duration_weeks || 12} tuần`, sub: "Thời lượng" },
                  { icon: BookOpen, label: `${lessonCount}+`, sub: "Bài học" },
                  { icon: Star, label: "4.9/5", sub: "Đánh giá" },
                  { icon: Users, label: `${course.enrolled_count || 500}+`, sub: "Học viên" },
                ].map((s) => (
                  <div key={s.sub} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center"><s.icon className="w-5 h-5 text-muted-foreground" /></div>
                    <div><p className="text-sm font-bold text-foreground">{s.label}</p><p className="text-xs text-muted-foreground">{s.sub}</p></div>
                  </div>
                ))}
              </div>

              {/* Schedule meta */}
              {(course.start_date || course.schedule_text_vi || course.location_vi) && (
                <div className="grid sm:grid-cols-3 gap-3 pt-4">
                  {course.start_date && (
                    <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-japanese" />
                      <div><p className="text-xs text-muted-foreground">Khai giảng</p><p className="text-sm font-semibold">{new Date(course.start_date).toLocaleDateString("vi-VN")}</p></div>
                    </div>
                  )}
                  {course.schedule_text_vi && (
                    <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
                      <Clock className="w-5 h-5 text-japanese" />
                      <div><p className="text-xs text-muted-foreground">Lịch học</p><p className="text-sm font-semibold">{course.schedule_text_vi}</p></div>
                    </div>
                  )}
                  {course.location_vi && (
                    <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-japanese" />
                      <div><p className="text-xs text-muted-foreground">Địa điểm</p><p className="text-sm font-semibold">{course.location_vi}</p></div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Pricing card */}
            <div className="lg:col-span-2">
              <div className="bg-card rounded-3xl border border-border shadow-card-hover p-8 sticky top-28">
                <div className="aspect-video rounded-2xl overflow-hidden mb-6 bg-muted relative">
                  <img src={course.thumbnail_url || courseDefaultImg} alt={course.title_vi} className="w-full h-full object-cover" width={1280} height={720} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                </div>

                {/* Enrollment */}
                {vis.enrollment && enrollStatus && (
                  <div className="mb-5 p-4 rounded-xl bg-muted/50 border border-border">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-white ${enrollStatus.color}`}>
                        {enrollStatus.label}
                      </span>
                      {seatsLeft !== null && seatsLeft <= 5 && seatsLeft > 0 && (
                        <span className="text-xs font-semibold text-orange-600 flex items-center gap-1"><Flame className="w-3 h-3" /> Còn {seatsLeft} chỗ</span>
                      )}
                    </div>
                    {course.enrollment_capacity ? (
                      <>
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                          <span>Đã đăng ký</span>
                          <span className="font-semibold text-foreground">{course.enrolled_count}/{course.enrollment_capacity}</span>
                        </div>
                        <Progress value={enrollmentPct} className="h-2" />
                      </>
                    ) : null}
                  </div>
                )}

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
                    <Link to="/auth"><GraduationCap className="w-5 h-5 mr-2" /> Đăng ký ngay</Link>
                  </Button>
                  <Button variant="outline" size="lg" className="w-full" asChild>
                    <Link to="/auth"><Play className="w-4 h-4 mr-2" /> Học thử miễn phí</Link>
                  </Button>

                  <div className="pt-4 space-y-3 border-t border-border">
                    {["Truy cập trọn đời", "Chứng chỉ hoàn thành", "Hỗ trợ giáo viên 1-1", "Cập nhật nội dung miễn phí"].map((item) => (
                      <div key={item} className="flex items-center gap-3 text-sm text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" /><span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* INTRO VIDEO */}
      {course.intro_video_url && (
        <section className="py-12 bg-background">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3"><Play className="w-6 h-6 text-japanese" /> Video giới thiệu</h2>
            <div className="aspect-video rounded-2xl overflow-hidden bg-black shadow-xl">
              <iframe src={getEmbedUrl(course.intro_video_url)} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen />
            </div>
          </div>
        </section>
      )}

      {/* LONG DESCRIPTION */}
      {course.long_description_vi && (
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold text-foreground mb-6">Giới thiệu khóa học</h2>
            <div
              className="prose prose-lg max-w-none text-foreground leading-relaxed [&_img]:rounded-xl [&_img]:my-4 [&_iframe]:w-full [&_iframe]:rounded-xl [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_h1]:text-3xl [&_h2]:text-2xl [&_h3]:text-xl [&_a]:text-primary [&_a]:underline"
              dangerouslySetInnerHTML={{ __html: course.long_description_vi }}
            />
          </div>
        </section>
      )}

      {/* OUTCOMES + HIGHLIGHTS */}
      {(vis.outcomes || vis.highlights) && (outcomes.length > 0 || highlights.length > 0 || features.length > 0) && (
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12">
            {vis.outcomes && (
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-8 flex items-center gap-3">
                  <Target className="w-6 h-6 text-japanese" /> Bạn sẽ học được gì?
                </h2>
                <div className="grid gap-4">
                  {(outcomes.length > 0 ? outcomes : features.length > 0 ? features : [
                    "Nắm vững toàn bộ ngữ pháp cấp độ " + course.level,
                    "Luyện nghe - nói với giáo viên bản ngữ",
                    "Thuộc lòng Kanji & từ vựng cần thiết",
                  ]).map((o, i) => (
                    <div key={i} className="flex items-start gap-3 bg-card rounded-xl p-4 border border-border">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span className="text-foreground">{o}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {vis.highlights && (
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-8 flex items-center gap-3">
                  <Zap className="w-6 h-6 text-accent" /> Điểm nổi bật
                </h2>
                <div className="grid gap-4">
                  {(highlights.length > 0 ? highlights.map(h => ({ title: h, desc: "" })) : [
                    { title: "Lộ trình chuẩn JLPT", desc: "Sát đề thi thật, từ N5 lên N1 hệ thống" },
                    { title: "Video bài giảng HD", desc: "Xem lại không giới hạn, học mọi lúc" },
                    { title: "Lớp 1-1 cùng giáo viên", desc: "Luyện nói trực tiếp với giáo viên Nhật" },
                    { title: "Lịch học linh hoạt", desc: "Tự sắp xếp thời gian phù hợp" },
                  ]).map((item, i) => (
                    <div key={i} className="flex items-start gap-4 bg-card rounded-xl p-4 border border-border hover:border-japanese/30 transition-colors">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center flex-shrink-0`}>
                        <Trophy className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground">{item.title}</h3>
                        {item.desc && <p className="text-sm text-muted-foreground">{item.desc}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
      )}

      {/* TIMELINE / LỘ TRÌNH */}
      {vis.timeline && timeline.length > 0 && (
        <section className="py-20">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-japanese/10 text-japanese text-xs font-semibold mb-3">
                <ListChecks className="w-3.5 h-3.5" /> Lộ trình học
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">Hành trình từng bước</h2>
              <p className="text-muted-foreground mt-2">Lộ trình chi tiết theo tuần / giai đoạn</p>
            </div>
            <div className="relative">
              <div className={`absolute left-6 md:left-8 top-2 bottom-2 w-0.5 bg-gradient-to-b ${config.gradient} opacity-30`} />
              <div className="space-y-6">
                {timeline.map((step, i) => (
                  <div key={i} className="relative pl-16 md:pl-20">
                    <div className={`absolute left-0 top-2 w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center text-white font-bold shadow-lg`}>
                      {i + 1}
                    </div>
                    <div className="bg-card rounded-2xl border border-border p-5 hover:shadow-card-hover transition-all">
                      {step.week && <Badge variant="outline" className="mb-2">{step.week}</Badge>}
                      <h3 className="text-lg font-bold text-foreground mb-1">{step.title}</h3>
                      {step.description && <p className="text-sm text-muted-foreground whitespace-pre-line">{step.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* REQUIREMENTS */}
      {requirements.length > 0 && (
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3"><AlertCircle className="w-6 h-6 text-amber-600" /> Yêu cầu đầu vào</h2>
            <div className="bg-card rounded-2xl border border-border p-6 space-y-3">
              {requirements.map((r, i) => (
                <div key={i} className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" /><span className="text-foreground">{r}</span></div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CUSTOM FIELDS */}
      {vis.custom && customFields.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-2xl font-bold text-foreground mb-8 text-center">Thông tin thêm</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customFields.map((f, i) => (
                <div key={i} className="bg-card border border-border rounded-2xl p-5 flex items-start gap-3">
                  {f.icon && <span className="text-2xl">{f.icon}</span>}
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{f.label}</p>
                    <p className="font-semibold text-foreground break-words">{f.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* GALLERY */}
      {vis.gallery && gallery.length > 0 && (
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Thư viện ảnh khóa học</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
              {gallery.map((url, i) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden bg-muted hover:scale-105 transition-transform cursor-pointer">
                  <img src={url} alt="" loading="lazy" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* TESTIMONIALS */}
      {vis.testimonials && testimonials.length > 0 && (
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-japanese/10 text-japanese text-xs font-semibold mb-3">
                <Quote className="w-3.5 h-3.5" /> Cảm nhận
              </span>
              <h2 className="text-3xl font-bold text-foreground">Học viên nói gì?</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {testimonials.map((t, i) => (
                <div key={i} className="bg-card rounded-2xl border border-border p-6 hover:shadow-card-hover transition-all">
                  <Quote className="w-8 h-8 text-japanese/30 mb-3" />
                  <p className="text-foreground italic mb-4">"{t.content}"</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-border">
                    <div className="w-12 h-12 rounded-full bg-muted overflow-hidden">
                      {t.avatar ? <img src={t.avatar} alt={t.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xl">👤</div>}
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* TEACHERS */}
      {vis.teachers && teachers.length > 0 && (
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-3 flex items-center justify-center gap-3">
                <GraduationCap className="w-7 h-7 text-japanese" /> Giảng viên phụ trách
              </h2>
              <p className="text-muted-foreground">Đội ngũ giảng viên đồng hành cùng bạn</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {teachers.map((t) => (
                <Link key={t.id} to={`/giao-vien/${t.slug || t.id}`} className="bg-card rounded-2xl border border-border p-6 hover:shadow-card-hover hover:-translate-y-1 transition-all group">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-muted overflow-hidden ring-2 ring-japanese/20 group-hover:ring-japanese/50 transition-all">
                      {t.image_url ? <img src={t.image_url} alt={t.display_name || ""} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl">👩‍🏫</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-foreground truncate">{t.display_name || "Giảng viên"}</h3>
                      {t.experience_years ? <p className="text-xs text-muted-foreground">{t.experience_years} năm kinh nghiệm</p> : null}
                    </div>
                  </div>
                  {t.bio_vi && <p className="text-sm text-muted-foreground line-clamp-3">{t.bio_vi}</p>}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CERTIFICATE */}
      {vis.certificate && course.certificate_image_url && (
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h2 className="text-3xl font-bold text-foreground mb-3 flex items-center justify-center gap-3">
              <Award className="w-7 h-7 text-japanese" /> Chứng chỉ hoàn thành
            </h2>
            <p className="text-muted-foreground mb-8">Hoàn thành khóa học và nhận chứng chỉ chính thức</p>
            <div className="rounded-2xl overflow-hidden border-2 border-border shadow-xl bg-card">
              <img src={course.certificate_image_url} alt="Chứng chỉ" className="w-full" />
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      {vis.faq && faq.length > 0 && (
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-3 flex items-center justify-center gap-3"><HelpCircle className="w-7 h-7 text-japanese" /> Câu hỏi thường gặp</h2>
            </div>
            <Accordion type="single" collapsible className="space-y-3">
              {faq.map((item, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="bg-card border border-border rounded-xl px-5">
                  <AccordionTrigger className="text-left font-semibold hover:no-underline">{item.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground whitespace-pre-line">{item.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      )}

      {/* RELATED */}
      {vis.related && related.length > 0 && (
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-japanese/10 text-japanese text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5" /> Có thể bạn cũng thích
              </span>
              <h2 className="text-3xl font-bold text-foreground">Khóa học liên quan</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {related.map((rc) => {
                const rcCfg = levelConfig[rc.level] || levelConfig.N5;
                return (
                  <Link key={rc.id} to={`/khoa-hoc/${rc.slug || rc.id}`} className="group bg-card rounded-2xl border border-border overflow-hidden shadow-soft hover:shadow-card-hover hover:-translate-y-1 transition-all">
                    <div className="relative aspect-video overflow-hidden">
                      <img src={rc.thumbnail_url || courseDefaultImg} alt={rc.title_vi} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      <Badge className={`absolute top-3 left-3 bg-gradient-to-r ${rcCfg.gradient} text-white border-0`}>JLPT {rc.level}</Badge>
                    </div>
                    <div className="p-5">
                      <h3 className="font-bold text-foreground line-clamp-2 mb-2 group-hover:text-japanese transition-colors">{rc.title_vi}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{rc.description_vi || rc.description || rcCfg.label}</p>
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-foreground">{formatPrice(rc.price)}</span>
                        <span className={`inline-flex items-center gap-1 text-sm font-semibold ${rcCfg.color} group-hover:gap-2 transition-all`}>Xem <ArrowRight className="w-4 h-4" /></span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* PROMOTION POLICY */}
      <ScrollReveal>
        <PromotionPolicySection />
      </ScrollReveal>

      {/* STUDENT BENEFITS */}
      <ScrollReveal>
        <StudentBenefitsSection />
      </ScrollReveal>
    

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <div className={`bg-gradient-to-r ${config.gradient} rounded-3xl p-12 md:p-16 text-white`}>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Sẵn sàng chinh phục JLPT {course.level}?</h2>
            <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">Đăng ký ngay hôm nay để bắt đầu hành trình</p>
            <Button size="lg" className="bg-white text-foreground hover:bg-white/90 text-lg h-14 px-8" asChild>
              <Link to="/auth"><GraduationCap className="w-5 h-5 mr-2" /> Đăng ký khóa học {course.level}</Link>
            </Button>
          </div>
        </div>
      </section>


<Footer />
</main>
);
};

export default CourseDetail;
