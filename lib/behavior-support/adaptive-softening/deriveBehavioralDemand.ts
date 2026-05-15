import type { AdaptiveStateSignal } from "../../longitudinal/types";
import type { BehavioralDemand, RoutineDisruption } from "../types";

export function deriveBehavioralDemand(input: {
  adaptiveStatePrimary: AdaptiveStateSignal;
  disruption: RoutineDisruption;
}): BehavioralDemand {
  if (
    input.adaptiveStatePrimary === "LOW_ENERGY" ||
    input.adaptiveStatePrimary === "OVERWHELMED" ||
    input.disruption.severity === "moderate"
  ) {
    return "minimal";
  }

  if (input.adaptiveStatePrimary === "WITHDRAWN" || input.disruption.disrupted) {
    return "light";
  }

  return "standard";
}
