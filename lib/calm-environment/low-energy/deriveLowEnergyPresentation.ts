import type { CalmEnvironmentInput, CalmEnvironmentLowEnergyPresentation } from "../types";

export function deriveLowEnergyPresentation(input: CalmEnvironmentInput): CalmEnvironmentLowEnergyPresentation {
  const active =
    input.lowEnergyModeEnabled ||
    input.interactionTolerance === "reduced" ||
    (typeof input.recentFatigueAverage === "number" && input.recentFatigueAverage >= 4);

  return {
    active,
    shortenReading: active,
    reduceSimultaneousActions: active || Boolean(input.overwhelmDetected),
    simplifySecondaryContent: active || Boolean(input.overwhelmDetected),
    preserveFunctionality: true,
  };
}
