import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface DailyEntry {
  id: string;
  date: string;
  fatigue: number | null;
  pain: number | null;
  brain_fog: number | null;
  mood: number | null;
  mobility: number | null;
  sleep_hours: number | null;
  notes: string | null;
  mood_tags: string[];
}

export const useEntries = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["entries", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_entries")
        .select("*")
        .order("date", { ascending: false });
      if (error) throw error;
      return data as DailyEntry[];
    },
    enabled: !!user,
  });
};

export const useEntriesInRange = (startDate: string, endDate: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["entries", user?.id, startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_entries")
        .select("*")
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: true });
      if (error) throw error;
      return data as DailyEntry[];
    },
    enabled: !!user,
  });
};

export const useSaveEntry = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entry: Omit<DailyEntry, "id">) => {
      const { data, error } = await supabase
        .from("daily_entries")
        .upsert(
          { ...entry, user_id: user!.id },
          { onConflict: "user_id,date" }
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries"] });
    },
  });
};
