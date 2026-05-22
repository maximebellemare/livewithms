import type { ProgramGroundingPriority, ProgramsEcosystemInput } from "../types";

function isSleepThinner(recentSleepAverage: number | null) {
  return typeof recentSleepAverage === "number" && recentSleepAverage > 0 && recentSleepAverage < 6.5;
}

export function deriveGroundingPriority(input: ProgramsEcosystemInput): ProgramGroundingPriority {
  if (input.stressTrend === "elevated") {
    return "grounding-first";
  }

  if (input.lowEnergyMode || input.lowEnergyAssistActive || input.fatigueTrend === "high") {
    return "low-energy-first";
  }

  if (isSleepThinner(input.recentSleepAverage) && input.timeOfDay === "evening") {
    return "sleep-first";
  }

  if (typeof input.brainFog === "number" && input.brainFog >= 4) {
    return "brain-fog-first";
  }

  return "steadiness-first";
}
