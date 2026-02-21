import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { format } from "date-fns";

// ── Exercise ──
export interface ExerciseLog {
  id: string; user_id: string; date: string; type: string;
  duration_minutes: number; intensity: string; notes: string | null; created_at: string;
}

export function useExerciseLogs(startDate?: string, endDate?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["exercise-logs", user?.id, startDate, endDate],
    queryFn: async () => {
      let q = supabase.from("exercise_logs" as any).select("*").eq("user_id", user!.id).order("date", { ascending: false });
      if (startDate) q = q.gte("date", startDate);
      if (endDate) q = q.lte("date", endDate);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as ExerciseLog[];
    },
    enabled: !!user,
  });
}

export function useAddExercise() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (log: Omit<ExerciseLog, "id" | "user_id" | "created_at">) => {
      const { error } = await supabase.from("exercise_logs" as any).insert({ ...log, user_id: user!.id } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exercise-logs"] }),
  });
}

export function useDeleteExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("exercise_logs" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exercise-logs"] }),
  });
}

// ── Supplements ──
export interface SupplementLog {
  id: string; user_id: string; date: string; name: string; taken: boolean; created_at: string;
}

export function useSupplementLogs(date?: string) {
  const { user } = useAuth();
  const d = date ?? format(new Date(), "yyyy-MM-dd");
  return useQuery({
    queryKey: ["supplement-logs", user?.id, d],
    queryFn: async () => {
      const { data, error } = await supabase.from("supplement_logs" as any).select("*").eq("user_id", user!.id).eq("date", d);
      if (error) throw error;
      return (data ?? []) as unknown as SupplementLog[];
    },
    enabled: !!user,
  });
}

export function useAddSupplement() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ date, name, taken }: { date: string; name: string; taken: boolean }) => {
      const { error } = await supabase.from("supplement_logs" as any).insert({ user_id: user!.id, date, name, taken } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["supplement-logs"] }),
  });
}

export function useToggleSupplement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, taken }: { id: string; taken: boolean }) => {
      const { error } = await supabase.from("supplement_logs" as any).update({ taken } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["supplement-logs"] }),
  });
}

// ── Diet Goals ──
export interface DietGoal {
  id: string; user_id: string; name: string; target: string | null; active: boolean; created_at: string;
}

export interface DietGoalLog {
  id: string; user_id: string; goal_id: string; date: string; completed: boolean;
}

export function useDietGoals() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["diet-goals", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("diet_goals" as any).select("*").eq("user_id", user!.id).eq("active", true).order("created_at");
      if (error) throw error;
      return (data ?? []) as unknown as DietGoal[];
    },
    enabled: !!user,
  });
}

export function useAddDietGoal() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, target }: { name: string; target?: string }) => {
      const { error } = await supabase.from("diet_goals" as any).insert({ user_id: user!.id, name, target: target || null } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["diet-goals"] }),
  });
}

export function useDeleteDietGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("diet_goals" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["diet-goals"] }),
  });
}

export function useDietGoalLogs(date?: string) {
  const { user } = useAuth();
  const d = date ?? format(new Date(), "yyyy-MM-dd");
  return useQuery({
    queryKey: ["diet-goal-logs", user?.id, d],
    queryFn: async () => {
      const { data, error } = await supabase.from("diet_goal_logs" as any).select("*").eq("user_id", user!.id).eq("date", d);
      if (error) throw error;
      return (data ?? []) as unknown as DietGoalLog[];
    },
    enabled: !!user,
  });
}

export function useToggleDietGoalLog() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ goal_id, date, completed }: { goal_id: string; date: string; completed: boolean }) => {
      const { data: existing } = await supabase.from("diet_goal_logs" as any).select("id").eq("goal_id", goal_id).eq("date", date).maybeSingle();
      if ((existing as any)?.id) {
        const { error } = await supabase.from("diet_goal_logs" as any).update({ completed } as any).eq("id", (existing as any).id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("diet_goal_logs" as any).insert({ user_id: user!.id, goal_id, date, completed } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["diet-goal-logs"] }),
  });
}

// ── Weight ──
export interface WeightLog {
  id: string; user_id: string; date: string; weight: number; unit: string; created_at: string;
}

export function useWeightLogs(days = 30) {
  const { user } = useAuth();
  const start = format(new Date(Date.now() - (days - 1) * 86400000), "yyyy-MM-dd");
  return useQuery({
    queryKey: ["weight-logs", user?.id, start],
    queryFn: async () => {
      const { data, error } = await supabase.from("weight_logs" as any).select("*").eq("user_id", user!.id).gte("date", start).order("date", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as WeightLog[];
    },
    enabled: !!user,
  });
}

export function useAddWeight() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ date, weight, unit }: { date: string; weight: number; unit: string }) => {
      const { error } = await supabase.from("weight_logs" as any).upsert({ user_id: user!.id, date, weight, unit } as any, { onConflict: "user_id,date" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["weight-logs"] }),
  });
}
