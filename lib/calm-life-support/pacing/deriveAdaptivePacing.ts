import type { AdaptiveExperienceState } from "../../adaptive-intelligence";
import type { CalmLifeAdaptivePacing } from "../types";

export function deriveAdaptivePacing(adaptive: AdaptiveExperienceState): CalmLifeAdaptivePacing {
  return {
    slowerPacing: adaptive.calmness.quieterPresentation || adaptive.programs.simplifyFurther,
    reducedUrgency: adaptive.intensity.level !== "steady",
    preserveSpaciousness: adaptive.calmness.reduceVisualNoise,
    lowerEmotionalIntensity: adaptive.calmness.lowerEmotionalIntensity,
  };
}
