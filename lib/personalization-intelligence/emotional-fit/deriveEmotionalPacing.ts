import type { PersonalizationAdaptiveState, PersonalizationFit } from "../types";

export function deriveEmotionalPacing(input: {
  adaptiveStatePrimary: PersonalizationAdaptiveState;
  engagementRhythm?: string | null;
  recoveryRhythm?: string | null;
}): { fit: PersonalizationFit; summary: string } {
  if (
    input.adaptiveStatePrimary === "LOW_ENERGY" ||
    input.recoveryRhythm === "quiet-reentry"
  ) {
    return {
      fit: "lighter",
      summary: "A lighter emotional pace may fit better during quieter or lower-capacity stretches.",
    };
  }

  if (input.adaptiveStatePrimary === "REFLECTIVE" && input.engagementRhythm === "steady") {
    return {
      fit: "reflective",
      summary: "There may be room for a little more reflection, without making it the default.",
    };
  }

  return {
    fit: "steady",
    summary: "Emotional pacing can stay steady and adjustable rather than fixed.",
  };
}
