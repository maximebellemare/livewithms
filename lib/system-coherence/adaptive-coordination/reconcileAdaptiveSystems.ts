import type { CoherenceAdaptiveState, CoherenceBurden } from "../types";

export function reconcileAdaptiveSystems(input: {
  adaptiveStatePrimary: CoherenceAdaptiveState;
  burden: CoherenceBurden;
  hasAiSummary: boolean;
  reflectionCount: number;
  quickLinkCount: number;
}) {
  const suppressSecondarySurfaces =
    input.adaptiveStatePrimary === "OVERWHELMED" ||
    input.adaptiveStatePrimary === "LOW_ENERGY" ||
    input.burden === "high";

  return {
    maxReflectionCards: suppressSecondarySurfaces ? 1 : input.burden === "moderate" ? 2 : 3,
    maxQuickLinks: suppressSecondarySurfaces ? 2 : Math.min(input.quickLinkCount, 3),
    maxAiSuggestions: suppressSecondarySurfaces ? 1 : input.burden === "moderate" ? 2 : 3,
    suppressSecondarySurfaces,
    preferNeutralTransition: suppressSecondarySurfaces || (input.hasAiSummary && input.reflectionCount > 0),
  };
}
