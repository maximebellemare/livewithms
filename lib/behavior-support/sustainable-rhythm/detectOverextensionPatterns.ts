import type { AdaptiveStateSignal } from "../../longitudinal/types";
import type { OverextensionPattern } from "../types";

export function detectOverextensionPatterns(input: {
  adaptiveStatePrimary: AdaptiveStateSignal;
  interactionFrequency: number;
  weeklyCheckIns: number;
}): OverextensionPattern {
  if (
    (input.adaptiveStatePrimary === "LOW_ENERGY" || input.adaptiveStatePrimary === "OVERWHELMED") &&
    input.interactionFrequency >= 2.5
  ) {
    return {
      atRisk: true,
      reason: "intensity-during-low-energy",
    };
  }

  if (input.weeklyCheckIns >= 6 && input.interactionFrequency >= 3) {
    return {
      atRisk: true,
      reason: "high-frequency",
    };
  }

  return {
    atRisk: false,
    reason: "none",
  };
}
