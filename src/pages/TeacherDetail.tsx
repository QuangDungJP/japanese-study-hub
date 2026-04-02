import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Star, Award, BookOpen, Globe, ArrowLeft, MessageCircle,
  Calendar, CheckCircle2, Clock, Users, Play, GraduationCap
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface TeacherProfile {
  id: string;
  user_id: string;
  bio: string | null;
  bio_vi: string | null;
  specializations: string[] | null;
  certifications: string[] | null;
  experience_years: number | null;
  rating: number | null;
  total_reviews: number | null;
  is_available: boolean | null;
  hourly_rate: number | null;
  image_url: string | null;
  display_name: string | null;
  is_featured: boolean | null;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

const TeacherDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [teacher, setTeacher] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchTeacher = async () => {
      // Get teacher profile
      const { data: tp } = await supabase
        .from("teacher_profiles")
        .select("*")
        .eq("id", id)
        .single();

      if (tp) {
        // Get user profile for name/avatar
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("user_id", tp.user_id)
          .single();

        setTeacher({
          ...tp,
          specializations: (tp.specializations as string[]) || [],
          certifications: (tp.certifications as string[]) || [],
          profile: profile || undefined,
        });
      }
      setLoading(false);
    };
    fetchTeacher();
  }, [id]);

  // Also check website_content for CMS teachers data
  const [cmsTeachers, setCmsTeachers] = useState<any[]>([]);
  useEffect(() => {
    const fetchCmsTeachers = async () => {
      const { data } = await supabase
        .from("website_content")
        .select("content")
        .eq("section_key", "teachers")
        .eq("is_active", true)
        .single();

      if (data?.content) {
        const content = data.content as any;
        setCmsTeachers(content.teachers || []);
      }
    };
    fetchCmsTeachers();
  }, []);

  // If no DB teacher found, try CMS teacher by index
  const cmsTeacher = !teacher && id ? cmsTeachers.find((_, i) => i.toString() === id) || cmsTeachers[parseInt(id)] : null;

  const displayTeacher = teacher || cmsTeacher;

  if (loading && !cmsTeacher) {
    return (
      <main className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 pt-28 pb-16">
          <Skeleton className="h-[600px] rounded-3xl" />
        </div>
        <Footer />
      </main>
    );
  }

  if (!displayTeacher) {
    return (
      <main className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 pt-28 pb-16 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-4">Giảng viên không tìm thấy</h1>
          <Button asChild><Link to="/#teachers">Quay lại</Link></Button>
        </div>
        <Footer />
      </main>
    );
  }

  // Normalize data
  const name = teacher?.profile?.full_name || (cmsTeacher as any)?.name || "Giảng viên";
  const avatar = teacher?.image_url || teacher?.profile?.avatar_url || (cmsTeacher as any)?.avatar_url || "";
  const bio = teacher?.bio_vi || teacher?.bio || (cmsTeacher as any)?.bio || "";
  const role = (cmsTeacher as any)?.role || "Giáo viên tiếng Nhật";
  const specializations = teacher?.specializations || (cmsTeacher as any)?.specializations || [];
  const certifications = teacher?.certifications || (cmsTeacher as any)?.certifications || [];
  const experienceYears = teacher?.experience_years || (cmsTeacher as any)?.experience_years || 0;
  const rating = teacher?.rating || (cmsTeacher as any)?.rating || 0;
  const totalReviews = teacher?.total_reviews || (cmsTeacher as any)?.total_reviews || 0;
  const languages = (cmsTeacher as any)?.languages || ["日本語", "Tiếng Việt"];
  const teacherVideoUrl = (cmsTeacher as any)?.video_url;

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-24 pb-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-japanese/5 to-primary/5" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-japanese/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-primary/5 blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <Link to="/#teachers" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Tất cả giảng viên</span>
          </Link>

          <div className="grid lg:grid-cols-3 gap-12 pb-16">
            {/* Left - Avatar */}
            <div className="lg:col-span-1">
              <div className="sticky top-28 space-y-6">
                <div className="relative group">
                  <div className="aspect-[3/4] rounded-3xl overflow-hidden bg-gradient-to-br from-japanese/20 to-primary/20 border border-border shadow-card-hover">
                    {avatar ? (
                      <img src={avatar} alt={name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-32 h-32 rounded-full bg-card shadow-lg flex items-center justify-center">
                          <span className="text-6xl">👩‍🏫</span>
                        </div>
                      </div>
                    )}
                    {teacherVideoUrl && (
                      <button
                        onClick={() => setVideoUrl(teacherVideoUrl)}
                        className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors"
                      >
                        <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                          <Play className="w-7 h-7 text-japanese fill-japanese ml-1" />
                        </div>
                      </button>
                    )}
                  </div>

                  {/* Rating badge */}
                  <div className="absolute top-4 right-4 bg-card/95 backdrop-blur-sm rounded-2xl px-4 py-2 flex items-center gap-2 shadow-lg">
                    <Star className="w-5 h-5 text-accent fill-accent" />
                    <span className="text-lg font-bold text-foreground">{rating}</span>
                  </div>
                </div>

                {/* Quick action */}
                <Button variant="japanese" size="lg" className="w-full h-14 text-lg" asChild>
                  <Link to="/auth">
                    <Calendar className="w-5 h-5 mr-2" />
                    Đặt lịch học ngay
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="w-full" asChild>
                  <Link to="/auth">
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Nhắn tin cho giảng viên
                  </Link>
                </Button>
              </div>
            </div>

            {/* Right - Details */}
            <div className="lg:col-span-2 space-y-8">
              <div>
                <p className="text-sm text-japanese font-semibold mb-2">{role}</p>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground mb-4">
                  {name}
                </h1>

                {/* Stats row */}
                <div className="flex flex-wrap gap-6">
                  {[
                    { icon: Clock, value: `${experienceYears} năm`, label: "Kinh nghiệm" },
                    { icon: Star, value: `${rating}/5`, label: "Đánh giá" },
                    { icon: Users, value: `${totalReviews}`, label: "Đánh giá" },
                    { icon: BookOpen, value: languages.length.toString(), label: "Ngôn ngữ" },
                  ].map((stat) => (
                    <div key={stat.label + stat.value} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                        <stat.icon className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bio */}
              <div className="bg-card rounded-2xl border border-border p-6">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-japanese" />
                  Giới thiệu
                </h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{bio}</p>
              </div>

              {/* Specializations */}
              {specializations.length > 0 && (
                <div className="bg-card rounded-2xl border border-border p-6">
                  <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-japanese" />
                    Chuyên môn
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {specializations.map((spec: string) => (
                      <Badge key={spec} variant="secondary" className="text-sm px-4 py-2">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Certifications */}
              {certifications.length > 0 && (
                <div className="bg-card rounded-2xl border border-border p-6">
                  <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5 text-japanese" />
                    Chứng chỉ & Bằng cấp
                  </h2>
                  <div className="grid gap-3">
                    {certifications.map((cert: string) => (
                      <div key={cert} className="flex items-center gap-3 bg-muted/50 rounded-xl p-4">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                        <span className="text-foreground font-medium">{cert}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Languages */}
              <div className="bg-card rounded-2xl border border-border p-6">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-japanese" />
                  Ngôn ngữ giảng dạy
                </h2>
                <div className="flex flex-wrap gap-3">
                  {languages.map((lang: string) => (
                    <div key={lang} className="flex items-center gap-2 bg-muted/50 rounded-xl px-5 py-3">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">{lang}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <div className="bg-gradient-to-r from-japanese to-red-600 rounded-3xl p-12 md:p-16 text-white">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
              Bắt đầu học cùng {name}
            </h2>
            <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
              Đặt lịch buổi học đầu tiên và trải nghiệm phương pháp giảng dạy chuyên nghiệp
            </p>
            <Button size="lg" className="bg-white text-foreground hover:bg-white/90 text-lg h-14 px-8" asChild>
              <Link to="/auth">
                <Calendar className="w-5 h-5 mr-2" />
                Đặt lịch học ngay
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />

      {/* Video Dialog */}
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