import { describe, expect, it } from "vitest";
import {
  deriveCalmDensityMode,
  derivePremiumCalmEnvironment,
  deriveReducedMotionSettings,
  deriveSensoryComfortSettings,
} from "../../../features/premium/calm-environment";

describe("premium calm environment", () => {
  it("simplifies density under heavier load without becoming dramatic", () => {
    const result = derivePremiumCalmEnvironment({
      hasPremiumAccess: true,
      featureEnabled: true,
      lowEnergyModeEnabled: true,
      reducedMotionPreference: false,
      softerHapticsPreference: true,
      nightCalmPreference: true,
      densityPreference: "standard",
      timeOfDay: "evening",
      recentFatigueAverage: 4.1,
      recentStressAverage: 4,
      recentSleepAverage: 5.8,
    });

    expect(result.active).toBe(true);
    expect(result.density.mode).toBe("simplified");
    expect(result.sensory.lowerVisualNoise).toBe(true);
    expect(result.body.toLowerCase()).not.toMatch(/immersive|luxury|optimi[sz]e|advanced ui/);
  });

  it("keeps reduced motion and sensory settings restrained", () => {
    const motion = deriveReducedMotionSettings({
      hasPremiumAccess: true,
      featureEnabled: true,
      lowEnergyModeEnabled: false,
      reducedMotionPreference: true,
      softerHapticsPreference: true,
      nightCalmPreference: false,
      densityPreference: "spacious",
      timeOfDay: "afternoon",
    });
    const density = deriveCalmDensityMode({
      hasPremiumAccess: true,
      featureEnabled: true,
      lowEnergyModeEnabled: false,
      reducedMotionPreference: true,
      softerHapticsPreference: true,
      nightCalmPreference: false,
      densityPreference: "spacious",
      timeOfDay: "afternoon",
    });
    const sensory = deriveSensoryComfortSettings({
      hasPremiumAccess: true,
      featureEnabled: true,
      lowEnergyModeEnabled: false,
      reducedMotionPreference: true,
      softerHapticsPreference: true,
      nightCalmPreference: true,
      densityPreference: "spacious",
      timeOfDay: "evening",
    });

    expect(motion.reducedMotion).toBe(true);
    expect(motion.motionScale).toBeLessThan(1);
    expect(density.label).toBe("Spacious mode");
    expect(sensory.nightCalm).toBe(true);
    expect(sensory.spaciousReading).toBe(true);
  });
});
