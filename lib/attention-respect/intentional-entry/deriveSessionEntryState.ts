import type { SessionEntryState } from "../types";

export function deriveSessionEntryState(input: {
  adaptiveStatePrimary: "LOW_ENERGY" | "OVERWHELMED" | "WITHDRAWN" | "STABLE" | "REFLECTIVE";
  attentionLoad: "low" | "moderate" | "high";
}) : SessionEntryState {
  if (input.adaptiveStatePrimary === "LOW_ENERGY" || input.adaptiveStatePrimary === "OVERWHELMED") {
    return "quiet-entry";
  }

  if (input.adaptiveStatePrimary === "REFLECTIVE" && input.attentionLoad !== "high") {
    return "reflective-entry";
  }

  return "steady-entry";
}

