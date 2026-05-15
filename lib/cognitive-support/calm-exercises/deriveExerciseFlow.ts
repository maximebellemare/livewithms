import type { CognitiveIntensity } from "../types";

export function deriveExerciseFlow(input: {
  intensity: CognitiveIntensity;
  attentionLoad: "low" | "moderate" | "high";
}) {
  if (input.intensity === "very-light" || input.attentionLoad === "high") {
    return {
      type: "attention-reset",
      durationMinutes: 1,
      steps: 2,
      stimulation: "low",
    } as const;
  }

  if (input.intensity === "light" || input.attentionLoad === "moderate") {
    return {
      type: "visual-pacing",
      durationMinutes: 2,
      steps: 3,
      stimulation: "low",
    } as const;
  }

  return {
    type: "gentle-sequencing",
    durationMinutes: 3,
    steps: 4,
    stimulation: "moderate",
  } as const;
}
