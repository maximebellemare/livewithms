import type { PlatformGovernanceInput } from "../types";
import { deriveAllowedAdaptationLevel } from "../adaptive-governance/deriveAllowedAdaptationLevel";

export function deriveMaxRecommendationDensity(input: PlatformGovernanceInput) {
  return deriveAllowedAdaptationLevel(input).maxRecommendationDensity;
}
