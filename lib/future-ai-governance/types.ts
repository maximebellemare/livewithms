export type FutureAICapabilityTier = "current" | "advanced" | "multimodal" | "autonomous";

export type AllowedAICapabilities = {
  tier: FutureAICapabilityTier;
  allowEmotionalInference: false;
  allowCompanionDynamics: false;
  allowPredictiveEmotionalTargeting: false;
  maxConversationalPersistence: number;
  preferHumanRedirect: boolean;
};
