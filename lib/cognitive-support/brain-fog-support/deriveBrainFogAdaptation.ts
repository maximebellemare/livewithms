import type { CognitiveSupportAdaptiveState } from "../types";

export function deriveBrainFogAdaptation(input: {
  adaptiveStatePrimary: CognitiveSupportAdaptiveState;
  attentionLoad: "low" | "moderate" | "high";
}) {
  return {
    shorterSteps:
      input.adaptiveStatePrimary === "LOW_ENERGY" ||
      input.adaptiveStatePrimary === "OVERWHELMED" ||
      input.attentionLoad !== "low",
    lowerStimulation:
      input.adaptiveStatePrimary !== "REFLECTIVE" || input.attentionLoad === "high",
    reducedBranching:
      input.adaptiveStatePrimary === "LOW_ENERGY" ||
      input.adaptiveStatePrimary === "WITHDRAWN" ||
      input.attentionLoad === "high",
  };
}
