import { deriveEmotionalSupportState } from "../../emotional-support-engine";
import type { AdaptiveIntelligenceInput, AdaptiveReducedComplexity } from "../types";
import { deriveInteractionTolerance } from "../context/deriveInteractionTolerance";

export function deriveReducedComplexity(input: AdaptiveIntelligenceInput): AdaptiveReducedComplexity {
  const state = deriveEmotionalSupportState({
    ...input,
    interactionTolerance: deriveInteractionTolerance(input),
  });
  const active = state.intensity.level !== "steady";

  return {
    shortenSummaries: active,
    collapseSecondarySections: active,
    reduceChartDensity: active,
    simplifyPrograms: active,
    reduceVisualNoise: state.calmness.reduceVisualNoise,
    preferShortAiReplies: active,
    simplifyNavigation: active || input.engagementRhythm === "sporadic",
    reduceRecommendationIntensity: active || input.preferredSupportStyle === "calm",
  };
}
