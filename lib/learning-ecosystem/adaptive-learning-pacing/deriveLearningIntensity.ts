import type { EducationalLoad, LearningAdaptiveState, LearningIntensity } from "../types";

export function deriveLearningIntensity(input: {
  adaptiveStatePrimary: LearningAdaptiveState;
  educationalLoad: EducationalLoad;
}) : LearningIntensity {
  if (input.adaptiveStatePrimary === "OVERWHELMED" || input.educationalLoad === "high") {
    return "very-light";
  }

  if (
    input.adaptiveStatePrimary === "LOW_ENERGY" ||
    input.adaptiveStatePrimary === "WITHDRAWN" ||
    input.educationalLoad === "moderate"
  ) {
    return "light";
  }

  return "steady";
}
