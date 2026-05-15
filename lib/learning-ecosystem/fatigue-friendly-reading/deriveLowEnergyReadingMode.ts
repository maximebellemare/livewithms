import type { LearningAdaptiveState } from "../types";

export function deriveLowEnergyReadingMode(input: {
  adaptiveStatePrimary: LearningAdaptiveState;
  educationalLoad: "low" | "moderate" | "high";
}) {
  return {
    simplified:
      input.adaptiveStatePrimary === "LOW_ENERGY" ||
      input.adaptiveStatePrimary === "OVERWHELMED" ||
      input.educationalLoad === "high",
    shorterSummary:
      input.educationalLoad !== "low" || input.adaptiveStatePrimary === "WITHDRAWN",
    reducedBranching:
      input.adaptiveStatePrimary === "LOW_ENERGY" || input.educationalLoad === "high",
  };
}
