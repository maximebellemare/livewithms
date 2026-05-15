export type ResilienceAdaptiveState =
  | "LOW_ENERGY"
  | "OVERWHELMED"
  | "WITHDRAWN"
  | "STABLE"
  | "REFLECTIVE";

export type ResilienceBurden = "low" | "moderate" | "high";

export type StressLevel = "low" | "guarded" | "elevated";

export type ResilienceFallbackMode = "none" | "simplified" | "quiet";
