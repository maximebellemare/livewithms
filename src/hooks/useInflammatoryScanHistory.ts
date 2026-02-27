import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface InflammatoryScan {
  id: string;
  user_id: string;
  meal_name: string;
  overall_score: string;
  overall_label: string;
  summary: string | null;
  flags: any[];
  positives: any[];
  scanned_at: string;
}

export function useInflammatoryScanHistory(limit = 20) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["inflammatory-scans", user?.id, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inflammatory_scans" as any)
        .select("*")
        .eq("user_id", user!.id)
        .order("scanned_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as unknown as InflammatoryScan[];
    },
    enabled: !!user,
  });
}

export function useSaveInflammatoryScan() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (scan: {
      meal_name: string;
      overall_score: string;
      overall_label: string;
      summary: string | null;
      flags: any[];
      positives: any[];
    }) => {
      const { error } = await supabase
        .from("inflammatory_scans" as any)
        .insert({ ...scan, user_id: user!.id } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inflammatory-scans"] }),
  });
}

export function useDeleteInflammatoryScan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("inflammatory_scans" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inflammatory-scans"] }),
  });
}

/** Get a map of meal_name → overall_score for badge display */
export function useMealScanScores() {
  const { data: scans = [] } = useInflammatoryScanHistory(100);
  const scoreMap = new Map<string, string>();
  // Latest scan per meal name wins
  for (const s of scans) {
    const key = s.meal_name.toLowerCase();
    if (!scoreMap.has(key)) scoreMap.set(key, s.overall_score);
  }
  return scoreMap;
}
