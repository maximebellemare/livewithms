import { LONGITUDINAL_DEFAULTS } from "../constants";
import type { AdaptiveStateSignal, LongitudinalEntry } from "../types";

function average(values: Array<number | null>) {
  const valid = values.filter((value): value is number => typeof value === "number");
  if (!valid.length) {
    return null;
  }

  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

export function deriveFatigueState(entries: LongitudinalEntry[]): AdaptiveStateSignal {
  const recentEntries = entries.slice(0, LONGITUDINAL_DEFAULTS.weeklyDays);
  const averageFatigue = average(recentEntries.map((entry) => entry.fatigue));
  const averageBrainFog = average(recentEntries.map((entry) => entry.brain_fog));
  const averageSleep = average(recentEntries.map((entry) => entry.sleep_hours));

  if (
    (averageFatigue !== null && averageFatigue >= LONGITUDINAL_DEFAULTS.elevatedFatigue) ||
    (averageBrainFog !== null && averageBrainFog >= LONGITUDINAL_DEFAULTS.elevatedBrainFog) ||
    (averageSleep !== null && averageSleep < LONGITUDINAL_DEFAULTS.lowSleep)
  ) {
    return "LOW_ENERGY";
  }

  return "STABLE";
}
