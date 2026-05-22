import { deriveAdaptiveExperience } from "../../adaptive-intelligence";
import { derivePlatformGovernance } from "../../platform-governance";
import { deriveCalmDailySupport } from "../adaptive-support/deriveCalmDailySupport";
import { deriveLowPressureGuidance } from "../adaptive-support/deriveLowPressureGuidance";
import { deriveSupportPriority } from "../adaptive-support/deriveSupportPriority";
import { deriveOrdinaryLifeAnchors } from "../grounding/deriveOrdinaryLifeAnchors";
import { deriveAdaptivePacing } from "../pacing/deriveAdaptivePacing";
import { deriveRecoverySteadiness } from "../recovery/deriveRecoverySteadiness";
import { deriveReducedComplexity } from "../support-density/deriveReducedComplexity";
import type { CalmLifeSupportInput, CalmLifeSupportState } from "../types";

export function deriveCalmLifeSupport(input: CalmLifeSupportInput): CalmLifeSupportState {
  const adaptive = deriveAdaptiveExperience({
    hasPremiumAccess: input.hasPremiumAccess ?? true,
    featureEnabled: input.featureEnabled ?? true,
    lowEnergyModeEnabled: input.lowEnergyModeEnabled,
    recentFatigueAverage: input.recentFatigueAverage,
    recentStressAverage: input.recentStressAverage,
    recentSleepAverage: input.recentSleepAverage,
    brainFog: input.brainFog,
    fatigueTrend: input.fatigueTrend,
    stressTrend: input.stressTrend,
    interactionTolerance: input.interactionTolerance,
    overwhelmDetected: input.overwhelmDetected,
    abandonedFlowCount: input.abandonedFlowCount,
    engagementRhythm: input.engagementRhythm,
    timeOfDay: input.timeOfDay,
    message: input.message,
  });
  const priority = deriveSupportPriority(input);
  const governance = derivePlatformGovernance({
    ...input,
    surface: "today",
  });
  const lowPressureGuidance = deriveLowPressureGuidance(input, priority).slice(0, governance.adaptive.maxRecommendationDensity);
  const calmDailySupport = deriveCalmDailySupport(priority);

  return {
    adaptive,
    governance,
    priority,
    lowPressureGuidance,
    reducedComplexity: deriveReducedComplexity(adaptive),
    adaptivePacing: deriveAdaptivePacing(adaptive),
    ordinaryLifeAnchors: deriveOrdinaryLifeAnchors(input),
    recoverySteadiness: deriveRecoverySteadiness(input),
    calmDailySupport: {
      ...calmDailySupport,
      suggestions: calmDailySupport.suggestions.slice(0, governance.adaptive.maxRecommendationDensity),
    },
  };
}
