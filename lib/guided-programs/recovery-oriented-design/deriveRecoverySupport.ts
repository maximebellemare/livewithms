import type { GuidedProgramAdaptiveState } from "../types";

export function deriveRecoverySupport(input: {
  adaptiveStatePrimary: GuidedProgramAdaptiveState;
  hasRecentDisruption: boolean;
}) {
  if (input.hasRecentDisruption || input.adaptiveStatePrimary === "WITHDRAWN") {
    return "Returning gently is part of the program design. You can simply begin from where you are.";
  }

  if (input.adaptiveStatePrimary === "LOW_ENERGY") {
    return "Recovery can stay very practical today: fewer steps, slower pacing, earlier stopping.";
  }

  return "Use these tools in the way that best supports recovery rather than completion.";
}
