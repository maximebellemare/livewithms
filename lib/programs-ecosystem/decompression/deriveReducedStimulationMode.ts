import type { AdaptiveExperienceState } from "../../adaptive-intelligence";
import type { ReducedStimulationMode, ProgramsEcosystemInput } from "../types";

function isSleepThinner(recentSleepAverage: number | null) {
  return typeof recentSleepAverage === "number" && recentSleepAverage > 0 && recentSleepAverage < 6.5;
}

export function deriveReducedStimulationMode(
  input: ProgramsEcosystemInput,
  adaptive: AdaptiveExperienceState,
): ReducedStimulationMode {
  if (input.stressTrend === "elevated") {
    return {
      active: true,
      preferAudio: true,
      simplerInteractions: true,
      reason: "overwhelm",
    };
  }

  if (input.lowEnergyMode || input.lowEnergyAssistActive || input.fatigueTrend === "high") {
    return {
      active: true,
      preferAudio: adaptive.calmness.quieterPresentation,
      simplerInteractions: true,
      reason: "fatigue",
    };
  }

  if (isSleepThinner(input.recentSleepAverage) && input.timeOfDay === "evening") {
    return {
      active: true,
      preferAudio: true,
      simplerInteractions: false,
      reason: "sleep",
    };
  }

  return {
    active: adaptive.calmness.quieterPresentation,
    preferAudio: false,
    simplerInteractions: adaptive.reducedComplexity.simplifyPrograms,
    reason: "steady",
  };
}
