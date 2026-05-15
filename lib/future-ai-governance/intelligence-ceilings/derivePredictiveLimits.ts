import type { FutureAICapabilityTier } from "../types";

export function derivePredictiveLimits(tier: FutureAICapabilityTier = "current") {
  return {
    tier,
    allowForecasting: false,
    allowEmotionalPrediction: false,
    allowBehavioralTargeting: false,
    requireProbabilisticLanguage: true,
  };
}
