import { useState, useEffect, useMemo } from 'react';
import ScrollReveal from './ScrollReveal';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PartnerInfo {
  id: string;
  name: string;
  logoUrl: string;
  websiteUrl: string;
}

export const PARTNERS_CATALOG: PartnerInfo[] = [
  {
    id: '1',
    name: 'Cultural Roots Global Reach',
    logoUrl: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=300&auto=format&fit=crop&q=80',
    websiteUrl: 'https://www.quangdungnihongo.com',
  },
  {
    id: '2',
    name: 'FPT Education - FPT University',
    logoUrl: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=300&auto=format&fit=crop&q=80',
    websiteUrl: 'https://www.quangdungnihongo.com',
  },
  {
    id: '3',
    name: 'Go4AI Life',
    logoUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=300&auto=format&fit=crop&q=80',
    websiteUrl: 'https://www.quangdungnihongo.com',
  },
  {
    id: '4',
    name: 'I-TESOL International',
    logoUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=300&auto=format&fit=crop&q=80',
    websiteUrl: 'https://www.quangdungnihongo.com',
  },
  {
    id: '5',
    name: 'Intracom University',
    logoUrl: 'https://images.unsplash.com/photo-1492571350019-22de08371fd3?w=300&auto=format&fit=crop&q=80',
    websiteUrl: 'https://www.quangdungnihongo.com',
  },
  {
    id: '6',
    name: 'JCI Trevi',
    logoUrl: 'https://images.unsplash.com/photo-1528164344705-47542687990d?w=300&auto=format&fit=crop&q=80',
    websiteUrl: 'https://www.quangdungnihongo.com',
  },
  {
    id: '7',
    name: 'Light Learning',
    logoUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&auto=format&fit=crop&q=80',
    websiteUrl: 'https://www.quangdungnihongo.com',
  },
  {
    id: '8',
    name: 'Medu English',
    logoUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=300&auto=format&fit=crop&q=80',
    websiteUrl: 'https://www.quangdungnihongo.com',
  },
];

export const PartnersSection = () => {
  const [startIndex, setStartIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const { data: cmsContent } = useQuery({
    queryKey: ['partners-section-cms'],
    queryFn: async () => {
      const { data } = await supabase
        .from('website_content')
        .select('content')
        .eq('section_key', 'partners')
        .maybeSingle();
      return (data?.content as Record<string, any>) || null;
    },
  });

  const activePartners: PartnerInfo[] = useMemo(() => {
    if (Array.isArray(cmsContent?.partners_list) && cmsContent.partners_list.length > 0) {
      return cmsContent.partners_list;
    }
    return PARTNERS_CATALOG;
  }, [cmsContent]);

  const slideSpeedSeconds = (cmsContent?.slide_speed_seconds || 3.5) * 1000;
  const sectionTitle = cmsContent?.section_title || 'Đơn vị kết nối';

  // Auto slide carousel
  useEffect(() => {
    if (isHovered || activePartners.length === 0) return;
    const timer = setInterval(() => {
      setStartIndex((prev) => (prev + 1) % activePartners.length);
    }, slideSpeedSeconds);
    return () => clearInterval(timer);
  }, [isHovered, activePartners.length, slideSpeedSeconds]);

  const handlePrev = () => {
    setStartIndex((prev) => (prev - 1 + activePartners.length) % activePartners.length);
  };

  const handleNext = () => {
    setStartIndex((prev) => (prev + 1) % activePartners.length);
  };

  // Get 4 visible partners for current carousel window
  const visiblePartners = [0, 1, 2, 3].map(
    (offset) => activePartners[(startIndex + offset) % activePartners.length]
  ).filter(Boolean);

  return (
    <section className="py-12 bg-white dark:bg-slate-950 border-t border-b border-slate-100 dark:border-slate-800">
      <div className="container mx-auto px-4">
        <ScrollReveal>
          <div className="text-center mb-8 flex items-center justify-between max-w-5xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-extrabold text-black dark:text-white tracking-tight mx-auto pl-10">
              {sectionTitle}
            </h2>
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrev}
                className="h-8 w-8 rounded-full text-slate-400 hover:text-black hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNext}
                className="h-8 w-8 rounded-full text-slate-400 hover:text-black hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </ScrollReveal>

        {/* Carousel Container (4 partners per view, auto-sliding) */}
        <div
          className="max-w-6xl mx-auto overflow-hidden py-4"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-10 items-center justify-items-center transition-all duration-500">
            {visiblePartners.map((partner, i) => (
              <a
                key={`${partner.id || partner.name}-${startIndex}-${i}`}
                href={partner.websiteUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-center h-24 w-48 md:w-56 p-2 transition-all duration-300 hover:scale-105"
                title={partner.name}
              >
                <img
                  src={partner.logoUrl}
                  alt={partner.name}
                  className="max-h-full max-w-full object-contain transition-all duration-300 filter drop-shadow-xs"
                />
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PartnersSection;
