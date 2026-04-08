import { useMemo } from "react";
import { useCognitiveSessions } from "./useCognitiveSessions";
import { usePremiumAccess } from "./usePremiumAccess";
import { format } from "date-fns";

const FREE_DAILY_LIMIT = 3;

export function useDailyGameLimit() {
  const { hasPremiumAccess, isLoading: premiumLoading } = usePremiumAccess();
  const { data: sessions, isLoading: sessionsLoading } = useCognitiveSessions(1);

  const todayStr = format(new Date(), "yyyy-MM-dd");

  const todayCount = useMemo(() => {
    if (!sessions) return 0;
    return sessions.filter((s) => s.played_at.startsWith(todayStr)).length;
  }, [sessions, todayStr]);

  const limitReached = !hasPremiumAccess && todayCount >= FREE_DAILY_LIMIT;
  const remaining = hasPremiumAccess ? Infinity : Math.max(0, FREE_DAILY_LIMIT - todayCount);

  return {
    todayCount,
    limitReached,
    remaining,
    limit: FREE_DAILY_LIMIT,
    isPremium: hasPremiumAccess,
    isLoading: premiumLoading || sessionsLoading,
  };
}
