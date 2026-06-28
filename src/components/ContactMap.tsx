import { useEffect, useState } from "react";
import { MapPin, Phone, Clock, Navigation, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/config/brand";

interface MapContent {
  embed_url?: string;
  address?: string;
  phone?: string;
  hours?: string;
  directions_url?: string;
  title?: string;
  subtitle?: string;
  lat?: string;
  lng?: string;
  query?: string;
}

const DEFAULTS: MapContent = {
  embed_url: "",
  address: "TP. Hồ Chí Minh, Việt Nam",
  phone: "(+84) 901 189 399",
  hours: "Thứ 2 - Chủ nhật: 8:00 - 21:00",
  directions_url: `https://www.google.com/maps?q=${BRAND.mapQuery}`,
  title: BRAND.mapTitle,
  subtitle: "Ghé thăm trung tâm, gặp gỡ đội ngũ và trải nghiệm lớp học demo miễn phí.",
  lat: "10.776889",
  lng: "106.700981",
  query: BRAND.mapQuery,
};

const buildEmbedUrl = (c: MapContent): string => {
  if (c.embed_url && c.embed_url.trim()) return c.embed_url.trim();
  const lat = c.lat?.trim();
  const lng = c.lng?.trim();
  if (lat && lng && !isNaN(Number(lat)) && !isNaN(Number(lng))) {
    return `https://maps.google.com/maps?q=${lat},${lng}&z=16&hl=vi&output=embed`;
  }
  const q = c.query?.trim() || c.address?.trim() || BRAND.mapQuery;
  return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=15&hl=vi&output=embed`;
};

const ContactMap = () => {
  const [c, setC] = useState<MapContent>(DEFAULTS);

  useEffect(() => {
    let active = true;
    supabase
      .from("website_content")
      .select("content")
      .eq("section_key", "contact_map")
      .maybeSingle()
      .then(({ data }) => {
        if (!active || !data?.content) return;
        const raw = data.content as Record<string, string>;
        setC({
          embed_url: raw.embed_url || DEFAULTS.embed_url,
          address: raw.address || DEFAULTS.address,
          phone: raw.phone || DEFAULTS.phone,
          hours: raw.hours || DEFAULTS.hours,
          directions_url: raw.directions_url || DEFAULTS.directions_url,
          title: raw.title || DEFAULTS.title,
          subtitle: raw.subtitle || DEFAULTS.subtitle,
          lat: raw.lat ?? DEFAULTS.lat,
          lng: raw.lng ?? DEFAULTS.lng,
          query: raw.query ?? DEFAULTS.query,
        });
      });
    return () => {
      active = false;
    };
  }, []);

  const mapSrc = buildEmbedUrl(c);

  return (
    <section className="relative py-20 overflow-hidden bg-gradient-to-b from-background via-muted/30 to-background">
      <div className="absolute top-10 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-orange-300/10 rounded-full blur-3xl" />

      <div className="container relative z-10 mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 mb-4">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">Vị trí của chúng tôi</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-foreground mb-3">
            {c.title}
          </h2>
          <p className="text-muted-foreground">{c.subtitle}</p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="relative rounded-[32px] overflow-hidden border border-border shadow-2xl bg-card">
            {/* Map */}
            <div className="relative aspect-[16/10] md:aspect-[21/9] w-full bg-muted">
              {mapSrc ? (
                <iframe
                  src={mapSrc}
                  title={`Bản đồ ${BRAND.name}`}
                  className="absolute inset-0 w-full h-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  Chưa cấu hình bản đồ
                </div>
              )}

              {/* Floating info card */}
              <div className="hidden md:block absolute top-6 left-6 w-[340px] rounded-2xl bg-card/95 backdrop-blur-xl border border-border shadow-2xl p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Địa chỉ</p>
                    <p className="font-bold text-foreground leading-snug">{c.address}</p>
                  </div>
                </div>
                {c.phone && (
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Phone className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Hotline</p>
                      <p className="font-bold text-foreground">{c.phone}</p>
                    </div>
                  </div>
                )}
                {c.hours && (
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Giờ làm việc</p>
                      <p className="font-bold text-foreground">{c.hours}</p>
                    </div>
                  </div>
                )}
                <Button asChild variant="hero" size="default" className="w-full mt-2">
                  <a href={c.directions_url} target="_blank" rel="noreferrer">
                    <Navigation className="w-4 h-4" />
                    Chỉ đường
                  </a>
                </Button>
              </div>
            </div>

            {/* Mobile info */}
            <div className="md:hidden p-5 space-y-3 bg-card">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <p className="font-semibold text-foreground">{c.address}</p>
              </div>
              {c.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-primary shrink-0" />
                  <p className="font-semibold text-foreground">{c.phone}</p>
                </div>
              )}
              {c.hours && (
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-primary shrink-0" />
                  <p className="font-semibold text-foreground">{c.hours}</p>
                </div>
              )}
              <Button asChild variant="hero" className="w-full">
                <a href={c.directions_url} target="_blank" rel="noreferrer">
                  <Navigation className="w-4 h-4" />
                  Chỉ đường <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactMap;