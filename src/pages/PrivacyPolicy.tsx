import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Shield, Lock, Eye, Database, Bell, Users, Globe, Mail } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const PrivacyPolicy = () => {
  const sections = [
    {
      icon: Database,
      title: "1. Thu thập thông tin",
      content: `Chúng tôi thu thập các loại thông tin sau:

**Thông tin bạn cung cấp trực tiếp:**
- Thông tin đăng ký: email, tên hiển thị, mật khẩu (được mã hóa)
- Thông tin hồ sơ: ảnh đại diện, ngôn ngữ muốn học
- Nội dung tương tác: câu trả lời bài tập, ghi chú cá nhân

**Thông tin tự động thu thập:**
- Dữ liệu học tập: tiến trình, điểm số, thời gian học
- Thông tin thiết bị: loại trình duyệt, hệ điều hành
- Dữ liệu sử dụng: trang đã truy cập, tính năng đã dùng`
    },
    {
      icon: Eye,
      title: "2. Mục đích sử dụng",
      content: `Chúng tôi sử dụng thông tin thu thập để:

- **Cung cấp dịch vụ:** Vận hành và cải thiện nền tảng học tập
- **Cá nhân hóa trải nghiệm:** Đề xuất bài học phù hợp với trình độ
- **Phân tích và nghiên cứu:** Hiểu cách người dùng học để cải thiện nội dung
- **Giao tiếp:** Gửi thông báo quan trọng về tài khoản và dịch vụ
- **Bảo mật:** Phát hiện và ngăn chặn gian lận, lạm dụng`
    },
    {
      icon: Users,
      title: "3. Chia sẻ thông tin",
      content: `Chúng tôi **KHÔNG** bán thông tin cá nhân của bạn.

Thông tin có thể được chia sẻ trong các trường hợp:

- **Với sự đồng ý của bạn:** Khi bạn cho phép rõ ràng
- **Nhà cung cấp dịch vụ:** Đối tác hỗ trợ vận hành (hosting, thanh toán) - họ bị ràng buộc bảo mật
- **Yêu cầu pháp lý:** Khi luật pháp yêu cầu
- **Bảo vệ quyền lợi:** Khi cần thiết để bảo vệ quyền lợi hợp pháp của chúng tôi`
    },
    {
      icon: Lock,
      title: "4. Bảo mật dữ liệu",
      content: `Chúng tôi áp dụng các biện pháp bảo mật tiên tiến:

- **Mã hóa:** Toàn bộ dữ liệu được mã hóa khi truyền tải (HTTPS/TLS)
- **Bảo mật mật khẩu:** Mật khẩu được hash bằng thuật toán bcrypt
- **Kiểm soát truy cập:** Chỉ nhân viên được ủy quyền mới truy cập dữ liệu
- **Sao lưu thường xuyên:** Dữ liệu được sao lưu định kỳ tại nhiều địa điểm
- **Giám sát 24/7:** Hệ thống được giám sát liên tục để phát hiện xâm nhập`
    },
    {
      icon: Bell,
      title: "5. Quyền của bạn",
      content: `Bạn có các quyền sau đối với dữ liệu cá nhân:

- **Quyền truy cập:** Xem toàn bộ dữ liệu chúng tôi lưu trữ về bạn
- **Quyền chỉnh sửa:** Cập nhật thông tin không chính xác
- **Quyền xóa:** Yêu cầu xóa tài khoản và dữ liệu
- **Quyền hạn chế:** Giới hạn cách chúng tôi sử dụng dữ liệu
- **Quyền phản đối:** Từ chối một số loại xử lý dữ liệu
- **Quyền di chuyển:** Nhận bản sao dữ liệu ở định dạng có thể đọc được`
    },
    {
      icon: Globe,
      title: "6. Cookie và theo dõi",
      content: `Chúng tôi sử dụng cookie để:

- **Cookie cần thiết:** Duy trì phiên đăng nhập, bảo mật
- **Cookie phân tích:** Hiểu cách bạn sử dụng trang web (Google Analytics)
- **Cookie tùy chọn:** Nhớ cài đặt ngôn ngữ, giao diện

Bạn có thể quản lý cookie thông qua cài đặt trình duyệt. Lưu ý: tắt cookie cần thiết có thể ảnh hưởng đến trải nghiệm sử dụng.`
    }
  ];

  const highlights = [
    { icon: Shield, text: "Dữ liệu được mã hóa" },
    { icon: Lock, text: "Không bán thông tin" },
    { icon: Eye, text: "Minh bạch hoàn toàn" },
    { icon: Users, text: "Bạn kiểm soát dữ liệu" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-50" />
        <div className="absolute top-10 left-1/4 w-72 h-72 bg-green-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse animation-delay-200" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 mb-6">
              <Shield className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-green-500">Bảo mật & Quyền riêng tư</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Chính sách <span className="text-gradient">Bảo mật</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-4">
              Cam kết bảo vệ thông tin và quyền riêng tư của bạn
            </p>
            <p className="text-sm text-muted-foreground">
              Cập nhật lần cuối: 14/12/2024
            </p>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="py-12 border-y border-border/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {highlights.map((item, index) => (
              <div key={index} className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="font-medium">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            {sections.map((section, index) => (
              <Card key={index} className="overflow-hidden border-border/50 hover:border-primary/30 transition-colors">
                <CardContent className="p-8">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center flex-shrink-0">
                      <section.icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold mb-4">{section.title}</h2>
                      <div className="prose prose-neutral dark:prose-invert max-w-none">
                        {section.content.split('\n').map((paragraph, i) => (
                          <p key={i} className="text-muted-foreground mb-3 whitespace-pre-wrap">
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

      {/* Contact */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <Mail className="w-12 h-12 mx-auto mb-6 text-primary" />
            <h2 className="text-3xl font-bold mb-4">Câu hỏi về bảo mật?</h2>
            <p className="text-muted-foreground mb-6">
              Nếu bạn có bất kỳ câu hỏi nào về chính sách bảo mật hoặc cách chúng tôi xử lý dữ liệu, vui lòng liên hệ:
            </p>
            <a 
              href="mailto:privacy@linguaviet.com"
              className="text-primary hover:underline font-medium text-lg"
            >
              privacy@linguaviet.com
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
