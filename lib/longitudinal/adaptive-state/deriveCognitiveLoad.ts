import { LONGITUDINAL_DEFAULTS } from "../constants";
import type { AdaptiveStateSignal, LongitudinalEntry } from "../types";

function average(values: Array<number | null>) {
  const valid = values.filter((value): value is number => typeof value === "number");
  if (!valid.length) {
    return null;
  }

  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

export function deriveCognitiveLoad(entries: LongitudinalEntry[]): AdaptiveStateSignal {
  const recentEntries = entries.slice(0, LONGITUDINAL_DEFAULTS.weeklyDays);
  const averageStress = average(recentEntries.map((entry) => entry.stress));
  const averageBrainFog = average(recentEntries.map((entry) => entry.brain_fog));
  const reflectionDensity = recentEntries.filter((entry) => (entry.notes ?? entry.reflection_text ?? "").trim().length > 0).length;

  if (
    (averageStress !== null && averageStress >= LONGITUDINAL_DEFAULTS.elevatedStress) ||
    (averageBrainFog !== null && averageBrainFog >= LONGITUDINAL_DEFAULTS.elevatedBrainFog)
  ) {
    return "OVERWHELMED";
  }

  if (reflectionDensity >= 2) {
    return "REFLECTIVE";
  }

  return "STABLE";
}
