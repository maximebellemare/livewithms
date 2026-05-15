import type { CollaborativeTone, SelfTrustAdaptiveState } from "../types";

export function deriveCollaborativeTone(input: {
  adaptiveStatePrimary: SelfTrustAdaptiveState;
  channel?: "coach" | "insight-summary" | "insight-list-item";
}): CollaborativeTone {
  if (input.channel === "insight-list-item") {
    return "observational";
  }

  if (input.adaptiveStatePrimary === "LOW_ENERGY" || input.adaptiveStatePrimary === "OVERWHELMED") {
    return "grounded";
  }

  if (input.adaptiveStatePrimary === "REFLECTIVE") {
    return "collaborative";
  }

  return "observational";
}
