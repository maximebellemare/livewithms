import { describe, expect, it } from "vitest";
import { derivePremiumDailySupport } from "../../../features/today/premium-daily-support";

describe("premium daily support", () => {
  it("returns calm daily support for premium users", () => {
    const result = derivePremiumDailySupport({
      currentHour: 9,
      lowEnergyMode: false,
      hasPremiumAccess: true,
      featureEnabled: true,
      recentFatigueAverage: 3,
      recentStressAverage: 3,
      recentSleepAverage: 7,
      todayEntry: null,
    });

    expect(result).not.toBeNull();
    expect(result?.moment).toBe("morning");
    expect(`${result?.title} ${result?.body} ${result?.reflection} ${result?.pacing}`.toLowerCase()).not.toMatch(
      /always here for you|companion|journey|best self|attached|personal ai/,
    );
  });

  it("softens pacing further in lower-energy states", () => {
    const result = derivePremiumDailySupport({
      currentHour: 19,
      lowEnergyMode: true,
      hasPremiumAccess: true,
      featureEnabled: true,
      recentFatigueAverage: 4.3,
      recentStressAverage: 4.1,
      recentSleepAverage: 5.8,
      todayEntry: null,
    });

    expect(result?.body.toLowerCase()).toContain("quieter");
    expect(result?.pacing.toLowerCase()).toContain("quieter");
  });

  it("returns null when premium access is unavailable", () => {
    const result = derivePremiumDailySupport({
      currentHour: 14,
      lowEnergyMode: false,
      hasPremiumAccess: false,
      featureEnabled: true,
      recentFatigueAverage: 3,
      recentStressAverage: 3,
      recentSleepAverage: 7,
      todayEntry: null,
    });

    expect(result).toBeNull();
  });
});
