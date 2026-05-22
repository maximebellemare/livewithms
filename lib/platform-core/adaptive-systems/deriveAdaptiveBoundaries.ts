import { deriveAdaptiveExperience } from "../../adaptive-intelligence";
import { derivePlatformGovernance } from "../../platform-governance";
import type { PlatformCoreInput } from "../types";

export function deriveAdaptiveBoundaries(input: PlatformCoreInput) {
  const adaptive = deriveAdaptiveExperience(input);
  const governance = derivePlatformGovernance(input);

  return {
    subtle: governance.adaptive.subtle,
    maxRecommendationDensity: governance.adaptive.maxRecommendationDensity,
    maxSupportSurfaces: governance.adaptive.maxSupportSurfaces,
    lowerEmotionalIntensity: adaptive.coach.lowerEmotionalIntensity && governance.calmness.reduceEmotionalSharpness,
    simplifyNavigation: adaptive.navigation.simplifyNavigation,
    reduceComplexity: adaptive.reducedComplexity.reduceRecommendationIntensity,
  };
}
