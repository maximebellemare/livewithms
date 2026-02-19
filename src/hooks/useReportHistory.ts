import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface ReportHistoryEntry {
  id: string;
  user_id: string;
  sent_at: string;
  start_date: string;
  end_date: string;
  recipient_email: string;
  recipient_name: string | null;
  file_name: string | null;
  created_at: string;
}

export const useReportHistory = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["report_history", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("report_history" as any)
        .select("*")
        .eq("user_id", user!.id)
        .order("sent_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as unknown as ReportHistoryEntry[];
    },
    enabled: !!user,
  });
};

export const useAddReportHistory = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entry: Omit<ReportHistoryEntry, "id" | "user_id" | "created_at" | "sent_at">) => {
      const { data, error } = await supabase
        .from("report_history" as any)
        .insert({ ...entry, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["report_history"] });
    },
  });
};

export const useDeleteReportHistory = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("report_history" as any)
        .delete()
        .eq("id", id)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["report_history"] });
    },
  });
};
