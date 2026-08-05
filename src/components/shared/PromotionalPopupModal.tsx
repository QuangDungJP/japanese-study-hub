import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, X, ExternalLink, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface MarketingPopup {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  target_link: string | null;
  pc_width_px: number;
  pc_height_px: number;
  mobile_width_px: number;
  mobile_height_px: number;
  display_frequency: 'first_visit' | 'session' | 'once_a_day' | 'always';
  start_at: string | null;
  end_at: string | null;
  is_active: boolean;
  order_index: number;
}

const PromotionalPopupModal = () => {
  const [popups, setPopups] = useState<MarketingPopup[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchEligiblePopups();
  }, []);

  const fetchEligiblePopups = async () => {
    try {
      const { data, error } = await supabase
        .from('marketing_popups' as any)
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: false });

      if (error || !data) return;

      const now = new Date().getTime();
      const todayStr = new Date().toISOString().slice(0, 10);

      // Filter eligible popups by schedule & frequency rules
      const eligible = (data as unknown as MarketingPopup[]).filter(popup => {
        // Date range check
        if (popup.start_at && new Date(popup.start_at).getTime() > now) return false;
        if (popup.end_at && new Date(popup.end_at).getTime() < now) return false;

        // Frequency check
        if (popup.display_frequency === 'first_visit' || popup.display_frequency === 'session') {
          if (sessionStorage.getItem(`popup_seen_${popup.id}`)) return false;
        } else if (popup.display_frequency === 'once_a_day') {
          if (localStorage.getItem(`popup_seen_date_${popup.id}`) === todayStr) return false;
        }

        return true;
      });

      if (eligible.length > 0) {
        setPopups(eligible);
        setCurrentIndex(0);
        setOpen(true);
      }
    } catch (e) {
      console.error('Error fetching marketing popups:', e);
    }
  };

  const handleClose = () => {
    setOpen(false);
    const todayStr = new Date().toISOString().slice(0, 10);

    // Record frequency check for all viewed popups
    popups.forEach(popup => {
      if (popup.display_frequency === 'first_visit' || popup.display_frequency === 'session') {
        sessionStorage.setItem(`popup_seen_${popup.id}`, 'true');
      } else if (popup.display_frequency === 'once_a_day') {
        localStorage.setItem(`popup_seen_date_${popup.id}`, todayStr);
      }
    });
  };

  if (!open || popups.length === 0) return null;

  const currentPopup = popups[currentIndex];
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const targetWidth = isMobile ? currentPopup.mobile_width_px : currentPopup.pc_width_px;
  const targetHeight = isMobile ? currentPopup.mobile_height_px : currentPopup.pc_height_px;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev === 0 ? popups.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev === popups.length - 1 ? 0 : prev + 1));
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent 
        className="p-0 border-none bg-transparent shadow-2xl overflow-visible max-w-none flex justify-center items-center"
      >
        <div 
          style={{
            width: `${Math.min(targetWidth, isMobile ? 360 : 600)}px`,
            maxHeight: `${Math.min(targetHeight, 680)}px`,
            aspectRatio: `${targetWidth}/${targetHeight}`,
          }}
          className="relative bg-gradient-to-b from-amber-400 via-orange-500 to-red-500 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/30 flex flex-col justify-between p-4 group transition-all duration-300 animate-in zoom-in-95"
        >
          {/* Main Popup Image Banner */}
          <a
            href={currentPopup.target_link || '#'}
            target={currentPopup.target_link?.startsWith('http') ? '_blank' : '_self'}
            rel="noreferrer"
            className="absolute inset-0 block w-full h-full cursor-pointer z-0"
            onClick={() => {
              if (currentPopup.target_link) handleClose();
            }}
          >
            <img 
              src={currentPopup.image_url} 
              alt={currentPopup.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
          </a>

          {/* Top Close Button (X) */}
          <button 
            onClick={handleClose}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 text-white border border-white/30 flex items-center justify-center font-bold z-30 hover:bg-black hover:scale-110 transition-all shadow-lg"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Carousel Arrows (if > 1 popup) */}
          {popups.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white hover:bg-black border border-white/20 flex items-center justify-center z-30 transition-all shadow-md"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white hover:bg-black border border-white/20 flex items-center justify-center z-30 transition-all shadow-md"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Bottom Details Overlay */}
          <div className="relative z-20 text-white mt-auto space-y-2 pointer-events-none">
            <h3 className="text-lg md:text-xl font-extrabold text-shadow-md line-clamp-1">{currentPopup.title}</h3>
            {currentPopup.description && (
              <p className="text-xs text-white/90 line-clamp-2">{currentPopup.description}</p>
            )}
            
            {/* Action CTA & Dots */}
            <div className="flex items-center justify-between pt-1 pointer-events-auto">
              {currentPopup.target_link ? (
                <a
                  href={currentPopup.target_link}
                  target={currentPopup.target_link.startsWith('http') ? '_blank' : '_self'}
                  rel="noreferrer"
                  onClick={handleClose}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-500 text-black font-extrabold text-xs shadow-xl uppercase tracking-wider hover:scale-105 transition-transform"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Xem Ngay 👉
                </a>
              ) : <div />}

              {/* Carousel Indicators Dots */}
              {popups.length > 1 && (
                <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-full backdrop-blur-sm border border-white/20">
                  {popups.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentIndex(idx)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        idx === currentIndex ? 'bg-amber-400 w-4' : 'bg-white/50 hover:bg-white'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PromotionalPopupModal;
