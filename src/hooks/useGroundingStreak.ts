import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useGroundingStreak = () => {
  const { user } = useAuth();

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["grounding-streak-dates", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("grounding_sessions")
        .select("completed_at")
        .eq("user_id", user!.id)
        .order("completed_at", { ascending: false });
      return data ?? [];
    },
  });

  const result = useMemo(() => {
    if (sessions.length === 0) return { streak: 0, isAliveToday: false, totalSessions: 0 };

    const daysWithSessions = new Set(
      sessions.map((s) => format(new Date(s.completed_at), "yyyy-MM-dd"))
    );

    const today = format(new Date(), "yyyy-MM-dd");
    const todayDone = daysWithSessions.has(today);

    let count = todayDone ? 1 : 0;
    let cursor = todayDone ? 1 : 1;

    while (true) {
      const dateStr = format(subDays(new Date(), cursor), "yyyy-MM-dd");
      if (daysWithSessions.has(dateStr)) {
        count++;
        cursor++;
      } else {
        break;
      }
    }

    return { streak: count, isAliveToday: todayDone, totalSessions: sessions.length };
  }, [sessions]);

  return { ...result, isLoading };
};
