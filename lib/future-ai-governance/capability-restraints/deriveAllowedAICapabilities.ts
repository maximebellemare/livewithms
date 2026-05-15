import type { AllowedAICapabilities, FutureAICapabilityTier } from "../types";

export function deriveAllowedAICapabilities(
  tier: FutureAICapabilityTier = "current",
): AllowedAICapabilities {
  const maxConversationalPersistence =
    tier === "autonomous" ? 1 : tier === "multimodal" ? 2 : tier === "advanced" ? 2 : 3;

  return {
    tier,
    allowEmotionalInference: false,
    allowCompanionDynamics: false,
    allowPredictiveEmotionalTargeting: false,
    maxConversationalPersistence,
    preferHumanRedirect: tier !== "current",
  };
}
