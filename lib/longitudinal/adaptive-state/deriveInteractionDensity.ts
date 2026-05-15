import { LONGITUDINAL_DEFAULTS } from "../constants";
import type { AdaptiveStateSignal, LongitudinalEntry } from "../types";

export function deriveInteractionDensity(entries: LongitudinalEntry[]): AdaptiveStateSignal {
  const recentEntries = entries.slice(0, LONGITUDINAL_DEFAULTS.weeklyDays);

  if (recentEntries.length <= 1) {
    return "WITHDRAWN";
  }

  const averageInteractions =
    recentEntries.reduce((sum, entry) => sum + (entry.interaction_count ?? 1), 0) / recentEntries.length;

  if (averageInteractions < 0.75) {
    return "WITHDRAWN";
  }

  const reflectionCount = recentEntries.filter((entry) => (entry.notes ?? entry.reflection_text ?? "").trim().length > 0).length;
  if (reflectionCount >= 2) {
    return "REFLECTIVE";
  }

  return "STABLE";
}
