import { useMemo } from "react";
import { useCognitiveSessions } from "./useCognitiveSessions";
import { useProfile } from "./useProfile";
import { format, subDays, startOfWeek } from "date-fns";

/**
 * Computes the current consecutive-day streak of playing at least one cognitive game,
 * the total number of unique days with sessions (lifetime),
 * and streak freeze status (mirrors daily logging streak freeze).
 */
export function useCognitiveStreak() {
  const { data: sessions } = useCognitiveSessions(90);
  const { data: profile } = useProfile();

  return useMemo(() => {
    if (!sessions || sessions.length === 0) return { streak: 0, totalDays: 0, frozeToday: false, freezesRemaining: 0 };

    // Unique days with at least one session
    const daySet = new Set<string>();
    for (const s of sessions) {
      daySet.add(format(new Date(s.played_at), "yyyy-MM-dd"));
    }

    const totalDays = daySet.size;
    const today = format(new Date(), "yyyy-MM-dd");
    const playedToday = daySet.has(today);
    const freezeEnabled = profile?.cog_streak_freeze_enabled ?? false;

    let streak = 0;
    let cursor = playedToday ? 0 : 1;
    let freezeUsedThisWeek = false;
    let frozeToday = false;

    // If didn't play today and didn't play yesterday (and no freeze possible), streak is 0
    if (!playedToday && !daySet.has(format(subDays(new Date(), 1), "yyyy-MM-dd")) && !freezeEnabled) {
      return { streak: 0, totalDays, frozeToday: false, freezesRemaining: 0 };
    }

    while (true) {
      const dateStr = format(subDays(new Date(), cursor), "yyyy-MM-dd");
      if (daySet.has(dateStr)) {
        streak++;
        cursor++;
      } else if (freezeEnabled) {
        const missedDate = subDays(new Date(), cursor);
        const weekKey = format(startOfWeek(missedDate, { weekStartsOn: 1 }), "yyyy-MM-dd");
        const currentWeekKey = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");

        if (weekKey !== currentWeekKey) freezeUsedThisWeek = false;

        if (!freezeUsedThisWeek) {
          const dayBefore = format(subDays(new Date(), cursor + 1), "yyyy-MM-dd");
          if (daySet.has(dayBefore)) {
            freezeUsedThisWeek = true;
            if (cursor === 1 && !playedToday) frozeToday = true;
            cursor++;
            continue;
          }
        }
        break;
      } else {
        break;
      }
    }

    const freezesRemaining = freezeEnabled ? (freezeUsedThisWeek ? 0 : 1) : 0;

    return { streak, totalDays, frozeToday, freezesRemaining };
  }, [sessions, profile]);
}
