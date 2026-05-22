import type { CalmEnvironmentInput, CalmEnvironmentDensity } from "../types";

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

export function deriveAdaptiveDensity(input: CalmEnvironmentInput): CalmEnvironmentDensity {
  const heavierLoad = hasHeavierLoad(input);
  const effectiveMode =
    input.densityPreference === "spacious" || input.densityPreference === "simplified"
      ? input.densityPreference
      : heavierLoad
        ? "simplified"
        : "standard";

  if (effectiveMode === "spacious") {
    return {
      mode: "spacious",
      spacingMultiplier: 1.14,
      maxVisibleSections: 4,
      prefersShorterReading: false,
      label: "Spacious mode",
      largerTapTargets: true,
      simplifyHierarchy: false,
    };
  }

  if (effectiveMode === "simplified") {
    return {
      mode: "simplified",
      spacingMultiplier: 1.08,
      maxVisibleSections: 3,
      prefersShorterReading: true,
      label: "Low-stimulation mode",
      largerTapTargets: true,
      simplifyHierarchy: true,
    };
  }

  return {
    mode: "standard",
    spacingMultiplier: heavierLoad ? 1.04 : 1,
    maxVisibleSections: heavierLoad ? 3 : 5,
    prefersShorterReading: heavierLoad,
    label: "Standard calm",
    largerTapTargets: heavierLoad,
    simplifyHierarchy: heavierLoad,
  };
}
