import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TeachersSection from "@/components/TeachersSection";
import ScrollReveal from "@/components/ScrollReveal";
import PageBanner from "@/components/shared/PageBanner";

const TeachersPage = () => {
  return (
    <main className="min-h-screen">
      <Navbar />
      <PageBanner
        pageKey="teachers"
        defaultBadge="Đội ngũ giảng viên"
        defaultTitle="Giảng viên xuất sắc & tận tâm"
        highlight="xuất sắc"
        defaultSubtitle="100% giáo viên có chứng chỉ giảng dạy, kinh nghiệm dày dặn và phương pháp giảng dạy sáng tạo"
      />

      <ScrollReveal>
        <TeachersSection />
      </ScrollReveal>
      <Footer />
    </main>
  );
};

export default TeachersPage;
