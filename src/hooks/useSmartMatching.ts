import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface SmartMatchProfile {
  user_id: string;
  opt_in: boolean;
  bio: string | null;
  looking_for: string | null;
}

export interface SmartMatch {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  ms_type: string | null;
  age_range: string | null;
  bio: string | null;
  looking_for: string | null;
}

export function useMyMatchProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["smart-match-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("smart_match_profiles" as any)
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as SmartMatchProfile | null;
    },
    enabled: !!user,
  });
}

export function useUpsertMatchProfile() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (profile: Partial<Omit<SmartMatchProfile, "user_id">>) => {
      const { data: existing } = await supabase
        .from("smart_match_profiles" as any)
        .select("id")
        .eq("user_id", user!.id)
        .maybeSingle();
      if ((existing as any)?.id) {
        const { error } = await supabase
          .from("smart_match_profiles" as any)
          .update(profile as any)
          .eq("user_id", user!.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("smart_match_profiles" as any)
          .insert({ ...profile, user_id: user!.id } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["smart-match-profile"] }),
  });
}

export function useSmartMatches() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["smart-matches", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_smart_matches", {
        requesting_user_id: user!.id,
      });
      if (error) throw error;
      return (data ?? []) as unknown as SmartMatch[];
    },
    enabled: !!user,
  });
}
