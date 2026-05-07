import { useQuery } from "@tanstack/react-query";
import type { DailyCheckIn } from "../checkins/types";
import { insightsApi } from "./api";

export function usePatternSummary(entries: DailyCheckIn[], range = 7) {
  return useQuery({
    queryKey: [
      "pattern-summary",
      range,
      entries.map((entry) => `${entry.date}:${entry.updated_at}`).join("|"),
    ],
    queryFn: () => insightsApi.getPatternSummary(entries, range),
    enabled: entries.length > 0,
    retry: false,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}
