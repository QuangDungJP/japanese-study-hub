import { 
  Brain, 
  Target, 
  Trophy, 
  BarChart3, 
  Smartphone, 
  Globe,
  Zap,
  Shield
} from "lucide-react";
import { useAllWebsiteContent } from "@/hooks/useWebsiteContent";
import { Skeleton } from "@/components/ui/skeleton";

const defaultFeatures = [
  { icon: Brain, title: "AI Cá nhân hóa", description: "Hệ thống AI phân tích điểm mạnh/yếu, tự động điều chỉnh bài học phù hợp với bạn." },
  { icon: Target, title: "Lộ trình rõ ràng", description: "Mục tiêu học tập cụ thể theo tuần/tháng, giúp bạn theo dõi tiến độ dễ dàng." },
  { icon: Trophy, title: "Gamification", description: "Điểm thưởng, huy hiệu, bảng xếp hạng - học mà chơi, chơi mà học." },
  { icon: BarChart3, title: "Báo cáo chi tiết", description: "Thống kê học tập theo ngày/tuần/tháng, biết rõ mình đang ở đâu." },
  { icon: Smartphone, title: "Đa nền tảng", description: "Học mọi lúc mọi nơi - Web, iOS, Android đồng bộ hoàn hảo." },
  { icon: Globe, title: "Cộng đồng học tập", description: "Kết nối với hàng ngàn học viên, trao đổi kinh nghiệm học tập." },
  { icon: Zap, title: "Học nhanh 3x", description: "Phương pháp Spaced Repetition giúp ghi nhớ từ vựng hiệu quả gấp 3 lần." },
  { icon: Shield, title: "Cam kết hoàn tiền", description: "Không hài lòng? Hoàn tiền 100% trong 30 ngày đầu tiên." },
];

const iconMap: Record<string, any> = {
  brain: Brain,
  target: Target,
  trophy: Trophy,
  chart: BarChart3,
  smartphone: Smartphone,
  globe: Globe,
  zap: Zap,
  shield: Shield,
};

const FeaturesSection = () => {
  const { data: content, isLoading } = useAllWebsiteContent();
  const featuresContent = content?.features;
  const featuresData = featuresContent?.content as {
    items?: Array<{ icon: string; title: string; description: string }>;
  } | null;

  const title = featuresContent?.title_vi || "Công nghệ học tập tiên tiến";
  const subtitle = featuresContent?.subtitle_vi || "Tại sao chọn LinguaViet?";
  const description = featuresContent?.description_vi || 
    "Kết hợp AI và phương pháp giảng dạy hiện đại để mang đến trải nghiệm học tập tốt nhất";

  const features = featuresData?.items?.map(item => ({
    ...item,
    icon: iconMap[item.icon] || Brain,
  })) || defaultFeatures;

  if (isLoading) {
    return (
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <Skeleton className="h-8 w-48 mx-auto" />
            <Skeleton className="h-12 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Skeleton key={i} className="h-40 rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="features" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-semibold mb-4">
            {subtitle}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {title}
          </h2>
          <p className="text-lg text-muted-foreground">
            {description}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group bg-card rounded-2xl p-6 shadow-soft hover:shadow-card-hover transition-all duration-300 border border-border hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <feature.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
