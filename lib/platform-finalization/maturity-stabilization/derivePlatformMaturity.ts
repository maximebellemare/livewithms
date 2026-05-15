import type { FinalizationSignal } from "../types";

export function derivePlatformMaturity(input: {
  complexityCompressed: boolean;
  calmnessStable: boolean;
  governanceStable: boolean;
}): FinalizationSignal {
  const stable = input.complexityCompressed && input.calmnessStable && input.governanceStable;

  return {
    stable,
    summary: stable
      ? "The platform feels operationally mature, calm, and dependable."
      : "The platform needs more compression and restraint before it feels fully mature.",
  };
}
