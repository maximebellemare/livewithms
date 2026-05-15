export type SelfTrustAdaptiveState =
  | "LOW_ENERGY"
  | "OVERWHELMED"
  | "WITHDRAWN"
  | "STABLE"
  | "REFLECTIVE";

export type CollaborativeTone = "collaborative" | "observational" | "grounded";

export type OverinterpretationRisk = "low" | "guarded" | "elevated";

export type AIOverpresencePlan = {
  maxSuggestionCount: number;
  showPerspectiveNote: boolean;
  suppressExtraPrompt: boolean;
};
