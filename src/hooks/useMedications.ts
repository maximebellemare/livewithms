import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface DbMedication {
  id: string;
  user_id: string;
  name: string;
  dosage: string | null;
  schedule_type: string;
  times_per_day: number | null;
  infusion_interval_months: number | null;
  active: boolean;
  color: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbMedicationLog {
  id: string;
  user_id: string;
  medication_id: string;
  date: string;
  status: string;
  time: string | null;
  created_at: string;
}

export const useDbMedications = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["medications", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("medications")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as DbMedication[];
    },
    enabled: !!user,
  });
};

export const useSaveMedication = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (med: Partial<DbMedication> & { name: string }) => {
      if (med.id) {
        const { data, error } = await supabase
          .from("medications")
          .update({
            name: med.name,
            dosage: med.dosage,
            schedule_type: med.schedule_type || "daily",
            times_per_day: med.times_per_day,
            infusion_interval_months: med.infusion_interval_months,
            active: med.active ?? true,
            color: med.color,
          })
          .eq("id", med.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("medications")
          .insert({
            user_id: user!.id,
            name: med.name,
            dosage: med.dosage,
            schedule_type: med.schedule_type || "daily",
            times_per_day: med.times_per_day,
            infusion_interval_months: med.infusion_interval_months,
            active: med.active ?? true,
            color: med.color,
          })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medications"] });
    },
  });
};

export const useDeleteMedication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("medications").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medications"] });
    },
  });
};

export const useDbMedicationLogs = (startDate?: string, endDate?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["medication_logs", user?.id, startDate, endDate],
    queryFn: async () => {
      let query = supabase.from("medication_logs").select("*");
      if (startDate) query = query.gte("date", startDate);
      if (endDate) query = query.lte("date", endDate);
      const { data, error } = await query.order("date", { ascending: false });
      if (error) throw error;
      return data as DbMedicationLog[];
    },
    enabled: !!user,
  });
};

export const useLogMedication = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (log: { medication_id: string; date: string; status: string; time?: string }) => {
      // Upsert by deleting existing and inserting new
      await supabase
        .from("medication_logs")
        .delete()
        .eq("medication_id", log.medication_id)
        .eq("date", log.date)
        .eq("user_id", user!.id);

      const { data, error } = await supabase
        .from("medication_logs")
        .insert({ ...log, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medication_logs"] });
    },
  });
};
