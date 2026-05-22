import type { CalmEnvironmentState } from "../types";

export function deriveStateSurfacePresentation(environment: CalmEnvironmentState) {
  const simplified = environment.lowEnergyPresentation.simplifySecondaryContent;
  const spacious = environment.readability.spaciousReading || environment.density.mode === "spacious";

  return {
    cardPaddingHorizontal: spacious ? 26 : 24,
    cardPaddingVertical: simplified ? 22 : spacious ? 28 : 24,
    cardGap: simplified ? 12 : spacious ? 16 : 14,
    outerPadding: simplified ? 20 : 24,
    maxWidth: spacious ? 408 : 388,
    skeletonLines: simplified ? 2 : 3,
    useStaticLoadingIndicator: environment.motion.reducedMotion,
    alignActionsStretch: simplified,
    titleBottomSpacing: simplified ? 2 : 0,
    reduceTextWalls: environment.readability.reduceTextWalls,
  };
}
