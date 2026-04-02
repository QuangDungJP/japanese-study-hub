import { Sparkles, Star, Play, BookOpen, Mic, PenTool, Headphones, ArrowRight, Video, Users, Calendar, Clock, MessageCircle, Award, Brain, Target, Trophy, BarChart3, Smartphone, Globe, Zap, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PreviewData {
  section_key: string;
  title: string;
  title_vi: string;
  subtitle: string;
  subtitle_vi: string;
  description: string;
  description_vi: string;
  image_url: string;
  content: Record<string, any>;
}

interface SectionPreviewProps {
  data: PreviewData;
}

const HeroPreview = ({ data }: SectionPreviewProps) => {
  const statsContent = data.content as {
    students?: string;
    teachers?: string;
    lessons?: string;
    features?: string[];
    rating?: string;
    reviews?: string;
  };

  return (
    <div className="bg-gradient-to-br from-primary/10 to-accent/10 p-6 rounded-xl">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-japanese/10 text-japanese mb-4 w-fit text-xs">
        <Sparkles className="w-3 h-3" />
        <span className="font-semibold">{data.subtitle_vi || "Nền tảng học ngôn ngữ"}</span>
      </div>
      
      <h1 className="text-xl font-extrabold text-foreground leading-tight mb-3">
        {data.title_vi || "Chinh phục Tiếng Nhật"}
      </h1>
      
      <p className="text-sm text-muted-foreground mb-4">
        {data.description_vi || "Mô tả..."}
      </p>

      <div className="flex gap-2 mb-4">
        <Button size="sm" variant="default" className="text-xs">
          <Sparkles className="w-3 h-3 mr-1" />
          Học ngay
        </Button>
        <Button size="sm" variant="outline" className="text-xs">
          <Play className="w-3 h-3 mr-1" />
          Xem demo
        </Button>
      </div>

      <div className="flex gap-6">
        <div className="text-center">
          <div className="text-lg font-bold text-foreground">{statsContent?.students || "50K+"}</div>
          <div className="text-xs text-muted-foreground">Học viên</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-foreground">{statsContent?.teachers || "200+"}</div>
          <div className="text-xs text-muted-foreground">Giáo viên</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-foreground">{statsContent?.lessons || "1000+"}</div>
          <div className="text-xs text-muted-foreground">Bài học</div>
        </div>
      </div>
    </div>
  );
};

const SkillsPreview = ({ data }: SectionPreviewProps) => {
  const defaultSkills = [
    { icon: BookOpen, title: "Đọc hiểu", color: "bg-blue-500" },
    { icon: Mic, title: "Nói", color: "bg-green-500" },
    { icon: PenTool, title: "Viết", color: "bg-purple-500" },
    { icon: Headphones, title: "Nghe", color: "bg-orange-500" },
  ];

  return (
    <div className="bg-background p-6 rounded-xl">
      <div className="text-center mb-4">
        <span className="inline-block px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-2">
          {data.subtitle_vi || "4 Kỹ năng cốt lõi"}
        </span>
        <h2 className="text-lg font-bold text-foreground">
          {data.title_vi || "Phát triển toàn diện"}
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          {data.description_vi || "Mô tả..."}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {defaultSkills.map((skill) => (
          <div key={skill.title} className="bg-card rounded-lg p-3 border border-border">
            <div className={`w-8 h-8 rounded-lg ${skill.color} bg-opacity-10 flex items-center justify-center mb-2`}>
              <skill.icon className={`w-4 h-4 ${skill.color.replace('bg-', 'text-')}`} />
            </div>
            <h3 className="text-sm font-semibold">{skill.title}</h3>
          </div>
        ))}
      </div>
    </div>
  );
};

const FeaturesPreview = ({ data }: SectionPreviewProps) => {
  const defaultFeatures = [
    { icon: Brain, title: "AI Cá nhân hóa" },
    { icon: Target, title: "Lộ trình rõ ràng" },
    { icon: Trophy, title: "Gamification" },
    { icon: Zap, title: "Học nhanh 3x" },
  ];

  return (
    <div className="bg-muted/30 p-6 rounded-xl">
      <div className="text-center mb-4">
        <span className="inline-block px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-2">
          {data.subtitle_vi || "Tại sao chọn chúng tôi?"}
        </span>
        <h2 className="text-lg font-bold text-foreground">
          {data.title_vi || "Công nghệ học tập tiên tiến"}
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {defaultFeatures.map((feature) => (
          <div key={feature.title} className="bg-card rounded-lg p-3 border border-border">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center mb-2">
              <feature.icon className="w-4 h-4 text-primary-foreground" />
            </div>
            <h3 className="text-xs font-semibold">{feature.title}</h3>
          </div>
        ))}
      </div>
    </div>
  );
};

const ZoomPreview = ({ data }: SectionPreviewProps) => {
  return (
    <div className="bg-background p-6 rounded-xl">
      <span className="inline-block px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-3">
        {data.subtitle_vi || "Học Online với Zoom"}
      </span>
      <h2 className="text-lg font-bold text-foreground mb-2">
        {data.title_vi || "Kết nối trực tiếp với giáo viên"}
      </h2>
      <p className="text-xs text-muted-foreground mb-4">
        {data.description_vi || "Mô tả..."}
      </p>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="bg-muted/50 px-3 py-2 flex items-center gap-2 border-b">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <div className="w-2 h-2 rounded-full bg-yellow-500" />
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-xs text-muted-foreground ml-2">LinguaViet Class</span>
        </div>
        <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center relative">
          {data.image_url ? (
            <img src={data.image_url} alt="Zoom Preview" className="w-full h-full object-cover" />
          ) : (
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-card mx-auto mb-2 flex items-center justify-center shadow">
                <span className="text-2xl">👩‍🏫</span>
              </div>
              <p className="text-xs font-medium">Teacher Name</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const LanguagesPreview = ({ data }: SectionPreviewProps) => {
  const courses = ["N5", "N4", "N3", "N2", "N1"];

  return (
    <div className="bg-muted/30 p-6 rounded-xl">
      <div className="text-center mb-4">
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-japanese/10 text-japanese text-xs font-semibold mb-2">
          <span>🇯🇵</span>
          {data.subtitle_vi || "Tiếng Nhật"}
        </span>
        <h2 className="text-lg font-bold text-foreground">
          {data.title_vi || "Lộ trình học toàn diện"}
        </h2>
      </div>

      <div className="flex gap-2 justify-center mb-4">
        {courses.map((level, i) => (
          <div key={level} className="w-10 h-10 rounded-lg bg-card border border-border flex items-center justify-center">
            <span className="text-xs font-bold">{level}</span>
          </div>
        ))}
      </div>

      <div className="text-center">
        <Button size="sm" variant="default" className="bg-japanese hover:bg-japanese/90 text-xs">
          Bắt đầu học
        </Button>
      </div>
    </div>
  );
};

const CTAPreview = ({ data }: SectionPreviewProps) => {
  const ctaData = data.content as { offer?: string; primaryButton?: string };

  return (
    <div className="bg-gradient-to-r from-primary to-primary/80 p-6 rounded-xl text-center">
      <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs mb-3">
        <Sparkles className="w-3 h-3" />
        <span>{ctaData?.offer || "Ưu đãi đặc biệt"}</span>
      </div>
      
      <h2 className="text-lg font-bold text-primary-foreground mb-2">
        {data.title_vi || "Bắt đầu hành trình ngay hôm nay"}
      </h2>
      
      <p className="text-xs text-primary-foreground/80 mb-4">
        {data.description_vi || "Mô tả..."}
      </p>

      <Button size="sm" className="bg-white text-primary hover:bg-white/90 text-xs">
        <Sparkles className="w-3 h-3 mr-1" />
        {ctaData?.primaryButton || "Đăng ký ngay"}
      </Button>
    </div>
  );
};

const PricingPreview = ({ data }: SectionPreviewProps) => {
  return (
    <div className="bg-background p-6 rounded-xl">
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold text-foreground">
          {data.title_vi || "Bảng giá"}
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {["N5", "N4"].map((level) => (
          <div key={level} className="bg-card rounded-lg p-3 border border-border text-center">
            <div className="text-sm font-bold mb-1">{level}</div>
            <div className="text-xs text-muted-foreground">Từ 1.990.000đ</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const TeachersPreview = ({ data }: SectionPreviewProps) => {
  const teachersData = data.content as { teachers?: Array<{ name: string; role: string; rating: number; experience_years: number }> };
  const teachers = teachersData?.teachers?.slice(0, 4) || [];

  return (
    <div className="bg-muted/30 p-6 rounded-xl">
      <div className="text-center mb-4">
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-japanese/10 text-japanese text-xs font-semibold mb-2">
          <Award className="w-3 h-3" />
          {data.subtitle_vi || "Giảng viên"}
        </span>
        <h2 className="text-lg font-bold text-foreground">
          {data.title_vi || "Đội ngũ giảng viên xuất sắc"}
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          {data.description_vi || "Mô tả..."}
        </p>
      </div>

      {teachers.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">
          Chưa có dữ liệu giảng viên. Vui lòng thêm trong Admin.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {teachers.map((t) => (
            <div key={t.name} className="bg-card rounded-lg p-3 border border-border">
              <div className="w-8 h-8 rounded-full bg-japanese/10 flex items-center justify-center mb-2">
                <span className="text-sm">👩‍🏫</span>
              </div>
              <h3 className="text-xs font-semibold">{t.name}</h3>
              <p className="text-[10px] text-muted-foreground">{t.role}</p>
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-3 h-3 text-accent fill-accent" />
                <span className="text-[10px] font-medium">{t.rating}</span>
                <span className="text-[10px] text-muted-foreground">• {t.experience_years} năm</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const SectionPreview = ({ data }: SectionPreviewProps) => {
  switch (data.section_key) {
    case 'hero':
      return <HeroPreview data={data} />;
    case 'skills':
      return <SkillsPreview data={data} />;
    case 'features':
      return <FeaturesPreview data={data} />;
    case 'zoom':
      return <ZoomPreview data={data} />;
    case 'languages':
      return <LanguagesPreview data={data} />;
    case 'teachers':
      return <TeachersPreview data={data} />;
    case 'cta':
      return <CTAPreview data={data} />;
    case 'pricing':
      return <PricingPreview data={data} />;
    default:
      return (
        <div className="bg-muted/30 p-6 rounded-xl text-center">
          <p className="text-sm text-muted-foreground">Preview không khả dụng cho section này</p>
        </div>
      );
  }
};

export default SectionPreview;
