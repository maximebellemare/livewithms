import type { GuidedProgramAdaptiveState, GuidedProgramIntensity } from "../types";

export function deriveProgramIntensity(input: {
  adaptiveStatePrimary: GuidedProgramAdaptiveState;
  lowEnergyMode: boolean;
  stressTrend: "elevated" | "steady";
}) : GuidedProgramIntensity {
  if (input.adaptiveStatePrimary === "OVERWHELMED" || input.lowEnergyMode) {
    return "very-gentle";
  }

  if (input.adaptiveStatePrimary === "WITHDRAWN" || input.stressTrend === "elevated") {
    return "gentle";
  }

  return "steady";
}
