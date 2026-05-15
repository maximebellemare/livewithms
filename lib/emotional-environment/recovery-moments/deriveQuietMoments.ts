import type { AtmosphereState, EmotionalRecoveryMoment } from "../types";

export function deriveQuietMoments(atmosphere: AtmosphereState, hasStackedEmotionalSurfaces: boolean): EmotionalRecoveryMoment | null {
  if (!hasStackedEmotionalSurfaces && atmosphere !== "QUIET" && atmosphere !== "RESTORATIVE") {
    return null;
  }

  return atmosphere === "RESTORATIVE"
    ? {
        title: "A quieter pause is okay",
        body: "This can stay simple for now.",
        spacing: "roomy",
      }
    : {
        title: "A little breathing room can help",
        body: "You do not need to take in everything at once.",
        spacing: "standard",
      };
}

