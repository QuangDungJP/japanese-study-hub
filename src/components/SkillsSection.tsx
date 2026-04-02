import { BookOpen, Mic, PenTool, Headphones, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAllWebsiteContent } from "@/hooks/useWebsiteContent";
import { Skeleton } from "@/components/ui/skeleton";

const defaultSkills = [
  {
    icon: BookOpen,
    title: "Đọc hiểu",
    titleEn: "Reading",
    description: "Luyện đọc với hàng ngàn bài viết từ cơ bản đến nâng cao. Từ vựng được highlight và giải thích chi tiết.",
    color: "bg-blue-500",
    features: ["Bài đọc theo level", "Từ vựng highlight", "Quiz sau mỗi bài"],
  },
  {
    icon: Mic,
    title: "Nói",
    titleEn: "Speaking",
    description: "Luyện phát âm với AI và giáo viên bản ngữ. Nhận phản hồi chi tiết về ngữ điệu và phát âm.",
    color: "bg-green-500",
    features: ["AI phân tích giọng nói", "1-1 với giáo viên", "Flashcard phát âm"],
  },
  {
    icon: PenTool,
    title: "Viết",
    titleEn: "Writing",
    description: "Bài tập viết đa dạng từ câu đơn đến essay. AI chấm điểm và giáo viên review chi tiết.",
    color: "bg-purple-500",
    features: ["AI chấm bài tự động", "Template mẫu", "Feedback chi tiết"],
  },
  {
    icon: Headphones,
    title: "Nghe",
    titleEn: "Listening",
    description: "Audio chất lượng cao với nhiều giọng và tốc độ. Transcript đi kèm để follow along.",
    color: "bg-orange-500",
    features: ["Đa dạng chủ đề", "Tốc độ điều chỉnh", "Transcript song ngữ"],
  },
];

const iconMap: Record<string, any> = {
  reading: BookOpen,
  speaking: Mic,
  writing: PenTool,
  listening: Headphones,
};

const SkillsSection = () => {
  const { data: content, isLoading } = useAllWebsiteContent();
  const skillsContent = content?.skills;
  const skillsData = skillsContent?.content as {
    skills?: Array<{
      icon: string;
      title: string;
      titleEn: string;
      description: string;
      color: string;
      features: string[];
    }>;
  } | null;

  const title = skillsContent?.title_vi || "Phát triển toàn diện ngôn ngữ";
  const subtitle = skillsContent?.subtitle_vi || "4 Kỹ năng cốt lõi";
  const description = skillsContent?.description_vi || 
    "Hệ thống bài học được thiết kế khoa học, giúp bạn tiến bộ nhanh chóng ở cả 4 kỹ năng";

  const skills = skillsData?.skills?.map(skill => ({
    ...skill,
    icon: iconMap[skill.icon] || BookOpen,
  })) || defaultSkills;

  if (isLoading) {
    return (
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <Skeleton className="h-8 w-48 mx-auto" />
            <Skeleton className="h-12 w-96 mx-auto" />
            <Skeleton className="h-6 w-80 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="skills" className="py-24 bg-background">
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

        {/* Skills Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {skills.map((skill, index) => (
            <div
              key={skill.title}
              className="group relative bg-card rounded-2xl p-8 shadow-soft hover:shadow-card-hover transition-all duration-300 border border-border overflow-hidden"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Background Gradient */}
              <div className={`absolute top-0 right-0 w-32 h-32 ${skill.color} opacity-5 rounded-full blur-3xl group-hover:opacity-10 transition-opacity`} />
              
              <div className="relative z-10">
                {/* Icon */}
                <div className={`w-14 h-14 rounded-xl ${skill.color} bg-opacity-10 flex items-center justify-center mb-6`}>
                  <skill.icon className={`w-7 h-7 ${skill.color.replace('bg-', 'text-')}`} />
                </div>

                {/* Title */}
                <div className="flex items-baseline gap-3 mb-3">
                  <h3 className="text-2xl font-bold text-foreground">{skill.title}</h3>
                  <span className="text-sm text-muted-foreground font-medium">{skill.titleEn}</span>
                </div>

                {/* Description */}
                <p className="text-muted-foreground mb-6">{skill.description}</p>

                {/* Features */}
                <ul className="space-y-2 mb-6">
                  {skill.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-foreground">
                      <div className={`w-1.5 h-1.5 rounded-full ${skill.color}`} />
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Button variant="ghost" className="group/btn p-0 h-auto text-primary hover:text-primary/80">
                  Khám phá ngay
                  <ArrowRight className="w-4 h-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SkillsSection;
