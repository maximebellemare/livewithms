import type { AdaptiveExperienceState } from "../../adaptive-intelligence";
import type { AdaptiveProgramDensityState } from "../types";

export function deriveAdaptiveProgramDensity(adaptive: AdaptiveExperienceState): AdaptiveProgramDensityState {
  return {
    level: adaptive.density.level,
    maxVisiblePrograms: adaptive.programs.maxVisibleTools,
    maxVisibleCategories: adaptive.density.level === "minimal" ? 2 : 4,
    reduceRecommendationOverload: adaptive.reducedComplexity.reduceRecommendationIntensity,
  };
}
