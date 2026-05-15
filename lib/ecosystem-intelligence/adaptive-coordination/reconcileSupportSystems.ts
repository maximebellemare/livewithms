import type { EcosystemAdaptiveState, EcosystemBurden } from "../types";

type Input = {
  adaptiveStatePrimary: EcosystemAdaptiveState;
  burden: EcosystemBurden;
  requestedSystems: string[];
};

export function reconcileSupportSystems(input: Input) {
  const maxVisible =
    input.burden === "high" || input.adaptiveStatePrimary === "OVERWHELMED"
      ? 2
      : input.adaptiveStatePrimary === "LOW_ENERGY"
        ? 3
        : 4;

  return {
    visibleSystems: input.requestedSystems.slice(0, maxVisible),
    suppressedSystems: input.requestedSystems.slice(maxVisible),
  };
}
