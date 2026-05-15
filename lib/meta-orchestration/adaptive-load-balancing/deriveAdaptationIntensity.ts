import type { AdaptationIntensity } from "../types";

export function deriveAdaptationIntensity(input: {
  adaptiveStatePrimary: "LOW_ENERGY" | "OVERWHELMED" | "WITHDRAWN" | "STABLE" | "REFLECTIVE";
  burden: "low" | "moderate" | "high";
  activeSystemCount: number;
  hasAiVisible: boolean;
}): AdaptationIntensity {
  if (
    input.adaptiveStatePrimary === "OVERWHELMED" ||
    input.burden === "high" ||
    input.activeSystemCount >= 6
  ) {
    return "minimal";
  }

  if (
    input.adaptiveStatePrimary === "LOW_ENERGY" ||
    input.adaptiveStatePrimary === "WITHDRAWN" ||
    input.burden === "moderate" ||
    input.hasAiVisible
  ) {
    return "moderate";
  }

  return "supportive";
}
