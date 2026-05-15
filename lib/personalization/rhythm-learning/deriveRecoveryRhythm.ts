import type { AdaptiveProfile } from "../../../features/adaptive/types";
import type { GrowthState } from "../../../features/growth/types";
import type { RecoveryRhythm } from "../types";

export function deriveRecoveryRhythm(input: {
  adaptiveProfile: AdaptiveProfile;
  growthState: GrowthState | null;
}): RecoveryRhythm {
  const recentActions = input.growthState?.recentActions ?? [];
  const reflectionSaves = recentActions.filter((action) => action.eventName === "reflection_saved").length;

  if (input.adaptiveProfile.engagementPattern === "gentle-reengagement") {
    return reflectionSaves >= 2 ? "gradual-return" : "quiet-reentry";
  }

  if (input.adaptiveProfile.lowEnergyMode) {
    return "quick-reset";
  }

  return "gradual-return";
}
