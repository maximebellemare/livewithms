import type { PlatformCalmnessConstraints, PlatformGovernanceInput } from "../types";

export function deriveCalmnessConstraints(input: PlatformGovernanceInput): PlatformCalmnessConstraints {
  const heavier =
    Boolean(input.lowEnergyModeEnabled) ||
    Boolean(input.overwhelmDetected) ||
    input.interactionTolerance === "reduced" ||
    (typeof input.recentFatigueAverage === "number" && input.recentFatigueAverage >= 4) ||
    (typeof input.recentStressAverage === "number" && input.recentStressAverage >= 4);

  return {
    reduceUrgency: heavier,
    preserveSpaciousness: true,
    lowerStimulation: heavier || input.timeOfDay === "evening",
    reduceEmotionalSharpness: true,
    reduceTextWalls: heavier,
  };
}
