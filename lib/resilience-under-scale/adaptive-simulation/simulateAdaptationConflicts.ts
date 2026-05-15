import type { ResilienceAdaptiveState, ResilienceBurden, StressLevel } from "../types";

export function simulateAdaptationConflicts(input: {
  adaptiveStatePrimary: ResilienceAdaptiveState;
  burden: ResilienceBurden;
  activeSystems: string[];
  hasAiVisible: boolean;
}) {
  const overlappingSystems = new Set(input.activeSystems).size !== input.activeSystems.length;
  const complexityScore =
    input.activeSystems.length +
    (input.hasAiVisible ? 1 : 0) +
    (input.burden === "high" ? 2 : input.burden === "moderate" ? 1 : 0) +
    (input.adaptiveStatePrimary === "OVERWHELMED" || input.adaptiveStatePrimary === "LOW_ENERGY" ? 1 : 0);

  const risk: StressLevel =
    complexityScore >= 8 || overlappingSystems
      ? "elevated"
      : complexityScore >= 5
        ? "guarded"
        : "low";

  return {
    risk,
    overlappingSystems,
    conflictCount: Math.max(0, input.activeSystems.length - new Set(input.activeSystems).size) + (complexityScore >= 8 ? 1 : 0),
    shouldSimplify: risk !== "low",
  };
}
