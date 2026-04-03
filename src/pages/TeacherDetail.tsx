import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Star, Award, BookOpen, Globe, MessageCircle,
  Calendar, CheckCircle2, Clock, Users, Play, GraduationCap,
  MapPin, Heart, Search, Filter, ExternalLink,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Database } from "@/integrations/supabase/types";

type TeacherRow = Database["public"]["Tables"]["teacher_profiles"]["Row"];

const TeacherDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [teacher, setTeacher] = useState<TeacherRow | null>(null);
  const [allTeachers, setAllTeachers] = useState<TeacherRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  // Filters for other teachers
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSpec, setFilterSpec] = useState("all");

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      setLoading(true);
      const [{ data: tp }, { data: all }] = await Promise.all([
        supabase.from("teacher_profiles").select("*").eq("id", id).single(),
        supabase.from("teacher_profiles").select("*").eq("is_available", true).order("order_index", { ascending: true }),
      ]);
      setTeacher(tp);
      setAllTeachers(all || []);
      setLoading(false);
    };
    fetchData();
    window.scrollTo(0, 0);
  }, [id]);

  const parseArr = (val: unknown): string[] => {
    if (Array.isArray(val)) return val.filter((v) => typeof v === "string");
    return [];
  };

  const parseExtra = (val: unknown): Record<string, string> => {
    if (val && typeof val === "object" && !Array.isArray(val)) {
      const result: Record<string, string> = {};
      Object.entries(val as Record<string, unknown>).forEach(([k, v]) => { result[k] = String(v ?? ""); });
      return result;
    }
    return {};
  };

  const parseSocial = parseExtra;

  // All specializations for filter
  const allSpecs = useMemo(() => {
    const specs = new Set<string>();
    allTeachers.forEach((t) => parseArr(t.specializations).forEach((s) => specs.add(s)));
    return Array.from(specs);
  }, [allTeachers]);

  // Filtered other teachers
  const otherTeachers = useMemo(() => {
    return allTeachers
      .filter((t) => t.id !== id)
      .filter((t) => {
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const name = (t.display_name || "").toLowerCase();
          const headline = (t.headline || "").toLowerCase();
          if (!name.includes(q) && !headline.includes(q)) return false;
        }
        if (filterSpec !== "all") {
          if (!parseArr(t.specializations).includes(filterSpec)) return false;
        }
        return true;
      });
  }, [allTeachers, id, searchQuery, filterSpec]);

  if (loading) {
    return (
      <main className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 pt-28 pb-16 space-y-8">
          <Skeleton className="h-[400px] rounded-3xl" />
          <div className="grid lg:grid-cols-3 gap-8">
            <Skeleton className="h-[500px] rounded-3xl" />
            <Skeleton className="h-[500px] rounded-3xl lg:col-span-2" />
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (!teacher) {
    return (
      <main className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 pt-28 pb-16 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 rounded-full bg-muted mx-auto mb-6 flex items-center justify-center text-5xl">🔍</div>
            <h1 className="text-3xl font-bold text-foreground mb-4">Giảng viên không tìm thấy</h1>
            <p className="text-muted-foreground mb-8">Giảng viên này có thể đã bị xóa hoặc không còn hoạt động</p>
            <Button asChild variant="default"><Link to="/giang-vien">← Xem tất cả giảng viên</Link></Button>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  const name = teacher.display_name || "Giảng viên";
  const avatar = teacher.image_url || "";
  const coverImage = teacher.cover_image_url || "";
  const bio = teacher.bio_vi || teacher.bio || "";
  const headline = teacher.headline || "Giáo viên tiếng Nhật";
  const specializations = parseArr(teacher.specializations);
  const certifications = parseArr(teacher.certifications);
  const languages = parseArr(teacher.languages);
  const experienceYears = teacher.experience_years || 0;
  const rating = Number(teacher.rating) || 0;
  const totalReviews = teacher.total_reviews || 0;
  const totalStudents = teacher.total_students || 0;
  const totalLessons = teacher.total_lessons || 0;
  const totalHours = teacher.total_hours || 0;
  const location = teacher.location || "";
  const introVideo = teacher.intro_video_url || "";
  const extraData = parseExtra(teacher.extra_data);
  const socialLinks = parseSocial(teacher.social_links);

  const stats = [
    { icon: Clock, value: `${experienceYears}`, label: "Năm kinh nghiệm", show: experienceYears > 0 },
    { icon: Star, value: rating.toFixed(1), label: `${totalReviews} đánh giá`, show: rating > 0 },
    { icon: Users, value: `${totalStudents}`, label: "Học viên", show: totalStudents > 0 },
    { icon: BookOpen, value: `${totalLessons}`, label: "Bài giảng", show: totalLessons > 0 },
    { icon: Clock, value: `${totalHours}h`, label: "Giờ dạy", show: totalHours > 0 },
  ].filter((s) => s.show);

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <section className="relative pt-20">
        <div className="h-64 md:h-80 relative overflow-hidden">
          {coverImage ? (
            <img src={coverImage} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-accent/10">
              <div className="absolute inset-0">
                <div className="absolute top-10 right-20 w-40 h-40 rounded-full bg-primary/10 blur-3xl" />
                <div className="absolute bottom-10 left-10 w-60 h-60 rounded-full bg-primary/10 blur-3xl" />
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        </div>

        <div className="container mx-auto px-4 relative z-10 -mt-32 md:-mt-40">
          <div className="bg-card border border-border rounded-3xl shadow-lg overflow-hidden">
            <div className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                <div className="relative flex-shrink-0 mx-auto md:mx-0">
                  <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden border-4 border-background shadow-xl bg-gradient-to-br from-primary/20 to-primary/20">
                    {avatar ? (
                      <img src={avatar} alt={name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-6xl">👩‍🏫</div>
                    )}
                  </div>
                  {introVideo && (
                    <button
                      onClick={() => setVideoUrl(introVideo)}
                      className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                    >
                      <Play className="w-4 h-4 fill-white ml-0.5" />
                    </button>
                  )}
                </div>

                <div className="flex-1 text-center md:text-left">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div>
                      <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-foreground">{name}</h1>
                      <p className="text-primary font-semibold mt-1">{headline}</p>
                      {location && (
                        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1 justify-center md:justify-start">
                          <MapPin className="w-3.5 h-3.5" /> {location}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 justify-center md:justify-end">
                      <Button variant="default" size="lg" asChild>
                        <Link to="/auth"><Calendar className="w-4 h-4 mr-2" />Đặt lịch học</Link>
                      </Button>
                      <Button variant="outline" size="lg" asChild>
                        <Link to="/auth"><MessageCircle className="w-4 h-4 mr-2" />Nhắn tin</Link>
                      </Button>
                    </div>
                  </div>

                  {stats.length > 0 && (
                    <div className="flex flex-wrap gap-6 mt-6 justify-center md:justify-start">
                      {stats.map((stat, i) => (
                        <div key={i} className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                            <stat.icon className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-lg font-bold text-foreground leading-tight">{stat.value}</p>
                            <p className="text-xs text-muted-foreground">{stat.label}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {bio && (
              <div className="bg-card rounded-2xl border border-border p-6 md:p-8">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />Giới thiệu
                </h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{bio}</p>
              </div>
            )}

            {specializations.length > 0 && (
              <div className="bg-card rounded-2xl border border-border p-6 md:p-8">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-primary" />Chuyên môn
                </h2>
                <div className="flex flex-wrap gap-2">
                  {specializations.map((spec) => (
                    <Badge key={spec} variant="secondary" className="text-sm px-4 py-2">{spec}</Badge>
                  ))}
                </div>
              </div>
            )}

            {certifications.length > 0 && (
              <div className="bg-card rounded-2xl border border-border p-6 md:p-8">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />Chứng chỉ & Bằng cấp
                </h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {certifications.map((cert) => (
                    <div key={cert} className="flex items-center gap-3 bg-muted/50 rounded-xl p-4">
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-foreground font-medium">{cert}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {Object.keys(extraData).length > 0 && (
              <div className="bg-card rounded-2xl border border-border p-6 md:p-8">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-primary" />Thông tin thêm
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {Object.entries(extraData).map(([key, value]) => (
                    <div key={key} className="bg-muted/50 rounded-xl p-4">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">{key}</p>
                      <p className="text-foreground font-medium">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {languages.length > 0 && (
              <div className="bg-card rounded-2xl border border-border p-6">
                <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" />Ngôn ngữ
                </h3>
                <div className="space-y-2">
                  {languages.map((lang) => (
                    <div key={lang} className="flex items-center gap-2 bg-muted/50 rounded-lg px-4 py-2.5">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">{lang}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {Object.values(socialLinks).some((v) => v) && (
              <div className="bg-card rounded-2xl border border-border p-6">
                <h3 className="font-bold text-foreground mb-3">Kết nối</h3>
                <div className="space-y-2">
                  {Object.entries(socialLinks).map(([platform, url]) =>
                    url ? (
                      <a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-muted/50 rounded-lg px-4 py-2.5 hover:bg-muted transition-colors"
                      >
                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                        <span className="capitalize font-medium text-foreground">{platform}</span>
                      </a>
                    ) : null
                  )}
                </div>
              </div>
            )}

            <div className="bg-gradient-to-br from-primary to-blue-600 rounded-2xl p-6 text-white">
              <h3 className="text-lg font-bold mb-2">Bắt đầu học cùng {name.split(" ").pop()}</h3>
              <p className="text-sm text-white/80 mb-4">Đặt lịch buổi học đầu tiên ngay hôm nay</p>
              <Button className="w-full bg-white text-foreground hover:bg-white/90" asChild>
                <Link to="/auth"><Calendar className="w-4 h-4 mr-2" />Đặt lịch học ngay</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Giảng viên khác</h2>
            <p className="text-muted-foreground">Khám phá thêm đội ngũ giảng viên tuyệt vời của chúng tôi</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm giảng viên..."
                className="pl-9"
              />
            </div>
            <Select value={filterSpec} onValueChange={setFilterSpec}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Chuyên môn" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {allSpecs.map((spec) => (
                  <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {otherTeachers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Không tìm thấy giảng viên phù hợp</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {otherTeachers.map((t) => (
                <Link
                  key={t.id}
                  to={`/teachers/${t.id}`}
                  className="group bg-card rounded-2xl border border-border shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden hover:-translate-y-1"
                >
                  <div className="relative aspect-[4/3] bg-gradient-to-br from-primary/20 to-primary/20 overflow-hidden">
                    {t.image_url ? (
                      <img src={t.image_url} alt={t.display_name || ""} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-5xl">👩‍🏫</span>
                      </div>
                    )}
                    {Number(t.rating) > 0 && (
                      <div className="absolute top-3 right-3 bg-card/90 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1 shadow-md">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span className="text-xs font-bold">{Number(t.rating).toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-foreground truncate">{t.display_name || "Giảng viên"}</h3>
                    {t.headline && <p className="text-xs text-primary font-medium truncate mt-0.5">{t.headline}</p>
                    }
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      {t.experience_years ? <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{t.experience_years} năm</span> : null}
                      {(t.total_students ?? 0) > 0 && <span className="flex items-center gap-0.5"><Users className="w-3 h-3" />{t.total_students}</span>}
                    </div>
                    {parseArr(t.specializations).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {parseArr(t.specializations).slice(0, 2).map((s) => (
                          <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />

      <Dialog open={!!videoUrl} onOpenChange={() => setVideoUrl(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          {videoUrl && (
            <video src={videoUrl} controls autoPlay className="w-full aspect-video" />
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default TeacherDetail;
