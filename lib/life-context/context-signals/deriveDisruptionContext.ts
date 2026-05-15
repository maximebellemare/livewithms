import { LIFE_CONTEXT_DEFAULTS } from "../constants";
import type { LongitudinalEntry } from "../../longitudinal/types";
import type { DisruptionContext } from "../types";

function daysBetween(left: string, right: string) {
  const leftMs = new Date(left).getTime();
  const rightMs = new Date(right).getTime();
  return Math.round(Math.abs(leftMs - rightMs) / (1000 * 60 * 60 * 24));
}

function hasTravelSignal(entries: LongitudinalEntry[]) {
  return entries.some((entry) => {
    const text = `${entry.notes ?? ""} ${entry.reflection_text ?? ""}`.toLowerCase();
    return text.includes("travel") || text.includes("trip") || text.includes("away");
  });
}

export function deriveDisruptionContext(entries: LongitudinalEntry[]): DisruptionContext {
  if (entries.length < 2) {
    return { kind: "stable", strength: "none", summary: null };
  }

  const recentEntries = entries.slice(0, 7);
  const latestGap = daysBetween(recentEntries[0].date, recentEntries[Math.min(1, recentEntries.length - 1)].date);

  if (hasTravelSignal(recentEntries)) {
    return {
      kind: "travel-like",
      strength: "light",
      summary: "Some recent notes suggest life may have felt a little more disrupted or away from your usual rhythm.",
    };
  }

  if (latestGap >= LIFE_CONTEXT_DEFAULTS.disruptionGapDays) {
    return {
      kind: "checkin-gap",
      strength: "light",
      summary: "There may have been a gap or interruption in routine recently, which can change how patterns feel.",
    };
  }

  const shiftingHours = recentEntries.filter((entry) => typeof entry.hour_of_day === "number").map((entry) => entry.hour_of_day as number);
  if (shiftingHours.length >= 3 && Math.max(...shiftingHours) - Math.min(...shiftingHours) >= 8) {
    return {
      kind: "routine-shift",
      strength: "light",
      summary: "Your recent check-ins seem to be landing at more varied times, which may reflect a changing routine.",
    };
  }

  return { kind: "stable", strength: "none", summary: null };
}

