import { REFLECTION_SURFACE_DEFAULTS } from "../constants";
import type { ReflectionTimingInput } from "../types";

/**
 * Keeps reflection surfaces calm on harder days and a little roomier
 * when someone appears to have more capacity for reflection.
 */
export function deriveReflectionDensity(input: ReflectionTimingInput): 0 | 1 | 2 {
  const { adaptiveState, fatigueLevel, interactionFrequency, skippedCheckIns } = input;

  if (adaptiveState.primary === "LOW_ENERGY" || adaptiveState.primary === "OVERWHELMED") {
    return REFLECTION_SURFACE_DEFAULTS.lowEnergyMaxCards;
  }

  if (adaptiveState.primary === "WITHDRAWN") {
    return 1;
  }

  if ((fatigueLevel ?? 0) >= 4 || skippedCheckIns >= 3) {
    return 1;
  }

  if (
    adaptiveState.primary === "REFLECTIVE" &&
    interactionFrequency <= REFLECTION_SURFACE_DEFAULTS.denseInteractionThreshold
  ) {
    return 2;
  }

  return 1;
}
