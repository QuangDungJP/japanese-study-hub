import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SkillsSection from "@/components/SkillsSection";
import FeaturesSection from "@/components/FeaturesSection";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Sparkles, Users, BookOpen, Trophy, Target, ArrowRight, GraduationCap, Heart, Star, Zap, Globe, HelpCircle, Search } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import ThreeCValues from "@/components/about/ThreeCValues";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  order_index: number;
}

const About = () => {
  const [faqSearch, setFaqSearch] = useState('');

  const { data: faqs = [] } = useQuery({
    queryKey: ['faqs-public'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });
      if (error) throw error;
      return data as FAQ[];
    },
  });

  const filteredFaqs = faqSearch
    ? faqs.filter(faq =>
        faq.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
        faq.answer.toLowerCase().includes(faqSearch.toLowerCase())
      )
    : faqs;

  return (
    <main className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-28 pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-japanese/5">
          <div className="absolute top-20 right-20 w-72 h-72 bg-primary/8 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-10 left-20 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-float animation-delay-200" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-japanese/3 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <ScrollReveal>
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6 border border-primary/20">
                <GraduationCap className="w-4 h-4" />
                Về TNQDO
              </div>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-foreground mb-6 leading-[1.1] tracking-tight">
                Nền tảng học{" "}
                <span className="relative inline-block">
                  <span className="text-japanese">Tiếng Nhật</span>
                  <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 300 8" fill="none">
                    <path d="M2 6C80 2 150 2 298 6" stroke="hsl(var(--japanese))" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
                  </svg>
                </span>
                {" "}hàng đầu
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Sứ mệnh giúp người Việt chinh phục tiếng Nhật hiệu quả nhất với phương pháp khoa học và công nghệ AI tiên tiến
              </p>
            </ScrollReveal>
          </div>

          {/* Stats */}
          <ScrollReveal delay={200}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-4xl mx-auto mt-16">
              {[
                { icon: Users, value: "50,000+", label: "Học viên", color: "text-blue-500", bg: "bg-blue-500/10" },
                { icon: BookOpen, value: "1,000+", label: "Bài học", color: "text-green-500", bg: "bg-green-500/10" },
                { icon: Trophy, value: "95%", label: "Tỷ lệ đỗ JLPT", color: "text-accent", bg: "bg-accent/10" },
                { icon: Target, value: "200+", label: "Giáo viên", color: "text-purple-500", bg: "bg-purple-500/10" },
              ].map((stat, i) => (
                <ScrollReveal key={stat.label} delay={i * 100} direction="up">
                  <div className="bg-card rounded-2xl p-5 md:p-6 border border-border text-center hover:shadow-xl transition-all duration-500 hover:-translate-y-1 group h-full">
                    <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                      <stat.icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                    <div className="text-2xl md:text-3xl font-extrabold text-foreground mb-1">{stat.value}</div>
                    <div className="text-xs md:text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 md:py-28 bg-muted/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center max-w-6xl mx-auto">
            <ScrollReveal direction="left">
              <div>
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-semibold mb-6 border border-accent/20">
                  <Heart className="w-4 h-4" />
                  Câu chuyện
                </span>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-tight">
                  Câu chuyện của <span className="text-primary">TNQDO</span>
                </h2>
                <div className="space-y-4 text-muted-foreground leading-relaxed text-base md:text-lg">
                  <p>TNQDO được thành lập với mong muốn mang đến cho người Việt Nam phương pháp học tiếng Nhật hiệu quả, khoa học và phù hợp nhất.</p>
                  <p>Với đội ngũ giáo viên bản ngữ có chứng chỉ giảng dạy quốc tế cùng hệ thống công nghệ AI tiên tiến, chúng tôi đã giúp hơn 50,000 học viên chinh phục thành công các kỳ thi JLPT.</p>
                  <p>Mỗi khóa học được thiết kế riêng cho người Việt, tập trung vào những điểm khó thường gặp và phát triển toàn diện 4 kỹ năng: Đọc - Nói - Viết - Nghe.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 mt-8">
                  <Button className="rounded-2xl h-12 px-8" asChild>
                    <Link to="/khoa-hoc">Xem khóa học <ArrowRight className="w-4 h-4 ml-2" /></Link>
                  </Button>
                  <Button variant="outline" className="rounded-2xl h-12 px-8" asChild>
                    <Link to="/giao-vien">Đội ngũ giảng viên</Link>
                  </Button>
                </div>
              </div>
            </ScrollReveal>
            <ScrollReveal direction="right">
              <div className="relative">
                <div className="bg-card rounded-3xl p-6 md:p-8 border border-border shadow-xl">
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    {[
                      { emoji: "🎌", text: "Văn hóa Nhật Bản", desc: "Hiểu sâu văn hóa" },
                      { emoji: "💼", text: "Cơ hội việc làm", desc: "Thăng tiến sự nghiệp" },
                      { emoji: "✈️", text: "Du học & Du lịch", desc: "Tự tin giao tiếp" },
                      { emoji: "📚", text: "Kiến thức toàn diện", desc: "4 kỹ năng cốt lõi" },
                    ].map(item => (
                      <div key={item.text} className="bg-muted/50 rounded-2xl p-5 md:p-6 text-center hover:bg-muted transition-colors group hover:-translate-y-1 duration-300">
                        <div className="text-3xl md:text-4xl mb-3 group-hover:scale-110 transition-transform">{item.emoji}</div>
                        <p className="text-sm font-bold text-foreground mb-1">{item.text}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-japanese/10 rounded-2xl rotate-12 animate-float hidden md:block" />
                <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-accent/10 rounded-xl -rotate-12 animate-float animation-delay-300 hidden md:block" />
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container mx-auto px-4">
          <ScrollReveal>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4 border border-primary/20">
                <Star className="w-4 h-4" />
                Giá trị cốt lõi
              </span>
              <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-5">
                Tại sao chọn <span className="text-primary">TNQDO</span>?
              </h2>
              <p className="text-lg text-muted-foreground">Chúng tôi cam kết mang đến trải nghiệm học tập tốt nhất</p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { icon: Zap, title: "Học nhanh gấp 3 lần", desc: "Phương pháp Spaced Repetition kết hợp AI giúp ghi nhớ nhanh và lâu hơn", color: "text-accent", bg: "bg-accent/10" },
              { icon: Globe, title: "100% giáo viên bản ngữ", desc: "Đội ngũ giáo viên Nhật Bản có chứng chỉ giảng dạy quốc tế", color: "text-blue-500", bg: "bg-blue-500/10" },
              { icon: Target, title: "Lộ trình cá nhân hóa", desc: "AI phân tích và tạo lộ trình học phù hợp riêng cho từng học viên", color: "text-green-500", bg: "bg-green-500/10" },
              { icon: Trophy, title: "Cam kết đầu ra", desc: "Cam kết đạt chứng chỉ JLPT hoặc hoàn tiền 100% trong 30 ngày", color: "text-purple-500", bg: "bg-purple-500/10" },
              { icon: Heart, title: "Cộng đồng lớn mạnh", desc: "Hơn 50,000 học viên đang cùng nhau chinh phục tiếng Nhật", color: "text-japanese", bg: "bg-japanese/10" },
              { icon: Sparkles, title: "Công nghệ AI tiên tiến", desc: "Hệ thống AI chấm điểm, phân tích phát âm và đề xuất bài học", color: "text-primary", bg: "bg-primary/10" },
            ].map((item, i) => (
              <ScrollReveal key={item.title} delay={i * 100} direction="up">
                <div className="bg-card rounded-2xl p-6 md:p-8 border border-border hover:shadow-xl transition-all duration-500 hover:-translate-y-1 group h-full">
                  <div className={`w-14 h-14 rounded-2xl ${item.bg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                    <item.icon className={`w-7 h-7 ${item.color}`} />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <ThreeCValues />
      <SkillsSection />
      <FeaturesSection />

      {/* ── FAQ Section ── */}
      <section className="py-20 md:py-28 bg-muted/30 relative overflow-hidden">
        {/* decorative sakura blobs */}
        <div className="absolute top-10 left-10 w-64 h-64 bg-sakura/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-japanese/5 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto">
            <ScrollReveal>
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-sakura/10 text-sakura text-sm font-semibold mb-4 border border-sakura/20">
                  <HelpCircle className="w-4 h-4" />
                  よくある質問
                </div>
                <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
                  Câu hỏi <span className="text-sakura">thường gặp</span>
                </h2>
                <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                  Tìm câu trả lời cho những thắc mắc phổ biến về NihonGo!
                </p>

                {/* search */}
                <div className="relative max-w-lg mx-auto mt-8">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Tìm kiếm câu hỏi..."
                    value={faqSearch}
                    onChange={(e) => setFaqSearch(e.target.value)}
                    className="pl-12 h-12 rounded-2xl border-border/50 focus:border-sakura bg-background/60 backdrop-blur-sm"
                  />
                </div>
              </div>
            </ScrollReveal>

            {filteredFaqs.length > 0 ? (
              <Accordion type="single" collapsible className="space-y-3">
                {filteredFaqs.map((faq, i) => (
                  <ScrollReveal key={faq.id} delay={i * 60} direction="up">
                    <AccordionItem value={faq.id} className="border-0">
                      <AccordionTrigger className="hover:no-underline px-6 py-4 rounded-2xl bg-gradient-to-r from-sakura/90 to-pink-500/90 text-white font-bold text-base md:text-lg data-[state=open]:rounded-b-none [&>svg]:text-white shadow-md shadow-sakura/20">
                        <span className="flex items-center gap-3 text-left">
                          <span className="text-lg">🌸</span>
                          {faq.question}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="bg-card border border-t-0 border-border/50 rounded-b-2xl px-6 py-5 text-foreground leading-relaxed whitespace-pre-wrap shadow-sm">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  </ScrollReveal>
                ))}
              </Accordion>
            ) : faqs.length > 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <HelpCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Không tìm thấy kết quả. Hãy thử từ khóa khác.</p>
              </div>
            ) : null}

            {/* Contact CTA */}
            <ScrollReveal delay={200}>
              <div className="mt-12 bg-card rounded-3xl p-8 md:p-10 border border-border text-center shadow-lg">
                <div className="text-4xl mb-4">💬</div>
                <h3 className="text-xl font-bold text-foreground mb-2">Vẫn cần hỗ trợ?</h3>
                <p className="text-muted-foreground mb-6">Đội ngũ hỗ trợ luôn sẵn sàng giúp đỡ bạn</p>
                <Button className="rounded-2xl h-12 px-8 bg-gradient-to-r from-sakura to-pink-500 hover:from-sakura/90 hover:to-pink-500/90 text-white shadow-lg shadow-sakura/20" asChild>
                  <Link to="/lien-he">Liên hệ hỗ trợ</Link>
                </Button>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* CTA */}
      <ScrollReveal>
        <section className="py-20 md:py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/90" />
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent rounded-full blur-3xl" />
          </div>
          <div className="container mx-auto px-4 text-center relative z-10">
            <div className="max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/15 text-white mb-6 border border-white/20">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-semibold">Bắt đầu ngay hôm nay</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">Sẵn sàng chinh phục Tiếng Nhật?</h2>
              <p className="text-white/80 text-lg mb-10 leading-relaxed">Đăng ký miễn phí và bắt đầu hành trình với hơn 50,000 học viên đang học cùng TNQDO</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="h-14 px-10 bg-white text-primary hover:bg-white/90 rounded-2xl text-base shadow-xl" asChild>
                  <Link to="/auth">Bắt đầu miễn phí <Sparkles className="w-5 h-5 ml-2" /></Link>
                </Button>
                <Button variant="outline" size="lg" className="h-14 px-10 rounded-2xl text-base border-white/30 text-white hover:bg-white/10" asChild>
                  <Link to="/khoa-hoc">Xem khóa học</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>

      <Footer />
    </main>
  );
};

export default About;
