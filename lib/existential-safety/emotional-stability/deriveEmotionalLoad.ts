import type { EmotionalLoad, ExistentialAdaptiveState } from "../types";

export function deriveEmotionalLoad(input: {
  adaptiveStatePrimary: ExistentialAdaptiveState;
  hasSensitiveTopic?: boolean;
  hasRecursiveDistress?: boolean;
}) : EmotionalLoad {
  if (
    input.adaptiveStatePrimary === "OVERWHELMED" ||
    input.hasSensitiveTopic ||
    input.hasRecursiveDistress
  ) {
    return "high";
  }

  if (
    input.adaptiveStatePrimary === "LOW_ENERGY" ||
    input.adaptiveStatePrimary === "WITHDRAWN" ||
    input.adaptiveStatePrimary === "REFLECTIVE"
  ) {
    return "moderate";
  }

  return "low";
}
