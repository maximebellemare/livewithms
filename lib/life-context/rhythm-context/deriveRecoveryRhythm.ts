import { LIFE_CONTEXT_DEFAULTS } from "../constants";
import type { LongitudinalEntry } from "../../longitudinal/types";
import type { RecoveryRhythm } from "../types";

function average(values: Array<number | null | undefined>) {
  const filtered = values.filter((value): value is number => typeof value === "number");
  if (filtered.length === 0) {
    return null;
  }

  return filtered.reduce((sum, value) => sum + value, 0) / filtered.length;
}

export function deriveRecoveryRhythm(entries: LongitudinalEntry[]): RecoveryRhythm {
  if (entries.length < 3) {
    return { pace: "steady", summary: null };
  }

  const recent = entries.slice(0, 5);
  const sleepAverage = average(recent.map((entry) => entry.sleep_hours));
  const stressAverage = average(recent.map((entry) => entry.stress));

  if ((sleepAverage ?? 0) >= LIFE_CONTEXT_DEFAULTS.recoverySleepAverage && (stressAverage ?? 99) <= LIFE_CONTEXT_DEFAULTS.recoveryStressAverage) {
    return {
      pace: "steady",
      summary: "Some recent days suggest your recovery rhythm may be a little steadier right now.",
    };
  }

  if ((sleepAverage ?? 99) < LIFE_CONTEXT_DEFAULTS.recoverySleepAverage) {
    return {
      pace: "slower",
      summary: "Recovery may be taking a little more time lately, which can make a softer pace feel more realistic.",
    };
  }

  return { pace: "rebuilding", summary: "Your recovery rhythm may still be rebuilding after a more demanding stretch." };
}

