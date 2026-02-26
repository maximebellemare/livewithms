import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface MealLog {
  id: string;
  user_id: string;
  date: string;
  meal_type: string;
  name: string;
  notes: string | null;
  created_at: string;
}

export function useMealLogs(days = 7) {
  const { user } = useAuth();
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString().slice(0, 10);

  return useQuery({
    queryKey: ["meal-logs", user?.id, days],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meal_logs" as any)
        .select("*")
        .eq("user_id", user!.id)
        .gte("date", sinceStr)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as MealLog[];
    },
    enabled: !!user,
  });
}

export function useAddMealLog() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (log: { date: string; meal_type: string; name: string; notes?: string | null }) => {
      const { error } = await supabase
        .from("meal_logs" as any)
        .insert({ ...log, user_id: user!.id } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meal-logs"] }),
  });
}

export function useDeleteMealLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("meal_logs" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meal-logs"] }),
  });
}
