import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { format } from "date-fns";

export interface EnergyBudget {
  id: string;
  user_id: string;
  date: string;
  total_spoons: number;
  created_at: string;
  updated_at: string;
}

export interface EnergyActivity {
  id: string;
  budget_id: string;
  user_id: string;
  name: string;
  spoon_cost: number;
  completed: boolean;
  sort_order: number;
  created_at: string;
}

export function useTodayBudget() {
  const { user } = useAuth();
  const today = format(new Date(), "yyyy-MM-dd");

  return useQuery({
    queryKey: ["energy-budget", user?.id, today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("energy_budgets" as any)
        .select("*")
        .eq("user_id", user!.id)
        .eq("date", today)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as EnergyBudget | null;
    },
    enabled: !!user,
  });
}

export function useBudgetActivities(budgetId: string | undefined) {
  return useQuery({
    queryKey: ["energy-activities", budgetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("energy_activities" as any)
        .select("*")
        .eq("budget_id", budgetId!)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as EnergyActivity[];
    },
    enabled: !!budgetId,
  });
}

export function useCreateBudget() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ date, total_spoons }: { date: string; total_spoons: number }) => {
      const { data, error } = await supabase
        .from("energy_budgets" as any)
        .insert({ user_id: user!.id, date, total_spoons } as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as EnergyBudget;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["energy-budget"] }),
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, total_spoons }: { id: string; total_spoons: number }) => {
      const { error } = await supabase
        .from("energy_budgets" as any)
        .update({ total_spoons } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["energy-budget"] }),
  });
}

export function useAddActivity() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ budget_id, name, spoon_cost }: { budget_id: string; name: string; spoon_cost: number }) => {
      const { data, error } = await supabase
        .from("energy_activities" as any)
        .insert({ budget_id, user_id: user!.id, name, spoon_cost } as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as EnergyActivity;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["energy-activities"] }),
  });
}

export function useToggleActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { error } = await supabase
        .from("energy_activities" as any)
        .update({ completed } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["energy-activities"] }),
  });
}

export function useDeleteActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("energy_activities" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["energy-activities"] }),
  });
}

export function useUpdateActivityCost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, spoon_cost }: { id: string; spoon_cost: number }) => {
      const { error } = await supabase
        .from("energy_activities" as any)
        .update({ spoon_cost } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["energy-activities"] }),
  });
}

export function useEnergyHistory(days = 7) {
  const { user } = useAuth();
  const end = format(new Date(), "yyyy-MM-dd");
  const start = format(new Date(Date.now() - (days - 1) * 86400000), "yyyy-MM-dd");

  return useQuery({
    queryKey: ["energy-history", user?.id, start, end],
    queryFn: async () => {
      const { data: budgets, error: bErr } = await supabase
        .from("energy_budgets" as any)
        .select("*")
        .eq("user_id", user!.id)
        .gte("date", start)
        .lte("date", end)
        .order("date", { ascending: true });
      if (bErr) throw bErr;

      const budgetIds = (budgets ?? []).map((b: any) => b.id);
      let activities: EnergyActivity[] = [];
      if (budgetIds.length > 0) {
        const { data: acts, error: aErr } = await supabase
          .from("energy_activities" as any)
          .select("*")
          .in("budget_id", budgetIds);
        if (aErr) throw aErr;
        activities = (acts ?? []) as unknown as EnergyActivity[];
      }

      return (budgets ?? []).map((b: any) => {
        const acts = activities.filter((a) => a.budget_id === b.id);
        const used = acts.filter((a) => a.completed).reduce((s, a) => s + a.spoon_cost, 0);
        return { ...b, activities: acts, used, remaining: b.total_spoons - used };
      });
    },
    enabled: !!user,
  });
}

/** Returns the user's most frequently added activities (name + average cost), sorted by frequency */
export function useFrequentActivities(limit = 6) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["energy-frequent-activities", user?.id],
    queryFn: async () => {
      // Fetch all activities for this user from the last 30 days
      const cutoff = format(new Date(Date.now() - 30 * 86400000), "yyyy-MM-dd");
      const { data: budgets, error: bErr } = await supabase
        .from("energy_budgets" as any)
        .select("id")
        .eq("user_id", user!.id)
        .gte("date", cutoff);
      if (bErr) throw bErr;

      const budgetIds = (budgets ?? []).map((b: any) => b.id);
      if (budgetIds.length === 0) return [];

      const { data: acts, error: aErr } = await supabase
        .from("energy_activities" as any)
        .select("name, spoon_cost")
        .in("budget_id", budgetIds);
      if (aErr) throw aErr;

      // Aggregate by name
      const map = new Map<string, { count: number; totalCost: number }>();
      for (const a of (acts ?? []) as any[]) {
        const key = a.name.toLowerCase().trim();
        const existing = map.get(key) || { count: 0, totalCost: 0 };
        map.set(key, { count: existing.count + 1, totalCost: existing.totalCost + a.spoon_cost });
      }

      return Array.from(map.entries())
        .map(([name, { count, totalCost }]) => ({
          name: (acts as any[])!.find((a: any) => a.name.toLowerCase().trim() === name)?.name ?? name,
          cost: Math.round(totalCost / count),
          count,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}
