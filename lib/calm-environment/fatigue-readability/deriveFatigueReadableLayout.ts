import { deriveProcessingAccessibility } from "../../global-accessibility/neurodivergent-accessibility/deriveProcessingAccessibility";
import type { CalmEnvironmentInput, CalmEnvironmentFatigueReadableLayout } from "../types";
import { deriveAdaptiveDensity } from "../adaptive-density/deriveAdaptiveDensity";

export function deriveFatigueReadableLayout(input: CalmEnvironmentInput): CalmEnvironmentFatigueReadableLayout {
  const density = deriveAdaptiveDensity(input);
  const accessibility = deriveProcessingAccessibility({
    lowerComplexity: density.simplifyHierarchy,
    lowEnergy: input.lowEnergyModeEnabled,
  });
  const spaciousReading = density.mode === "spacious";
  const shortened = density.prefersShorterReading || accessibility.slowerPacing;

  return {
    spaciousReading,
    lineHeightScale: spaciousReading ? 1.08 : shortened ? 1.04 : 1,
    reduceTextWalls: shortened,
    easierScanning: true,
    simplerHierarchy: density.simplifyHierarchy,
  };
}
