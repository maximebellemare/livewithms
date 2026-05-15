import type { EcosystemAdaptiveState } from "../types";

export function deriveContextualInteractionMode(adaptiveStatePrimary: EcosystemAdaptiveState) {
  switch (adaptiveStatePrimary) {
    case "OVERWHELMED":
      return "quiet-checkin";
    case "LOW_ENERGY":
    case "WITHDRAWN":
      return "single-support-surface";
    default:
      return "spacious-review";
  }
}
