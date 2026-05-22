import type { PreferredDensity, SupportStyle } from "../personalization/types";
import type {
  AdaptiveGroundingState,
  EmotionalSupportCalmness,
  EmotionalSupportDensity,
  EmotionalSupportIntensity,
  EmotionalSupportReducedCognitiveLoad,
} from "../emotional-support-engine";
import type { PlatformGovernanceState } from "../platform-governance";

export type AdaptiveIntelligenceInput = {
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
  abandonedFlowCount?: number;
  overwhelmDetected?: boolean;
  preferredSupportStyle?: SupportStyle | null;
  preferredDensity?: PreferredDensity | null;
  engagementRhythm?: "light" | "steady" | "sporadic";
  timeOfDay?: "morning" | "afternoon" | "evening";
  message?: string | null;
};

export type AdaptiveLowEnergyState = {
  active: boolean;
  title: string;
  body: string;
};

export type AdaptiveReducedComplexity = {
  shortenSummaries: boolean;
  collapseSecondarySections: boolean;
  reduceChartDensity: boolean;
  simplifyPrograms: boolean;
  reduceVisualNoise: boolean;
  preferShortAiReplies: boolean;
  simplifyNavigation: boolean;
  reduceRecommendationIntensity: boolean;
};

export type AdaptiveCoachSettings = {
  maxParagraphs: number;
  maxSentences: number;
  maxChars: number;
  maxStarterSuggestions: number;
  lowerEmotionalIntensity: boolean;
};

export type AdaptiveInsightsSettings = {
  maxCards: number;
  maxSuggestions: number;
  maxSummaryChars: number;
  reduceChartDensity: boolean;
  shortenReflections: boolean;
};

export type AdaptiveProgramSettings = {
  maxVisibleSteps: number;
  maxVisiblePrompts: number;
  maxVisibleTools: number;
  simplifyFurther: boolean;
};

export type AdaptiveNotificationSettings = {
  reduceReminderFrequency: boolean;
  lowerNotificationPressure: boolean;
  quieterTiming: boolean;
  softerTone: boolean;
};

export type AdaptiveNavigationSettings = {
  simplifyNavigation: boolean;
  reduceSimultaneousActions: boolean;
  prioritizeLowEnergyAccess: boolean;
};

export type AdaptiveExperienceState = {
  available: boolean;
  active: boolean;
  reasons: string[];
  interactionTolerance: "reduced" | "steady";
  governance: PlatformGovernanceState;
  intensity: EmotionalSupportIntensity;
  calmness: EmotionalSupportCalmness;
  density: EmotionalSupportDensity;
  cognitiveLoad: EmotionalSupportReducedCognitiveLoad;
  adaptiveGrounding: AdaptiveGroundingState;
  lowEnergy: AdaptiveLowEnergyState;
  reducedComplexity: AdaptiveReducedComplexity;
  recommendations: string[];
  coach: AdaptiveCoachSettings;
  insights: AdaptiveInsightsSettings;
  programs: AdaptiveProgramSettings;
  notifications: AdaptiveNotificationSettings;
  navigation: AdaptiveNavigationSettings;
};
