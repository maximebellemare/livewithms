import type { AtmosphereState, EmotionalRecoveryMoment } from "../types";

export function deriveQuietMoments(atmosphere: AtmosphereState, hasStackedEmotionalSurfaces: boolean): EmotionalRecoveryMoment | null {
  if (!hasStackedEmotionalSurfaces && atmosphere !== "QUIET" && atmosphere !== "RESTORATIVE") {
    return null;
  }

  return atmosphere === "RESTORATIVE"
    ? {
        title: "Lower stimulation",
        body: "Keep the view light for now.",
        spacing: "roomy",
      }
    : {
        title: "Keep the view light",
        body: "A shorter read may help here.",
        spacing: "standard",
      };
}
