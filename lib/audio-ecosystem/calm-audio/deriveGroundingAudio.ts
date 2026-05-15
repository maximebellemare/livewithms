import type { AudioAdaptiveState } from "../types";

export function deriveGroundingAudio(adaptiveStatePrimary: AudioAdaptiveState) {
  if (adaptiveStatePrimary === "OVERWHELMED" || adaptiveStatePrimary === "LOW_ENERGY") {
    return "Grounding audio can stay short, calm, and easy to step away from.";
  }

  return "Audio support can stay optional and brief when it feels useful.";
}
