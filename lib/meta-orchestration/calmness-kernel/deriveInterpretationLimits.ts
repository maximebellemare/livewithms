import type { AdaptationIntensity } from "../types";

export function deriveInterpretationLimits(input: {
  adaptiveStatePrimary: "LOW_ENERGY" | "OVERWHELMED" | "WITHDRAWN" | "STABLE" | "REFLECTIVE";
  burden: "low" | "moderate" | "high";
  adaptationIntensity: AdaptationIntensity;
}) {
  const highLoad =
    input.adaptiveStatePrimary === "OVERWHELMED" ||
    input.adaptiveStatePrimary === "LOW_ENERGY" ||
    input.burden === "high" ||
    input.adaptationIntensity === "minimal";

  return {
    maxPromptActions: highLoad ? 1 : input.burden === "moderate" ? 2 : 3,
    maxAiSuggestions: highLoad ? 1 : input.adaptationIntensity === "moderate" ? 2 : 3,
    maxInterpretiveSentences: highLoad ? 2 : input.burden === "moderate" ? 3 : 4,
  };
}
