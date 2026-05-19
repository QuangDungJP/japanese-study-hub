import { Button } from "@/components/ui/button";
import { Video, Users, Calendar, Clock, MessageCircle, Award } from "lucide-react";
import { useAllWebsiteContent } from "@/hooks/useWebsiteContent";
import { Link as RouterLink } from "react-router-dom";

const features = [
  { icon: Video, title: "Lớp học 1-1", desc: "Học riêng với giáo viên" },
  { icon: Users, title: "Nhóm nhỏ", desc: "Tối đa 6 học viên" },
  { icon: Calendar, title: "Lịch linh hoạt", desc: "Đặt lịch theo bạn" },
  { icon: Clock, title: "Hỗ trợ 24/7", desc: "Luôn sẵn sàng" },
  { icon: MessageCircle, title: "Chat giáo viên", desc: "Hỏi bài ngoài giờ" },
  { icon: Award, title: "Giáo viên chứng chỉ", desc: "Quốc tế" },
];

const AboutZoomSection = () => {
  const { data: content } = useAllWebsiteContent();
  const c = content?.about_zoom || content?.zoom;
  if (c && c.is_active === false) return null;

  const title = c?.title_vi || "Học Online qua Google Meet";
  const subtitle = c?.subtitle_vi || "Lớp học trực tuyến";
  const description = c?.description_vi || "Lớp 1-1 hoặc nhóm nhỏ tối đa 6 học viên với giáo viên bản ngữ. Công nghệ HD, tương tác trực tiếp.";

  return (
    <section id="zoom" className="py-20 md:py-28 bg-background relative overflow-hidden scroll-mt-20">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2" />
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl -translate-y-1/2" />
      </div>
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center max-w-6xl mx-auto">
          <div>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-semibold mb-4 border border-accent/20">
              <Video className="w-4 h-4" /> {subtitle}
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-5 leading-tight">{title}</h2>
            <p className="text-lg text-muted-foreground mb-8">{description}</p>
            <div className="grid grid-cols-2 gap-4 mb-8">
              {features.map(f => (
                <div key={f.title} className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <f.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-foreground">{f.title}</h4>
                    <p className="text-xs text-muted-foreground">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" asChild className="rounded-2xl">
                <RouterLink to="/lien-he"><Video className="w-5 h-5 mr-2" />Đăng ký học thử</RouterLink>
              </Button>
              <Button size="lg" variant="outline" asChild className="rounded-2xl">
                <RouterLink to="/giao-vien">Xem giáo viên</RouterLink>
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="bg-card rounded-3xl shadow-2xl border border-border overflow-hidden">
              <div className="bg-foreground/5 px-6 py-4 flex items-center justify-between border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">TNQDO Live Class</span>
                <div className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="w-4 h-4" />45:23</div>
              </div>
              <div className="relative aspect-video overflow-hidden group">
  <img
    src="/img/zoom-meeting.png"
    alt="TNQDO Online Class"
    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
  />

  {/* Overlay */}
  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

  {/* Live Badge */}
  <div className="absolute top-4 left-4 bg-green-500/90 backdrop-blur-md text-white px-3 py-1 rounded-full flex items-center gap-2 text-sm font-medium shadow-lg">
    <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
    Đang live
  </div>

  {/* Teacher Info */}
  <div className="absolute bottom-4 left-4">
    <div className="bg-black/50 backdrop-blur-md rounded-2xl px-4 py-3 border border-white/10">
      <p className="text-white font-semibold">Sensei</p>
      <p className="text-white/70 text-sm">Native Teacher</p>
    </div>
  </div>

  {/* Student Preview */}
  <div className="absolute bottom-4 right-4 w-36 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-black/40 backdrop-blur-md">
    <img
      src="/img/zoom-meeting.png"
      alt="Student"
      className="w-full h-24 object-cover"
    />
    <div className="px-3 py-2">
      <p className="text-xs text-white font-medium">5 học viên online</p>
    </div>
  </div>
</div>
              <div className="px-6 py-4 flex items-center justify-center gap-3 bg-foreground/5">
                {[Video, MessageCircle, Users, Award].map((I, i) => (
                  <button key={i} className="w-11 h-11 rounded-full bg-card shadow-md flex items-center justify-center hover:bg-muted transition-colors">
                    <I className="w-5 h-5 text-foreground" />
                  </button>
                ))}
              </div>
            </div>
            <div className="absolute -top-4 -left-4 bg-card rounded-2xl p-3 shadow-lg border border-border animate-float hidden md:flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-medium text-foreground">Đang live</span>
            </div>
            <div className="absolute -bottom-4 -right-4 bg-card rounded-2xl p-3 shadow-lg border border-border animate-float animation-delay-300 hidden md:flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-foreground">5 online</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutZoomSection;