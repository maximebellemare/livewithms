import { useMemo } from "react";
import { differenceInDays, parseISO } from "date-fns";
import { useRelapses } from "@/hooks/useRelapses";

/** Days since last resolved relapse. Returns 0 if an ongoing relapse exists or no relapses recorded. */
export function useRelapseFreeStreak() {
  const { data: relapses = [] } = useRelapses();

  return useMemo(() => {
    if (relapses.length === 0) return 0;
    const ongoing = relapses.some((r) => !r.is_recovered);
    if (ongoing) return 0;
    const resolved = relapses.filter((r) => r.is_recovered && r.end_date);
    if (resolved.length === 0) return 0;
    const lastEnd = resolved
      .map((r) => parseISO(r.end_date!))
      .sort((a, b) => b.getTime() - a.getTime())[0];
    return differenceInDays(new Date(), lastEnd);
  }, [relapses]);
}
