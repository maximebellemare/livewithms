import type { CoherenceAdaptiveState, CoherenceTone } from "../types";

export function deriveUnifiedTone(input: {
  adaptiveStatePrimary: CoherenceAdaptiveState;
  emotionalLoad: "low" | "moderate" | "high";
}): CoherenceTone {
  if (input.emotionalLoad === "high" || input.adaptiveStatePrimary === "OVERWHELMED") {
    return "grounded";
  }

  if (input.adaptiveStatePrimary === "REFLECTIVE" && input.emotionalLoad === "low") {
    return "reflective";
  }

  return "quiet";
}
