import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type TeacherProfileRow = Database['public']['Tables']['teacher_profiles']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export interface TeacherProfileWithUser extends TeacherProfileRow {
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface UseTeacherProfilesOptions {
  activeOnly?: boolean;
  featuredOnly?: boolean;
}

export const useTeacherProfiles = (options: UseTeacherProfilesOptions = {}) => {
  const { activeOnly = true, featuredOnly = false } = options;

  return useQuery({
    queryKey: ["teacher-profiles", activeOnly, featuredOnly],
    queryFn: async () => {
      let query = supabase.from("teacher_profiles").select("*");

      if (activeOnly) query = query.eq("is_available", true);
      if (featuredOnly) query = query.eq("is_featured", true);

      const { data: teachers, error: teachersError } = await query.order("order_index", { ascending: true }).order("created_at", { ascending: true });

      if (teachersError) throw teachersError;

      const userIds = (teachers || []).map((t) => t.user_id).filter(Boolean);
      if (userIds.length === 0) {
        return [] as TeacherProfileWithUser[];
      }

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);

      if (profilesError) throw profilesError;

      const profileMap = new Map<string, { full_name: string | null; avatar_url: string | null }>();
      (profiles || []).forEach((p) => {
        if (p?.user_id) profileMap.set(p.user_id, { full_name: p.full_name, avatar_url: p.avatar_url });
      });

      return (teachers || []).map((teacher) => ({
        ...teacher,
        profile: profileMap.get(teacher.user_id) ?? undefined,
      })) as TeacherProfileWithUser[];
    },
  });
};
