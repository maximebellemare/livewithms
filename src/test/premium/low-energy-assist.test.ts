import { describe, expect, it } from "vitest";
import {
  deriveAdaptiveSimplification,
  deriveCalmPresentationMode,
  deriveLowEnergyAssist,
  deriveReducedCognitiveLoad,
} from "../../../features/premium/low-energy-assist";

describe("premium low energy assist", () => {
  it("stays inactive without premium access even when lower-energy signals are present", () => {
    const result = deriveLowEnergyAssist({
      hasPremiumAccess: false,
      featureEnabled: true,
      lowEnergyModeEnabled: true,
      recentFatigueAverage: 4.2,
      recentStressAverage: 4.1,
      recentSleepAverage: 5.8,
      fatigueTrend: "high",
      stressTrend: "elevated",
    });

    expect(result.available).toBe(false);
    expect(result.active).toBe(false);
    expect(result.triggerReasons.length).toBeGreaterThan(0);
  });

  it("activates safely for premium users during heavier stretches", () => {
    const result = deriveLowEnergyAssist({
      hasPremiumAccess: true,
      featureEnabled: true,
      lowEnergyModeEnabled: false,
      recentFatigueAverage: 4.1,
      recentStressAverage: 4.2,
      recentSleepAverage: 5.9,
      fatigueTrend: "high",
      stressTrend: "elevated",
      abandonedFlowCount: 2,
      interactionTolerance: "reduced",
    });

    expect(result.available).toBe(true);
    expect(result.active).toBe(true);
    expect(result.cognitiveLoad.level).toBe("active");
    expect(result.cognitiveLoad.maxSuggestions).toBe(1);
    expect(result.presentation.body.toLowerCase()).toContain("gently simplifies");
  });

  it("keeps simplification lighter when signals are mild", () => {
    const simplification = deriveAdaptiveSimplification({
      hasPremiumAccess: true,
      featureEnabled: true,
      lowEnergyModeEnabled: false,
      recentFatigueAverage: 2.8,
      recentStressAverage: 3,
      recentSleepAverage: 7,
      fatigueTrend: "steady",
      stressTrend: "steady",
      abandonedFlowCount: 1,
    });
    const load = deriveReducedCognitiveLoad({
      hasPremiumAccess: true,
      featureEnabled: true,
      lowEnergyModeEnabled: false,
      recentFatigueAverage: 2.8,
      recentStressAverage: 3,
      recentSleepAverage: 7,
      fatigueTrend: "steady",
      stressTrend: "steady",
      abandonedFlowCount: 1,
    });

    expect(simplification.shortenSummaries).toBe(false);
    expect(load.level).toBe("gentle");
    expect(load.maxSuggestions).toBe(2);
  });

  it("uses calm, non-technical presentation copy", () => {
    const presentation = deriveCalmPresentationMode({
      hasPremiumAccess: true,
      featureEnabled: true,
      lowEnergyModeEnabled: true,
      recentFatigueAverage: 4,
      recentStressAverage: 3.9,
      recentSleepAverage: 5.8,
    });

    expect(presentation.title).toBe("Low Energy Assist is on");
    expect(presentation.body.toLowerCase()).not.toContain("optimization");
    expect(presentation.body.toLowerCase()).not.toContain("condition");
  });
});

