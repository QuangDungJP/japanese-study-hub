import heroImage from "@/assets/hero-japan.jpg";
import { Button } from "@/components/ui/button";
import { BookOpen, GraduationCap } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <img src={heroImage} alt="Phong cảnh Nhật Bản với hoa anh đào" width={1920} height={1024} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/80 via-primary/50 to-transparent" />
      </div>
      
      {/* Floating petals */}
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute text-sakura opacity-60 animate-petal pointer-events-none"
          style={{
            left: `${10 + i * 15}%`,
            top: '-5%',
            animationDuration: `${6 + i * 2}s`,
            animationDelay: `${i * 1.5}s`,
            fontSize: `${12 + i * 4}px`,
          }}
        >
          🌸
        </div>
      ))}

      <div className="relative z-10 container mx-auto px-6">
        <div className="max-w-2xl">
          <p className="text-sakura font-heading text-lg mb-3 tracking-wider">日本語を学ぼう</p>
          <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground font-heading leading-tight mb-6">
            Chinh phục <br />
            <span className="text-gradient-sakura">Tiếng Nhật</span>
            <br />cùng bạn
          </h1>
          <p className="text-primary-foreground/80 text-lg md:text-xl mb-8 max-w-lg leading-relaxed">
            Nền tảng học tiếng Nhật toàn diện dành cho sinh viên — từ bảng chữ cái đến JLPT N1.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-heading text-base px-8 py-6 rounded-full">
              <BookOpen className="mr-2 h-5 w-5" />
              Bắt đầu học
            </Button>
            <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 font-heading text-base px-8 py-6 rounded-full">
              <GraduationCap className="mr-2 h-5 w-5" />
              Luyện thi JLPT
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
