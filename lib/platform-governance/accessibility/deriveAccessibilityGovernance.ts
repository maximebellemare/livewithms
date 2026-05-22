import type { PlatformAccessibilityGovernance, PlatformGovernanceInput } from "../types";

export function deriveAccessibilityGovernance(input: PlatformGovernanceInput): PlatformAccessibilityGovernance {
  const fatigueReadable =
    Boolean(input.lowEnergyModeEnabled) ||
    input.interactionTolerance === "reduced" ||
    (typeof input.recentFatigueAverage === "number" && input.recentFatigueAverage >= 4);

  return {
    fatigueReadable,
    lowSensoryLoad: fatigueReadable || Boolean(input.overwhelmDetected),
    interruptionSafe: true,
    reducedMotionPreferred: fatigueReadable || input.timeOfDay === "evening",
  };
}
