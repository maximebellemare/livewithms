import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Fetches all admin/moderator roles and returns a map of userId -> roles[].
 * The RLS policy allows any authenticated user to see admin/moderator roles.
 */
export const useCommunityRoles = () => {
  return useQuery({
    queryKey: ["community-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id, role");
      if (error) throw error;
      const map: Record<string, string[]> = {};
      for (const r of data ?? []) {
        if (!map[r.user_id]) map[r.user_id] = [];
        map[r.user_id].push(r.role);
      }
      return map;
    },
    staleTime: 5 * 60 * 1000, // cache for 5 min
  });
};
