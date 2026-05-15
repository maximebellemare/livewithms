import type { TrackingIntensity } from "../../uncertainty-safety/types";
import type { OverinterpretationRisk, SelfTrustAdaptiveState } from "../types";

export function detectOverinterpretationRisk(input: {
  adaptiveStatePrimary: SelfTrustAdaptiveState;
  aiSurfaceVisible: boolean;
  stackedInsightCount: number;
  trackingIntensity: TrackingIntensity;
}) : OverinterpretationRisk {
  if (
    input.trackingIntensity === "reduced" ||
    input.adaptiveStatePrimary === "OVERWHELMED" ||
    input.stackedInsightCount >= 3
  ) {
    return "elevated";
  }

  if (input.aiSurfaceVisible || input.stackedInsightCount >= 2 || input.adaptiveStatePrimary === "LOW_ENERGY") {
    return "guarded";
  }

  return "low";
}
