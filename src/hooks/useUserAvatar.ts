import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Fetches avatar_url for a given user_id from profiles.
 * Caches per user_id so multiple components showing the same user share one request.
 */
export const useUserAvatar = (userId: string | null) => {
  return useQuery({
    queryKey: ["user-avatar", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("user_id", userId!)
        .single();
      if (error) return null;
      return (data?.avatar_url as string) || null;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // cache for 5 minutes
  });
};
