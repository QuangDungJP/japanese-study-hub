import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContactFormSection from "@/components/ContactFormSection";
import { Mail, Phone, MessageSquare } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

const Contact = () => {
  return (
    <main className="min-h-screen">
      <Navbar />

      {/* Hero + Form Section */}
      <section className="relative pt-28 pb-20 overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-amber-100 via-orange-50 to-background" />
        <div className="absolute top-10 left-10 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            {/* Left: Mascot + Text */}
            <ScrollReveal direction="left">
              <div className="text-center lg:text-left space-y-6">
                <div className="flex justify-center lg:justify-start">
                  <div className="w-40 h-40 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border-4 border-primary/30 shadow-xl">
                    <span className="text-6xl">📚</span>
                  </div>
                </div>
                <h1 className="text-3xl md:text-5xl font-extrabold text-foreground leading-tight">
                  Để lại thông tin để đăng kí<br />
                  dịch vụ tại <span className="text-primary">TNQDO</span>
                </h1>
                <p className="text-lg text-muted-foreground max-w-md">
                  Bạn vui lòng để SĐT Zalo cho CSKH tụi mình tiện liên lạc bạn nha
                </p>
              </div>
            </ScrollReveal>

            {/* Right: Inline Quick Form */}
            <ScrollReveal direction="right">
              <div className="bg-gradient-to-br from-emerald-200/80 to-teal-200/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-emerald-300/50">
                <ContactFormSection variant="compact" />
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Contact Info Bar */}
      <section className="py-12 bg-card border-y border-border">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Phone Numbers */}
              <ScrollReveal delay={0} direction="up">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground mb-2">Hotline</h3>
                    <p className="text-foreground font-semibold">(+84) 901 189 399 <span className="text-muted-foreground font-normal">(Mr. Triệu)</span></p>
                    <p className="text-foreground font-semibold">(+84) 939 734 210 <span className="text-muted-foreground font-normal">(Mr. Hưng)</span></p>
                  </div>
                </div>
              </ScrollReveal>

              {/* Emails */}
              <ScrollReveal delay={150} direction="up">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground mb-2">Email</h3>
                    <p className="text-foreground font-medium break-all">quangdungonline.education@gmail.com</p>
                    <p className="text-foreground font-medium break-all">quangdungonline.nihongo@edu.vn</p>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default Contact;
