import type { TrackingIntensity, VariabilityContext } from "../types";

export function deriveTrackingIntensity(input: {
  variability: VariabilityContext;
  adaptiveStatePrimary: "LOW_ENERGY" | "OVERWHELMED" | "WITHDRAWN" | "STABLE" | "REFLECTIVE";
}) : TrackingIntensity {
  if (input.variability.level === "high" || input.adaptiveStatePrimary === "OVERWHELMED") {
    return "reduced";
  }

  return "light";
}

