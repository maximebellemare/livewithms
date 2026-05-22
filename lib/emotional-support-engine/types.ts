import type { PreferredDensity, SupportStyle } from "../personalization/types";

export type EmotionalSupportIntensityLevel = "steady" | "elevated" | "high";
export type EmotionalSupportPrimaryState =
  | "steady"
  | "grounding"
  | "decompression"
  | "pacing"
  | "uncertainty"
  | "recovery";
export type EmotionalSupportDensityLevel = "standard" | "lighter" | "minimal";
export type EmotionalSupportCalmnessLevel = "standard" | "heightened" | "protective";

export type EmotionalSupportEngineInput = {
  lowEnergyModeEnabled?: boolean;
  recentFatigueAverage?: number | null;
  recentStressAverage?: number | null;
  recentSleepAverage?: number | null;
  brainFog?: number | null;
  fatigueTrend?: "high" | "steady" | "lighter" | "unknown";
  stressTrend?: "elevated" | "steady" | "lighter" | "unknown";
  interactionTolerance?: "reduced" | "steady";
  abandonedFlowCount?: number;
  overwhelmDetected?: boolean;
  preferredSupportStyle?: SupportStyle | null;
  preferredDensity?: PreferredDensity | null;
  engagementRhythm?: "light" | "steady" | "sporadic";
  timeOfDay?: "morning" | "afternoon" | "evening";
  message?: string | null;
};

export type EmotionalSupportIntensity = {
  level: EmotionalSupportIntensityLevel;
  score: number;
  primaryState: EmotionalSupportPrimaryState;
  reasons: string[];
};

export type EmotionalSupportDensity = {
  level: EmotionalSupportDensityLevel;
  maxCards: number;
  maxSuggestions: number;
  maxSecondarySections: number;
};

export type EmotionalSupportReducedCognitiveLoad = {
  level: "none" | "gentle" | "active";
  maxSuggestions: number;
  maxInsightCards: number;
  maxVisiblePrompts: number;
  maxVisibleSteps: number;
  maxCorrelationCards: number;
  maxStarterSuggestions: number;
};

export type EmotionalSupportCalmness = {
  level: EmotionalSupportCalmnessLevel;
  reduceVisualNoise: boolean;
  reduceAnimationIntensity: boolean;
  lowerEmotionalIntensity: boolean;
  quieterPresentation: boolean;
};

export type AdaptiveGroundingState = {
  surfaceGroundingFirst: boolean;
  reduceFutureIntensity: boolean;
  simplifyInteractions: boolean;
  supportPriority: EmotionalSupportPrimaryState[];
  primaryRecommendation: "grounding" | "decompression" | "steadiness" | "smaller-horizon";
};

export type EmotionalSupportSafetyGovernance = {
  avoidTherapySimulation: boolean;
  avoidDependencyLanguage: boolean;
  avoidInspirationalFraming: boolean;
  avoidPseudoMedicalInterpretation: boolean;
  containsUnsafeLanguage: boolean;
};

export type EmotionalSupportState = {
  intensity: EmotionalSupportIntensity;
  calmness: EmotionalSupportCalmness;
  density: EmotionalSupportDensity;
  cognitiveLoad: EmotionalSupportReducedCognitiveLoad;
  adaptiveGrounding: AdaptiveGroundingState;
  lowPressureRecommendations: string[];
  safety: EmotionalSupportSafetyGovernance;
};
