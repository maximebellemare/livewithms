import type { ExistentialAdaptiveState } from "../types";

export function deriveOrdinaryLifeSpacing(adaptiveStatePrimary: ExistentialAdaptiveState) {
  if (adaptiveStatePrimary === "OVERWHELMED" || adaptiveStatePrimary === "WITHDRAWN") {
    return "Ordinary parts of the day still count too.";
  }

  if (adaptiveStatePrimary === "LOW_ENERGY") {
    return "It is okay if today stays small and ordinary.";
  }

  return null;
}
