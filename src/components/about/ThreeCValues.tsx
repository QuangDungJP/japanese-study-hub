import ScrollReveal from "@/components/ScrollReveal";
import { useWebsiteContent } from "@/hooks/useWebsiteContent";

interface ValueItem {
  letter: string;
  word: string;
  color: string;
  bgGradient: string;
  description: string;
  quote?: string;
  quoteAuthor?: string;
  imageUrl?: string;
}

const defaultValues: ValueItem[] = [
  {
    letter: "C",
    word: "hallenging",
    color: "text-amber-500",
    bgGradient: "from-amber-50 to-orange-50",
    description: "Luôn tạo thử thách cho học viên, có tinh thần học tập không ngừng nghỉ. GV luôn đặt thử thách đầu giờ cho HV trước khi vào bài.",
    quote: "GV luôn đặt thử thách đầu giờ cho HV trước khi vào bài ",
    quoteAuthor: "Phương pháp TNQDO",
  },
  {
    letter: "C",
    word: "ultural-Based",
    color: "text-green-600",
    bgGradient: "from-green-50 to-emerald-50",
    description: "Giá trị văn hóa: Văn hóa doanh nghiệp, lối sống thường ngày của người Nhật luôn là Key quan trọng trong bài học.",
    quote: "Bài học nói về văn hóa 'Ông hát bà khen hay' khi đàm thoại",
    quoteAuthor: "Văn hóa Nhật Bản",
  },
  {
    letter: "C",
    word: "o-learning",
    color: "text-blue-600",
    bgGradient: "from-blue-50 to-sky-50",
    description: "Luôn tạo cảm giác giáo viên học cùng học viên. Không phải chỉ đơn giản là 'cái máy nhắc bài chạy bằng cơm'.",
    quote: "GV bắt HV đi tìm chủ ngữ, vị ngữ để cùng giải mã bài tập",
    quoteAuthor: "Phương pháp tương tác",
  },
];

const ThreeCValues = () => {
  const { data: content } = useWebsiteContent("about_3c_values");
  
  // Use CMS data if available, otherwise defaults
  const cmsContent = content?.[0]?.content as Record<string, unknown> | null;
  const title = (cmsContent?.title_display as string) || "Giá trị cốt lõi 3C tại TNQDO";
  const values: ValueItem[] = (cmsContent?.values as ValueItem[]) || defaultValues;

  return (
    <section className="py-20 md:py-28 bg-muted/20 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 via-green-500 to-blue-500" />
      <div className="container mx-auto px-4">
        <ScrollReveal>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              {title}
            </h2>
            <div className="flex items-center justify-center gap-3 mt-4">
              <span className="w-16 h-1 rounded-full bg-amber-400" />
              <span className="w-16 h-1 rounded-full bg-green-500" />
              <span className="w-16 h-1 rounded-full bg-blue-500" />
            </div>
          </div>
        </ScrollReveal>

        <div className="max-w-5xl mx-auto space-y-8 md:space-y-12">
          {values.map((item, i) => {
            const isEven = i % 2 === 0;
            return (
              <ScrollReveal key={i} delay={i * 150} direction={isEven ? "left" : "right"}>
                <div className={`bg-gradient-to-br ${item.bgGradient} rounded-3xl p-6 md:p-10 border border-border/50 shadow-lg hover:shadow-xl transition-all duration-500 group`}>
                  <div className={`flex flex-col ${isEven ? "md:flex-row" : "md:flex-row-reverse"} gap-6 md:gap-10 items-center`}>
                    {/* Text content */}
                    <div className="flex-1 space-y-4">
                      <div className="flex items-baseline gap-0">
                        <span className={`text-6xl md:text-8xl font-black ${item.color} leading-none group-hover:scale-110 transition-transform origin-bottom-left`}>
                          {item.letter}
                        </span>
                        <span className="text-2xl md:text-4xl font-bold text-foreground leading-none">
                          {item.word}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
                        {item.description}
                      </p>
                      {item.quote && (
                        <div className="bg-background/60 backdrop-blur-sm rounded-2xl p-4 border border-border/30 mt-4">
                          <p className="text-sm italic text-muted-foreground">"{item.quote}"</p>
                          {item.quoteAuthor && (
                            <p className="text-xs text-muted-foreground/70 mt-1">— {item.quoteAuthor}</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Visual element */}
                    <div className="flex-shrink-0 w-full md:w-72 lg:w-80">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={`${item.letter}${item.word}`}
                          className="w-full rounded-2xl shadow-md object-cover aspect-[4/3]"
                        />
                      ) : (
                        <div className={`w-full aspect-[4/3] rounded-2xl bg-gradient-to-br ${
                          i === 0 ? "from-amber-200 to-orange-300" :
                          i === 1 ? "from-green-200 to-emerald-300" :
                          "from-blue-200 to-sky-300"
                        } flex items-center justify-center shadow-md`}>
                          <span className="text-7xl md:text-9xl font-black text-white/40 select-none">
                            {item.letter}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ThreeCValues;
