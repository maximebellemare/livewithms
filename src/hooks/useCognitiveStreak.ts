import { useMemo } from "react";
import { useCognitiveSessions } from "./useCognitiveSessions";
import { format, subDays } from "date-fns";

/**
 * Computes the current consecutive-day streak of playing at least one cognitive game,
 * and the total number of unique days with sessions (lifetime).
 */
export function useCognitiveStreak() {
  const { data: sessions } = useCognitiveSessions(90);

  return useMemo(() => {
    if (!sessions || sessions.length === 0) return { streak: 0, totalDays: 0 };

    const daySet = new Set<string>();
    for (const s of sessions) {
      daySet.add(format(new Date(s.played_at), "yyyy-MM-dd"));
    }

    const totalDays = daySet.size;
    const today = format(new Date(), "yyyy-MM-dd");
    const playedToday = daySet.has(today);

    let streak = 0;
    let cursor = playedToday ? 0 : 1;

    // If didn't play today and didn't play yesterday, streak is 0
    if (!playedToday && !daySet.has(format(subDays(new Date(), 1), "yyyy-MM-dd"))) {
      return { streak: 0, totalDays };
    }

    while (true) {
      const dateStr = format(subDays(new Date(), cursor), "yyyy-MM-dd");
      if (daySet.has(dateStr)) {
        streak++;
        cursor++;
      } else {
        break;
      }
    }

    return { streak, totalDays };
  }, [sessions]);
}
