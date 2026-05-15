import type { InteractionStyleProfile, InteractionStyleWeights } from "../types";

function blend(previous: number, next: number, smoothing = 0.2) {
  return Math.round((previous * (1 - smoothing) + next * smoothing) * 100) / 100;
}

export function evolveInteractionProfile(
  previous: InteractionStyleProfile | null | undefined,
  next: InteractionStyleProfile,
): InteractionStyleProfile {
  if (!previous) {
    return next;
  }

  const weights = Object.fromEntries(
    Object.entries(next.weights).map(([key, value]) => [
      key,
      blend(previous.weights[key as keyof InteractionStyleWeights] ?? 0.5, value),
    ]),
  ) as InteractionStyleWeights;

  const topEntry = Object.entries(weights).sort((left, right) => right[1] - left[1])[0];

  return {
    weights,
    primaryStyle: (topEntry?.[0] ?? previous.primaryStyle) as keyof InteractionStyleWeights,
    confidence: blend(previous.confidence, topEntry?.[1] ?? previous.confidence, 0.15),
  };
}
