import type { HealthyExitState } from "../types";

export function deriveHealthyExitState(input: {
  attentionLoad: "low" | "moderate" | "high";
  adaptiveStatePrimary: "LOW_ENERGY" | "OVERWHELMED" | "WITHDRAWN" | "STABLE" | "REFLECTIVE";
}) : HealthyExitState {
  if (input.attentionLoad === "high" || input.adaptiveStatePrimary === "OVERWHELMED") {
    return "soft-exit";
  }

  return "easy-exit";
}

