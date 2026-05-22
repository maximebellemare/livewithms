import type { EmotionalSupportEngineInput, EmotionalSupportReducedCognitiveLoad } from "../types";
import { deriveSupportIntensity } from "../overwhelm/deriveSupportIntensity";

export function deriveReducedCognitiveLoad(
  input: EmotionalSupportEngineInput,
): EmotionalSupportReducedCognitiveLoad {
  const intensity = deriveSupportIntensity(input);
  const gentle = intensity.level !== "steady" || (input.abandonedFlowCount ?? 0) >= 1;

  if (intensity.level === "high") {
    return {
      level: "active",
      maxSuggestions: 1,
      maxInsightCards: 2,
      maxVisiblePrompts: 1,
      maxVisibleSteps: 2,
      maxCorrelationCards: 1,
      maxStarterSuggestions: 2,
    };
  }

  if (gentle) {
    return {
      level: "gentle",
      maxSuggestions: 2,
      maxInsightCards: 3,
      maxVisiblePrompts: 2,
      maxVisibleSteps: 3,
      maxCorrelationCards: 2,
      maxStarterSuggestions: 3,
    };
  }

  return {
    level: "none",
    maxSuggestions: 3,
    maxInsightCards: 4,
    maxVisiblePrompts: 3,
    maxVisibleSteps: 4,
    maxCorrelationCards: 3,
    maxStarterSuggestions: 3,
  };
}
