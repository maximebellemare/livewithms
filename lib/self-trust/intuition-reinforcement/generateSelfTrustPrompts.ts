import type { OverinterpretationRisk, SelfTrustAdaptiveState } from "../types";

export function generateSelfTrustPrompts(input: {
  adaptiveStatePrimary: SelfTrustAdaptiveState;
  overinterpretationRisk: OverinterpretationRisk;
}) {
  if (input.overinterpretationRisk === "elevated") {
    return [
      "Not every difficult day needs a larger explanation.",
      "Your own sense of pacing matters too.",
    ];
  }

  if (input.adaptiveStatePrimary === "REFLECTIVE") {
    return [
      "Only you fully know how these stretches felt from the inside.",
      "This can be one lens alongside your own lived sense of things.",
    ];
  }

  return ["Your own sense of pacing matters too."];
}
