import type { CognitiveIntensity } from "../types";

export function deriveCalmInteractionTiming(intensity: CognitiveIntensity) {
  if (intensity === "very-light") {
    return {
      transitionMs: 160,
      pauseMs: 240,
      feedbackStyle: "soft",
    } as const;
  }

  if (intensity === "light") {
    return {
      transitionMs: 180,
      pauseMs: 200,
      feedbackStyle: "gentle",
    } as const;
  }

  return {
    transitionMs: 220,
    pauseMs: 180,
    feedbackStyle: "steady",
  } as const;
}
