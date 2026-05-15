import type { AdaptiveStateSignal } from "../../longitudinal/types";
import type { RecoveryExperience, RoutineDisruption } from "../types";

export function deriveRecoveryExperience(input: {
  adaptiveStatePrimary: AdaptiveStateSignal;
  disruption: RoutineDisruption;
}): RecoveryExperience {
  if (
    input.adaptiveStatePrimary === "LOW_ENERGY" ||
    input.adaptiveStatePrimary === "OVERWHELMED" ||
    input.disruption.severity === "moderate"
  ) {
    return {
      style: "extra-gentle",
      reduceDemand: true,
      simplifyReturn: true,
    };
  }

  if (input.disruption.disrupted || input.adaptiveStatePrimary === "WITHDRAWN") {
    return {
      style: "open",
      reduceDemand: true,
      simplifyReturn: true,
    };
  }

  return {
    style: "steady",
    reduceDemand: false,
    simplifyReturn: false,
  };
}
