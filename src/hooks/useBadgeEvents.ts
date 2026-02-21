import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface BadgeEvent {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
}

export function useBadgeEvents() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["badge-events", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("badge_events")
        .select("*")
        .order("earned_at", { ascending: false });
      if (error) throw error;
      return data as BadgeEvent[];
    },
    enabled: !!user,
  });
}

export function useRecordBadgeEvent() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (badgeIds: string[]) => {
      if (!user) return;
      const rows = badgeIds.map((badge_id) => ({
        user_id: user.id,
        badge_id,
      }));
      const { error } = await supabase
        .from("badge_events")
        .upsert(rows, { onConflict: "user_id,badge_id", ignoreDuplicates: true });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["badge-events"] });
    },
  });
}
