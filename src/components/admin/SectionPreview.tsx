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
  const content = data.content || {};
  const heroMode = content.hero_mode || 'center_poster';
  const imageUrl = data.image_url || content.image_url || "/img/qd-team-hero.png";

  // Dynamic Custom Buttons list or fallback
  const customButtons = (content.custom_buttons as any[]) || [
    content.primary_btn || { id: '1', text: 'Học miễn phí ngay', url: '/auth', variant: 'primary', enabled: true },
    content.secondary_btn || { id: '2', text: 'Xem khóa học', url: '/khoa-hoc', variant: 'outline', enabled: true }
  ];
  const activeButtons = customButtons.filter((b: any) => b.enabled !== false);

  const showStats = content.show_stats !== false;
  const statsList = content.stats_list || [
    { value: content.students || '50K+', label: 'Học viên', icon: '👥' },
    { value: content.teachers || '200+', label: 'Giáo viên', icon: '👨‍🏫' },
    { value: content.lessons || '1000+', label: 'Bài học', icon: '📚' },
  ];

  const title = data.title_vi || data.title || "Chinh phục Tiếng Nhật cùng TNQDO";
  const subtitle = data.subtitle_vi || data.subtitle || "Nền tảng học Tiếng Nhật #1 cho người Việt";
  const description = data.description_vi || data.description || "Phương pháp học toàn diện 4 kỹ năng: Đọc - Nói - Viết - Nghe...";

  // MODE 1: SINGLE COVER (Full Background Overlay)
  if (heroMode === 'single_cover') {
    return (
      <div className="relative rounded-2xl overflow-hidden min-h-[300px] text-white flex flex-col justify-between p-6 border shadow-xl bg-slate-900">
        <img src={imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-75" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

        <div className="relative z-10 space-y-3 max-w-lg">
          <span className="px-3 py-1 rounded-full bg-rose-500/30 text-rose-200 font-bold text-xs border border-rose-400/40 inline-block backdrop-blur-md">
            {subtitle}
          </span>
          <h1 className="text-2xl font-black text-white drop-shadow-md leading-tight">{title}</h1>
          <p className="text-xs text-gray-200 line-clamp-2">{description}</p>

          <div className="flex flex-wrap gap-2 pt-2">
            {activeButtons.map((btn: any, idx: number) => (
              <Button
                key={btn.id || idx}
                size="sm"
                className={`h-8 text-xs font-bold ${
                  btn.variant === 'outline'
                    ? 'bg-white/10 text-white border-white/40 hover:bg-white/20'
                    : 'bg-rose-600 hover:bg-rose-700 text-white shadow-md'
                }`}
              >
                {btn.text}
              </Button>
            ))}
          </div>
        </div>

        {showStats && (
          <div className="relative z-10 flex items-center gap-6 pt-4 border-t border-white/20 mt-4 text-xs font-bold text-gray-200">
            {statsList.map((st: any, idx: number) => (
              <div key={idx} className="flex items-center gap-1">
                <span className="text-sm font-black text-white">{st.value}</span>
                <span className="text-[10px] text-gray-300">{st.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // MODE 2 & 3: CENTER POSTER & CENTER FULL
  if (heroMode === 'center_poster' || heroMode === 'center_full') {
    return (
      <div className="bg-gradient-to-b from-background via-background to-primary/5 p-4 rounded-xl space-y-4 text-center border shadow-xs">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-600 text-xs font-bold border border-rose-200">
          <Sparkles className="w-3 h-3 text-rose-500" />
          <span>{subtitle}</span>
        </div>

        <h1 className="text-xl font-black text-foreground">{title}</h1>

        <div className="relative w-full rounded-2xl overflow-hidden border bg-card max-h-[260px] shadow-sm">
          <img
            src={imageUrl}
            alt=""
            className="w-full h-auto max-h-[260px] object-contain mx-auto"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-left pt-1">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-foreground">{content.tagline || "Mở cánh cửa tương lai Nhật Bản, kết nối toàn cầu."}</h4>
            <p className="text-[11px] text-muted-foreground line-clamp-2">{description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            {activeButtons.map((btn: any, idx: number) => (
              <Button
                key={btn.id || idx}
                size="sm"
                className={`h-7 text-xs font-bold ${
                  btn.variant === 'outline'
                    ? 'bg-background text-foreground border-border'
                    : 'bg-[#1e293b] text-white'
                }`}
              >
                {btn.text}
              </Button>
            ))}
          </div>
        </div>

        {showStats && (
          <div className="flex items-center justify-center gap-6 pt-3 border-t text-left">
            {statsList.map((st: any, idx: number) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="text-base font-black text-foreground">{st.value}</span>
                <span className="text-[10px] text-muted-foreground font-semibold">{st.icon} {st.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // DEFAULT / STANDARD SPLIT MODE
  return (
    <div className="bg-gradient-to-br from-primary/10 via-background to-accent/10 p-5 rounded-xl space-y-4 border">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-japanese/10 text-japanese w-fit text-xs font-bold">
        <Sparkles className="w-3 h-3" />
        <span>{subtitle}</span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
        <div className="space-y-2">
          <h1 className="text-lg font-black text-foreground leading-tight">{title}</h1>
          <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>
          <div className="flex flex-wrap gap-2 pt-2">
            {activeButtons.map((btn: any, idx: number) => (
              <Button key={btn.id || idx} size="sm" className="h-8 text-xs font-bold">{btn.text}</Button>
            ))}
          </div>
        </div>

        <div className="rounded-xl overflow-hidden border bg-card max-h-[160px]">
          <img src={imageUrl} alt="" className="w-full h-full object-cover" />
        </div>
      </div>

      {showStats && (
        <div className="flex gap-6 pt-3 border-t">
          {statsList.map((st: any, idx: number) => (
            <div key={idx} className="text-center">
              <div className="text-base font-bold text-foreground">{st.value}</div>
              <div className="text-[11px] text-muted-foreground">{st.label}</div>
            </div>
          ))}
        </div>
      )}
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
        {data.subtitle_vi || "Học Online với Meeting"}
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
            <img src={data.image_url} alt="Meeting Preview" className="w-full h-full object-cover" />
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

const GenericPreview = ({ data }: SectionPreviewProps) => {
  const layoutMode = data.content?.layout_mode || 'standard_split';
  const primaryBtn = data.content?.primary_btn || { enabled: true, text: 'Xem chi tiết', url: '/auth' };
  const secondaryBtn = data.content?.secondary_btn || { enabled: false, text: 'Liên hệ tư vấn', url: '/lien-he' };

  if (layoutMode === 'full_banner' && data.image_url) {
    return (
      <div className="relative rounded-2xl overflow-hidden min-h-[220px] bg-foreground text-background flex flex-col justify-end p-6 border shadow-lg">
        <img src={data.image_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
        <div className="relative z-10 space-y-2 max-w-lg">
          {data.subtitle_vi && <span className="px-2.5 py-0.5 rounded-full bg-primary/20 text-primary font-bold text-[10px] uppercase border border-primary/30">{data.subtitle_vi}</span>}
          <h2 className="text-lg font-black text-white">{data.title_vi || data.title}</h2>
          <p className="text-xs text-gray-200 line-clamp-2">{data.description_vi || data.description}</p>
          <div className="flex gap-2 pt-1">
            {primaryBtn.enabled !== false && <Button size="sm" className="h-7 text-xs font-bold bg-primary">{primaryBtn.text}</Button>}
            {secondaryBtn.enabled && <Button size="sm" variant="outline" className="h-7 text-xs font-bold text-white border-white/40">{secondaryBtn.text}</Button>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card p-5 rounded-2xl border shadow-sm space-y-3">
      {data.subtitle_vi && (
        <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-bold">
          {data.subtitle_vi}
        </span>
      )}
      
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1 space-y-2">
          <h3 className="text-base font-extrabold text-foreground">{data.title_vi || data.title || "Tiêu đề section"}</h3>
          <p className="text-xs text-muted-foreground line-clamp-3">{data.description_vi || data.description || "Mô tả nội dung..."}</p>
          
          <div className="flex gap-2 pt-2">
            {primaryBtn.enabled !== false && <Button size="sm" className="h-8 text-xs font-bold">{primaryBtn.text}</Button>}
            {secondaryBtn.enabled && <Button size="sm" variant="outline" className="h-8 text-xs font-bold">{secondaryBtn.text}</Button>}
          </div>
        </div>

        {data.image_url && (
          <div className="w-full md:w-48 h-32 rounded-xl overflow-hidden border shrink-0 bg-muted">
            <img src={data.image_url} alt="" className="w-full h-full object-cover" />
          </div>
        )}
      </div>
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
      return <GenericPreview data={data} />;
  }
};

export default SectionPreview;
