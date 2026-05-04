import { Button } from "@/components/ui/button";
import { Video, Users, Calendar, Clock, MessageCircle, Award } from "lucide-react";
import { useAllWebsiteContent } from "@/hooks/useWebsiteContent";
import { Skeleton } from "@/components/ui/skeleton";
import { Link as RouterLink } from "react-router-dom";

const defaultFeatures = [
  { icon: Video, title: "Lớp học 1-1", description: "Học riêng với giáo viên, tập trung vào điểm yếu của bạn" },
  { icon: Users, title: "Lớp nhóm nhỏ", description: "Tối đa 6 học viên, tương tác và thực hành hiệu quả" },
  { icon: Calendar, title: "Lịch linh hoạt", description: "Đặt lịch học theo thời gian phù hợp với bạn" },
  { icon: Clock, title: "24/7 Support", description: "Hỗ trợ kỹ thuật và học thuật mọi lúc" },
  { icon: MessageCircle, title: "Chat với giáo viên", description: "Nhắn tin hỏi bài ngoài giờ học" },
  { icon: Award, title: "Giáo viên chứng chỉ", description: "100% giáo viên có chứng chỉ giảng dạy quốc tế" },
];

const iconMap: Record<string, any> = {
  video: Video,
  users: Users,
  calendar: Calendar,
  clock: Clock,
  message: MessageCircle,
  award: Award,
};

const ZoomSection = () => {
  const { data: content, isLoading } = useAllWebsiteContent();
  const zoomContent = content?.zoom;
  const zoomData = zoomContent?.content as {
    features?: Array<{ icon: string; title: string; description: string }>;
    teacherName?: string;
    teacherRole?: string;
    primaryButton?: string;
    primaryButtonUrl?: string;
    secondaryButton?: string;
    secondaryButtonUrl?: string;
  } | null;

  const title = zoomContent?.title_vi || "Kết nối trực tiếp với giáo viên bản ngữ";
  const subtitle = zoomContent?.subtitle_vi || "Học Online với Zoom";
  const description = zoomContent?.description_vi || 
    "Trải nghiệm lớp học trực tuyến chất lượng cao, tương tác trực tiếp như học offline. Công nghệ Zoom HD đảm bảo hình ảnh và âm thanh sắc nét.";

  const features = zoomData?.features?.map(f => ({
    ...f,
    icon: iconMap[f.icon] || Video,
  })) || defaultFeatures;

  const teacherName = zoomData?.teacherName || "Ms. Sarah Johnson";
  const teacherRole = zoomData?.teacherRole || "IELTS Instructor";
  const primaryButton = zoomData?.primaryButton || "Đăng ký học thử miễn phí";
  const primaryButtonUrl = zoomData?.primaryButtonUrl || "/contact";
  const secondaryButton = zoomData?.secondaryButton || "Xem lịch học";
  const secondaryButtonUrl = zoomData?.secondaryButtonUrl || "/learn/calendar";
  const isExternal = (u: string) => /^https?:\/\//i.test(u);

  if (isLoading) {
    return (
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
            <Skeleton className="h-96 rounded-3xl" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="zoom" className="py-24 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2" />
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl -translate-y-1/2" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <div>
            <span className="inline-block px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-semibold mb-4">
              {subtitle}
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              {title}
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              {description}
            </p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              {features.map((feature) => (
                <div key={feature.title} className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">{feature.title}</h4>
                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-4">
              <Button variant="hero" size="lg" asChild>
                {isExternal(primaryButtonUrl) ? (
                  <a href={primaryButtonUrl} target="_blank" rel="noopener noreferrer">
                    <Video className="w-5 h-5" />
                    {primaryButton}
                  </a>
                ) : (
                  <RouterLink to={primaryButtonUrl}>
                    <Video className="w-5 h-5" />
                    {primaryButton}
                  </RouterLink>
                )}
              </Button>
              <Button variant="outline" size="lg" asChild>
                {isExternal(secondaryButtonUrl) ? (
                  <a href={secondaryButtonUrl} target="_blank" rel="noopener noreferrer">{secondaryButton}</a>
                ) : (
                  <RouterLink to={secondaryButtonUrl}>{secondaryButton}</RouterLink>
                )}
              </Button>
            </div>
          </div>

          {/* Right Content - Zoom Interface Mock */}
          <div className="relative">
            <div className="bg-card rounded-3xl shadow-card-hover border border-border overflow-hidden">
              {/* Zoom Header */}
              <div className="bg-foreground/5 px-6 py-4 flex items-center justify-between border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">TNQDO - Class</span>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>45:23</span>
                </div>
              </div>

              {/* Main Video Area */}
              <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                {zoomContent?.image_url ? (
                  <img 
                    src={zoomContent.image_url} 
                    alt="Teacher" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center">
                    <div className="w-24 h-24 rounded-full bg-card mx-auto mb-4 flex items-center justify-center shadow-lg">
                      <span className="text-4xl">👩‍🏫</span>
                    </div>
                    <p className="font-semibold text-foreground">{teacherName}</p>
                    <p className="text-sm text-muted-foreground">{teacherRole}</p>
                  </div>
                )}

                {/* Self Video */}
                <div className="absolute bottom-4 right-4 w-32 h-24 bg-card rounded-xl shadow-lg overflow-hidden border-2 border-card">
                  <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                    <span className="text-2xl">🧑‍🎓</span>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="px-6 py-4 flex items-center justify-center gap-4 bg-foreground/5">
                <button className="w-12 h-12 rounded-full bg-card shadow-md flex items-center justify-center hover:bg-muted transition-colors">
                  <Video className="w-5 h-5 text-foreground" />
                </button>
                <button className="w-12 h-12 rounded-full bg-card shadow-md flex items-center justify-center hover:bg-muted transition-colors">
                  <MessageCircle className="w-5 h-5 text-foreground" />
                </button>
                <button className="w-14 h-14 rounded-full bg-red-500 shadow-md flex items-center justify-center hover:bg-red-600 transition-colors">
                  <Video className="w-6 h-6 text-white" />
                </button>
                <button className="w-12 h-12 rounded-full bg-card shadow-md flex items-center justify-center hover:bg-muted transition-colors">
                  <Users className="w-5 h-5 text-foreground" />
                </button>
                <button className="w-12 h-12 rounded-full bg-card shadow-md flex items-center justify-center hover:bg-muted transition-colors">
                  <Award className="w-5 h-5 text-foreground" />
                </button>
              </div>
            </div>

            {/* Floating elements */}
            <div className="absolute -top-4 -left-4 bg-card rounded-2xl p-4 shadow-lg border border-border animate-float">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <span className="text-sm font-medium text-foreground">Đang live</span>
              </div>
            </div>

            <div className="absolute -bottom-4 -right-4 bg-card rounded-2xl p-4 shadow-lg border border-border animate-float animation-delay-300">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-foreground">5 học viên online</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ZoomSection;
