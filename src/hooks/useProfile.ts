import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Profile {
  id: string;
  user_id: string;
  ms_type: string | null;
  year_diagnosed: string | null;
  diagnosis_date: string | null;
  age_range: string | null;
  symptoms: string[];
  goals: string[];
  medications: string[];
  neurologist_email: string | null;
  neurologist_name: string | null;
  neurologist_phone: string | null;
  weekly_digest_enabled: boolean;
  weekly_log_goal: number;
  last_report_sent_at: string | null;
  last_digest_sent_at: string | null;
  hydration_goal: number;
  sleep_goal: number;
  avatar_url: string | null;
  display_name: string | null;
  country: string | null;
  city: string | null;
  onboarding_completed: boolean;
  streak_freeze_enabled: boolean;
  cog_streak_freeze_enabled: boolean;
  allow_dms: boolean;
  ai_memory_enabled: boolean;
  is_premium: boolean;
  premium_until: string | null;
  premium_started_at: string | null;
  monthly_reports_used: number;
  monthly_reports_reset_at: string | null;
  grounding_weekly_goal: number;
  hydration_reminder_hour: number;
  pinned_metrics: string[];
  excluded_ingredients: string[];
}

export const useProfile = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data as Profile;
    },
    enabled: !!user,
  });
};

export const useUpdateProfile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: Partial<Omit<Profile, "id" | "user_id">>) => {
      const { data, error } = await supabase
        .from("profiles")
        .update(profile as any)
        .eq("user_id", user!.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
};
