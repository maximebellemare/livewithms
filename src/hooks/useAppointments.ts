import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface DbAppointment {
  id: string;
  user_id: string;
  title: string;
  type: string;
  date: string;
  time: string | null;
  location: string | null;
  notes: string | null;
  reminder: string;
  recurrence: string;
  recurrence_parent_id: string | null;
  checklist: { text: string; checked: boolean }[];
  created_at: string;
  updated_at: string;
}

export const useDbAppointments = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["appointments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .order("date", { ascending: true });
      if (error) throw error;
      return (data as unknown as DbAppointment[]);
    },
    enabled: !!user,
  });
};

export const useSaveAppointment = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appt: Partial<DbAppointment> & { title: string; date: string }) => {
      if (appt.id) {
        const { data, error } = await supabase
          .from("appointments")
          .update({
            title: appt.title,
            type: appt.type || "custom",
            date: appt.date,
            time: appt.time,
            location: appt.location,
            notes: appt.notes,
            reminder: appt.reminder || "none",
            recurrence: appt.recurrence || "none",
            checklist: appt.checklist || [],
          })
          .eq("id", appt.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("appointments")
          .insert({
            user_id: user!.id,
            title: appt.title,
            type: appt.type || "custom",
            date: appt.date,
            time: appt.time,
            location: appt.location,
            notes: appt.notes,
            reminder: appt.reminder || "none",
            recurrence: appt.recurrence || "none",
            checklist: appt.checklist || [],
          })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
};

export const useDeleteAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("appointments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
};
