import type { ContinuityAdaptiveState } from "../types";

export function deriveContextAwareInteraction(input: {
  adaptiveStatePrimary: ContinuityAdaptiveState;
  lowEnergyFriendly: boolean;
}) {
  if (input.adaptiveStatePrimary === "LOW_ENERGY" && input.lowEnergyFriendly) {
    return "This surface can stay lighter and easier to move through right now.";
  }

  return "Each surface can keep the same calm tone while still fitting the device.";
}
