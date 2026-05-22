import type { AdaptiveContinuityState } from "../types";

export function deriveReducedEmotionalIntensity(input: { lowEnergyMode?: boolean; difficultWeeks?: boolean }): Pick<
  AdaptiveContinuityState,
  "reduceEmotionalIntensity" | "maxListItems" | "maxMeaningfulMoments"
> {
  if (input.lowEnergyMode || input.difficultWeeks) {
    return {
      reduceEmotionalIntensity: true,
      maxListItems: 1,
      maxMeaningfulMoments: 1,
    };
  }

  return {
    reduceEmotionalIntensity: false,
    maxListItems: 2,
    maxMeaningfulMoments: 2,
  };
}
