import type { ExistentialAdaptiveState } from "../types";

export function deriveOrdinaryLifeSpacing(adaptiveStatePrimary: ExistentialAdaptiveState) {
  if (adaptiveStatePrimary === "OVERWHELMED" || adaptiveStatePrimary === "WITHDRAWN") {
    return "Ordinary parts of the day still count too.";
  }

  if (adaptiveStatePrimary === "LOW_ENERGY") {
    return "Today can stay small and ordinary.";
  }

  return null;
}
