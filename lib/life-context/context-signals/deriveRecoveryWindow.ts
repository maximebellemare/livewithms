import { LIFE_CONTEXT_DEFAULTS } from "../constants";
import type { LongitudinalEntry } from "../../longitudinal/types";
import type { DisruptionContext, RecoveryWindow, StressContext } from "../types";

function average(values: Array<number | null | undefined>) {
  const filtered = values.filter((value): value is number => typeof value === "number");
  if (filtered.length === 0) {
    return null;
  }

  return filtered.reduce((sum, value) => sum + value, 0) / filtered.length;
}

export function deriveRecoveryWindow(
  entries: LongitudinalEntry[],
  stressContext: StressContext,
  disruptionContext: DisruptionContext,
): RecoveryWindow {
  if (entries.length < 3) {
    return { active: false, strength: "none", summary: null, suggestedPacing: "steady" };
  }

  const recent = entries.slice(0, 5);
  const sleepAverage = average(recent.map((entry) => entry.sleep_hours));
  const fatigueAverage = average(recent.map((entry) => entry.fatigue));

  if (
    disruptionContext.kind !== "stable" ||
    stressContext.level !== "steady" ||
    (sleepAverage != null && sleepAverage < LIFE_CONTEXT_DEFAULTS.recoverySleepAverage) ||
    (fatigueAverage != null && fatigueAverage >= LIFE_CONTEXT_DEFAULTS.highFatigueAverage)
  ) {
    return {
      active: true,
      strength: "light",
      summary: "This may be more of a recovery window than a push-through stretch.",
      suggestedPacing: "lighter",
    };
  }

  return { active: false, strength: "none", summary: null, suggestedPacing: "steady" };
}

