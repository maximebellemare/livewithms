import type { PlatformGovernanceInput, PlatformGovernanceState } from "../platform-governance";
import type { AdaptiveExperienceState } from "../adaptive-intelligence";
import type { CalmLifeSupportState } from "../calm-life-support";

export type PlatformCoreInput = PlatformGovernanceInput & {
  hasPremiumAccess?: boolean;
  featureEnabled?: boolean;
  fatigueTrend?: "high" | "steady" | "lighter" | "unknown";
  stressTrend?: "elevated" | "steady" | "lighter" | "unknown";
  abandonedFlowCount?: number;
};

export type PlatformSupportDensityLimits = {
  maxRecommendationDensity: number;
  maxSupportSurfaces: number;
  reduceRecommendationIntensity: boolean;
  reduceVisualStacking: boolean;
};

export type PlatformCoreCalmness = {
  reduceUrgency: boolean;
  preserveSpaciousness: boolean;
  lowerStimulation: boolean;
  reduceTextWalls: boolean;
  fatigueReadable: boolean;
};

export type PlatformPremiumGovernance = {
  calmPositioningRequired: boolean;
  lowPressureUpgradeRequired: boolean;
  respectfulLockedStateRequired: boolean;
  manipulativeUpsellBlocked: boolean;
};

export type PlatformAnalyticsGovernance = {
  minimalMetadataOnly: boolean;
  avoidEmotionalProfiling: boolean;
  requireNonBlockingDelivery: boolean;
};

export type PlatformContentGovernance = {
  safe: boolean;
  avoidTherapySimulation: boolean;
  avoidCompanionTone: boolean;
  avoidManipulativeUrgency: boolean;
  categoryIdentityProtected: boolean;
  reasons: string[];
};

export type PlatformOperationalResilience = {
  preferSilentRetries: boolean;
  preserveCachedState: boolean;
  quietLoadingStates: boolean;
  softenFailureRecovery: boolean;
  preserveInterruptedState: boolean;
  degradeGracefully: boolean;
};

export type PlatformAccessibilityRules = {
  fatigueReadable: boolean;
  lowSensoryLoad: boolean;
  interruptionSafe: boolean;
  reducedMotionPreferred: boolean;
  largeTapTargetsPreferred: boolean;
};

export type PlatformFutureExpansionRule = {
  key: string;
  rule: string;
  protects: string[];
};

export type PlatformFutureGovernancePolicy = {
  key: string;
  requiredChecks: string[];
  blockedDirections: string[];
};

export type PlatformQualityAudit = {
  ready: boolean;
  governanceSafe: boolean;
  adaptiveBounded: boolean;
  calmnessProtected: boolean;
  categoryIdentityProtected: boolean;
  reasons: string[];
};

export type PlatformCoreState = {
  governance: PlatformGovernanceState;
  adaptive: AdaptiveExperienceState;
  calmLifeSupport: CalmLifeSupportState;
  calmness: PlatformCoreCalmness;
  supportDensity: PlatformSupportDensityLimits;
  premium: PlatformPremiumGovernance;
  analytics: PlatformAnalyticsGovernance;
  content: PlatformContentGovernance;
  operationalResilience: PlatformOperationalResilience;
  accessibility: PlatformAccessibilityRules;
  futureExpansionRules: PlatformFutureExpansionRule[];
  futureGovernancePolicies: PlatformFutureGovernancePolicy[];
  qualityAudit: PlatformQualityAudit;
};
