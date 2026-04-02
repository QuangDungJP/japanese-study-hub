import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Star, TrendingUp, Award, Crown } from "lucide-react";

const levels = [
  { level: "N5", title: "Sơ cấp", desc: "Hiragana, Katakana, 100 Kanji, ngữ pháp cơ bản", icon: BookOpen, kanji: "初", vocab: "800", grammar: "80" },
  { level: "N4", title: "Sơ trung cấp", desc: "300 Kanji, giao tiếp hàng ngày, đọc hiểu cơ bản", icon: Star, kanji: "基", vocab: "1,500", grammar: "165" },
  { level: "N3", title: "Trung cấp", desc: "650 Kanji, đọc báo đơn giản, nghe tin tức", icon: TrendingUp, kanji: "中", vocab: "3,750", grammar: "250" },
  { level: "N2", title: "Trung cao cấp", desc: "1,000 Kanji, đọc tiểu thuyết, làm việc tại Nhật", icon: Award, kanji: "上", vocab: "6,000", grammar: "350" },
  { level: "N1", title: "Cao cấp", desc: "2,000 Kanji, thành thạo mọi tình huống giao tiếp", icon: Crown, kanji: "極", vocab: "10,000", grammar: "450" },
];

const JLPTSection = () => {
  return (
    <section className="py-20 bg-muted/50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-14">
          <Badge className="bg-sakura-light text-secondary-foreground border-0 mb-4 font-heading">JLPT レベル</Badge>
          <h2 className="text-3xl md:text-4xl font-bold font-heading text-foreground">Các cấp độ JLPT</h2>
          <p className="text-muted-foreground mt-3 max-w-lg mx-auto">Chọn cấp độ phù hợp và bắt đầu hành trình chinh phục tiếng Nhật</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {levels.map((l, i) => {
            const Icon = l.icon;
            return (
              <Card key={l.level} className="group border-border hover:border-accent/50 hover:shadow-lg transition-all duration-300 cursor-pointer bg-card">
                <CardContent className="p-6 text-center">
                  <div className="text-5xl font-heading text-muted-foreground/20 mb-2">{l.kanji}</div>
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-sakura-light mb-3">
                    <Icon className="h-6 w-6 text-accent" />
                  </div>
                  <h3 className="text-xl font-bold font-heading text-foreground">{l.level}</h3>
                  <p className="text-sm font-medium text-accent mb-2">{l.title}</p>
                  <p className="text-xs text-muted-foreground mb-4">{l.desc}</p>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>📝 {l.vocab} từ vựng</p>
                    <p>📖 {l.grammar} ngữ pháp</p>
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

export default JLPTSection;
