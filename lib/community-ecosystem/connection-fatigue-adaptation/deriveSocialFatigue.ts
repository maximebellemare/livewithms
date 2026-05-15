import type { CommunityAdaptiveState } from "../types";

export function deriveSocialFatigue(input: {
  adaptiveStatePrimary: CommunityAdaptiveState;
  hasStackedEmotionalSurfaces: boolean;
  aiSummaryVisible: boolean;
}) {
  if (
    input.adaptiveStatePrimary === "OVERWHELMED" ||
    (input.hasStackedEmotionalSurfaces && input.aiSummaryVisible)
  ) {
    return "high" as const;
  }

  if (input.adaptiveStatePrimary === "LOW_ENERGY" || input.adaptiveStatePrimary === "WITHDRAWN") {
    return "moderate" as const;
  }

  return "low" as const;
}
