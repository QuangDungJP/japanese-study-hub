import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface WebsiteContent {
  id: string;
  section_key: string;
  title: string | null;
  title_vi: string | null;
  subtitle: string | null;
  subtitle_vi: string | null;
  description: string | null;
  description_vi: string | null;
  image_url: string | null;
  video_url: string | null;
  content: Record<string, any> | null;
  is_active: boolean | null;
  order_index: number | null;
}

export const useWebsiteContent = (sectionKey?: string) => {
  return useQuery({
    queryKey: ["website-content", sectionKey],
    queryFn: async () => {
      let query = supabase
        .from("website_content")
        .select("*")
        .eq("is_active", true)
        .order("order_index", { ascending: true });

      if (sectionKey) {
        query = query.eq("section_key", sectionKey);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as WebsiteContent[];
    },
  });
};

export const useAllWebsiteContent = () => {
  return useQuery({
    queryKey: ["website-content-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("website_content")
        .select("*")
        .eq("is_active", true)
        .order("order_index", { ascending: true });

      if (error) throw error;

      // Group by section_key
      const grouped: Record<string, WebsiteContent> = {};
      (data as WebsiteContent[]).forEach((item) => {
        grouped[item.section_key] = item;
      });

      return grouped;
    },
  });
};
