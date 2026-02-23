import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface RiskScore {
  id: string;
  week_start: string;
  week_end: string;
  score: number;
  level: "low" | "moderate" | "elevated" | "high";
  factors: string[];
  created_at: string;
}

export const useRiskScores = (weeks = 12) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["risk_scores", user?.id, weeks],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("risk_scores")
        .select("*")
        .order("week_start", { ascending: true })
        .limit(weeks);
      if (error) throw error;
      return (data ?? []) as RiskScore[];
    },
    enabled: !!user,
  });
};
