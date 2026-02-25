import { useMemo } from "react";
import { differenceInDays, parseISO } from "date-fns";
import { useRelapses } from "@/hooks/useRelapses";

/** Days since the last relapse ended (or started, if no end date). Returns 0 if no relapses recorded. */
export function useRelapseFreeStreak() {
  const { data: relapses = [] } = useRelapses();

  return useMemo(() => {
    if (relapses.length === 0) return 0;

    // For each relapse, use end_date if available, otherwise fall back to start_date
    const latestDate = relapses
      .map((r) => parseISO(r.end_date ?? r.start_date))
      .sort((a, b) => b.getTime() - a.getTime())[0];

    return Math.max(0, differenceInDays(new Date(), latestDate));
  }, [relapses]);
}
