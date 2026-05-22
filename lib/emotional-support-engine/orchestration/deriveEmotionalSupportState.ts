import { deriveSupportDensity } from "../adaptive-support/deriveSupportDensity";
import { deriveCalmnessLevel } from "../calmness/deriveCalmnessLevel";
import { deriveAdaptiveGrounding } from "../grounding/deriveAdaptiveGrounding";
import { containsUnsafeEmotionalSupportLanguage } from "../governance/guardEmotionalSafety";
import { deriveReducedCognitiveLoad } from "../low-energy/deriveReducedCognitiveLoad";
import { deriveSupportIntensity } from "../overwhelm/deriveSupportIntensity";
import { deriveLowPressureRecommendations } from "../pacing/deriveLowPressureRecommendations";
import type { EmotionalSupportEngineInput, EmotionalSupportState } from "../types";

export function deriveEmotionalSupportState(input: EmotionalSupportEngineInput): EmotionalSupportState {
  const intensity = deriveSupportIntensity(input);
  const calmness = deriveCalmnessLevel(input);
  const density = deriveSupportDensity(input);
  const cognitiveLoad = deriveReducedCognitiveLoad(input);
  const adaptiveGrounding = deriveAdaptiveGrounding(input);
  const lowPressureRecommendations = deriveLowPressureRecommendations(input);
  const message = input.message ?? "";

  return {
    intensity,
    calmness,
    density,
    cognitiveLoad,
    adaptiveGrounding,
    lowPressureRecommendations,
    safety: {
      avoidTherapySimulation: true,
      avoidDependencyLanguage: true,
      avoidInspirationalFraming: true,
      avoidPseudoMedicalInterpretation: true,
      containsUnsafeLanguage: containsUnsafeEmotionalSupportLanguage(message),
    },
  };
}
