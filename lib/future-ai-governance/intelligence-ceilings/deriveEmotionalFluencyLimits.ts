import type { FutureAICapabilityTier } from "../types";

export function deriveEmotionalFluencyLimits(tier: FutureAICapabilityTier = "current") {
  return {
    maxRelationalWarmth: tier === "current" ? 2 : 1,
    maxReflectiveSentences: tier === "current" ? 3 : 2,
    requireBoundedLanguage: true,
    preferShorterResponses: tier !== "current",
  };
}
