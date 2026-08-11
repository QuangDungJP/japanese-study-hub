import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContactFormSection from "@/components/ContactFormSection";
import { Mail, Phone, MapPin, Navigation } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

const Contact = () => {
  const { data: contactContent } = useQuery({
    queryKey: ['contact-info-content'],
    queryFn: async () => {
      const { data } = await supabase
        .from('website_content')
        .select('content')
        .eq('section_key', 'contact_info')
        .maybeSingle();
      return (data?.content as Record<string, any>) || null;
    },
  });

  const rawMapUrl = contactContent?.google_maps_url || "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.424167419727!2d106.70042377573618!3d10.778788959146197!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f4646738927%3A0xd641a998bb55f1f9!2zTmd1eeG7hW4gSHXhu4csIFF14bqtbiAxLCBUaMOgbmggcGjhu5EgSOG7kyBDaMOtIE1pbmg!5e0!3m2!1svi!2svn!4v1700000000000!5m2!1svi!2svn";
  // Extract iframe src if user pasted full <iframe> tag
  const mapSrc = rawMapUrl.includes('src="') ? (rawMapUrl.match(/src="([^"]+)"/) || [])[1] || rawMapUrl : rawMapUrl;

  const phone1 = contactContent?.phone_1 || "(+84) 901 189 399";
  const phone2 = contactContent?.phone_2 || "(+84) 939 734 210";
  const email1 = contactContent?.email_1 || "quangdungonline.education@gmail.com";
  const email2 = contactContent?.email_2 || "quangdungonline.nihongo@edu.vn";
  const address = contactContent?.address || "123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh";

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      {/* Hero + Form Section */}
      <section className="relative pt-28 pb-20 overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-amber-100/50 via-orange-50/30 to-background dark:from-slate-900 dark:to-background" />
        <div className="absolute top-10 left-10 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            {/* Left: Mascot + Text */}
            <ScrollReveal direction="left">
              <div className="text-center lg:text-left space-y-6">
                <div className="flex justify-center lg:justify-start">
                  <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border-2 border-primary/30 shadow-xl">
                    <span className="text-4xl">📚</span>
                  </div>
                </div>
                <h1 className="text-3xl md:text-5xl font-extrabold text-foreground leading-tight">
                  Để lại thông tin để tư vấn<br />
                  dịch vụ tại <span className="text-primary">TNQDO</span>
                </h1>
                <p className="text-base text-muted-foreground max-w-md">
                  Bạn vui lòng để lại thông tin liên hệ. Đội ngũ tư vấn viên sẽ phản hồi nhanh chóng qua Zalo / Hotline.
                </p>
              </div>
            </ScrollReveal>

            {/* Right: Inline Quick Form */}
            <ScrollReveal direction="right">
              <div className="bg-gradient-to-br from-emerald-200/80 to-teal-200/80 dark:from-slate-800 dark:to-slate-900 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-emerald-300/50 dark:border-slate-700">
                <ContactFormSection variant="compact" />
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Contact Info Bar */}
      <section className="py-12 bg-card border-y border-border">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Address */}
              <ScrollReveal delay={0} direction="up">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground mb-1">Trụ sở trung tâm</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{address}</p>
                  </div>
                </div>
              </ScrollReveal>

              {/* Phone Numbers */}
              <ScrollReveal delay={100} direction="up">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Phone className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground mb-1">Hotline tư vấn</h3>
                    <p className="text-sm text-foreground font-semibold">{phone1}</p>
                    <p className="text-sm text-foreground font-semibold">{phone2}</p>
                  </div>
                </div>
              </ScrollReveal>

              {/* Emails */}
              <ScrollReveal delay={200} direction="up">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground mb-1">Email hỗ trợ</h3>
                    <p className="text-sm text-foreground font-medium break-all">{email1}</p>
                    <p className="text-sm text-foreground font-medium break-all">{email2}</p>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* Google Maps Interactive Section */}
      <section className="py-16 bg-muted/20">
        <div className="container mx-auto px-4">
          <ScrollReveal>
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-bold mb-2">
                    <Navigation className="w-3.5 h-3.5 mr-1" /> Vị Trí Bản Đồ
                  </Badge>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-foreground">
                    Bản đồ chỉ đường tới trung tâm
                  </h2>
                </div>
              </div>

              {/* Google Maps Embedded Frame */}
              <div className="relative w-full h-[450px] rounded-3xl overflow-hidden border-2 border-border shadow-2xl bg-card">
                <iframe
                  src={mapSrc}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Google Maps Location"
                  className="w-full h-full"
                />
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default Contact;
