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
      summary: "Short stretches can look more changeable than they really are.",
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
      summary: "Some periods naturally feel more variable, and short stretches do not always point to a larger change.",
    };
  }

  if (composite >= UNCERTAINTY_SAFETY_DEFAULTS.variabilityDeltaThreshold) {
    return {
      level: "moderate",
      summary: "Energy, mood, and clarity can shift from day to day without forming a single clear pattern.",
    };
  }

  return {
    level: "low",
    summary: "A steadier stretch can still include fluctuation from one day to the next.",
  };
}

