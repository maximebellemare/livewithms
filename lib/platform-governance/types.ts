export type PlatformGovernanceInput = {
  lowEnergyModeEnabled?: boolean;
  recentFatigueAverage?: number | null;
  recentStressAverage?: number | null;
  recentSleepAverage?: number | null;
  brainFog?: number | null;
  interactionTolerance?: "reduced" | "steady";
  overwhelmDetected?: boolean;
  engagementRhythm?: "light" | "steady" | "sporadic";
  timeOfDay?: "morning" | "afternoon" | "evening";
  message?: string | null;
  lines?: string[];
  surface?:
    | "coach"
    | "programs"
    | "insights"
    | "notifications"
    | "premium"
    | "today"
    | "track"
    | "care"
    | "platform";
};

export type PlatformEmotionalSafety = {
  valid: boolean;
  containsUnsafeLanguage: boolean;
  containsEngagementPressure: boolean;
  containsBoundaryViolation: boolean;
  containsClinicalDrift: boolean;
  reasons: string[];
};

export type PlatformAdaptiveGovernance = {
  level: "minimal" | "bounded" | "protective";
  subtle: boolean;
  maxRecommendationDensity: number;
  maxSupportSurfaces: number;
};

export type PlatformCalmnessConstraints = {
  reduceUrgency: boolean;
  preserveSpaciousness: boolean;
  lowerStimulation: boolean;
  reduceEmotionalSharpness: boolean;
  reduceTextWalls: boolean;
};

export type PlatformAIBehavior = {
  maxInterpretiveSentences: number;
  avoidTherapySimulation: boolean;
  avoidDependencyDynamics: boolean;
  avoidCompanionTone: boolean;
  avoidEmotionalOverreach: boolean;
};

export type PlatformOperationalGovernance = {
  preferSilentRetries: boolean;
  preserveCachedState: boolean;
  quietLoadingStates: boolean;
  softenFailureRecovery: boolean;
};

export type PlatformAccessibilityGovernance = {
  fatigueReadable: boolean;
  lowSensoryLoad: boolean;
  interruptionSafe: boolean;
  reducedMotionPreferred: boolean;
};

export type PlatformGovernanceState = {
  emotionalSafety: PlatformEmotionalSafety;
  adaptive: PlatformAdaptiveGovernance;
  calmness: PlatformCalmnessConstraints;
  ai: PlatformAIBehavior;
  operational: PlatformOperationalGovernance;
  accessibility: PlatformAccessibilityGovernance;
};
