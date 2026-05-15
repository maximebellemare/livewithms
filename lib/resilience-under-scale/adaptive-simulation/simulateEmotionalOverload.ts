import type { ResilienceAdaptiveState, ResilienceBurden, StressLevel } from "../types";

export function simulateEmotionalOverload(input: {
  adaptiveStatePrimary: ResilienceAdaptiveState;
  burden: ResilienceBurden;
  reflectionCount: number;
  hasAiVisible: boolean;
}) {
  const loadScore =
    input.reflectionCount +
    (input.hasAiVisible ? 1 : 0) +
    (input.burden === "high" ? 2 : input.burden === "moderate" ? 1 : 0) +
    (input.adaptiveStatePrimary === "OVERWHELMED" ? 2 : input.adaptiveStatePrimary === "LOW_ENERGY" ? 1 : 0);

  const risk: StressLevel = loadScore >= 6 ? "elevated" : loadScore >= 3 ? "guarded" : "low";

  return {
    risk,
    loadScore,
    shouldReduceEmotionalDensity: risk !== "low",
  };
}
