import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Headphones, PenTool, MessageCircle, FileText, Video } from "lucide-react";

const resources = [
  { icon: BookOpen, title: "Từ vựng", desc: "Học từ vựng theo chủ đề với flashcard thông minh", jp: "語彙" },
  { icon: PenTool, title: "Kanji", desc: "Luyện viết và ghi nhớ Kanji theo thứ tự JLPT", jp: "漢字" },
  { icon: Headphones, title: "Nghe hiểu", desc: "Bài nghe từ đời thực: tin tức, podcast, anime", jp: "聴解" },
  { icon: MessageCircle, title: "Ngữ pháp", desc: "Giải thích ngữ pháp rõ ràng với ví dụ thực tế", jp: "文法" },
  { icon: FileText, title: "Đọc hiểu", desc: "Bài đọc phân cấp từ dễ đến khó", jp: "読解" },
  { icon: Video, title: "Video bài giảng", desc: "Video giảng dạy chi tiết từ giáo viên bản xứ", jp: "動画" },
];

const ResourcesSection = () => {
  return (
    <section className="py-20 bg-muted/50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold font-heading text-foreground">Tài nguyên học tập</h2>
          <p className="text-muted-foreground mt-3">Đầy đủ công cụ giúp bạn tiến bộ mỗi ngày</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((r) => {
            const Icon = r.icon;
            return (
              <Card key={r.title} className="group border-border hover:border-accent/40 hover:shadow-lg transition-all duration-300 cursor-pointer bg-card">
                <CardContent className="p-6 flex gap-4 items-start">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-sakura-light flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                    <Icon className="h-6 w-6 text-accent" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold font-heading text-foreground">{r.title}</h3>
                      <span className="text-xs text-muted-foreground font-heading">{r.jp}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{r.desc}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ResourcesSection;
