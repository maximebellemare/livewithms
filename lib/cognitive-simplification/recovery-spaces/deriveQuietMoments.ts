import type { AdaptiveStateSignal } from "../../longitudinal/types";
import type { QuietMoment } from "../types";

export function deriveQuietMoments(input: {
  adaptiveStatePrimary: AdaptiveStateSignal;
  hasStackedEmotionalSurfaces: boolean;
}): QuietMoment {
  if (
    input.adaptiveStatePrimary === "LOW_ENERGY" ||
    input.adaptiveStatePrimary === "OVERWHELMED" ||
    input.hasStackedEmotionalSurfaces
  ) {
    return {
      title: "A quieter moment",
      body: "You do not need to take in everything at once. One small step is enough here.",
    };
  }

  return null;
}
