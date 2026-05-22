import { deriveEmotionalSupportState } from "../../emotional-support-engine";
import type { AdaptiveIntelligenceInput, AdaptiveNavigationSettings } from "../types";
import { deriveInteractionTolerance } from "../context/deriveInteractionTolerance";

export function deriveAdaptiveNavigationSettings(
  input: AdaptiveIntelligenceInput,
): AdaptiveNavigationSettings {
  const state = deriveEmotionalSupportState({
    ...input,
    interactionTolerance: deriveInteractionTolerance(input),
  });

  return {
    simplifyNavigation: state.intensity.level !== "steady" || input.engagementRhythm === "sporadic",
    reduceSimultaneousActions: state.density.level !== "standard",
    prioritizeLowEnergyAccess: Boolean(input.lowEnergyModeEnabled) || state.cognitiveLoad.level === "active",
  };
}
