import { UNCERTAINTY_SAFETY_DEFAULTS } from "../constants";
import type { LongitudinalEntry } from "../../longitudinal/types";
import type { VariabilityContext } from "../types";

function range(values: Array<number | null | undefined>) {
  const filtered = values.filter((value): value is number => typeof value === "number");
  if (filtered.length < 2) {
    return null;
  }

  return Math.max(...filtered) - Math.min(...filtered);
}

export function deriveVariabilityContext(entries: LongitudinalEntry[]): VariabilityContext {
  if (entries.length < UNCERTAINTY_SAFETY_DEFAULTS.sparseEntryCount) {
    return {
      level: "low",
      summary: "A few days of data may not reflect longer-term patterns yet.",
    };
  }

  const recent = entries.slice(0, 7);
  const fatigueRange = range(recent.map((entry) => entry.fatigue));
  const stressRange = range(recent.map((entry) => entry.stress));
  const moodRange = range(recent.map((entry) => entry.mood));
  const composite = Math.max(fatigueRange ?? 0, stressRange ?? 0, moodRange ?? 0);

  if (composite >= UNCERTAINTY_SAFETY_DEFAULTS.variabilityDeltaThreshold * 1.8) {
    return {
      level: "high",
      summary: "Short-term trends can fluctuate day to day.",
    };
  }

  if (composite >= UNCERTAINTY_SAFETY_DEFAULTS.variabilityDeltaThreshold) {
    return {
      level: "moderate",
      summary: "Recent entries are changing day to day, so this is not a clear pattern yet.",
    };
  }

  return {
    level: "low",
    summary: "This stretch looks fairly steady overall.",
  };
}
