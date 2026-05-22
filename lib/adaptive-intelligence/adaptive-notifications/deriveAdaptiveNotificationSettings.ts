import { deriveEmotionalSupportState } from "../../emotional-support-engine";
import type { AdaptiveIntelligenceInput, AdaptiveNotificationSettings } from "../types";
import { deriveInteractionTolerance } from "../context/deriveInteractionTolerance";

export function deriveAdaptiveNotificationSettings(
  input: AdaptiveIntelligenceInput,
): AdaptiveNotificationSettings {
  const state = deriveEmotionalSupportState({
    ...input,
    interactionTolerance: deriveInteractionTolerance(input),
  });

  return {
    reduceReminderFrequency: state.intensity.level !== "steady",
    lowerNotificationPressure: state.cognitiveLoad.level !== "none",
    quieterTiming: state.calmness.quieterPresentation,
    softerTone: state.calmness.lowerEmotionalIntensity,
  };
}
