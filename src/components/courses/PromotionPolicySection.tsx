import { motion } from "framer-motion";
import {
  Sparkles,
  Gift,
  BadgePercent,
  Crown,
  Users,
} from "lucide-react";

const policies = [
  {
    percent: "-2%",
    title: "học phí",
    content:
      "Mỗi tháng nếu chuyên cần đi học đầy đủ bạn sẽ tích được 1 voucher -2% học phí",
    icon: Sparkles,
  },
  {
    percent: "-10%",
    title: "học phí",
    content:
      "Nếu bạn đóng học phí toàn khóa thay vì đóng lẻ từng tháng",
    icon: BadgePercent,
  },
  {
    percent: "-15%",
    title: "học phí",
    content: [
      "Cho mỗi một người thân bạn giới thiệu học bất kì bộ môn nào trong hệ sinh thái QDO",
      "Khi bạn mua gói trọn bộ N543 tại TNQDO",
    ],
    icon: Gift,
  },
  {
    percent: "-50%",
    title: "học phí",
    content:
      "Nếu bạn là CBCNV tại QDO. Hoặc nếu bạn là nhà tài trợ VÀNG / KIM CƯƠNG cho TNQDO",
    icon: Crown,
  },
];

const PromotionPolicySection = () => {
  return (
    <section className="relative py-24 overflow-hidden bg-[#eef3fb]">
      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-green-400/10 blur-3xl rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-400/10 blur-3xl rounded-full" />
      </div>

      <div className="container relative z-10 mx-auto px-4">
        {/* Ribbon */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="flex justify-center mb-20"
        >
          <div className="relative">
            {/* Left Tail */}
            <div className="absolute left-[-60px] top-5 w-20 h-20 bg-gradient-to-r from-[#e0bb57] to-[#f9efb0] skew-y-[20deg] rounded-bl-3xl shadow-lg" />

            {/* Right Tail */}
            <div className="absolute right-[-60px] top-5 w-20 h-20 bg-gradient-to-l from-[#e0bb57] to-[#f9efb0] -skew-y-[20deg] rounded-br-3xl shadow-lg" />

            {/* Main Ribbon */}
            <div className="relative px-16 py-5 rounded-[28px] border-[3px] border-[#b98c35] bg-gradient-to-b from-[#fff6c8] via-[#f5df8e] to-[#cfa03c] shadow-2xl">
              <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight drop-shadow-[0_4px_0_rgba(31,64,181,1)]">
                Chính sách ưu đãi
              </h2>
            </div>
          </div>
        </motion.div>

        {/* Policies */}
        <div className="max-w-6xl mx-auto flex flex-col gap-10">
          {policies.map((item, index) => {
            const Icon = item.icon;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.7,
                  delay: index * 0.15,
                }}
                viewport={{ once: true }}
                className="grid grid-cols-1 lg:grid-cols-[280px_1fr] items-center gap-6"
              >
                {/* LEFT */}
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Icon className="w-10 h-10 text-[#76ff4f]" />

                      <h3 className="text-[72px] md:text-[90px] leading-none font-black italic text-[#76ff4f] drop-shadow-[0_2px_0_rgba(0,0,0,0.1)]">
                        {item.percent}
                      </h3>
                    </div>

                    <p className="text-4xl md:text-5xl font-light italic text-black -mt-2">
                      {item.title}
                    </p>
                  </div>
                </div>

                {/* RIGHT */}
                <div className="relative">
                  {/* Arrow Shape */}
                  <div
                    className="
                      relative
                      bg-gradient-to-r
                      from-[#f8fff8]
                      via-[#edf9f2]
                      to-[#cfe9ff]
                      px-8
                      py-8
                      md:px-12
                      md:py-10
                      shadow-xl
                      border
                      border-white/70
                      backdrop-blur-xl
                      clip-arrow
                    "
                  >
                    <div className="absolute inset-0 bg-white/20 rounded-[24px]" />

                    <div className="relative z-10">
                      {Array.isArray(item.content) ? (
                        <ul className="space-y-4">
                          {item.content.map((line, i) => (
                            <li
                              key={i}
                              className="flex gap-4 text-xl md:text-[34px] leading-relaxed italic text-black font-medium"
                            >
                              <span className="mt-3 w-3 h-3 rounded-full bg-black flex-shrink-0" />
                              <span>{line}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xl md:text-[34px] leading-relaxed italic text-black font-medium">
                          {item.content}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom Note */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-white/70 backdrop-blur-md shadow-lg border border-white">
            <Users className="w-5 h-5 text-primary" />
            <p className="text-muted-foreground font-medium">
              Chính sách có thể thay đổi theo từng chương trình ưu đãi đặc biệt
            </p>
          </div>
        </motion.div>
      </div>

      {/* Tailwind Custom */}
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

export default PromotionPolicySection;