import { deriveEmotionalSupportState } from "../../emotional-support-engine";
import type { AdaptiveCoachSettings, AdaptiveIntelligenceInput } from "../types";
import { deriveInteractionTolerance } from "../context/deriveInteractionTolerance";

export function deriveAdaptiveCoachSettings(input: AdaptiveIntelligenceInput): AdaptiveCoachSettings {
  const state = deriveEmotionalSupportState({
    ...input,
    interactionTolerance: deriveInteractionTolerance(input),
  });
  const isEvening = input.timeOfDay === "evening";
  const highBrainFog = typeof input.brainFog === "number" && input.brainFog >= 4;

  if (state.cognitiveLoad.level === "active") {
    return {
      maxParagraphs: 2,
      maxSentences: isEvening ? 2 : highBrainFog ? 2 : 3,
      maxChars: isEvening ? 180 : highBrainFog ? 190 : 220,
      maxStarterSuggestions: 2,
      lowerEmotionalIntensity: true,
    };
  }

  return {
    maxParagraphs: 3,
    maxSentences: isEvening ? 4 : 5,
    maxChars: isEvening ? 300 : 360,
    maxStarterSuggestions: 3,
    lowerEmotionalIntensity: state.calmness.lowerEmotionalIntensity,
  };
}
