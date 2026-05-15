import { LIFE_CONTEXT_DEFAULTS } from "../constants";
import type { LongitudinalEntry } from "../../longitudinal/types";
import type { StressContext } from "../types";

function average(values: Array<number | null | undefined>) {
  const filtered = values.filter((value): value is number => typeof value === "number");
  if (filtered.length === 0) {
    return null;
  }

  return filtered.reduce((sum, value) => sum + value, 0) / filtered.length;
}

export function deriveStressContext(entries: LongitudinalEntry[]): StressContext {
  if (entries.length < LIFE_CONTEXT_DEFAULTS.minimumEntriesForContext) {
    return { level: "steady", strength: "none", summary: null };
  }

  const recentAverage = average(entries.slice(0, 7).map((entry) => entry.stress));
  if (recentAverage == null) {
    return { level: "steady", strength: "none", summary: null };
  }

  if (recentAverage >= LIFE_CONTEXT_DEFAULTS.highStressAverage) {
    return {
      level: "high",
      strength: "moderate",
      summary: "Recent stressful stretches may be shaping how demanding things feel right now.",
    };
  }

  if (recentAverage >= LIFE_CONTEXT_DEFAULTS.elevatedStressAverage) {
    return {
      level: "elevated",
      strength: "light",
      summary: "There seems to be a busier or more pressured stretch around these recent days.",
    };
  }

  return { level: "steady", strength: "none", summary: null };
}

