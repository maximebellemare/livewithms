import type { AdaptiveStateSignal } from "../../longitudinal/types";
import type { CognitiveBurden } from "../types";

export function deriveCognitiveBurden(input: {
  adaptiveStatePrimary: AdaptiveStateSignal;
  visibleSurfaceCount: number;
  actionCount: number;
  hasAiSummary?: boolean;
}): CognitiveBurden {
  if (
    input.adaptiveStatePrimary === "LOW_ENERGY" ||
    input.adaptiveStatePrimary === "OVERWHELMED" ||
    input.visibleSurfaceCount >= 7 ||
    input.actionCount >= 8
  ) {
    return "high";
  }

  if (input.visibleSurfaceCount >= 5 || input.actionCount >= 5 || input.hasAiSummary) {
    return "medium";
  }

  return "low";
}
