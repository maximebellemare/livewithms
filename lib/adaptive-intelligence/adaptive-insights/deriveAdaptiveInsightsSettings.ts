import { deriveEmotionalSupportState } from "../../emotional-support-engine";
import type { AdaptiveInsightsSettings, AdaptiveIntelligenceInput } from "../types";
import { deriveInteractionTolerance } from "../context/deriveInteractionTolerance";

export function deriveAdaptiveInsightsSettings(input: AdaptiveIntelligenceInput): AdaptiveInsightsSettings {
  const state = deriveEmotionalSupportState({
    ...input,
    interactionTolerance: deriveInteractionTolerance(input),
  });

  return {
    maxCards: state.density.maxCards,
    maxSuggestions: state.density.maxSuggestions,
    maxSummaryChars: state.cognitiveLoad.level === "active" ? 160 : state.cognitiveLoad.level === "gentle" ? 200 : 260,
    reduceChartDensity: state.calmness.reduceVisualNoise,
    shortenReflections: state.cognitiveLoad.level !== "none",
  };
}
