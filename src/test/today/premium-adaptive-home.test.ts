import { describe, expect, it } from "vitest";
import { derivePremiumAdaptiveHome } from "../../../features/today/premium-adaptive-home";

describe("premium adaptive home", () => {
  it("simplifies the home layout on heavier days", () => {
    const result = derivePremiumAdaptiveHome({
      hasPremiumAccess: true,
      featureEnabled: true,
      lowEnergyMode: true,
      recentFatigueAverage: 4.2,
      recentStressAverage: 4.1,
      recentSleepAverage: 5.8,
      hasTodayEntry: false,
      recentCheckIns: 2,
      currentHour: 9,
      reducedInteractionTolerance: true,
    });

    expect(result.layout.level).toBe("minimal");
    expect(result.layout.maxReflectionCards).toBe(1);
    expect(result.layout.showSecondaryProgram).toBe(false);
    expect(result.supportPriority.summary.toLowerCase()).toContain("simpler");
  });

  it("keeps calmer copy restrained and non-creepy", () => {
    const result = derivePremiumAdaptiveHome({
      hasPremiumAccess: true,
      featureEnabled: true,
      lowEnergyMode: false,
      recentFatigueAverage: 3,
      recentStressAverage: 3,
      recentSleepAverage: 7,
      hasTodayEntry: true,
      recentCheckIns: 6,
      currentHour: 14,
      reducedInteractionTolerance: false,
    });

    expect(
      `${result.calmness.title} ${result.calmness.body} ${result.calmness.toneLine} ${result.supportPriority.summary}`.toLowerCase(),
    ).not.toMatch(/we noticed|ai detected|emotionally intelligent|companion|always here for you|optimized/);
  });

  it("stays inactive for users without premium access", () => {
    const result = derivePremiumAdaptiveHome({
      hasPremiumAccess: false,
      featureEnabled: true,
      lowEnergyMode: false,
      recentFatigueAverage: 3,
      recentStressAverage: 3,
      recentSleepAverage: 7,
      hasTodayEntry: true,
      recentCheckIns: 4,
      currentHour: 18,
      reducedInteractionTolerance: false,
    });

    expect(result.available).toBe(false);
  });
});
