import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LanguagesSection from "@/components/LanguagesSection";
import { Sparkles } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

const CoursesPage = () => {
  return (
    <main className="min-h-screen">
      <Navbar />

      {/* Page Hero */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-japanese/5 via-background to-primary/5">
          <div className="absolute top-20 left-20 w-72 h-72 bg-japanese/8 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-japanese/10 text-japanese text-sm font-semibold mb-6 border border-japanese/20">
              <span className="text-xl">🇯🇵</span> Khóa học JLPT
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold text-foreground mb-6 leading-tight">
              Khóa học <span className="text-japanese">Tiếng Nhật</span> toàn diện
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Từ N5 đến N1, lộ trình học được thiết kế khoa học và chuẩn JLPT cho người Việt
            </p>
          </div>
        </div>
      </section>

      <ScrollReveal>
        <LanguagesSection />
      </ScrollReveal>
      <Footer />
    </main>
  );
};

export default CoursesPage;
