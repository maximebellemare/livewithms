import type { AdaptiveFlowInput, InteractionComplexity } from "../types";

export function deriveInteractionComplexity(input: AdaptiveFlowInput): InteractionComplexity {
  if (
    input.adaptiveState.primary === "LOW_ENERGY" ||
    input.adaptiveState.primary === "OVERWHELMED" ||
    input.adaptiveState.primary === "WITHDRAWN"
  ) {
    return "LOW";
  }

  if (input.adaptiveState.primary === "REFLECTIVE") {
    return "HIGH";
  }

  return "MEDIUM";
}
