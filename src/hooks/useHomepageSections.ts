import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SectionConfig {
  id: string;
  label: string;
  visible: boolean;
}

const defaultOrder = ['hero', 'skills', 'courses', 'features', 'zoom', 'teachers', 'blog', 'cta'];

const defaultLabels: Record<string, string> = {
  hero: 'Hero Banner',
  skills: '4 Kỹ năng cốt lõi',
  courses: 'Khóa học JLPT',
  features: 'Tại sao chọn chúng tôi',
  zoom: 'Đặt lịch học',
  teachers: 'Đội ngũ giảng viên',
  blog: 'Blog nổi bật',
  cta: 'CTA - Đăng ký ngay',
};

const mergeSectionsWithDefaults = (saved: SectionConfig[]) => {
  const merged = [...saved];
  const defaultIndex = (id: string) => defaultOrder.indexOf(id);

  for (const id of defaultOrder) {
    if (merged.some(section => section.id === id)) continue;

    const nextDefault = defaultOrder.slice(defaultIndex(id) + 1);
    const nextIndex = merged.findIndex(section => nextDefault.includes(section.id));
    const section = { id, label: defaultLabels[id] || id, visible: true };

    if (nextIndex >= 0) {
      merged.splice(nextIndex, 0, section);
    } else {
      merged.push(section);
    }
  }

  return merged;
};

export function useHomepageSections() {
  return useQuery({
    queryKey: ['homepage-sections'],
    queryFn: async () => {
      const { data } = await supabase
        .from('website_content')
        .select('content')
        .eq('section_key', 'homepage_sections')
        .maybeSingle();

      const saved = (data?.content && Array.isArray(data.content))
        ? (data.content as unknown as SectionConfig[])
        : [];
      return mergeSectionsWithDefaults(saved);
    },
    staleTime: 60_000,
  });
}
