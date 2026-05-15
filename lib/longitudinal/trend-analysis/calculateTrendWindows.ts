import { LONGITUDINAL_DEFAULTS } from "../constants";
import type { LongitudinalEntry, TrendWindow } from "../types";

function buildWindow(key: TrendWindow["key"], label: string, entries: LongitudinalEntry[], daysCovered: number): TrendWindow {
  const recentEntries = entries.slice(0, daysCovered);
  return {
    key,
    label,
    startDate: recentEntries[recentEntries.length - 1]?.date ?? null,
    endDate: recentEntries[0]?.date ?? null,
    daysCovered,
    daysLogged: recentEntries.length,
    entries: recentEntries,
  };
}

export function calculateTrendWindows(entries: LongitudinalEntry[]) {
  return {
    weekly: buildWindow("weekly", "Past 7 days", entries, LONGITUDINAL_DEFAULTS.weeklyDays),
    monthly: buildWindow("monthly", "Past 30 days", entries, LONGITUDINAL_DEFAULTS.monthlyDays),
    rolling: buildWindow("rolling", "Rolling view", entries, Math.min(entries.length, LONGITUDINAL_DEFAULTS.monthlyDays)),
  };
}
