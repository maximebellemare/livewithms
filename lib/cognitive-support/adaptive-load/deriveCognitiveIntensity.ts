import type { CognitiveIntensity, CognitiveSupportAdaptiveState } from "../types";

export function deriveCognitiveIntensity(input: {
  adaptiveStatePrimary: CognitiveSupportAdaptiveState;
  attentionLoad: "low" | "moderate" | "high";
}) : CognitiveIntensity {
  if (input.adaptiveStatePrimary === "OVERWHELMED" || input.attentionLoad === "high") {
    return "very-light";
  }

  if (
    input.adaptiveStatePrimary === "LOW_ENERGY" ||
    input.adaptiveStatePrimary === "WITHDRAWN" ||
    input.attentionLoad === "moderate"
  ) {
    return "light";
  }

  return "steady";
}
