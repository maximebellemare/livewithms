import type { AdaptiveProfile } from "../../../features/adaptive/types";
import type { ComplexityTolerance, ReflectionDepthPreference } from "../types";

export function deriveComplexityTolerance(input: {
  adaptiveProfile: AdaptiveProfile;
  reflectionDepthPreference: ReflectionDepthPreference;
}) : ComplexityTolerance {
  if (input.adaptiveProfile.lowEnergyMode || input.adaptiveProfile.brainFogTrend === "high") {
    return "lower";
  }

  if (input.reflectionDepthPreference === "deeper" && input.adaptiveProfile.engagementPattern === "steady") {
    return "higher";
  }

  return "balanced";
}
