import type { AdaptiveExperienceState } from "../adaptive-intelligence";
import type { PlatformGovernanceState } from "../platform-governance";

export type CalmLifeSupportInput = {
  hasPremiumAccess?: boolean;
  featureEnabled?: boolean;
  lowEnergyModeEnabled?: boolean;
  recentFatigueAverage?: number | null;
  recentStressAverage?: number | null;
  recentSleepAverage?: number | null;
  brainFog?: number | null;
  fatigueTrend?: "high" | "steady" | "lighter" | "unknown";
  stressTrend?: "elevated" | "steady" | "lighter" | "unknown";
  interactionTolerance?: "reduced" | "steady";
  overwhelmDetected?: boolean;
  abandonedFlowCount?: number;
  engagementRhythm?: "light" | "steady" | "sporadic";
  timeOfDay?: "morning" | "afternoon" | "evening";
  message?: string | null;
};

export type CalmLifeSupportPriority =
  | "grounding"
  | "low-energy"
  | "pacing"
  | "uncertainty"
  | "rebuilding"
  | "ordinary-life"
  | "steadiness";

export type CalmLifeReducedComplexity = {
  shortenReading: boolean;
  reduceSuggestionCount: boolean;
  collapseSecondarySections: boolean;
  simplifyNavigation: boolean;
  reduceRecommendationIntensity: boolean;
};

export type CalmLifeAdaptivePacing = {
  slowerPacing: boolean;
  reducedUrgency: boolean;
  preserveSpaciousness: boolean;
  lowerEmotionalIntensity: boolean;
};

export type CalmLifeDailySupport = {
  title: string;
  body: string;
  suggestions: string[];
};

export type CalmLifeSupportState = {
  adaptive: AdaptiveExperienceState;
  governance: PlatformGovernanceState;
  priority: CalmLifeSupportPriority;
  lowPressureGuidance: string[];
  reducedComplexity: CalmLifeReducedComplexity;
  adaptivePacing: CalmLifeAdaptivePacing;
  ordinaryLifeAnchors: string[];
  recoverySteadiness: string[];
  calmDailySupport: CalmLifeDailySupport;
};
