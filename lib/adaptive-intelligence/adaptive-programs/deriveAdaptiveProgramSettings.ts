import { deriveEmotionalSupportState } from "../../emotional-support-engine";
import type { AdaptiveIntelligenceInput, AdaptiveProgramSettings } from "../types";
import { deriveInteractionTolerance } from "../context/deriveInteractionTolerance";

export function deriveAdaptiveProgramSettings(input: AdaptiveIntelligenceInput): AdaptiveProgramSettings {
  const state = deriveEmotionalSupportState({
    ...input,
    interactionTolerance: deriveInteractionTolerance(input),
  });

  return {
    maxVisibleSteps: state.cognitiveLoad.maxVisibleSteps,
    maxVisiblePrompts: state.cognitiveLoad.maxVisiblePrompts,
    maxVisibleTools: state.cognitiveLoad.level === "active" ? 2 : 3,
    simplifyFurther: state.intensity.level !== "steady",
  };
}
