import type { AdaptiveStateSignal } from "../../longitudinal/types";
import type { CognitiveBurden, ReflectionDensity } from "../types";

export function deriveReflectionDensity(input: {
  adaptiveStatePrimary: AdaptiveStateSignal;
  burden: CognitiveBurden;
}): ReflectionDensity {
  if (input.adaptiveStatePrimary === "LOW_ENERGY" || input.adaptiveStatePrimary === "OVERWHELMED" || input.burden === "high") {
    return {
      maxCards: 1,
      allowDeeperCards: false,
    };
  }

  if (input.adaptiveStatePrimary === "REFLECTIVE") {
    return {
      maxCards: 2,
      allowDeeperCards: true,
    };
  }

  return {
    maxCards: 1,
    allowDeeperCards: false,
  };
}
