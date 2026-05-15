import type { AdaptiveState, EmotionalContext } from "../types";

export function adaptiveToneState(
  adaptiveState: AdaptiveState,
  emotionalContext: EmotionalContext,
): EmotionalContext["supportStyle"] {
  if (adaptiveState.primary === "LOW_ENERGY" || adaptiveState.primary === "OVERWHELMED") {
    return "grounding";
  }

  if (adaptiveState.primary === "REFLECTIVE" || emotionalContext.recentTone === "mixed") {
    return "reflective";
  }

  if (adaptiveState.primary === "WITHDRAWN") {
    return "steady";
  }

  return emotionalContext.supportStyle;
}
