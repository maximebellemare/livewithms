import type { GuidedProgramIntensity } from "../types";

export function deriveLowEnergyProgramMode(input: {
  intensity: GuidedProgramIntensity;
  stepCount: number;
}) {
  return {
    visibleStepCount:
      input.intensity === "very-gentle" ? Math.min(2, input.stepCount) : input.intensity === "gentle" ? Math.min(3, input.stepCount) : input.stepCount,
    reduceOptionalContext: input.intensity !== "steady",
    shortenCtas: input.intensity === "very-gentle",
  };
}
