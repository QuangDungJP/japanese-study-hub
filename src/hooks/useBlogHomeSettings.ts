import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BlogHomeSettings {
  pinned_ids: string[];
  home_ids: string[];
  home_count: number;
}

const DEFAULTS: BlogHomeSettings = {
  pinned_ids: [],
  home_ids: [],
  home_count: 6,
};

export const useBlogHomeSettings = () => {
  return useQuery({
    queryKey: ["blog-home-settings"],
    queryFn: async (): Promise<BlogHomeSettings> => {
      const { data } = await supabase
        .from("website_content")
        .select("content")
        .eq("section_key", "blog_homepage_settings")
        .maybeSingle();
      const c = (data?.content as any) || {};
      return {
        pinned_ids: Array.isArray(c.pinned_ids) ? c.pinned_ids : [],
        home_ids: Array.isArray(c.home_ids) ? c.home_ids : [],
        home_count: typeof c.home_count === "number" ? c.home_count : 6,
      };
    },
    staleTime: 30_000,
  });
};

export const useSaveBlogHomeSettings = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (settings: BlogHomeSettings) => {
      const { error } = await supabase
        .from("website_content")
        .upsert(
          {
            section_key: "blog_homepage_settings",
            title: "Blog Homepage Settings",
            content: settings as any,
            is_active: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "section_key" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blog-home-settings"] });
      qc.invalidateQueries({ queryKey: ["home-blog-posts"] });
    },
  });
};

export { DEFAULTS as BLOG_HOME_DEFAULTS };
