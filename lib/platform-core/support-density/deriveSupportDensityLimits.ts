import { deriveAdaptiveExperience } from "../../adaptive-intelligence";
import { derivePlatformGovernance } from "../../platform-governance";
import type { PlatformCoreInput, PlatformSupportDensityLimits } from "../types";

export function deriveSupportDensityLimits(input: PlatformCoreInput): PlatformSupportDensityLimits {
  const governance = derivePlatformGovernance(input);
  const adaptive = deriveAdaptiveExperience({
    ...input,
    hasPremiumAccess: input.hasPremiumAccess ?? true,
    featureEnabled: input.featureEnabled ?? true,
  });

  return {
    maxRecommendationDensity: governance.adaptive.maxRecommendationDensity,
    maxSupportSurfaces: governance.adaptive.maxSupportSurfaces,
    reduceRecommendationIntensity:
      governance.calmness.reduceEmotionalSharpness || adaptive.reducedComplexity.reduceRecommendationIntensity,
    reduceVisualStacking:
      governance.calmness.lowerStimulation || adaptive.reducedComplexity.collapseSecondarySections,
  };
}
