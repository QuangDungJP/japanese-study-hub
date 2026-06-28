import { useState } from 'react';
import { ChevronDown, BookOpen, Users, Crown, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';

interface GuideSection {
  title: string;
  content: string;
  subsections?: {
    title: string;
    content: string;
    steps?: string[];
  }[];
}

interface RoleGuide {
  role: string;
  roleVi: string;
  emoji: string;
  color: string;
  description: string;
  sections: GuideSection[];
}

const UserGuides = () => {
  const [activeRole, setActiveRole] = useState<'learn' | 'teacher' | 'admin'>('learn');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const guides: Record<'learn' | 'teacher' | 'admin', RoleGuide> = {
    learn: {
      role: 'Learner',
      roleVi: 'Học viên',
      emoji: '📚',
      color: 'from-blue-500 to-blue-600',
      description: 'Hướng dẫn toàn diện cho những ai muốn học tiếng Nhật',
      sections: [
        {
          title: 'Bắt đầu',
          content: 'Khi bạn lần đầu tiên đăng nhập vào khu vực học tập, bạn sẽ thấy Dashboard với tổng quan về tiến độ học tập của mình.',
          subsections: [
            {
              title: 'Điều hướng chính',
              content: 'Sidebar bên trái hiển thị tất cả các mục chính mà bạn có thể truy cập:',
              steps: [
                '📊 Dashboard - Xem tổng quan về tiến độ học',
                '🎓 Lớp học của tôi - Xem các lớp bạn đã tham gia',
                '📖 Bài học - Truy cập các bài học do giáo viên tạo',
                '🏋️ Bài tập - Làm bài tập thực hành',
                '✏️ Bài kiểm tra - Tham gia các bài kiểm tra',
                '🎥 Đặt lịch học - Tham gia lớp học trực tuyến',
                '📅 Lịch học - Xem lịch học của bạn',
                '🏆 Thành tích - Xem huy hiệu và thành tích đã đạt',
                '👤 Hồ sơ - Chỉnh sửa thông tin cá nhân',
                '⚙️ Cài đặt - Tùy chỉnh các tùy chọn ứng dụng',
              ],
            },
            {
              title: 'Hồ sơ cá nhân',
              content: 'Truy cập menu Hồ sơ để:',
              steps: [
                '✏️ Cập nhật tên đầy đủ',
                '📷 Tải lên ảnh đại diện',
                '📝 Xem các role hiện tại của bạn',
                '💬 Nếu bạn là giáo viên, chỉnh sửa thông tin giáo viên (tiểu sử, chứng chỉ, giờ làm việc...)',
              ],
            },
          ],
        },
        {
          title: 'Học tập',
          content: 'Cách thức học tập được cấu trúc thành các phần khác nhau để tối ưu hóa quá trình học:',
          subsections: [
            {
              title: 'Bài học',
              content: 'Bài học là nội dung chính được giáo viên tạo ra. Mỗi bài học chứa:',
              steps: [
                '📚 Nội dung bài học chi tiết',
                '🎯 Các mục tiêu học tập rõ ràng',
                '📝 Ghi chú và ví dụ thực tế',
                '🔖 Các tag để phân loại (ngữ pháp, từ vựng...)',
                '⏱️ Thời gian ước tính để hoàn thành',
                '⭐ Điểm kinh nghiệm (XP) khi hoàn thành',
              ],
            },
            {
              title: 'Bài tập',
              content: 'Sau mỗi bài học, bạn có thể làm bài tập để ôn luyện:',
              steps: [
                '✏️ Trả lời các câu hỏi liên quan đến bài học',
                '🔄 Nhận phản hồi tức thời cho các câu trắc nghiệm',
                '📊 Xem điểm số và giải thích chi tiết',
                '💾 Lưu tiến độ của bạn tự động',
                '📝 Nộp bài tập yêu cầu chấm để nhận phản hồi từ giáo viên',
              ],
            },
            {
              title: 'Bài kiểm tra',
              content: 'Kiểm tra tập hợp kiến thức của bạn:',
              steps: [
                '📋 Các bài kiểm tra được đặt lịch trước bởi giáo viên',
                '⏱️ Có thời gian giới hạn cho mỗi bài kiểm tra',
                '🔐 Không thể quay lại sau khi gửi',
                '📊 Xem kết quả và phân tích chi tiết sau khi kết thúc',
                '🎯 Xem các nước cố gắng trước đó của bạn',
              ],
            },
          ],
        },
        {
          title: 'Lớp học',
          content: 'Quản lý sự tham gia lớp học của bạn:',
          subsections: [
            {
              title: 'Lớp của tôi',
              content: 'Xem danh sách tất cả các lớp bạn đã tham gia',
              steps: [
                '👥 Xem danh sách thành viên trong lớp',
                '📚 Xem các bài tập và bài học được gán cho lớp',
                '📅 Xem lịch trình lớp',
                '🔔 Nhận thông báo về các bài tập mới',
              ],
            },
            {
              title: 'Đặt lịch học',
              content: 'Tham gia các lớp học trực tuyến:',
              steps: [
                '📅 Xem các buổi học Zoom sắp tới',
                '🔗 Nhấp vào liên kết để tham gia',
                '📝 Xem chủ đề và nội dung buổi học',
                '📝 Xem ghi chú từ các buổi học trước',
              ],
            },
          ],
        },
        {
          title: 'Tiến độ và thành tích',
          content: 'Theo dõi sự phát triển của bạn qua hệ thống thành tích:',
          subsections: [
            {
              title: 'Dashboard',
              content: 'Trang chủ hiển thị:',
              steps: [
                '📊 Tổng số bài học hoàn thành',
                '📊 Tổng số bài tập hoàn thành',
                '📊 Tổng số bài kiểm tra đã làm',
                '📈 Biểu đồ tiến độ gần đây',
                '🎯 Bài học được xuất bản gần đây',
                '⚡ Bài kiểm tra sắp tới',
              ],
            },
            {
              title: 'Thành tích',
              content: 'Xem các huy hiệu và thành tích bạn đã đạt được:',
              steps: [
                '🏆 Huy hiệu hoàn thành bài học',
                '⭐ Huy hiệu điểm cao trên bài kiểm tra',
                '🔥 Huy hiệu duy trì chuỗi học liên tiếp',
                '💎 Huy hiệu độc lập/hiếm gặp',
              ],
            },
            {
              title: 'Lịch học',
              content: 'Lịch tích hợp để quản lý việc học:',
              steps: [
                '📅 Xem tất cả sự kiện học tập sắp tới',
                '🔔 Nhận nhắc nhở trước các sự kiện',
                '📝 Xem các bài tập có thời hạn',
                '🎯 Lên kế hoạch thời gian học của bạn',
              ],
            },
          ],
        },
        {
          title: 'Cài đặt',
          content: 'Tùy chỉnh trải nghiệm học của bạn:',
          subsections: [
            {
              title: 'Tùy chỉnh giao diện',
              content: 'Điều chỉnh cách ứng dụng trông và hoạt động:',
              steps: [
                '🌙 Chuyển đổi giữa chế độ sáng/tối',
                '🎨 Chọn màu chủ đề ưa thích',
                '📝 Chọn kiểu chữ phù hợp',
                '🔍 Điều chỉnh kích thước văn bản',
              ],
            },
            {
              title: 'Thông báo',
              content: 'Quản lý thông báo của bạn',
              steps: [
                '🔔 Bật/tắt thông báo bài tập mới',
                '🔔 Bật/tắt thông báo lớp học',
                '🔔 Bật/tắt thông báo kết quả kiểm tra',
                '🔔 Bật/tắt thông báo hàng loạt',
              ],
            },
          ],
        },
        {
          title: 'Mẹo và thủ thuật',
          content: 'Tối ưu hóa trải nghiệm học của bạn:',
          subsections: [
            {
              title: 'Hiệu quả học tập',
              content: 'Cách tối ưu hóa quá trình học:',
              steps: [
                '🎯 Hoàn thành một bài học, sau đó làm bài tập ngay lập tức để ôn luyện',
                '📅 Đặt lịch học hàng ngày để duy trì chuỗi',
                '💬 Tham gia lớp Zoom để tương tác với giáo viên',
                '📝 Xem lại phần giải thích của bài tập khó',
                '🔖 Sử dụng các tag để tìm nội dung theo chủ đề',
              ],
            },
            {
              title: 'Tân trang kiến thức',
              content: 'Giữ kiến thức của bạn sẵn sàng:',
              steps: [
                '♻️ Quay lại các bài học cũ để ôn luyện',
                '📚 Xem lại từ vựng các từ khó',
                '📊 Theo dõi biểu đồ tiến độ để xác định lĩnh vực yếu',
                '🎓 Làm lại các bài kiểm tra cũ để kiểm tra kiến thức',
              ],
            },
          ],
        },
      ],
    },
    teacher: {
      role: 'Teacher',
      roleVi: 'Giáo viên',
      emoji: '👨‍🏫',
      color: 'from-green-500 to-green-600',
      description: 'Hướng dẫn quản lý lớp học, bài giảng, và học sinh',
      sections: [
        {
          title: 'Bắt đầu',
          content: 'Bảng điều khiển giáo viên là trung tâm quản lý lớp học của bạn. Từ đó, bạn có thể quản lý tất cả khía cạnh của quá trình giảng dạy.',
          subsections: [
            {
              title: 'Điều hướng chính',
              content: 'Sidebar cung cấp quyền truy cập vào các công cụ giảng dạy chính:',
              steps: [
                '📊 Dashboard - Xem tổng quan lớp và thống kê',
                '📖 Bài học - Tạo, chỉnh sửa và quản lý bài học',
                '✏️ Bài kiểm tra - Tạo và quản lý bài kiểm tra',
                '👥 Lớp học - Quản lý lớp và danh sách sinh viên',
                '📝 Chấm bài - Chấm bài tập của học sinh',
                '✅ Điểm danh - Ghi nhận sự tham dự',
                '🎥 Lịch Zoom - Lên lịch các buổi lớp trực tuyến',
                '📅 Lịch & Nghỉ phép - Quản lý lịch cá nhân',
                '🔔 Thông báo - Gửi tin nhắn đến học sinh',
                '🐛 Báo lỗi - Báo cáo các vấn đề kỹ thuật',
                '👤 Hồ sơ - Chỉnh sửa thông tin giáo viên',
              ],
            },
            {
              title: 'Vai trò giáo viên',
              content: 'Có hai loại vai trò giáo viên:',
              steps: [
                '👨‍🏫 Giáo viên - Có thể tạo bài học và gửi chúng để duyệt',
                '⭐ Giáo viên cao cấp - Có thể xuất bản bài học trực tiếp mà không cần duyệt',
              ],
            },
          ],
        },
        {
          title: 'Quản lý bài học',
          content: 'Bài học là nội dung chính mà bạn tạo cho học sinh. Quá trình tạo bài là linh hoạt và mạnh mẽ.',
          subsections: [
            {
              title: 'Tạo bài học',
              content: 'Để tạo bài học mới:',
              steps: [
                '1️⃣ Nhấp vào "Bài học" trong sidebar',
                '2️⃣ Nhấp nút "Tạo bài học"',
                '3️⃣ Điền tiêu đề bài học (Tiếng Anh và Tiếng Việt)',
                '4️⃣ Thêm mô tả chi tiết',
                '5️⃣ Chọn kỹ năng (reading, speaking, writing, listening, vocabulary)',
                '6️⃣ Đặt cấp độ (beginner, intermediate, advanced)',
                '7️⃣ Viết nội dung bài học bằng HTML hoặc Markdown',
                '8️⃣ Thêm các tag để dễ tìm kiếm',
                '9️⃣ Thiết lập thời gian ước tính và phần thưởng XP',
                '🔟 Nộp để duyệt hoặc xuất bản (tuỳ thuộc vào vai trò)',
              ],
            },
            {
              title: 'Chỉnh sửa và xuất bản',
              content: 'Quản lý bài học của bạn:',
              steps: [
                '📝 Chỉnh sửa bất kỳ bài học nào bạn tạo',
                '📋 Xem trạng thái: soạn thảo, đang chờ duyệt, xuất bản',
                '👨‍🏫 Giáo viên thường: gửi để duyệt admin',
                '⭐ Giáo viên cao cấp: xuất bản trực tiếp',
                '🗑️ Xóa các bài học chưa xuất bản',
                '👀 Xem trước bài học trước khi xuất bản',
              ],
            },
            {
              title: 'Gán bài học cho lớp',
              content: 'Gán bài học để học sinh hoàn thành:',
              steps: [
                '✏️ Khi tạo bài kiểm tra hoặc bài tập, bạn có thể gán bài học',
                '📅 Đặt thời hạn cho bài tập',
                '🔔 Học sinh sẽ nhận được thông báo',
                '📊 Theo dõi các khoảng nhìn thấy',
              ],
            },
          ],
        },
        {
          title: 'Quản lý bài kiểm tra',
          content: 'Tạo và quản lý bài kiểm tra để đánh giá kiến thức học sinh.',
          subsections: [
            {
              title: 'Tạo bài kiểm tra',
              content: 'Để tạo bài kiểm tra mới:',
              steps: [
                '1️⃣ Nhấp vào "Bài kiểm tra" trong sidebar',
                '2️⃣ Nhấp nút "Tạo bài kiểm tra"',
                '3️⃣ Chọn loại kiểm tra (quiz, midterm, final, placement)',
                '4️⃣ Thêm tiêu đề và mô tả',
                '5️⃣ Thêm các câu hỏi (trắc nghiệm, tự luận, điền chỗ trống)',
                '6️⃣ Đặt thời gian giới hạn (phút)',
                '7️⃣ Đặt điểm đạt (% để vượt qua)',
                '8️⃣ Chọn số lần tối đa được làm lại',
                '9️⃣ Bật/tắt xáo trộn câu hỏi',
                '🔟 Lên lịch thời gian bài kiểm tra',
              ],
            },
            {
              title: 'Quản lý bài kiểm tra',
              content: 'Sau khi tạo:',
              steps: [
                '📊 Xem thống kê tổng quan (trung bình điểm, tỷ lệ hoàn thành...)',
                '👥 Xem danh sách học sinh đã nộp bài',
                '📋 Xem chi tiết bài làm từng học sinh',
                '✅ Chấm bài tự luận nếu cần',
                '📝 Thêm phản hồi và giải thích',
              ],
            },
          ],
        },
        {
          title: 'Quản lý lớp học',
          content: 'Quản lý lớp, học sinh và nội dung lớp.',
          subsections: [
            {
              title: 'Xem lớp',
              content: 'Quản lý các lớp học của bạn:',
              steps: [
                '👥 Xem danh sách tất cả lớp bạn dạy',
                '👨‍🎓 Xem danh sách học sinh trong mỗi lớp',
                '📊 Xem thống kê lớp (tổng số học sinh, bài học hoàn thành...)',
                '📚 Xem các bài tập được gán cho lớp',
              ],
            },
            {
              title: 'Chi tiết lớp',
              content: 'Khi xem chi tiết lớp:',
              steps: [
                '📋 Xem lịch trình lớp',
                '👥 Quản lý thành viên (thêm, xóa học sinh)',
                '📝 Xem các bài tập và hạn chót',
                '✅ Ghi nhận điểm danh cho các buổi học',
                '💬 Gửi thông báo cho cả lớp',
              ],
            },
          ],
        },
        {
          title: 'Chấm bài và phản hồi',
          content: 'Chấm bài tập và cung cấp phản hồi chi tiết cho học sinh.',
          subsections: [
            {
              title: 'Chấm bài',
              content: 'Cách chấm bài:',
              steps: [
                '📥 Nhấp vào "Chấm bài" trong sidebar',
                '📋 Xem danh sách các bài tập chưa chấm',
                '👨‍🎓 Bấm vào bài nộp của từng học sinh',
                '🔍 Xem nội dung bài nộp',
                '⭐ Chấm điểm',
                '💬 Thêm phản hồi chi tiết',
                '✅ Lưu và gửi feedback',
              ],
            },
            {
              title: 'Phản hồi tốt',
              content: 'Cách viết phản hồi hiệu quả:',
              steps: [
                '✅ Bắt đầu với điểm tích cực',
                '🎯 Chỉ ra những cải thiện cần thiết',
                '💡 Đưa ra ví dụ cụ thể',
                '🔄 Gợi ý cách sửa chữa',
                '🌟 Khuyến khích cải thiện trong lần tới',
              ],
            },
          ],
        },
        {
          title: 'Điểm danh',
          content: 'Ghi nhận sự tham gia và điểm danh học sinh.',
          subsections: [
            {
              title: 'Ghi điểm danh',
              content: 'Để ghi điểm danh:',
              steps: [
                '1️⃣ Nhấp vào "Điểm danh" trong sidebar',
                '2️⃣ Chọn lớp học',
                '3️⃣ Chọn ngày/buổi học',
                '4️⃣ Đánh dấu các học sinh có mặt',
                '5️⃣ Thêm ghi chú nếu cần (vắng có phép, vắng không phép)',
                '6️⃣ Lưu điểm danh',
              ],
            },
            {
              title: 'Xem báo cáo',
              content: 'Phân tích sự tham gia:',
              steps: [
                '📊 Xem tỷ lệ tham dự theo học sinh',
                '📈 Xem xu hướng sự tham gia theo thời gian',
                '👨‍🎓 Xác định học sinh thường xuyên vắng mặt',
                '📧 Gửi nhắc nhở cho những học sinh vắng mặt',
              ],
            },
          ],
        },
        {
          title: 'Lịch Zoom',
          content: 'Lên lịch và quản lý các buổi lớp trực tuyến.',
          subsections: [
            {
              title: 'Tạo buổi Zoom',
              content: 'Để tạo buổi Zoom:',
              steps: [
                '1️⃣ Nhấp vào "Lịch Zoom" trong sidebar',
                '2️⃣ Nhấp nút "Lên lịch buổi Zoom"',
                '3️⃣ Chọn lớp',
                '4️⃣ Đặt ngày, giờ và thời lượng',
                '5️⃣ Thêm chủ đề/nội dung buổi học',
                '6️⃣ Tạo/nhập liên kết Zoom',
                '7️⃣ Lưu',
              ],
            },
            {
              title: 'Quản lý buổi Zoom',
              content: 'Sau khi tạo buổi Zoom:',
              steps: [
                '📅 Xem tất cả các buổi Zoom sắp tới',
                '📝 Chỉnh sửa chi tiết buổi Zoom',
                '🔗 Sao chép liên kết để chia sẻ',
                '📧 Gửi thông báo nhắc nhở cho học sinh',
                '🗑️ Hủy hoặc xóa các buổi không còn cần thiết',
              ],
            },
          ],
        },
        {
          title: 'Thông báo',
          content: 'Giao tiếp hiệu quả với học sinh qua thông báo.',
          subsections: [
            {
              title: 'Gửi thông báo',
              content: 'Để gửi thông báo:',
              steps: [
                '1️⃣ Nhấp vào "Thông báo" trong sidebar',
                '2️⃣ Nhấp nút "Gửi thông báo"',
                '3️⃣ Chọn người nhận (cả lớp, nhóm hoặc cá nhân)',
                '4️⃣ Viết tiêu đề',
                '5️⃣ Viết nội dung thông báo',
                '6️⃣ Chọn loại thông báo (thông báo, nhắc nhở, khẩn cấp)',
                '7️⃣ Đặt thời gian gửi (ngay lập tức hoặc lên lịch)',
                '8️⃣ Gửi',
              ],
            },
            {
              title: 'Loại thông báo hiệu quả',
              content: 'Khi nào nên gửi thông báo:',
              steps: [
                '📣 Bài tập mới được gán',
                '⏰ Nhắc nhở hạn chót sắp đến',
                '🎓 Kết quả bài kiểm tra',
                '🔔 Cập nhật lộ trình lớp',
                '⭐ Khen ngợi thành tích tốt',
              ],
            },
          ],
        },
        {
          title: 'Báo cáo và phân tích',
          content: 'Theo dõi tiến độ học sinh và hiệu quả giảng dạy.',
          subsections: [
            {
              title: 'Dashboard thống kê',
              content: 'Trang Dashboard giáo viên hiển thị:',
              steps: [
                '📊 Thống kê bài học (tổng số, được xuất bản, chờ duyệt)',
                '👥 Thống kê lớp (tổng số lớp, tổng số học sinh)',
                '📝 Thống kê bài kiểm tra (tổng số, hoàn thành)',
                '⏳ Các bài tập chưa chấm đang chờ',
                '📅 Các buổi Zoom sắp tới',
                '📈 Tỷ lệ tham gia trung bình',
              ],
            },
            {
              title: 'Theo dõi cá nhân',
              content: 'Theo dõi tiến độ từng học sinh:',
              steps: [
                '👨‍🎓 Xem bài tập hoàn thành của từng học sinh',
                '⭐ Xem điểm trung bình',
                '📊 Xem xu hướng hiệu suất theo thời gian',
                '🚨 Xác định các học sinh chậm tiến độ',
                '💬 Gửi hỗ trợ hoặc khuyến khích cá nhân',
              ],
            },
          ],
        },
      ],
    },
    admin: {
      role: 'Administrator',
      roleVi: 'Quản trị viên',
      emoji: '👑',
      color: 'from-purple-500 to-purple-600',
      description: 'Hướng dẫn quản lý hệ thống, nội dung và cấu hình',
      sections: [
        {
          title: 'Giới thiệu',
          content: 'Bảng điều khiển quản trị viên cung cấp quyền truy cập hoàn toàn vào tất cả các tính năng hệ thống. Từ quản lý nội dung đến tài chính, mọi thứ được kiểm soát từ đây.',
          subsections: [
            {
              title: 'Quyền hạn quản trị viên',
              content: 'Quản trị viên có toàn quyền để:',
              steps: [
                '🌐 Quản lý nội dung website công khai',
                '📰 Quản lý blog và bài viết',
                '👨‍🏫 Quản lý giáo viên và hồ sơ',
                '📚 Quản lý khóa học',
                '👥 Quản lý lớp học',
                '📖 Quản lý/duyệt bài học',
                '✏️ Quản lý bài kiểm tra',
                '💰 Quản lý tài chính và đơn hàng',
                '📅 Quản lý sự kiện',
                '📋 Quản lý form liên hệ',
                '👤 Quản lý người dùng',
                '⚙️ Cấu hình toàn hệ thống',
              ],
            },
            {
              title: 'Vai trò quản trị',
              content: 'Có hai loại vai trò:',
              steps: [
                '👑 Quản trị viên - Có quyền truy cập vào tất cả',
                '🔧 Kiểm duyệt viên - Quyền hạn giới hạn hơn, không có tài chính/sử dụng',
              ],
            },
          ],
        },
        {
          title: 'Quản lý nội dung trang web',
          content: 'Quản lý và tùy chỉnh nội dung công khai của website.',
          subsections: [
            {
              title: 'Website CMS',
              content: 'Chỉnh sửa nội dung trang chủ và các trang công khai:',
              steps: [
                '🏠 Quản lý sections trên trang chủ',
                '🎨 Thêm/chỉnh sửa banner, hình ảnh hero',
                '📝 Cập nhật văn bản mô tả (tiếng Anh + Tiếng Việt)',
                '🎬 Thêm video, hình ảnh, gallery',
                '🔗 Quản lý liên kết CTA (Call-to-action)',
                '🌐 Quản lý nội dung đa ngôn ngữ',
                '✅ Xem trước trước khi xuất bản',
              ],
            },
            {
              title: 'Trang công khai',
              content: 'Quản lý các trang công khai:',
              steps: [
                '📄 Chỉnh sửa nội dung các trang (Giới thiệu, Khóa học, Giáo viên...)',
                '🎯 Đặt SEO metadata',
                '📷 Quản lý hình ảnh trang',
                '⏱️ Xuất bản/ẩn trang theo thời gian',
              ],
            },
          ],
        },
        {
          title: 'Blog và nội dung',
          content: 'Quản lý blog, bài viết và nội dung tài nguyên.',
          subsections: [
            {
              title: 'Quản lý bài blog',
              content: 'Tạo và quản lý bài blog:',
              steps: [
                '1️⃣ Nhấp vào "Blog" trong sidebar',
                '2️⃣ Nhấp "Bài viết mới"',
                '3️⃣ Thêm tiêu đề (Tiếng Anh + Tiếng Việt)',
                '4️⃣ Chọn danh mục',
                '5️⃣ Viết nội dung (hỗ trợ Markdown)',
                '6️⃣ Thêm hình thumb ngắn',
                '7️⃣ Thêm các tag',
                '8️⃣ Lên lịch xuất bản hoặc xuất bản ngay',
                '9️⃣ Lưu',
              ],
            },
            {
              title: 'Danh mục blog',
              content: 'Quản lý danh mục bài viết:',
              steps: [
                '➕ Thêm danh mục mới',
                '✏️ Chỉnh sửa tên danh mục',
                '🔄 Thay đổi thứ tự hiển thị',
                '🗑️ Xóa danh mục (nếu không có bài viết)',
              ],
            },
            {
              title: 'SEO và khám phá',
              content: 'Tối ưu hóa khám phá nội dung:',
              steps: [
                '📝 Thêm meta description',
                '🔖 Sử dụng tags phù hợp',
                '💬 Thêm excerpt hấp dẫn',
                '📊 Xem lượt xem bài viết',
              ],
            },
          ],
        },
        {
          title: 'Quản lý giáo viên',
          content: 'Quản lý hồ sơ giáo viên và xét duyệt tài khoản.',
          subsections: [
            {
              title: 'Danh sách giáo viên',
              content: 'Xem và quản lý tất cả giáo viên:',
              steps: [
                '👨‍🏫 Xem danh sách tất cả giáo viên',
                '⭐ Xem xếp hạng và số đánh giá',
                '👥 Xem số học sinh',
                '📊 Xem số bài học đã xuất bản',
              ],
            },
            {
              title: 'Chi tiết giáo viên',
              content: 'Quản lý thông tin giáo viên:',
              steps: [
                '📝 Chỉnh sửa tiểu sử (Tiếng Anh + Tiếng Việt)',
                '🎓 Quản lý chứng chỉ',
                '⭐ Xem xếp hạng và đánh giá',
                '👥 Xem tổng số học sinh',
                '📚 Xem các bài học',
                '🌟 Đánh dấu là "Featured" để hiển thị trên trang chủ',
                '🖼️ Quản lý ảnh đại diện, hình nền, gallery',
              ],
            },
            {
              title: 'Phê duyệt bài học giáo viên',
              content: 'Duyệt các bài học do giáo viên tạo:',
              steps: [
                '📋 Xem danh sách bài học chờ duyệt',
                '👀 Xem trước nội dung bài học',
                '✅ Phê duyệt (xuất bản)',
                '❌ Từ chối (gửi lại cho giáo viên)',
                '💬 Thêm ghi chú cho giáo viên',
              ],
            },
          ],
        },
        {
          title: 'Quản lý khóa học',
          content: 'Tạo và quản lý các khóa học có sẵn.',
          subsections: [
            {
              title: 'Tạo khóa học',
              content: 'Để tạo khóa học mới:',
              steps: [
                '1️⃣ Nhấp "Tạo khóa học"',
                '2️⃣ Thêm tiêu đề (Tiếng Anh + Tiếng Việt)',
                '3️⃣ Thêm mô tả chi tiết',
                '4️⃣ Chọn cấp độ (beginner, intermediate, advanced)',
                '5️⃣ Đặt giá tiền (nếu có)',
                '6️⃣ Thêm thời lượng khóa học (tuần)',
                '7️⃣ Chọn hình ảnh đại diện',
                '8️⃣ Thêm kết quả học tập',
                '9️⃣ Thêm yêu cầu tiên quyết',
                '🔟 Thiết lập hiển thị trang chủ + thứ tự',
              ],
            },
            {
              title: 'Giáo viên khóa học',
              content: 'Gán giáo viên cho khóa học:',
              steps: [
                '👨‍🏫 Thêm giáo viên tham gia dạy',
                '📖 Xem các bài học được gán',
                '👥 Xem số học sinh đã ghi danh',
              ],
            },
            {
              title: 'Quản lý nội dung khóa học',
              content: 'Quản lý các bài học và bài tập trong khóa học',
              steps: [
                '📚 Thêm bài học vào khóa học',
                '✏️ Thêm bài kiểm tra',
                '💰 Quản lý giá và khuyến mãi',
                '📊 Xem thống kê ghi danh',
              ],
            },
          ],
        },
        {
          title: 'Quản lý lớp học',
          content: 'Quản lý các lớp và nhóm học sinh.',
          subsections: [
            {
              title: 'Xem lớp',
              content: 'Quản lý các lớp học:',
              steps: [
                '👥 Xem danh sách tất cả lớp',
                '📚 Xem khóa học liên quan',
                '👨‍🏫 Xem giáo viên phụ trách',
                '✅ Phê duyệt/từ chối các lớp chờ duyệt',
              ],
            },
            {
              title: 'Chi tiết lớp',
              content: 'Quản lý thông tin lớp:',
              steps: [
                '📝 Chỉnh sửa tên, mô tả lớp',
                '👥 Xem danh sách học sinh',
                '➕ Thêm/xóa học sinh thủ công',
                '📅 Xem lịch trình lớp',
                '📚 Xem bài tập được gán',
                '📊 Xem thống kê lớp',
              ],
            },
          ],
        },
        {
          title: 'Quản lý tài chính',
          content: 'Quản lý doanh thu, đơn hàng và thanh toán.',
          subsections: [
            {
              title: 'Bảng điều khiển tài chính',
              content: 'Xem tổng quan tài chính:',
              steps: [
                '💰 Tổng doanh thu',
                '📊 Doanh thu theo thời gian',
                '🛒 Tổng số đơn hàng',
                '💳 Các phương thức thanh toán',
                '📈 Biểu đồ xu hướng doanh thu',
              ],
            },
            {
              title: 'Quản lý đơn hàng',
              content: 'Theo dõi và quản lý đơn hàng:',
              steps: [
                '🛒 Xem tất cả đơn hàng',
                '📋 Xem chi tiết đơn hàng (khóa học, học sinh, giá)',
                '💳 Xem trạng thái thanh toán',
                '✅ Xác nhận hoàn tất đơn hàng',
                '🔍 Tìm kiếm đơn hàng theo học sinh',
                '📊 Xuất báo cáo doanh thu',
              ],
            },
            {
              title: 'Xác nhận thanh toán',
              content: 'Xử lý xác nhận chuyển khoản thủ công:',
              steps: [
                '📸 Xem ảnh xác nhận chuyển khoản',
                '✅ Xác nhận thanh toán',
                '❌ Từ chối nếu không hợp lệ',
                '💬 Thêm ghi chú cho học sinh',
              ],
            },
          ],
        },
        {
          title: 'Quản lý sự kiện',
          content: 'Tạo và quản lý các sự kiện, webinar, hội thảo.',
          subsections: [
            {
              title: 'Tạo sự kiện',
              content: 'Để tạo sự kiện mới:',
              steps: [
                '1️⃣ Nhấp "Tạo sự kiện"',
                '2️⃣ Thêm tiêu đề sự kiện',
                '3️⃣ Thêm mô tả chi tiết',
                '4️⃣ Đặt ngày giờ sự kiện',
                '5️⃣ Chọn địa điểm hoặc liên kết Zoom',
                '6️⃣ Đặt số người tham gia tối đa',
                '7️⃣ Thêm hình ảnh',
                '8️⃣ Bật/tắt đăng ký',
                '9️⃣ Lên lịch xuất bản',
              ],
            },
            {
              title: 'Quản lý đăng ký sự kiện',
              content: 'Quản lý người tham gia:',
              steps: [
                '👥 Xem danh sách người đã đăng ký',
                '📥 Xuất danh sách thành file',
                '✅ Xác nhận sự tham gia',
                '❌ Hủy đăng ký',
                '📧 Gửi email nhắc nhở tới người tham gia',
              ],
            },
          ],
        },
        {
          title: 'Quản lý người dùng',
          content: 'Quản lý tài khoản người dùng và quyền hạn.',
          subsections: [
            {
              title: 'Danh sách người dùng',
              content: 'Xem và quản lý tất cả người dùng:',
              steps: [
                '👥 Xem tất cả người dùng',
                '🔍 Tìm kiếm theo email/tên',
                '🎯 Lọc theo vai trò (admin, teacher, user...)',
                '📊 Xem ngày tham gia',
              ],
            },
            {
              title: 'Chỉnh sửa người dùng',
              content: 'Quản lý thông tin người dùng:',
              steps: [
                '✏️ Chỉnh sửa email',
                '👤 Chỉnh sửa tên',
                '📷 Chỉnh sửa ảnh đại diện',
                '🎯 Thay đổi vai trò (admin, teacher, user...)',
                '🔓 Đặt lại mật khẩu',
                '🚫 Vô hiệu hóa/kích hoạt tài khoản',
              ],
            },
            {
              title: 'Vai trò và quyền',
              content: 'Quản lý vai trò người dùng:',
              steps: [
                '👨‍💼 User - Vai trò mặc định, học viên',
                '👨‍🏫 Teacher - Có thể tạo bài học (cần duyệt)',
                '⭐ Senior Teacher - Có thể xuất bản trực tiếp',
                '🔧 Moderator - Quản lý có hạn',
                '👑 Admin - Toàn quyền',
              ],
            },
          ],
        },
        {
          title: 'Cài đặt hệ thống',
          content: 'Cấu hình các tùy chọn hệ thống toàn cuc.',
          subsections: [
            {
              title: 'Cài đặt chung',
              content: 'Cấu hình cơ bản:',
              steps: [
                '🌐 Tên website',
                '📧 Email liên hệ',
                '🌍 Ngôn ngữ mặc định',
                '🔗 URL cơ sở',
                '📞 Số điện thoại hỗ trợ',
              ],
            },
            {
              title: 'Hiển thị trang',
              content: 'Quản lý trang nào được hiển thị công khai:',
              steps: [
                '✅ Bật/tắt hiển thị các trang (Khóa học, Blog, Sự kiện...)',
                '✅ Quản lý item trên Navbar',
                '✅ Quản lý item trên Sidebar học viên',
                '💬 Cập nhật tên hiển thị của các trang',
              ],
            },
            {
              title: 'Cấu hình loại bài tập',
              content: 'Thiết lập các loại bài tập:',
              steps: [
                '📝 Multiple choice (trắc nghiệm)',
                '📝 Short answer (trả lời ngắn)',
                '📝 Essay (tự luận)',
                '📝 Fill in the blank (điền chỗ trống)',
                '🎤 Speaking (nói)',
              ],
            },
          ],
        },
        {
          title: 'Báo cáo và phân tích',
          content: 'Theo dõi thống kê và hiệu suất hệ thống.',
          subsections: [
            {
              title: 'Bảng điều khiển quản trị',
              content: 'Trang chủ quản trị hiển thị:',
              steps: [
                '👥 Tổng số người dùng',
                '📚 Tổng số bài học',
                '📰 Tổng số bài blog',
                '👁️ Số người dùng hoạt động hôm nay',
                '📈 Biểu đồ đăng ký theo thời gian',
              ],
            },
            {
              title: 'Báo cáo chi tiết',
              content: 'Các báo cáo chuyên biệt:',
              steps: [
                '👥 Báo cáo người dùng (kích hoạt, vô hiệu hóa)',
                '📚 Báo cáo bài học (xuất bản, chờ duyệt)',
                '💰 Báo cáo tài chính (doanh thu theo tháng)',
                '📊 Báo cáo hoạt động (đăng nhập, gửi bài...)',
              ],
            },
          ],
        },
      ],
    },
  };

  const currentGuide = guides[activeRole];
  const expandedId = (id: string) => `${activeRole}-${id}`;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-24 pb-16">
        {/* Header */}
        <div className="text-center mb-16 px-4">
          <h1 className="text-5xl font-bold mb-4 text-foreground">
            Hướng dẫn sử dụng hệ thống
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Tìm hiểu cách sử dụng nền tảng học tiếng Nhật của chúng tôi theo vai trò của bạn
          </p>
        </div>

        {/* Role Tabs */}
        <div className="flex justify-center gap-4 mb-12 px-4 flex-wrap">
          {(Object.keys(guides) as Array<'learn' | 'teacher' | 'admin'>).map((role) => {
            const guide = guides[role];
            const isActive = activeRole === role;

            return (
              <button
                key={role}
                onClick={() => setActiveRole(role)}
                className={cn(
                  'px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2',
                  isActive
                    ? `bg-gradient-to-r ${guide.color} text-white shadow-lg`
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                <span className="text-2xl">{guide.emoji}</span>
                <span>{guide.roleVi}</span>
              </button>
            );
          })}
        </div>

        {/* Guide Content */}
        <div className="max-w-4xl mx-auto px-4">
          <div className={`bg-gradient-to-r ${currentGuide.color} rounded-2xl p-8 mb-8 text-white`}>
            <h2 className="text-3xl font-bold mb-2">{currentGuide.emoji} {currentGuide.roleVi}</h2>
            <p className="text-lg opacity-90">{currentGuide.description}</p>
          </div>

          {/* Sections */}
          <div className="space-y-4">
            {currentGuide.sections.map((section, idx) => {
              const sectionId = expandedId(idx.toString());
              const isExpanded = expandedSections[sectionId];

              return (
                <div key={idx} className="border border-border rounded-xl overflow-hidden bg-card">
                  <button
                    onClick={() => toggleSection(sectionId)}
                    className="w-full flex items-center justify-between p-6 hover:bg-muted/50 transition-colors"
                  >
                    <h3 className="text-lg font-semibold text-foreground text-left">
                      {section.title}
                    </h3>
                    <ChevronDown
                      className={cn(
                        'w-5 h-5 text-muted-foreground transition-transform duration-200',
                        isExpanded && 'rotate-180'
                      )}
                    />
                  </button>

                  {isExpanded && (
                    <div className="border-t border-border px-6 py-4 space-y-4">
                      <p className="text-muted-foreground">{section.content}</p>

                      {section.subsections?.map((subsection, subIdx) => (
                        <div key={subIdx} className="ml-4 p-4 bg-muted/30 rounded-lg">
                          <h4 className="font-semibold text-foreground mb-2">
                            {subsection.title}
                          </h4>
                          <p className="text-sm text-muted-foreground mb-3">
                            {subsection.content}
                          </p>
                          {subsection.steps && (
                            <ul className="space-y-2 ml-4">
                              {subsection.steps.map((step, stepIdx) => (
                                <li
                                  key={stepIdx}
                                  className="text-sm text-foreground flex gap-2"
                                >
                                  <span className="flex-shrink-0">→</span>
                                  <span>{step}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserGuides;
