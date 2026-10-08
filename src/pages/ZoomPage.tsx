import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowUpRight, Video, Users, CalendarDays, MessageCircle, BookOpen, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { usePageSetting } from "@/hooks/usePageSettings";
import classroomPhoto from "@/assets/meeting/online-teacher.jpg.asset.json";
import studentPhoto from "@/assets/meeting/student.jpg.asset.json";

const ZoomPage = () => {
  const { data: page } = usePageSetting("zoom");
  const displayName = page?.display_name_vi || "Google Meet";
  const heroTitle = page?.hero_title_vi || `Học qua ${displayName} với giáo viên bản ngữ`;
  const heroSubtitle = page?.hero_subtitle_vi || "Lớp học trực tuyến chất lượng cao, tương tác trực tiếp 1-1 hoặc nhóm nhỏ tối đa 6 học viên";

  return (
    <main className="meeting-page min-h-screen bg-background text-foreground">
      <Navbar />
      <section className="meeting-intro pt-32 pb-12 md:pb-16">
        <div className="container mx-auto px-5 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-accent mb-5">
                <Video className="h-4 w-4" /> HỌC TRỰC TUYẾN · TNQDO
              </div>
              <h1 className="meeting-heading text-4xl sm:text-5xl xl:text-6xl font-extrabold leading-[1.12] mb-6">{heroTitle}</h1>
              <p className="text-base md:text-lg leading-relaxed text-muted-foreground max-w-xl">{heroSubtitle}</p>
              <div className="grid sm:grid-cols-2 gap-4 my-8">
                <div className="rounded-lg border border-border bg-card p-5">
                  <Video className="h-6 w-6 text-primary mb-4" />
                  <h2 className="font-bold text-base mb-2">Lớp học 1-1</h2>
                  <p className="text-sm leading-relaxed text-muted-foreground">Cá nhân hóa lộ trình, tập trung vào mục tiêu của bạn.</p>
                </div>
                <div className="rounded-lg border border-border bg-card p-5">
                  <Users className="h-6 w-6 text-english mb-4" />
                  <h2 className="font-bold text-base mb-2">Lớp nhóm nhỏ</h2>
                  <p className="text-sm leading-relaxed text-muted-foreground">Cùng luyện nói, trao đổi và tiến bộ sau mỗi buổi học.</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button size="lg" asChild className="h-auto min-h-12 py-3 px-5 whitespace-normal text-center">
                  <Link to="/lien-he">Đăng ký học thử miễn phí <ArrowUpRight /></Link>
                </Button>
                <Button size="lg" variant="secondary" asChild className="h-auto min-h-12 py-3 px-5 whitespace-normal text-center">
                  <Link to="/khoa-hoc">Xem khóa học <ArrowRight /></Link>
                </Button>
              </div>
            </div>
            <figure className="min-w-0 m-0">
              <div className="flex items-center justify-between gap-4 mb-4 text-sm">
                <span className="flex items-center gap-2 font-semibold"><Video className="h-4 w-4 text-primary" /> Google Meet</span>
                <span className="text-muted-foreground">Kết nối · Học tập · Tiến bộ</span>
              </div>
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
                <img src={classroomPhoto.url} alt="Học viên tương tác với giáo viên qua lớp học trực tuyến trên máy tính" className="h-full w-full object-cover" fetchPriority="high" />
                <div className="meeting-photo-caption absolute left-4 bottom-4 right-4 p-4 rounded-lg flex items-center gap-3">
                  <BookOpen className="h-6 w-6 shrink-0" />
                  <div><p className="font-semibold text-sm">Một lớp học, mọi khoảng cách</p><p className="text-xs mt-1 opacity-80">Tương tác trực tiếp cùng giáo viên</p></div>
                </div>
              </div>
              <figcaption className="flex items-center gap-4 py-4 border-b border-border">
                <img src={studentPhoto.url} alt="Góc học tập trực tuyến tại nhà" className="h-12 w-12 rounded-lg object-cover" loading="lazy" />
                <div className="flex-1"><p className="text-sm font-semibold">Không gian học tập của riêng bạn</p><p className="text-xs text-muted-foreground mt-1">Học tại nhà, kết nối với cả lớp.</p></div>
              </figcaption>
              <p className="text-xs text-muted-foreground mt-3">Ảnh minh họa học trực tuyến · Pexels</p>
            </figure>
          </div>
        </div>
      </section>
      <section className="border-y border-border bg-card py-10 md:py-12">
        <div className="container mx-auto px-5 lg:px-8 grid md:grid-cols-3 gap-8">
          {[{ icon: CalendarDays, title: 'Lịch học rõ ràng', text: 'Theo dõi buổi học và lịch học bù trong lớp của bạn.' }, { icon: MessageCircle, title: 'Kết nối cùng giáo viên', text: 'Trao đổi, hỏi bài và thảo luận cùng các bạn trong lớp.' }, { icon: BookOpen, title: 'Bài học luôn bên bạn', text: 'Tài liệu, bài giảng và bài kiểm tra trong cùng không gian học tập.' }].map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-4"><Icon className="h-6 w-6 mt-1 shrink-0 text-primary" /><div><h2 className="font-bold mb-2">{title}</h2><p className="text-sm text-muted-foreground leading-relaxed">{text}</p></div></div>
          ))}
        </div>
      </section>
      <Footer />
    </main>
  );
};

export default ZoomPage;
