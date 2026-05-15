import { LIFE_CONTEXT_DEFAULTS } from "../constants";
import type { LongitudinalEntry } from "../../longitudinal/types";
import type { OverloadPeriod, StressContext } from "../types";

function average(values: Array<number | null | undefined>) {
  const filtered = values.filter((value): value is number => typeof value === "number");
  if (filtered.length === 0) {
    return null;
  }

  return filtered.reduce((sum, value) => sum + value, 0) / filtered.length;
}

export function deriveOverloadPeriods(entries: LongitudinalEntry[], stressContext: StressContext): OverloadPeriod {
  if (entries.length < 4) {
    return { active: false, strength: "none", summary: null };
  }

  const recent = entries.slice(0, 5);
  const stressAverage = average(recent.map((entry) => entry.stress));
  const sleepAverage = average(recent.map((entry) => entry.sleep_hours));
  const fatigueAverage = average(recent.map((entry) => entry.fatigue));

  if (
    stressContext.level !== "steady" &&
    (stressAverage ?? 0) >= LIFE_CONTEXT_DEFAULTS.overloadStressAverage &&
    (sleepAverage ?? 99) <= LIFE_CONTEXT_DEFAULTS.overloadSleepAverage &&
    (fatigueAverage ?? 0) >= LIFE_CONTEXT_DEFAULTS.overloadFatigueAverage
  ) {
    return {
      active: true,
      strength: "moderate",
      summary: "There seems to be a heavier stretch where stress, sleep, and energy may all be pulling in the same direction.",
    };
  }

  return { active: false, strength: "none", summary: null };
}

