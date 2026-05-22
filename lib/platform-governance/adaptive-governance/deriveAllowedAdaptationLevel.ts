import type { PlatformGovernanceInput, PlatformAdaptiveGovernance } from "../types";

export function deriveAllowedAdaptationLevel(input: PlatformGovernanceInput): PlatformAdaptiveGovernance {
  const heavyFatigue = typeof input.recentFatigueAverage === "number" && input.recentFatigueAverage >= 4;
  const heavyStress = typeof input.recentStressAverage === "number" && input.recentStressAverage >= 4;
  const lowSleep = typeof input.recentSleepAverage === "number" && input.recentSleepAverage > 0 && input.recentSleepAverage < 6;
  const heavyFog = typeof input.brainFog === "number" && input.brainFog >= 4;
  const reducedTolerance = input.interactionTolerance === "reduced";
  const overwhelmed = Boolean(input.overwhelmDetected);

  if (overwhelmed || heavyFatigue || heavyStress || lowSleep || heavyFog || reducedTolerance) {
    return {
      level: "protective",
      subtle: true,
      maxRecommendationDensity: 2,
      maxSupportSurfaces: 3,
    };
  }

  if (input.engagementRhythm === "sporadic" || input.lowEnergyModeEnabled) {
    return {
      level: "bounded",
      subtle: true,
      maxRecommendationDensity: 3,
      maxSupportSurfaces: 4,
    };
  }

  return {
    level: "minimal",
    subtle: true,
    maxRecommendationDensity: 4,
    maxSupportSurfaces: 5,
  };
}
