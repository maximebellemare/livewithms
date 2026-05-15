import type { AdaptationIntensity } from "../types";

export function preventAdaptationOverstacking(input: {
  requestedCount: number;
  adaptationIntensity: AdaptationIntensity;
  hasAiVisible?: boolean;
  hasReflectionsVisible?: boolean;
}) {
  const baseMax = input.adaptationIntensity === "minimal" ? 1 : input.adaptationIntensity === "moderate" ? 2 : 3;
  const penalty = input.hasAiVisible && input.hasReflectionsVisible ? 1 : 0;

  return Math.max(1, Math.min(input.requestedCount, baseMax - penalty));
}
