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
    <section className="py-20 md:py-28 bg-background relative overflow-hidden">
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
              <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                {c?.image_url ? (
                  <img src={c.image_url} alt="Class" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center">
                    <div className="w-24 h-24 rounded-full bg-card mx-auto mb-3 flex items-center justify-center shadow-lg text-4xl">👩‍🏫</div>
                    <p className="font-semibold text-foreground">Sensei</p>
                    <p className="text-sm text-muted-foreground">Native Teacher</p>
                  </div>
                )}
                <div className="absolute bottom-4 right-4 w-32 h-24 bg-card rounded-xl shadow-lg overflow-hidden border-2 border-card flex items-center justify-center text-2xl">🧑‍🎓</div>
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