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
    bgGradient: "from-amber-50 via-orange-50 to-amber-100",
    description:
      "Luôn tạo thử thách cho học viên, có tinh thần học tập không ngừng nghỉ. GV luôn đặt thử thách đầu giờ cho HV trước khi vào bài.",
    quote:
      "GV luôn đặt thử thách đầu giờ cho HV trước khi vào bài",
    quoteAuthor: "Phương pháp TNQDO",
    imageUrl: "/img/challenging.png",
  },
  {
    letter: "C",
    word: "ultural-Based",
    color: "text-green-600",
    bgGradient: "from-green-50 via-emerald-50 to-green-100",
    description:
      "Giá trị văn hóa: Văn hóa doanh nghiệp, lối sống thường ngày của người Nhật luôn là Key quan trọng trong bài học.",
    quote:
      "Bài học nói về văn hóa 'Ông hát bà khen hay' khi đàm thoại",
    quoteAuthor: "Văn hóa Nhật Bản",
    imageUrl: "/img/cultural.png",
  },
  {
    letter: "C",
    word: "o-learning",
    color: "text-blue-600",
    bgGradient: "from-blue-50 via-sky-50 to-blue-100",
    description:
      "Luôn tạo cảm giác giáo viên học cùng học viên. Không phải chỉ đơn giản là 'cái máy nhắc bài chạy bằng cơm'.",
    quote:
      "GV bắt HV đi tìm chủ ngữ, vị ngữ để cùng giải mã bài tập",
    quoteAuthor: "Phương pháp tương tác",
    imageUrl: "/img/colearning.png",
  },
];

const ThreeCValues = () => {
  const { data: content } = useWebsiteContent("about_3c_values");

  // CMS content
  const cmsContent =
    (content?.[0]?.content as Record<string, unknown>) || null;

  const title =
    (cmsContent?.title_display as string) ||
    "Giá trị cốt lõi 3C tại TNQDO";

  const values: ValueItem[] =
    (cmsContent?.values as ValueItem[]) || defaultValues;

  return (
    <section className="py-20 md:py-28 bg-muted/20 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 via-green-500 to-blue-500" />

      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-amber-300/10 rounded-full blur-3xl" />

      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-300/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <ScrollReveal>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-background/80 backdrop-blur-xl border border-border shadow-sm mb-5">
              <span className="text-sm font-semibold text-primary">
                TNQDO Method
              </span>
            </div>

            <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-foreground leading-tight">
              {title}
            </h2>

            <div className="flex items-center justify-center gap-3 mt-6">
              <span className="w-16 h-1 rounded-full bg-amber-400" />
              <span className="w-16 h-1 rounded-full bg-green-500" />
              <span className="w-16 h-1 rounded-full bg-blue-500" />
            </div>

            <p className="text-muted-foreground text-lg mt-6 leading-relaxed">
              Phương pháp học tập hiện đại giúp học viên phát triển toàn diện
              tư duy, kỹ năng và khả năng ứng dụng thực tế.
            </p>
          </div>
        </ScrollReveal>

        {/* Cards */}
        <div className="max-w-6xl mx-auto space-y-8 md:space-y-12">
          {values.map((item, i) => {
            const isEven = i % 2 === 0;

            return (
              <ScrollReveal
                key={i}
                delay={i * 120}
                direction={isEven ? "left" : "right"}
              >
                <div
                  className={`
                    relative
                    overflow-hidden
                    rounded-[32px]
                    bg-gradient-to-br
                    ${item.bgGradient}
                    border
                    border-white/40
                    shadow-[0_20px_60px_rgba(0,0,0,0.08)]
                    hover:shadow-[0_30px_80px_rgba(0,0,0,0.12)]
                    transition-all
                    duration-500
                    group
                  `}
                >
                  {/* Decorative blur */}
                  <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/20 rounded-full blur-3xl" />

                  <div
                    className={`
                      relative
                      z-10
                      flex
                      flex-col
                      ${
                        isEven
                          ? "lg:flex-row"
                          : "lg:flex-row-reverse"
                      }
                      gap-8
                      lg:gap-12
                      items-center
                      p-6
                      md:p-10
                    `}
                  >
                    {/* TEXT */}
                    <div className="flex-1">
                      {/* Title */}
                      <div className="flex items-end gap-0 mb-5">
                        <span
                          className={`
                            text-6xl
                            md:text-8xl
                            font-black
                            ${item.color}
                            leading-none
                            group-hover:scale-110
                            transition-transform
                            duration-500
                          `}
                        >
                          {item.letter}
                        </span>

                        <span className="text-2xl md:text-4xl font-black text-foreground leading-none">
                          {item.word}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
                        {item.description}
                      </p>

                      {/* Quote */}
                      {item.quote && (
                        <div
                          className="
                            mt-6
                            rounded-2xl
                            bg-background/70
                            backdrop-blur-xl
                            border
                            border-border/40
                            p-5
                            shadow-sm
                          "
                        >
                          <p className="italic text-muted-foreground leading-relaxed">
                            “{item.quote}”
                          </p>

                          {item.quoteAuthor && (
                            <p className="text-sm text-muted-foreground/70 mt-3">
                              — {item.quoteAuthor}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* IMAGE */}
                    <div className="w-full md:w-[340px] flex-shrink-0">
                      <div
                        className="
                          relative
                          overflow-hidden
                          rounded-[28px]
                          border
                          border-white/30
                          bg-white
                          shadow-[0_20px_50px_rgba(0,0,0,0.12)]
                          group/image
                        "
                      >
                        {/* Image */}
                        <img
                          src={item.imageUrl}
                          alt={`${item.letter}${item.word}`}
                          className="
                            w-full
                            aspect-[4/3]
                            object-cover
                            transition-transform
                            duration-700
                            group-hover/image:scale-110
                          "
                        />

                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

                        {/* Badge */}
                        <div
                          className="
                            absolute
                            top-4
                            right-4
                            px-4
                            py-1.5
                            rounded-full
                            bg-white/20
                            backdrop-blur-md
                            border
                            border-white/20
                            text-white
                            text-sm
                            font-bold
                            tracking-wide
                          "
                        >
                          3C
                        </div>
                      </div>
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