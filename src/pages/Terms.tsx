import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { FileText, CheckCircle2, AlertTriangle, Scale, CreditCard, XCircle, RefreshCw, MessageSquare } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const Terms = () => {
  const sections = [
    {
      icon: CheckCircle2,
      title: "1. Chấp nhận điều khoản",
      content: `Bằng việc truy cập và sử dụng LinguaViet, bạn đồng ý tuân thủ và bị ràng buộc bởi các Điều khoản Sử dụng này.

Nếu bạn không đồng ý với bất kỳ phần nào của điều khoản, bạn không được phép sử dụng dịch vụ.

Chúng tôi có quyền sửa đổi điều khoản bất kỳ lúc nào. Việc tiếp tục sử dụng sau khi thay đổi đồng nghĩa với việc bạn chấp nhận điều khoản mới.`
    },
    {
      icon: FileText,
      title: "2. Mô tả dịch vụ",
      content: `LinguaViet là nền tảng học ngoại ngữ trực tuyến cung cấp:

• Các bài học tương tác theo nhiều cấp độ
• Luyện tập 4 kỹ năng: Đọc, Nghe, Nói, Viết
• Hệ thống theo dõi tiến trình học tập
• Bảng xếp hạng và thành tích
• Nội dung được cá nhân hóa theo trình độ

Dịch vụ được cung cấp "nguyên trạng" và chúng tôi không đảm bảo rằng dịch vụ sẽ hoạt động không gián đoạn hoặc không có lỗi.`
    },
    {
      icon: Scale,
      title: "3. Quyền và nghĩa vụ người dùng",
      content: `**Bạn ĐƯỢC quyền:**
• Truy cập và sử dụng nội dung học tập cho mục đích cá nhân
• Theo dõi và chia sẻ tiến trình học tập của mình
• Tham gia cộng đồng và tương tác với người học khác
• Yêu cầu hỗ trợ kỹ thuật khi gặp vấn đề

**Bạn KHÔNG ĐƯỢC:**
• Chia sẻ tài khoản với người khác
• Sao chép, phân phối nội dung bài học
• Sử dụng bot, script hoặc công cụ tự động
• Cố gắng hack, phá hoại hệ thống
• Quấy rối, xúc phạm người dùng khác
• Sử dụng dịch vụ cho mục đích thương mại trái phép`
    },
    {
      icon: CreditCard,
      title: "4. Thanh toán và hoàn tiền",
      content: `**Gói miễn phí:**
Bạn có thể sử dụng các tính năng cơ bản mà không cần thanh toán.

**Gói Premium:**
• Thanh toán theo tháng hoặc năm
• Tự động gia hạn trừ khi bạn hủy
• Giá có thể thay đổi với thông báo trước 30 ngày

**Hoàn tiền:**
• Hoàn tiền trong vòng 7 ngày kể từ ngày thanh toán
• Yêu cầu hoàn tiền qua email support@linguaviet.com
• Không hoàn tiền sau 7 ngày hoặc nếu vi phạm điều khoản`
    },
    {
      icon: AlertTriangle,
      title: "5. Sở hữu trí tuệ",
      content: `**Nội dung của LinguaViet:**
Toàn bộ nội dung bài học, hình ảnh, âm thanh, video, thiết kế giao diện thuộc sở hữu của LinguaViet hoặc đối tác cấp phép. Bạn không được sao chép, sửa đổi, phân phối mà không có sự cho phép bằng văn bản.

**Nội dung người dùng:**
Bạn giữ quyền sở hữu nội dung bạn tạo (ghi chú, bình luận). Tuy nhiên, bạn cấp cho chúng tôi quyền sử dụng phi độc quyền để vận hành và cải thiện dịch vụ.`
    },
    {
      icon: XCircle,
      title: "6. Chấm dứt tài khoản",
      content: `**Bạn có thể:**
Hủy tài khoản bất kỳ lúc nào thông qua Cài đặt > Xóa tài khoản.

**Chúng tôi có thể:**
Tạm ngưng hoặc chấm dứt tài khoản của bạn nếu:
• Vi phạm Điều khoản Sử dụng
• Không thanh toán phí Premium (nếu có)
• Hoạt động bất thường đe dọa bảo mật hệ thống
• Không hoạt động trong 24 tháng liên tiếp

Khi tài khoản bị chấm dứt, bạn mất quyền truy cập vào toàn bộ dữ liệu học tập.`
    },
    {
      icon: RefreshCw,
      title: "7. Giới hạn trách nhiệm",
      content: `LinguaViet không chịu trách nhiệm về:

• Mất mát dữ liệu do lỗi kỹ thuật ngoài kiểm soát
• Gián đoạn dịch vụ tạm thời do bảo trì hoặc sự cố
• Kết quả học tập không như mong đợi
• Thiệt hại gián tiếp phát sinh từ việc sử dụng dịch vụ

Tổng trách nhiệm tối đa của chúng tôi không vượt quá số tiền bạn đã thanh toán trong 12 tháng gần nhất.`
    },
    {
      icon: MessageSquare,
      title: "8. Giải quyết tranh chấp",
      content: `Mọi tranh chấp liên quan đến Điều khoản Sử dụng này sẽ được giải quyết như sau:

1. **Thương lượng:** Liên hệ với chúng tôi qua email để giải quyết trực tiếp
2. **Hòa giải:** Nếu không thương lượng được, các bên sẽ tham gia hòa giải
3. **Trọng tài/Tòa án:** Tranh chấp sẽ được giải quyết tại Tòa án có thẩm quyền tại Việt Nam

Điều khoản này được điều chỉnh bởi pháp luật Việt Nam.`
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-50" />
        <div className="absolute top-20 left-1/3 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/3 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse animation-delay-200" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 mb-6">
              <FileText className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium text-orange-500">Pháp lý</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Điều khoản <span className="text-gradient">Sử dụng</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-4">
              Các điều khoản và điều kiện sử dụng dịch vụ LinguaViet
            </p>
            <p className="text-sm text-muted-foreground">
              Có hiệu lực từ: 14/12/2024
            </p>
          </div>
        </div>
      </section>

      {/* Quick Navigation */}
      <section className="py-8 border-y border-border/50 sticky top-0 bg-background/95 backdrop-blur z-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-3">
            {sections.map((section, index) => (
              <a
                key={index}
                href={`#section-${index}`}
                className="px-4 py-2 rounded-full bg-muted hover:bg-primary/10 hover:text-primary transition-colors text-sm font-medium"
              >
                {section.title.split('. ')[1]}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            {sections.map((section, index) => (
              <Card 
                key={index} 
                id={`section-${index}`}
                className="overflow-hidden border-border/50 hover:border-primary/30 transition-colors scroll-mt-32"
              >
                <CardContent className="p-8">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                      <section.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold mb-4">{section.title}</h2>
                      <div className="space-y-3">
                        {section.content.split('\n').map((paragraph, i) => (
                          <p key={i} className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                            {paragraph.includes('**') 
                              ? paragraph.split('**').map((part, j) => 
                                  j % 2 === 1 ? <strong key={j} className="text-foreground">{part}</strong> : part
                                )
                              : paragraph
                            }
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Agreement Notice */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-8 text-center">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-bold mb-3">Xác nhận đồng ý</h3>
                <p className="text-muted-foreground mb-6">
                  Bằng việc tiếp tục sử dụng LinguaViet, bạn xác nhận rằng bạn đã đọc, hiểu và đồng ý với toàn bộ Điều khoản Sử dụng này.
                </p>
                <Separator className="my-6" />
                <p className="text-sm text-muted-foreground">
                  Nếu có thắc mắc về điều khoản, vui lòng liên hệ:{' '}
                  <a href="mailto:legal@linguaviet.com" className="text-primary hover:underline">
                    legal@linguaviet.com
                  </a>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Terms;
