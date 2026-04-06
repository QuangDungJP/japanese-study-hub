import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, Trophy, Video } from "lucide-react";
import { Link } from "react-router-dom";
import { useAllWebsiteContent } from "@/hooks/useWebsiteContent";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

const defaultCourses = [
  { level: "N5 - Sơ cấp", description: "Dành cho người mới bắt đầu", duration: "3 tháng", lessons: 60, color: "bg-green-500" },
  { level: "N4 - Sơ trung cấp", description: "Nắm vững ngữ pháp cơ bản", duration: "4 tháng", lessons: 80, color: "bg-blue-500" },
  { level: "N3 - Trung cấp", description: "Giao tiếp tự nhiên", duration: "5 tháng", lessons: 100, color: "bg-purple-500" },
  { level: "N2 - Cao cấp", description: "Đọc hiểu chuyên sâu", duration: "6 tháng", lessons: 120, color: "bg-orange-500" },
  { level: "N1 - Thành thạo", description: "Trình độ bản ngữ", duration: "8 tháng", lessons: 150, color: "bg-japanese" },
];

const defaultFeatures = [
  { icon: BookOpen, title: "1000+ Bài học", description: "Từ Hiragana, Katakana đến Kanji nâng cao" },
  { icon: Users, title: "Giáo viên Nhật Bản", description: "100% giáo viên bản ngữ có chứng chỉ" },
  { icon: Video, title: "Zoom Class", description: "Lớp học trực tuyến 1-1 và nhóm nhỏ" },
  { icon: Trophy, title: "Chứng chỉ JLPT", description: "Lộ trình luyện thi N5 đến N1" },
];

const iconMap: Record<string, any> = {
  book: BookOpen,
  users: Users,
  video: Video,
  trophy: Trophy,
};

const LanguagesSection = () => {
  const { data: content, isLoading } = useAllWebsiteContent();
  const [dbCourses, setDbCourses] = useState<Array<{ id: string; level: string; slug: string | null }>>([]);

  useEffect(() => {
    const fetchCourses = async () => {
      const { data } = await supabase
        .from("courses")
        .select("id, level, slug")
        .eq("is_published", true);
      setDbCourses(data || []);
    };
    fetchCourses();
  }, []);

  const getCourseLink = (level: string) => {
    const match = dbCourses.find(c => c.level === level.split(" ")[0]);
    return match ? `/khoa-hoc/${match.slug || match.id}` : "/auth";
  };

  const langContent = content?.languages;
  const langData = langContent?.content as {
    courses?: typeof defaultCourses;
    features?: Array<{ icon: string; title: string; description: string }>;
    whyLearn?: Array<{ emoji: string; title: string; description: string }>;
  } | null;

  const title = langContent?.title_vi || "Lộ trình học Tiếng Nhật toàn diện";
  const subtitle = langContent?.subtitle_vi || "Tiếng Nhật";
  const description = langContent?.description_vi || 
    "Từ N5 đến N1, phương pháp học chuẩn JLPT được thiết kế riêng cho người Việt";

  const courses = langData?.courses || defaultCourses;
  const features = langData?.features?.map(f => ({
    ...f,
    icon: iconMap[f.icon] || BookOpen,
  })) || defaultFeatures;
  const whyLearn = langData?.whyLearn || [
    { emoji: "💼", title: "Cơ hội việc làm", description: "Nhật Bản là đối tác thương mại lớn của Việt Nam với nhiều cơ hội nghề nghiệp hấp dẫn" },
    { emoji: "🎌", title: "Văn hóa phong phú", description: "Khám phá anime, manga, văn hóa truyền thống và ẩm thực Nhật Bản" },
    { emoji: "✈️", title: "Du học & Du lịch", description: "Chuẩn bị tốt nhất cho việc du học hoặc du lịch tại đất nước mặt trời mọc" },
  ];

  if (isLoading) {
    return (
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <Skeleton className="h-8 w-32 mx-auto" />
            <Skeleton className="h-12 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="languages" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-japanese/10 text-japanese text-sm font-semibold mb-4">
            <span className="text-xl">🇯🇵</span>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-card rounded-2xl p-6 border border-border shadow-soft hover:shadow-card-hover transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-japanese/10 flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-japanese" />
              </div>
              <h3 className="font-bold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Course Levels */}
        <div className="bg-card rounded-3xl p-8 border border-border shadow-soft">
          <h3 className="text-2xl font-bold text-foreground mb-8 text-center">
            Các cấp độ JLPT
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {courses.map((course, index) => (
              <Link
                key={course.level}
                to={getCourseLink(course.level)}
                className="group relative bg-muted/50 rounded-2xl p-6 hover:bg-muted transition-all duration-300 border border-transparent hover:border-japanese/20 block"
              >
                {/* Level Badge */}
                <div className={`w-10 h-10 rounded-xl ${course.color} flex items-center justify-center mb-4`}>
                  <span className="text-white font-bold text-sm">N{5 - index}</span>
                </div>
                
                <h4 className="font-bold text-foreground mb-1">{course.level}</h4>
                <p className="text-sm text-muted-foreground mb-4">{course.description}</p>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Thời gian:</span>
                    <span className="font-medium text-foreground">{course.duration}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Bài học:</span>
                    <span className="font-medium text-foreground">{course.lessons}</span>
                  </div>
                </div>

                {/* Hover effect */}
                <div className="absolute inset-0 rounded-2xl border-2 border-japanese opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </Link>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-8 text-center">
            <Button variant="japanese" size="lg" asChild>
              <Link to="/auth">
                Bắt đầu học Tiếng Nhật
              </Link>
            </Button>
          </div>
        </div>

        {/* Why Japanese */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          {whyLearn.map((item) => (
            <div key={item.title} className="text-center">
              <div className="text-4xl mb-4">{item.emoji}</div>
              <h4 className="font-bold text-foreground mb-2">{item.title}</h4>
              <p className="text-muted-foreground text-sm">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LanguagesSection;
