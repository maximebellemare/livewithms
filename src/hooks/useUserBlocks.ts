import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface BlockedUser {
  id: string;
  blocked_id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export function useBlockUser() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ blockedId, reason }: { blockedId: string; reason?: string }) => {
      const { error } = await supabase
        .from("user_blocks" as any)
        .insert({ blocker_id: user!.id, blocked_id: blockedId, reason } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["smart-matches"] });
      qc.invalidateQueries({ queryKey: ["blocked-users"] });
    },
  });
}

export function useBlockedUsers() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["blocked-users", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_blocks" as any)
        .select("id, blocked_id, created_at")
        .eq("blocker_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const blocks = (data ?? []) as any[];
      if (blocks.length === 0) return [] as BlockedUser[];

      // Fetch display names from profiles_public
      const blockedIds = blocks.map((b: any) => b.blocked_id);
      const { data: profiles } = await supabase
        .from("profiles_public")
        .select("user_id, display_name, avatar_url")
        .in("user_id", blockedIds);

      const profileMap = new Map(
        (profiles ?? []).map((p) => [p.user_id, p])
      );

      return blocks.map((b: any) => ({
        id: b.id,
        blocked_id: b.blocked_id,
        display_name: profileMap.get(b.blocked_id)?.display_name ?? null,
        avatar_url: profileMap.get(b.blocked_id)?.avatar_url ?? null,
        created_at: b.created_at,
      })) as BlockedUser[];
    },
    enabled: !!user,
  });
}

export function useUnblockUser() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (blockId: string) => {
      const { error } = await supabase
        .from("user_blocks" as any)
        .delete()
        .eq("id", blockId)
        .eq("blocker_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blocked-users"] });
      qc.invalidateQueries({ queryKey: ["smart-matches"] });
    },
  });
}
