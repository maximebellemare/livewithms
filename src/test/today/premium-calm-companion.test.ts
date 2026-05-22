import { describe, expect, it } from "vitest";
import { derivePremiumCalmCompanionEnvironment } from "../../../features/today/premium-calm-companion";

describe("premium calm daily environment", () => {
  it("keeps tone calm and free of companion dynamics", () => {
    const result = derivePremiumCalmCompanionEnvironment({
      hasPremiumAccess: true,
      featureEnabled: true,
      lowEnergyMode: false,
      recentFatigueAverage: 3,
      recentStressAverage: 3,
      recentSleepAverage: 7,
      recentCheckIns: 5,
      currentHour: 10,
      reducedInteractionTolerance: false,
      hasTodayEntry: true,
    });

    expect(result.active).toBe(true);
    expect(
      `${result.title} ${result.body} ${result.returnLine} ${result.continuityLine} ${result.microMoments.join(" ")}`.toLowerCase(),
    ).not.toMatch(/always here for you|companion|partner|personal emotional assistant|emotionally intelligent|we noticed|ai detected|attached/);
  });

  it("reduces visible density on heavier days", () => {
    const result = derivePremiumCalmCompanionEnvironment({
      hasPremiumAccess: true,
      featureEnabled: true,
      lowEnergyMode: true,
      recentFatigueAverage: 4.2,
      recentStressAverage: 4,
      recentSleepAverage: 5.8,
      recentCheckIns: 2,
      currentHour: 19,
      reducedInteractionTolerance: true,
      hasTodayEntry: false,
    });

    expect(result.spacing.reduceSuggestionDensity).toBe(true);
    expect(result.spacing.preserveSilence).toBe(true);
    expect(result.spacing.maxGuidanceActions).toBe(1);
    expect(result.spacing.maxReflectionCards).toBe(1);
  });

  it("stays unavailable without premium access", () => {
    const result = derivePremiumCalmCompanionEnvironment({
      hasPremiumAccess: false,
      featureEnabled: true,
      lowEnergyMode: false,
      recentFatigueAverage: 3,
      recentStressAverage: 3,
      recentSleepAverage: 7,
      recentCheckIns: 3,
      currentHour: 14,
      reducedInteractionTolerance: false,
      hasTodayEntry: false,
    });

    expect(result.available).toBe(false);
  });
});
