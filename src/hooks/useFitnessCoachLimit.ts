import { useState, useCallback } from "react";
import { usePremiumAccess } from "./usePremiumAccess";

const FREE_DAILY_LIMIT = 2;
const STORAGE_KEY = "fitness_coach_usage";

interface DailyUsage {
  date: string;
  count: number;
  limitTriggered: boolean;
}

function getTodayUsage(): DailyUsage {
  const today = new Date().toISOString().split("T")[0];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DailyUsage;
      if (parsed.date === today) return parsed;
    }
  } catch {}
  return { date: today, count: 0, limitTriggered: false };
}

function saveUsage(usage: DailyUsage) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
}

export function useFitnessCoachLimit() {
  const { hasPremiumAccess, isLoading } = usePremiumAccess();
  const [usage, setUsage] = useState<DailyUsage>(getTodayUsage);

  const limitReached = !hasPremiumAccess && usage.count >= FREE_DAILY_LIMIT;
  const remaining = hasPremiumAccess ? Infinity : Math.max(0, FREE_DAILY_LIMIT - usage.count);

  const recordMessage = useCallback(() => {
    if (hasPremiumAccess) return false;
    const current = getTodayUsage();
    const next: DailyUsage = {
      ...current,
      count: current.count + 1,
      limitTriggered: current.count + 1 >= FREE_DAILY_LIMIT,
    };
    saveUsage(next);
    setUsage(next);
    return next.limitTriggered;
  }, [hasPremiumAccess]);

  return {
    todayCount: usage.count,
    limitReached,
    remaining,
    limit: FREE_DAILY_LIMIT,
    isPremium: hasPremiumAccess,
    isLoading,
    recordMessage,
  };
}
