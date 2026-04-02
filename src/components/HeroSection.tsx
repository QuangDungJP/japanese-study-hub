import { Button } from "@/components/ui/button";
import { Play, Sparkles, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useAllWebsiteContent } from "@/hooks/useWebsiteContent";
import { Skeleton } from "@/components/ui/skeleton";

const HeroSection = () => {
  const { data: content, isLoading } = useAllWebsiteContent();
  const heroContent = content?.hero;
  const statsContent = heroContent?.content as {
    students?: string;
    teachers?: string;
    lessons?: string;
    tagline?: string;
    features?: string[];
    rating?: string;
    reviews?: string;
  } | null;

  // Default values
  const title = heroContent?.title_vi || "Chinh phục Tiếng Nhật cùng chúng tôi";
  const subtitle = heroContent?.subtitle_vi || "Nền tảng học Tiếng Nhật #1 cho người Việt";
  const description = heroContent?.description_vi || 
    "Phương pháp học toàn diện 4 kỹ năng: Đọc - Nói - Viết - Nghe. Từ N5 đến N1, luyện thi JLPT với giáo viên bản ngữ qua Zoom.";
  
  const students = statsContent?.students || "50K+";
  const teachers = statsContent?.teachers || "200+";
  const lessons = statsContent?.lessons || "1000+";
  const features = statsContent?.features || [
    "Lộ trình JLPT chuẩn",
    "Kanji & Hiragana từ cơ bản",
    "Giáo viên bản ngữ Nhật"
  ];
  const rating = statsContent?.rating || "4.9";
  const reviews = statsContent?.reviews || "2.5k đánh giá";

  if (isLoading) {
    return (
      <section className="relative min-h-screen bg-gradient-hero pt-20 overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12 py-16">
            <div className="flex-1 max-w-2xl space-y-6">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-24 w-full" />
              <div className="flex gap-4">
                <Skeleton className="h-12 w-40" />
                <Skeleton className="h-12 w-32" />
              </div>
            </div>
            <div className="flex-1">
              <Skeleton className="h-96 w-full max-w-md rounded-3xl" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative min-h-screen bg-gradient-hero pt-20 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-japanese/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float animation-delay-200" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 py-16">
          {/* Left Content */}
          <div className="flex-1 text-center lg:text-left max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-japanese/10 text-japanese mb-6 animate-slide-up">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-semibold">{subtitle}</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight mb-6 animate-slide-up animation-delay-100">
              {title.includes("Tiếng Nhật") ? (
                <>
                  {title.split("Tiếng Nhật")[0]}
                  <span className="text-japanese">Tiếng Nhật</span>
                  {title.split("Tiếng Nhật")[1]}
                </>
              ) : (
                title
              )}
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 animate-slide-up animation-delay-200">
              {description}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-slide-up animation-delay-300">
              <Button variant="hero" size="xl" asChild>
                <Link to="/auth">
                  <Sparkles className="w-5 h-5" />
                  Học miễn phí ngay
                </Link>
              </Button>
              <Button variant="outline" size="xl">
                <Play className="w-5 h-5" />
                Xem demo
              </Button>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-8 mt-12 animate-slide-up animation-delay-400">
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground">{students}</div>
                <div className="text-sm text-muted-foreground">Học viên</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground">{teachers}</div>
                <div className="text-sm text-muted-foreground">Giáo viên</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground">{lessons}</div>
                <div className="text-sm text-muted-foreground">Bài học</div>
              </div>
            </div>
          </div>

          {/* Right Content - Japanese Learning Card */}
          <div className="flex-1 relative">
            <div className="relative w-full max-w-md mx-auto">
              {/* Main Japanese Card */}
              <div className="bg-card rounded-3xl p-8 shadow-card-hover border border-border animate-float">
                {heroContent?.image_url ? (
                  <img 
                    src={heroContent.image_url} 
                    alt="Japanese Learning" 
                    className="w-16 h-16 rounded-2xl object-cover mb-6"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-japanese/10 flex items-center justify-center mb-6">
                    <span className="text-4xl">🇯🇵</span>
                  </div>
                )}
                <h3 className="text-2xl font-bold text-foreground mb-2">Tiếng Nhật</h3>
                <p className="text-muted-foreground mb-4">JLPT N5 - N1 • Giao tiếp • Thương mại</p>
                
                {/* Features */}
                <div className="space-y-3 mb-6">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-japanese/10 flex items-center justify-center">
                        <Star className="w-3 h-3 text-japanese" />
                      </div>
                      <span className="text-sm text-foreground">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-6">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="w-4 h-4 text-accent fill-accent" />
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-foreground">{rating}</span>
                  <span className="text-sm text-muted-foreground">({reviews})</span>
                </div>

                {/* Progress indicator */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-0 bg-japanese rounded-full animate-pulse" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Bắt đầu học</span>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-japanese/10 rounded-2xl rotate-12 animate-float animation-delay-200" />
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-accent/10 rounded-xl -rotate-12 animate-float animation-delay-400" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
