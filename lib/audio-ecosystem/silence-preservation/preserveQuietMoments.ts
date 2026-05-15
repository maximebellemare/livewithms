import type { AudioAdaptiveState } from "../types";

export function preserveQuietMoments(adaptiveStatePrimary: AudioAdaptiveState) {
  if (adaptiveStatePrimary === "OVERWHELMED" || adaptiveStatePrimary === "LOW_ENERGY") {
    return "Silence can still be the most supportive option right now.";
  }

  return "You do not need to fill quiet moments with audio for support to count.";
}
