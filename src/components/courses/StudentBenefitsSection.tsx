import { motion } from "framer-motion";
import {
  Headphones,
  BookOpen,
  GraduationCap,
  Users,
  Video,
  Network,
} from "lucide-react";

const benefits = [
  {
    icon: Headphones,
    title:
      "Sự chăm sóc tận tình bởi đội ngũ giáo viên, trợ giảng, CSKH",
  },
  {
    icon: BookOpen,
    title:
      "MIỄN PHÍ toàn bộ tài liệu học tập, sách giáo khoa E-book, giáo trình độc quyền",
    highlight: "MIỄN PHÍ",
  },
  {
    icon: GraduationCap,
    title:
      "MIỄN PHÍ kèm 1:1 để giảng lại bài học nếu chưa hiểu bài trên lớp",
    highlight: "MIỄN PHÍ",
  },
  {
    icon: Users,
    title:
      "Sĩ số nhỏ, hiệu quả to: Chỉ từ 15 học viên, thuận tiện để trao đổi trực tiếp với giáo viên.",
  },
  {
    icon: Video,
    title:
      "Luôn có record lại buổi học trên Google Meet, học viên có thể xem lại bất cứ lúc nào",
  },
  {
    icon: Network,
    title:
      "Cơ hội thăng tiến trong sự nghiệp, networking với các doanh nghiệp thông qua giáo viên giới thiệu.",
  },
];

const StudentBenefitsSection = () => {
  return (
    <section className="relative overflow-hidden bg-[#edf2fa] py-24">
      {/* Background Blur */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-primary/10 blur-3xl rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-sky-300/10 blur-3xl rounded-full" />
      </div>

      <div className="container relative z-10 mx-auto px-4">
        {/* Ribbon Title */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="flex justify-center mb-24"
        >
          <div className="relative">
            {/* Left Tail */}
            <div className="absolute left-[-70px] top-5 w-24 h-20 bg-gradient-to-r from-[#deb75a] to-[#fff0ae] skew-y-[20deg] rounded-bl-3xl shadow-xl" />

            {/* Right Tail */}
            <div className="absolute right-[-70px] top-5 w-24 h-20 bg-gradient-to-l from-[#deb75a] to-[#fff0ae] -skew-y-[20deg] rounded-br-3xl shadow-xl" />

            {/* Ribbon */}
            <div className="relative px-10 md:px-20 py-5 rounded-[30px] border-[3px] border-[#b68934] bg-gradient-to-b from-[#fff5c5] via-[#f6df8f] to-[#cf9f39] shadow-2xl">
              <h2 className="text-2xl md:text-5xl font-black text-white tracking-tight text-center drop-shadow-[0_4px_0_rgba(31,64,181,1)]">
                Quyền lợi học viên tại TNQDO
              </h2>
            </div>
          </div>
        </motion.div>

        {/* Benefits */}
        <div className="max-w-6xl mx-auto flex flex-col gap-10">
          {benefits.map((item, index) => {
            const Icon = item.icon;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.7,
                  delay: index * 0.1,
                }}
                viewport={{ once: true }}
                className="grid grid-cols-1 lg:grid-cols-[180px_1fr] gap-6 items-center"
              >
                {/* LEFT ICON */}
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-white/40 blur-2xl rounded-full scale-125" />

                    <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-3xl bg-white/80 backdrop-blur-md border border-white shadow-2xl flex items-center justify-center">
                      <Icon className="w-16 h-16 md:w-20 md:h-20 text-black stroke-[1.5]" />
                    </div>
                  </div>
                </div>

                {/* RIGHT CONTENT */}
                <div className="relative">
                  <div
                    className="
                      relative
                      px-8
                      py-7
                      md:px-12
                      md:py-9
                      bg-gradient-to-r
                      from-[#f9fff9]
                      via-[#eef9f2]
                      to-[#cfe8ff]
                      border
                      border-white/70
                      shadow-xl
                      backdrop-blur-xl
                      clip-arrow
                    "
                  >
                    {/* Glass Overlay */}
                    <div className="absolute inset-0 bg-white/20 rounded-[28px]" />

                    {/* Content */}
                    <div className="relative z-10">
                      <p className="text-xl md:text-[33px] leading-relaxed italic text-black font-medium">
                        {item.highlight ? (
                          <>
                            <span className="font-black not-italic">
                              {item.highlight}
                            </span>{" "}
                            {item.title.replace(item.highlight, "")}
                          </>
                        ) : (
                          item.title
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="mt-20 text-center"
        >
          <div className="inline-flex items-center gap-3 rounded-2xl bg-white/70 backdrop-blur-md border border-white px-6 py-4 shadow-xl">
            <GraduationCap className="w-5 h-5 text-primary" />
            <p className="font-medium text-muted-foreground">
              Học không chỉ để thi JLPT — mà để phát triển tương lai toàn diện
            </p>
          </div>
        </motion.div>
      </div>

      {/* Arrow Shape */}
      <style>{`
        .clip-arrow {
          clip-path: polygon(
            0 0,
            calc(100% - 55px) 0,
            100% 50%,
            calc(100% - 55px) 100%,
            0 100%
          );
          border-radius: 28px;
        }
      `}</style>
    </section>
  );
};

export default StudentBenefitsSection;