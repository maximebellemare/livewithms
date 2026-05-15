import type { AmbientSupportIntensity, PassiveAdaptiveState } from "../types";

export function deriveAmbientSupportLogic(input: {
  adaptiveStatePrimary: PassiveAdaptiveState;
  quieterDay: boolean;
}): AmbientSupportIntensity {
  if (input.adaptiveStatePrimary === "LOW_ENERGY" || input.quieterDay) {
    return "very-light";
  }

  if (input.adaptiveStatePrimary === "OVERWHELMED") {
    return "light";
  }

  return "steady";
}
