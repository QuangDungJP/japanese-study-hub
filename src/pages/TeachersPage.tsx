import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TeachersSection from "@/components/TeachersSection";
import { Award } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

const TeachersPage = () => {
  return (
    <main className="min-h-screen">
      <Navbar />

      {/* Page Hero */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-japanese/5">
          <div className="absolute top-20 right-20 w-72 h-72 bg-japanese/8 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-japanese/10 text-japanese text-sm font-semibold mb-6 border border-japanese/20">
              <Award className="w-4 h-4" /> Đội ngũ giảng viên
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold text-foreground mb-6 leading-tight">
              Giảng viên <span className="text-japanese">xuất sắc</span> & tận tâm
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              100% giáo viên có chứng chỉ giảng dạy, kinh nghiệm dày dặn và phương pháp giảng dạy sáng tạo
            </p>
          </div>
        </div>
      </section>

      <ScrollReveal>
        <TeachersSection />
      </ScrollReveal>
      <Footer />
    </main>
  );
};

export default TeachersPage;
