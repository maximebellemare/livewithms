import { deriveSensoryAccessibility } from "../../global-accessibility/neurodivergent-accessibility/deriveSensoryAccessibility";
import type { CalmEnvironmentInput, CalmEnvironmentSensoryComfort } from "../types";
import { deriveAdaptiveDensity } from "../adaptive-density/deriveAdaptiveDensity";

function hasHeavierLoad(input: CalmEnvironmentInput) {
  return (
    input.lowEnergyModeEnabled ||
    input.overwhelmDetected ||
    input.interactionTolerance === "reduced" ||
    (typeof input.recentFatigueAverage === "number" && input.recentFatigueAverage >= 3.8) ||
    (typeof input.recentStressAverage === "number" && input.recentStressAverage >= 3.8) ||
    (typeof input.recentSleepAverage === "number" && input.recentSleepAverage > 0 && input.recentSleepAverage < 6.3)
  );
}

export function deriveSensoryComfortMode(input: CalmEnvironmentInput): CalmEnvironmentSensoryComfort {
  const heavierLoad = hasHeavierLoad(input);
  const density = deriveAdaptiveDensity(input);
  const nightCalm = input.nightCalmPreference && input.timeOfDay === "evening";
  const sensory = deriveSensoryAccessibility({
    lowStimPreferred: input.densityPreference === "simplified" || input.nightCalmPreference,
    sensorySensitive: heavierLoad,
  });

  return {
    quieterPalette: heavierLoad || nightCalm,
    lowerVisualNoise: heavierLoad || density.mode === "simplified",
    calmerContrast: nightCalm || density.mode === "spacious",
    spaciousReading: density.mode === "spacious" || density.prefersShorterReading,
    softerLoadingStates: input.reducedMotionPreference || heavierLoad,
    nightCalm,
    reducedStimulus: sensory.reducedStimulus,
  };
}
