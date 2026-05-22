import type { EmotionalSupportDensity, EmotionalSupportEngineInput } from "../types";
import { deriveSupportIntensity } from "../overwhelm/deriveSupportIntensity";

export function deriveSupportDensity(input: EmotionalSupportEngineInput): EmotionalSupportDensity {
  const intensity = deriveSupportIntensity(input);
  const prefersMinimal = input.preferredDensity === "minimal";
  const lighterByRhythm = input.engagementRhythm === "sporadic" || input.preferredDensity === "standard";

  if (prefersMinimal || intensity.level === "high") {
    return {
      level: "minimal",
      maxCards: 2,
      maxSuggestions: 1,
      maxSecondarySections: 1,
    };
  }

  if (intensity.level === "elevated" || lighterByRhythm) {
    return {
      level: "lighter",
      maxCards: 3,
      maxSuggestions: 2,
      maxSecondarySections: 2,
    };
  }

  return {
    level: "standard",
    maxCards: 4,
    maxSuggestions: 3,
    maxSecondarySections: 3,
  };
}
