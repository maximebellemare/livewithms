import { deriveAdaptiveExperience } from "../../adaptive-intelligence";
import { derivePlatformGovernance } from "../../platform-governance";
import type { PlatformCoreCalmness, PlatformCoreInput } from "../types";

export function derivePlatformCalmnessConstraints(input: PlatformCoreInput): PlatformCoreCalmness {
  const governance = derivePlatformGovernance(input);
  const adaptive = deriveAdaptiveExperience({
    ...input,
    hasPremiumAccess: input.hasPremiumAccess ?? true,
    featureEnabled: input.featureEnabled ?? true,
  });

  return {
    reduceUrgency: governance.calmness.reduceUrgency,
    preserveSpaciousness: governance.calmness.preserveSpaciousness,
    lowerStimulation: governance.calmness.lowerStimulation || adaptive.reducedComplexity.reduceVisualNoise,
    reduceTextWalls: governance.calmness.reduceTextWalls || adaptive.reducedComplexity.shortenSummaries,
    fatigueReadable: governance.accessibility.fatigueReadable,
  };
}
