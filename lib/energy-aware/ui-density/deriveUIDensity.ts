import type { AdaptiveDensityProfile, AdaptiveFlowInput } from "../types";

export function deriveUIDensity(input: AdaptiveFlowInput): AdaptiveDensityProfile {
  if (
    input.adaptiveState.primary === "LOW_ENERGY" ||
    input.adaptiveState.primary === "OVERWHELMED" ||
    input.adaptiveState.primary === "WITHDRAWN"
  ) {
    return "MINIMAL";
  }

  if (input.adaptiveState.primary === "REFLECTIVE" && input.skippedCheckIns < 2) {
    return "REFLECTIVE";
  }

  return "STANDARD";
}
