import { useMemo } from "react";
import { format, startOfWeek, subWeeks } from "date-fns";
import { useEntries } from "@/hooks/useEntries";
import { useProfile } from "@/hooks/useProfile";

/**
 * Returns the number of consecutive weeks (including the current week)
 * in which the user met their weekly_log_goal.
 */
export const useWeekStreak = () => {
  const { data: allEntries = [], isLoading: entriesLoading } = useEntries();
  const { data: profile, isLoading: profileLoading } = useProfile();

  const weekStreak = useMemo(() => {
    if (!profile || allEntries.length === 0) return 0;
    const goal = profile.weekly_log_goal ?? 7;

    // Group entries by their Monday
    const weekCounts = new Map<string, number>();
    for (const entry of allEntries) {
      const d = new Date(entry.date + "T00:00:00");
      const day = d.getDay();
      d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
      const key = format(d, "yyyy-MM-dd");
      weekCounts.set(key, (weekCounts.get(key) ?? 0) + 1);
    }

    // Walk backwards from the current week
    let streak = 0;
    let cursor = startOfWeek(new Date(), { weekStartsOn: 1 });
    for (let i = 0; i < 52; i++) {
      const key = format(cursor, "yyyy-MM-dd");
      if ((weekCounts.get(key) ?? 0) >= goal) {
        streak++;
        cursor = subWeeks(cursor, 1);
      } else {
        break;
      }
    }
    return streak;
  }, [allEntries, profile]);

  return { weekStreak, goal: profile?.weekly_log_goal ?? 7, isLoading: entriesLoading || profileLoading };
};
