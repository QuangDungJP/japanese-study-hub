import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ZoomSection from "@/components/ZoomSection";
import { Video } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

const ZoomPage = () => {
  return (
    <main className="min-h-screen">
      <Navbar />

      {/* Page Hero */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-background to-primary/5">
          <div className="absolute top-20 left-20 w-72 h-72 bg-accent/8 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent/10 text-accent text-sm font-semibold mb-6 border border-accent/20">
              <Video className="w-4 h-4" /> Học trực tuyến
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold text-foreground mb-6 leading-tight">
              Học qua <span className="text-primary">Zoom</span> với giáo viên bản ngữ
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Lớp học trực tuyến chất lượng cao, tương tác trực tiếp 1-1 hoặc nhóm nhỏ tối đa 6 học viên
            </p>
          </div>
        </div>
      </section>

      <ScrollReveal>
        <ZoomSection />
      </ScrollReveal>
      <Footer />
    </main>
  );
};

export default ZoomPage;
