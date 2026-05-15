import type { CoherenceAdaptiveState, CoherenceBurden, CoherenceTone } from "../types";

export function deriveUnifiedEmotionalRules(input: {
  adaptiveStatePrimary: CoherenceAdaptiveState;
  burden: CoherenceBurden;
  hasAiVisible?: boolean;
  hasStackedEmotionalSurfaces?: boolean;
}) {
  let preferredTone: CoherenceTone = "quiet";

  if (input.adaptiveStatePrimary === "REFLECTIVE" && input.burden === "low") {
    preferredTone = "reflective";
  } else if (
    input.adaptiveStatePrimary === "OVERWHELMED" ||
    input.adaptiveStatePrimary === "LOW_ENERGY" ||
    input.burden === "high"
  ) {
    preferredTone = "grounded";
  }

  const emotionalDensityLimit =
    input.hasStackedEmotionalSurfaces || input.burden === "high" ? 1 : input.burden === "moderate" ? 2 : 3;
  const promptLoadLimit = input.burden === "high" ? 1 : input.burden === "moderate" ? 2 : 3;

  return {
    preferredTone,
    emotionalDensityLimit,
    promptLoadLimit,
    preferQuietTransitions:
      input.adaptiveStatePrimary !== "REFLECTIVE" || input.hasStackedEmotionalSurfaces === true,
    shouldUseNeutralBridge:
      input.adaptiveStatePrimary === "OVERWHELMED" ||
      input.adaptiveStatePrimary === "WITHDRAWN" ||
      input.burden === "high",
    allowAiSurface: !(input.hasAiVisible && input.hasStackedEmotionalSurfaces && input.burden === "high"),
  };
}
