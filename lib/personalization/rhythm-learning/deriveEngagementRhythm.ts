import type { GrowthState } from "../../../features/growth/types";
import type { EngagementRhythm } from "../types";

export function deriveEngagementRhythm(growthState: GrowthState | null): EngagementRhythm {
  const activeDates = growthState?.activeDates ?? [];
  if (activeDates.length <= 2) {
    return "light";
  }

  const recentActions = growthState?.recentActions ?? [];
  if (activeDates.length >= 10 || recentActions.length >= 6) {
    return "steady";
  }

  return "sporadic";
}
