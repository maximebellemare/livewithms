import type { PlatformCoreInput, PlatformCoreState } from "../platform-core";

export type FuturePlatformStrategyInput = PlatformCoreInput & {
  expansionSurface?:
    | "growth"
    | "community"
    | "content"
    | "android"
    | "web"
    | "partnerships"
    | "future-ai"
    | "monetization"
    | "platform";
};

export type AllowedGrowthPattern = {
  key: string;
  allowed: boolean;
  reason: string;
};

export type SafeRetentionMechanics = {
  allowedDrivers: string[];
  blockedDrivers: string[];
  lowPressureRequired: boolean;
  manipulativeUrgencyBlocked: boolean;
};

export type CommunitySafetyRule = {
  key: string;
  rule: string;
  blocks: string[];
};

export type ContentExpansionRule = {
  key: string;
  rule: string;
  protects: string[];
};

export type FuturePlatformBoundary = {
  key: string;
  allowed: string[];
  blocked: string[];
};

export type CalmExpansionConstraints = {
  preserveSpaciousness: boolean;
  preserveLowStimulation: boolean;
  preserveFatigueReadability: boolean;
  preserveSupportDensityLimits: boolean;
  preserveInterruptionSafety: boolean;
};

export type EthicalGrowthPolicy = {
  key: string;
  required: string[];
  blocked: string[];
};

export type FutureExpansionAudit = {
  valid: boolean;
  calmnessPreserved: boolean;
  emotionalSafetyPreserved: boolean;
  monetizationSafe: boolean;
  dependencyRiskBlocked: boolean;
  reasons: string[];
};

export type FuturePlatformStrategyState = {
  platformCore: PlatformCoreState;
  growthPatterns: AllowedGrowthPattern[];
  retention: SafeRetentionMechanics;
  community: CommunitySafetyRule[];
  content: ContentExpansionRule[];
  aiAndPlatformBoundaries: FuturePlatformBoundary[];
  calmness: CalmExpansionConstraints;
  ethicalGrowth: EthicalGrowthPolicy[];
  audit: FutureExpansionAudit;
};
