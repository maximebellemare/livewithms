import type { AdaptiveIntelligenceInput } from "../types";

export function deriveInteractionTolerance(input: AdaptiveIntelligenceInput): "reduced" | "steady" {
  if (input.interactionTolerance) {
    return input.interactionTolerance;
  }

  if (input.lowEnergyModeEnabled || (input.abandonedFlowCount ?? 0) >= 2) {
    return "reduced";
  }

  return "steady";
}
