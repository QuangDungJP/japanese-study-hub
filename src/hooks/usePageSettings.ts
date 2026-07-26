import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PageSetting {
  id: string;
  page_key: string;
  display_name: string;
  display_name_vi: string;
  nav_label: string | null;
  nav_label_vi: string | null;
  hero_title: string | null;
  hero_title_vi: string | null;
  hero_subtitle: string | null;
  hero_subtitle_vi: string | null;
  route_path: string;
  show_in_nav: boolean | null;
  order_index: number | null;
  is_active: boolean | null;
}

export const usePageSettings = () => {
  return useQuery({
    queryKey: ["page-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("page_settings" as any)
        .select("*")
        .order("order_index", { ascending: true });
      if (error) throw error;
      const map: Record<string, PageSetting> = {};
      ((data as unknown as PageSetting[]) || []).forEach((p) => {
        map[p.page_key] = p;
      });
      return map;
    },
    staleTime: 60_000,
  });
};

export const usePageSetting = (pageKey: string) => {
  const { data, ...rest } = usePageSettings();
  return { data: data?.[pageKey], ...rest };
};
