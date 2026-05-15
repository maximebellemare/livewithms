import type { CoherenceAdaptiveState, CoherenceBurden } from "../types";

export function deriveEmotionalDensityLimits(input: {
  adaptiveStatePrimary: CoherenceAdaptiveState;
  burden: CoherenceBurden;
  hasAiSummary?: boolean;
}) {
  const highLoad =
    input.adaptiveStatePrimary === "OVERWHELMED" ||
    input.adaptiveStatePrimary === "LOW_ENERGY" ||
    input.burden === "high";

  return {
    maxReflectionCards: highLoad ? 1 : input.burden === "moderate" ? 2 : 3,
    maxInsightCards: highLoad ? 2 : input.hasAiSummary ? 3 : 4,
    maxSupportCards: highLoad ? 1 : 2,
  };
}
