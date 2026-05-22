import type { EmotionalSupportCalmness, EmotionalSupportEngineInput } from "../types";
import { deriveSupportIntensity } from "../overwhelm/deriveSupportIntensity";

export function deriveCalmnessLevel(input: EmotionalSupportEngineInput): EmotionalSupportCalmness {
  const intensity = deriveSupportIntensity(input);
  const calmPreference = input.preferredSupportStyle === "calm";

  if (intensity.level === "high") {
    return {
      level: "protective",
      reduceVisualNoise: true,
      reduceAnimationIntensity: true,
      lowerEmotionalIntensity: true,
      quieterPresentation: true,
    };
  }

  if (intensity.level === "elevated" || calmPreference) {
    return {
      level: "heightened",
      reduceVisualNoise: true,
      reduceAnimationIntensity: true,
      lowerEmotionalIntensity: true,
      quieterPresentation: true,
    };
  }

  return {
    level: "standard",
    reduceVisualNoise: false,
    reduceAnimationIntensity: false,
    lowerEmotionalIntensity: false,
    quieterPresentation: calmPreference,
  };
}
