import { describe, expect, it } from "vitest";
import { deriveCalmEnvironment } from "../../../lib/calm-environment";

describe("unified calm environment", () => {
  it("simplifies the environment during heavier low-energy periods", () => {
    const result = deriveCalmEnvironment({
      hasPremiumAccess: true,
      featureEnabled: true,
      lowEnergyModeEnabled: true,
      reducedMotionPreference: false,
      softerHapticsPreference: true,
      nightCalmPreference: true,
      densityPreference: "standard",
      interactionTolerance: "reduced",
      timeOfDay: "evening",
      recentFatigueAverage: 4.1,
      recentStressAverage: 4,
      recentSleepAverage: 5.8,
      overwhelmDetected: true,
    });

    expect(result.active).toBe(true);
    expect(result.density.mode).toBe("simplified");
    expect(result.sensory.lowerVisualNoise).toBe(true);
    expect(result.motion.reducedMotion).toBe(true);
    expect(result.lowEnergyPresentation.reduceSimultaneousActions).toBe(true);
  });

  it("keeps spacious reading and calmer contrast available without becoming flashy", () => {
    const result = deriveCalmEnvironment({
      hasPremiumAccess: true,
      featureEnabled: true,
      lowEnergyModeEnabled: false,
      reducedMotionPreference: true,
      softerHapticsPreference: true,
      nightCalmPreference: true,
      densityPreference: "spacious",
      interactionTolerance: "steady",
      timeOfDay: "evening",
      recentFatigueAverage: 2.8,
      recentStressAverage: 2.6,
      recentSleepAverage: 7.2,
    });

    expect(result.density.mode).toBe("spacious");
    expect(result.readability.spaciousReading).toBe(true);
    expect(result.sensory.calmerContrast).toBe(true);
    expect(`${result.title} ${result.body}`.toLowerCase()).not.toMatch(/immersive|luxury|advanced ui|dopamine|flashy/);
  });

  it("preserves interruption safety and calmer pacing globally", () => {
    const result = deriveCalmEnvironment({
      hasPremiumAccess: true,
      featureEnabled: true,
      lowEnergyModeEnabled: false,
      reducedMotionPreference: false,
      softerHapticsPreference: true,
      nightCalmPreference: false,
      densityPreference: "standard",
      interactionTolerance: "reduced",
      timeOfDay: "afternoon",
      recentFatigueAverage: 3.9,
      recentStressAverage: 3.8,
      recentSleepAverage: 6.4,
    });

    expect(result.interactionPacing.interruptionSafe).toBe(true);
    expect(result.interactionPacing.preserveUnfinishedState).toBe(true);
    expect(result.interactionPacing.largerTapTargets).toBe(true);
  });
});
