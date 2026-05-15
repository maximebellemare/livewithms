import type { EcosystemAdaptiveState, EcosystemBurden } from "../types";

type Input = {
  adaptiveStatePrimary: EcosystemAdaptiveState;
  burden: EcosystemBurden;
  activeSystemCount: number;
};

export function deriveSimplificationMoments(input: Input) {
  const shouldSimplify =
    input.burden === "high" ||
    input.adaptiveStatePrimary === "OVERWHELMED" ||
    input.activeSystemCount >= 4;

  return {
    shouldSimplify,
    summary: shouldSimplify
      ? "This may be a moment for fewer surfaces and less interpretation."
      : "Support can stay coordinated without needing to disappear entirely.",
  };
}
