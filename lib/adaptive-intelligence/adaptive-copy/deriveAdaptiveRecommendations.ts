import { deriveLowPressureRecommendations } from "../../emotional-support-engine";
import type { AdaptiveIntelligenceInput } from "../types";
import { deriveInteractionTolerance } from "../context/deriveInteractionTolerance";

export function deriveAdaptiveRecommendations(input: AdaptiveIntelligenceInput) {
  return deriveLowPressureRecommendations({
    ...input,
    interactionTolerance: deriveInteractionTolerance(input),
  });
}
