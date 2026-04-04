import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SectionConfig {
  id: string;
  label: string;
  visible: boolean;
}

const defaultOrder = ['hero', 'skills', 'courses', 'features', 'zoom', 'teachers', 'cta'];

export function useHomepageSections() {
  return useQuery({
    queryKey: ['homepage-sections'],
    queryFn: async () => {
      const { data } = await supabase
        .from('website_content')
        .select('content')
        .eq('section_key', 'homepage_sections')
        .maybeSingle();

      if (data?.content && Array.isArray(data.content)) {
        const sections = data.content as unknown as SectionConfig[];
        return sections;
      }
      return defaultOrder.map(id => ({ id, label: id, visible: true }));
    },
    staleTime: 60_000,
  });
}
