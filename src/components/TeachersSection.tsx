import { Star, Award, BookOpen, Globe, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTeacherProfiles } from "@/hooks/useTeachers";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Link } from "react-router-dom";

interface Teacher {
  id: string;
  name: string;
  role: string;
  avatar_url: string;
  video_url?: string;
  bio: string;
  specializations: string[];
  certifications: string[];
  experience_years: number;
  rating: number;
  total_reviews: number;
  languages: string[];
}

const TeachersSection = () => {
  const { data: teachers, isLoading } = useTeacherProfiles();
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const teacherList: Teacher[] = (teachers || []).map((t) => {
    const specializations = Array.isArray(t.specializations)
      ? (t.specializations.filter((s) => typeof s === 'string') as string[])
      : [];

    const certifications = Array.isArray(t.certifications)
      ? (t.certifications.filter((c) => typeof c === 'string') as string[])
      : [];

    return {
      id: t.id,
      name: t.display_name || t.profile?.full_name || "Giảng viên",
      role: "Giảng viên",
      avatar_url: t.image_url || t.profile?.avatar_url || "",
      video_url: undefined,
      bio: t.bio_vi || t.bio || "",
      specializations,
      certifications,
      experience_years: t.experience_years ?? 0,
      rating: t.rating ?? 0,
      total_reviews: t.total_reviews ?? 0,
      languages: ["日本語", "Tiếng Việt"],
    };
  });

  const title = "Đội ngũ giảng viên xuất sắc";
  const subtitle = "Giảng viên";
  const description =
    "Giáo viên bản ngữ và giáo viên Việt Nam giàu kinh nghiệm, tận tâm đồng hành cùng bạn trên hành trình chinh phục tiếng Nhật";

  if (isLoading) {
    return (
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <Skeleton className="h-8 w-32 mx-auto" />
            <Skeleton className="h-12 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-[480px] rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="teachers" className="py-24 bg-muted/30 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-japanese/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-japanese/10 text-japanese text-sm font-semibold mb-4">
            <Award className="w-4 h-4" />
            {subtitle}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {title}
          </h2>
          <p className="text-lg text-muted-foreground">
            {description}
          </p>
        </div>

        {/* Teachers Grid */}
        {teacherList.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            Đang cập nhật dữ liệu giảng viên, vui lòng quay lại sau.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {teacherList.map((teacher) => (
              <Link
                key={teacher.id}
                to={`/teachers/${teacher.id}`}
                className="group bg-card rounded-2xl border border-border shadow-soft hover:shadow-card-hover transition-all duration-300 overflow-hidden hover:-translate-y-1 block"
              >
              {/* Avatar / Photo */}
              <div className="relative aspect-[4/3] bg-gradient-to-br from-japanese/20 to-primary/20 overflow-hidden">
                {teacher.avatar_url ? (
                  <img
                    src={teacher.avatar_url}
                    alt={teacher.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-24 h-24 rounded-full bg-card shadow-lg flex items-center justify-center">
                      <span className="text-4xl">👩‍🏫</span>
                    </div>
                  </div>
                )}

                {/* Video play button */}
                {teacher.video_url && (
                  <button
                    onClick={() => setVideoUrl(teacher.video_url!)}
                    className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                      <Play className="w-5 h-5 text-japanese fill-japanese ml-0.5" />
                    </div>
                  </button>
                )}

                {/* Rating badge */}
                <div className="absolute top-3 right-3 bg-card/90 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1 shadow-md">
                  <Star className="w-3.5 h-3.5 text-accent fill-accent" />
                  <span className="text-xs font-bold text-foreground">{teacher.rating}</span>
                </div>
              </div>

              {/* Info */}
              <div className="p-5">
                <h3 className="text-lg font-bold text-foreground">{teacher.name}</h3>
                <p className="text-sm text-japanese font-medium mb-3">{teacher.role}</p>

                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {teacher.bio}
                </p>

                {/* Stats */}
                <div className="flex items-center gap-4 mb-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{teacher.experience_years} năm KN</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5" />
                    <span>{teacher.total_reviews} đánh giá</span>
                  </div>
                </div>

                {/* Specializations */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {teacher.specializations.slice(0, 3).map((spec) => (
                    <Badge key={spec} variant="secondary" className="text-xs font-normal">
                      {spec}
                    </Badge>
                  ))}
                </div>

                {/* Certifications */}
                <div className="space-y-1.5 mb-4">
                  {teacher.certifications.slice(0, 2).map((cert) => (
                    <div key={cert} className="flex items-center gap-2 text-xs text-foreground">
                      <Award className="w-3 h-3 text-japanese flex-shrink-0" />
                      <span className="truncate">{cert}</span>
                    </div>
                  ))}
                </div>

                {/* Languages */}
                <div className="flex items-center gap-1.5 pt-3 border-t border-border">
                  <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {teacher.languages.join(" • ")}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

        {/* CTA */}
        <div className="mt-12 text-center">
          <Button variant="japanese" size="lg" asChild>
            <a href="/auth">
              Đăng ký học với giảng viên
            </a>
          </Button>
        </div>
      </div>

      {/* Video Dialog */}
      <Dialog open={!!videoUrl} onOpenChange={() => setVideoUrl(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          {videoUrl && (
            <video
              src={videoUrl}
              controls
              autoPlay
              className="w-full aspect-video"
            />
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default TeachersSection;
