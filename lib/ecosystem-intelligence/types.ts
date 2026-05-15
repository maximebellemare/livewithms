export type EcosystemAdaptiveState =
  | "LOW_ENERGY"
  | "OVERWHELMED"
  | "WITHDRAWN"
  | "STABLE"
  | "REFLECTIVE";

export type EcosystemBurden = "low" | "moderate" | "high";

export type UnifiedSupportState = {
  recommendedMode: "minimal" | "steady" | "supportive";
  maxActions: number;
  preferSilence: boolean;
  summary: string;
};
