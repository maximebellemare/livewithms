import type { EcosystemAdaptiveState, EcosystemBurden } from "../types";

type Input = {
  adaptiveStatePrimary: EcosystemAdaptiveState;
  burden: EcosystemBurden;
};

export function deriveEcosystemLimits(input: Input) {
  if (input.burden === "high" || input.adaptiveStatePrimary === "OVERWHELMED") {
    return { maxVisibleSystems: 2, maxActions: 1, maxLines: 2 };
  }

  if (input.adaptiveStatePrimary === "LOW_ENERGY" || input.adaptiveStatePrimary === "WITHDRAWN") {
    return { maxVisibleSystems: 3, maxActions: 2, maxLines: 3 };
  }

  return { maxVisibleSystems: 4, maxActions: 2, maxLines: 3 };
}
