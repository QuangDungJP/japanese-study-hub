import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type TestimonialLayout = 'masonry' | 'carousel' | 'bento' | 'video';
export type TestimonialSize = 'sm' | 'md' | 'lg';

export interface Testimonial {
  id: string;
  name: string;
  role?: string;
  avatar_url?: string;
  content: string;
  rating?: number;
  course?: string;
  image_url?: string;
  images?: string[];
  drive_url?: string;
  video_url?: string;
  layout: TestimonialLayout;
  is_featured?: boolean;
  is_active?: boolean;
  order_index?: number;
  size?: TestimonialSize;          // image display size (sm/md/lg)
  show_on_homepage?: boolean;       // whether to show this item on homepage
}

// Mockups removed — feedbacks are managed in /admin → tab "Bản đồ / Feedback".
export const DEFAULT_TESTIMONIALS: Testimonial[] = [];

export function useTestimonials() {
  return useQuery({
    queryKey: ['testimonials'],
    queryFn: async () => {
      const { data } = await supabase
        .from('website_content')
        .select('content')
        .eq('section_key', 'testimonials')
        .maybeSingle();
      const list = (data?.content as unknown as Testimonial[]) || [];
      if (!Array.isArray(list)) return [];
      return list
        .filter((t) => t.is_active !== false)
        .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
    },
  });
}

export interface TestimonialsSettings {
  show_on_homepage: boolean;
  homepage_limit: number;
}

export const DEFAULT_TESTIMONIALS_SETTINGS: TestimonialsSettings = {
  show_on_homepage: true,
  homepage_limit: 6,
};

export function useTestimonialsSettings() {
  return useQuery({
    queryKey: ['testimonials-settings'],
    queryFn: async (): Promise<TestimonialsSettings> => {
      const { data } = await supabase
        .from('website_content')
        .select('content')
        .eq('section_key', 'testimonials_settings')
        .maybeSingle();
      const raw = (data?.content as Partial<TestimonialsSettings> | null) || null;
      return {
        show_on_homepage: raw?.show_on_homepage ?? DEFAULT_TESTIMONIALS_SETTINGS.show_on_homepage,
        homepage_limit: Math.max(1, Math.min(50, raw?.homepage_limit ?? DEFAULT_TESTIMONIALS_SETTINGS.homepage_limit)),
      };
    },
  });
}
