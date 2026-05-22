import { guardEmotionalSupportCopy } from "../governance/guardEmotionalSafety";
import { deriveAdaptiveGrounding } from "../grounding/deriveAdaptiveGrounding";
import type { EmotionalSupportEngineInput } from "../types";

export function deriveLowPressureRecommendations(input: EmotionalSupportEngineInput) {
  const grounding = deriveAdaptiveGrounding(input);

  if (grounding.primaryRecommendation === "grounding") {
    return [
      guardEmotionalSupportCopy("Keep the next part smaller."),
      guardEmotionalSupportCopy("Lower one source of input."),
      guardEmotionalSupportCopy("Let one thing wait."),
    ];
  }

  if (grounding.primaryRecommendation === "smaller-horizon") {
    return [
      guardEmotionalSupportCopy("Keep the horizon closer."),
      guardEmotionalSupportCopy("Reduce one future-pressure loop."),
      guardEmotionalSupportCopy("Come back to today."),
    ];
  }

  if (grounding.primaryRecommendation === "decompression") {
    return [
      guardEmotionalSupportCopy("Lower one source of stimulation."),
      guardEmotionalSupportCopy("Reduce one decision."),
      guardEmotionalSupportCopy("Let the emotional pace slow down."),
    ];
  }

  return [
    guardEmotionalSupportCopy("Keep one routine simple."),
    guardEmotionalSupportCopy("Lower one expectation."),
    guardEmotionalSupportCopy("Let steadiness stay smaller."),
  ];
}
