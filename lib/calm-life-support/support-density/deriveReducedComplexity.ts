import type { AdaptiveExperienceState } from "../../adaptive-intelligence";
import type { CalmLifeReducedComplexity } from "../types";

export function deriveReducedComplexity(adaptive: AdaptiveExperienceState): CalmLifeReducedComplexity {
  return {
    shortenReading: adaptive.reducedComplexity.shortenSummaries || adaptive.coach.maxChars <= 240,
    reduceSuggestionCount: adaptive.reducedComplexity.reduceRecommendationIntensity,
    collapseSecondarySections: adaptive.reducedComplexity.collapseSecondarySections,
    simplifyNavigation: adaptive.reducedComplexity.simplifyNavigation,
    reduceRecommendationIntensity: adaptive.reducedComplexity.reduceRecommendationIntensity,
  };
}
