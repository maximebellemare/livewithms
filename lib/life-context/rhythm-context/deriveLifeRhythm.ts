import type { LongitudinalEntry } from "../../longitudinal/types";
import type { DisruptionContext, LifeRhythm, StressContext } from "../types";

export function deriveLifeRhythm(
  entries: LongitudinalEntry[],
  stressContext: StressContext,
  disruptionContext: DisruptionContext,
): LifeRhythm {
  if (entries.length < 3) {
    return { pace: "steady", summary: null };
  }

  if (disruptionContext.kind !== "stable") {
    return { pace: "variable", summary: "Life rhythm seems a little less settled lately, which may be shaping how days feel." };
  }

  if (stressContext.level === "high") {
    return { pace: "compressed", summary: "Recent days may have felt more compressed, with less room to recover between them." };
  }

  return { pace: "steady", summary: null };
}

