import type { CognitiveAttentionLoad, CognitiveIntensity } from "../types";

export function deriveLowStimulationUX(input: {
  intensity: CognitiveIntensity;
  attentionLoad: CognitiveAttentionLoad;
}) {
  return {
    reduceMotion: input.intensity !== "steady" || input.attentionLoad !== "low",
    reduceChoices: input.attentionLoad === "high",
    reduceVisualContrast: input.intensity === "very-light" || input.attentionLoad === "high",
  };
}
