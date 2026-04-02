import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useAllWebsiteContent } from "@/hooks/useWebsiteContent";
import { Skeleton } from "@/components/ui/skeleton";

const CTASection = () => {
  const { data: content, isLoading } = useAllWebsiteContent();
  const ctaContent = content?.cta;
  const ctaData = ctaContent?.content as {
    offer?: string;
    badges?: Array<{ emoji: string; text: string }>;
    primaryButton?: string;
    secondaryButton?: string;
  } | null;

  const title = ctaContent?.title_vi || "Bắt đầu hành trình chinh phục ngôn ngữ ngay hôm nay";
  const description = ctaContent?.description_vi || 
    "Tham gia cùng hơn 50,000 học viên đã thành công với LinguaViet. Đăng ký miễn phí và nhận ngay 7 ngày học thử Premium!";
  
  const offer = ctaData?.offer || "Ưu đãi đặc biệt - Giảm 50% khoá học đầu tiên";
  const primaryButton = ctaData?.primaryButton || "Đăng ký miễn phí ngay";
  const secondaryButton = ctaData?.secondaryButton || "Tìm hiểu thêm";
  const badges = ctaData?.badges || [
    { emoji: "⭐", text: "4.9/5 đánh giá" },
    { emoji: "🏆", text: "Top 1 App học ngôn ngữ" },
    { emoji: "🔒", text: "Bảo mật SSL 256-bit" },
  ];

  if (isLoading) {
    return (
      <section className="py-24 bg-gradient-primary">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <Skeleton className="h-8 w-64 mx-auto bg-white/20" />
            <Skeleton className="h-16 w-full bg-white/20" />
            <Skeleton className="h-12 w-96 mx-auto bg-white/20" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 bg-gradient-primary relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white/90 mb-6">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-semibold">{offer}</span>
          </div>
          
          <h2 className="text-3xl md:text-5xl font-bold text-primary-foreground mb-6">
            {title}
          </h2>
          
          <p className="text-lg text-primary-foreground/80 mb-8">
            {description}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="hero" 
              size="xl" 
              className="bg-white text-primary hover:bg-white/90"
              asChild
            >
              <Link to="/auth">
                <Sparkles className="w-5 h-5" />
                {primaryButton}
              </Link>
            </Button>
            <Button 
              variant="glass" 
              size="xl"
              className="text-primary-foreground border-primary-foreground/30 hover:bg-white/10"
            >
              {secondaryButton}
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-8 mt-12 text-primary-foreground/60">
            {badges.map((badge, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-2xl">{badge.emoji}</span>
                <span className="text-sm">{badge.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
