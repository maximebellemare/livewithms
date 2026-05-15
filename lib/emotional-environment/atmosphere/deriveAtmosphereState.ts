import type { EmotionalEnvironmentInput, AtmosphereState } from "../types";

export function deriveAtmosphereState(input: EmotionalEnvironmentInput): AtmosphereState {
  if (input.adaptiveStatePrimary === "LOW_ENERGY" || input.adaptiveStatePrimary === "WITHDRAWN") {
    return "RESTORATIVE";
  }

  if (input.adaptiveStatePrimary === "OVERWHELMED") {
    return "QUIET";
  }

  if (input.adaptiveStatePrimary === "REFLECTIVE") {
    return "REFLECTIVE";
  }

  if (input.timeOfDay != null && input.timeOfDay >= 18) {
    return "GROUNDED";
  }

  return "LIGHT";
}

