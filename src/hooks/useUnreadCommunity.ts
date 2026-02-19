import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

const LAST_VISIT_KEY = "community_last_visit";

export const getLastCommunityVisit = (): string | null => {
  return localStorage.getItem(LAST_VISIT_KEY);
};

export const markCommunityVisited = () => {
  localStorage.setItem(LAST_VISIT_KEY, new Date().toISOString());
};

export const useUnreadCommunityPosts = () => {
  const { user } = useAuth();
  const lastVisit = getLastCommunityVisit();

  return useQuery({
    queryKey: ["community-unread", lastVisit],
    queryFn: async () => {
      let query = supabase
        .from("community_posts")
        .select("id", { count: "exact", head: true })
        .eq("is_hidden", false);

      if (lastVisit) {
        query = query.gt("created_at", lastVisit);
      }

      const { count, error } = await query;
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!user,
    refetchInterval: 60_000, // poll every minute
  });
};
