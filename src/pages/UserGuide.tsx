import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { BookOpen, Target, Trophy, Zap, Headphones, MessageSquare, PenTool, BookMarked, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const UserGuide = () => {
  const steps = [
    {
      icon: BookOpen,
      title: "Đăng ký tài khoản",
      description: "Tạo tài khoản miễn phí để bắt đầu hành trình học ngôn ngữ của bạn.",
      details: [
        "Nhấn nút 'Bắt đầu miễn phí' trên trang chủ",
        "Điền thông tin email và mật khẩu",
        "Xác nhận email để kích hoạt tài khoản"
      ]
    },
    {
      icon: Target,
      title: "Chọn ngôn ngữ & cấp độ",
      description: "Lựa chọn ngôn ngữ bạn muốn học và đánh giá trình độ hiện tại.",
      details: [
        "Chọn từ 6+ ngôn ngữ phổ biến",
        "Làm bài test đánh giá trình độ (không bắt buộc)",
        "Hệ thống tự động đề xuất lộ trình phù hợp"
      ]
    },
    {
      icon: Zap,
      title: "Học theo lộ trình",
      description: "Theo dõi lộ trình học tập được cá nhân hóa với các bài học tương tác.",
      details: [
        "Hoàn thành các bài học theo thứ tự",
        "Luyện tập với nhiều dạng bài tập khác nhau",
        "Nhận phản hồi tức thì sau mỗi câu trả lời"
      ]
    },
    {
      icon: Trophy,
      title: "Nhận phần thưởng",
      description: "Tích lũy XP, duy trì streak và mở khóa các thành tích.",
      details: [
        "Kiếm XP qua mỗi bài học hoàn thành",
        "Duy trì streak học tập hàng ngày",
        "Cạnh tranh trên bảng xếp hạng"
      ]
    }
  ];

  const skills = [
    {
      icon: BookMarked,
      title: "Đọc hiểu",
      color: "from-blue-500 to-cyan-500",
      description: "Cải thiện kỹ năng đọc với các bài đọc đa dạng từ cơ bản đến nâng cao."
    },
    {
      icon: Headphones,
      title: "Nghe hiểu",
      color: "from-purple-500 to-pink-500",
      description: "Luyện nghe với người bản xứ, podcast và video thực tế."
    },
    {
      icon: MessageSquare,
      title: "Nói",
      color: "from-orange-500 to-red-500",
      description: "Thực hành phát âm với công nghệ nhận diện giọng nói AI."
    },
    {
      icon: PenTool,
      title: "Viết",
      color: "from-green-500 to-emerald-500",
      description: "Rèn luyện kỹ năng viết từ câu đơn giản đến đoạn văn phức tạp."
    }
  ];

  const tips = [
    "Học ít nhất 15 phút mỗi ngày để duy trì tiến độ",
    "Sử dụng tính năng ôn tập để củng cố kiến thức",
    "Tham gia cộng đồng để trao đổi với người học khác",
    "Đặt mục tiêu cụ thể và theo dõi tiến trình",
    "Kết hợp học với xem phim, nghe nhạc bằng ngôn ngữ đích"
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-50" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse animation-delay-200" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <BookOpen className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Hướng dẫn sử dụng</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Bắt đầu học <span className="text-gradient">ngôn ngữ</span> như thế nào?
            </h1>
            <p className="text-xl text-muted-foreground">
              Hướng dẫn chi tiết giúp bạn tận dụng tối đa nền tảng LinguaViet
            </p>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">4 bước bắt đầu</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <Card key={index} className="group relative overflow-hidden border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-glow">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary/20 to-transparent rounded-bl-full" />
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <step.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div className="text-sm font-medium text-primary mb-2">Bước {index + 1}</div>
                  <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground mb-4">{step.description}</p>
                  <ul className="space-y-2">
                    {step.details.map((detail, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">4 kỹ năng ngôn ngữ</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Phát triển toàn diện cả 4 kỹ năng để sử dụng ngôn ngữ thành thạo
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {skills.map((skill, index) => (
              <Card key={index} className="group overflow-hidden hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${skill.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <skill.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{skill.title}</h3>
                  <p className="text-muted-foreground">{skill.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Tips Section */}
      <section className="py-20 bg-gradient-card">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Mẹo học hiệu quả</h2>
              <p className="text-muted-foreground">
                Những bí quyết giúp bạn tiến bộ nhanh hơn
              </p>
            </div>
            <div className="space-y-4">
              {tips.map((tip, index) => (
                <div 
                  key={index} 
                  className="flex items-center gap-4 p-4 rounded-xl bg-background/80 backdrop-blur border border-border/50 hover:border-primary/30 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary">{index + 1}</span>
                  </div>
                  <p className="text-foreground">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Sẵn sàng bắt đầu?</h2>
            <p className="text-muted-foreground mb-8">
              Đăng ký ngay hôm nay và bắt đầu hành trình học ngôn ngữ của bạn
            </p>
            <Link 
              to="/auth" 
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
            >
              Bắt đầu miễn phí
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default UserGuide;
