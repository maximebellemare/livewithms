import type { GuidedProgramAdaptiveState } from "../types";

export function deriveGroundingSupport(input: {
  adaptiveStatePrimary: GuidedProgramAdaptiveState;
  intensity: "very-gentle" | "gentle" | "steady";
}) {
  if (input.adaptiveStatePrimary === "OVERWHELMED" || input.intensity === "very-gentle") {
    return "Let this stay slow and small. A very light version can still be useful.";
  }

  if (input.adaptiveStatePrimary === "LOW_ENERGY" || input.intensity === "gentle") {
    return "A quieter pace may help this support feel more manageable.";
  }

  return "You can move through this at your own pace.";
}
